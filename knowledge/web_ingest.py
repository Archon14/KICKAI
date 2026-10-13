"""Fetch football knowledge from Wikipedia (allowed API). Players + techniques."""

from __future__ import annotations

import json
import re
import urllib.parse
import urllib.request
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from knowledge.rag_hub import KnowledgeDocument

USER_AGENT = "KICKAI/0.3 (football coaching KB; contact: local)"
STORE = Path(__file__).resolve().parents[1] / "data" / "knowledge" / "web_documents.json"

TECHNIQUE_QUERIES = [
    "Association football tactics",
    "Dribbling",
    "Passing (association football)",
    "Association football positions",
    "Pressing (association football)",
    "Counterattack",
    "Set piece (football)",
    "First touch (association football)",
    "Offside (association football)",
    "Goalkeeper (association football)",
]

PLAYER_SEEDS = [
    "Lionel Messi",
    "Cristiano Ronaldo",
    "Erling Haaland",
    "Kevin De Bruyne",
    "Mohamed Salah",
    "Virgil van Dijk",
    "Lamine Yamal",
    "Bukayo Saka",
]


def _wiki_api(params: dict) -> dict:
    base = "https://en.wikipedia.org/w/api.php"
    params = {**params, "format": "json"}
    url = base + "?" + urllib.parse.urlencode(params)
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.loads(response.read().decode("utf-8"))


def _clean_extract(text: str, max_chars: int = 1800) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) > max_chars:
        text = text[: max_chars - 3].rsplit(" ", 1)[0] + "..."
    return text


def fetch_wikipedia_article(title: str) -> Optional[KnowledgeDocument]:
    data = _wiki_api(
        {
            "action": "query",
            "prop": "extracts",
            "exintro": "1",
            "explaintext": "1",
            "titles": title,
        }
    )
    pages = data.get("query", {}).get("pages", {})
    if not pages:
        return None
    page = next(iter(pages.values()))
    if "missing" in page:
        return None
    extract = _clean_extract(page.get("extract", ""))
    if len(extract) < 80:
        return None
    real_title = page.get("title", title)
    category = "Players" if _looks_like_player(real_title, extract) else "Technical Skills"
    return KnowledgeDocument(
        title=real_title,
        category=category,
        content=extract,
        source=f"Wikipedia — https://en.wikipedia.org/wiki/{urllib.parse.quote(real_title.replace(' ', '_'))}",
    )


def _looks_like_player(title: str, text: str) -> bool:
    cues = ("footballer", "born", "plays as", "professional football")
    lower = text.lower()
    return any(c in lower for c in cues) and "football" in lower


def search_wikipedia_player(name: str) -> Optional[KnowledgeDocument]:
    data = _wiki_api(
        {
            "action": "query",
            "list": "search",
            "srsearch": f"{name} footballer",
            "srlimit": 3,
        }
    )
    hits = data.get("query", {}).get("search", [])
    for hit in hits:
        doc = fetch_wikipedia_article(hit["title"])
        if doc and _looks_like_player(doc.title, doc.content):
            return doc
    return fetch_wikipedia_article(name)


def ingest_default_pack(force: bool = False) -> list[KnowledgeDocument]:
    docs: list[KnowledgeDocument] = []
    for title in TECHNIQUE_QUERIES:
        doc = fetch_wikipedia_article(title)
        if doc:
            docs.append(doc)
    for player in PLAYER_SEEDS:
        doc = search_wikipedia_player(player)
        if doc:
            docs.append(doc)
    return docs


def save_documents(docs: list[KnowledgeDocument]) -> Path:
    STORE.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "updated": datetime.now(timezone.utc).isoformat(),
        "count": len(docs),
        "documents": [asdict(d) for d in docs],
    }
    STORE.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    return STORE


def load_stored_documents() -> list[KnowledgeDocument]:
    if not STORE.exists():
        return []
    try:
        payload = json.loads(STORE.read_text(encoding="utf-8"))
    except Exception:
        return []
    out = []
    for row in payload.get("documents", []):
        out.append(
            KnowledgeDocument(
                title=row["title"],
                category=row["category"],
                content=row["content"],
                source=row["source"],
            )
        )
    return out


def stored_metadata() -> dict:
    if not STORE.exists():
        return {"count": 0, "updated": None}
    try:
        payload = json.loads(STORE.read_text(encoding="utf-8"))
        return {"count": payload.get("count", 0), "updated": payload.get("updated")}
    except Exception:
        return {"count": 0, "updated": None}


def refresh_knowledge_base(extra_players: Optional[list[str]] = None) -> dict:
    docs = ingest_default_pack()
    seen = {d.title for d in docs}
    for name in extra_players or []:
        if not name.strip():
            continue
        doc = search_wikipedia_player(name.strip())
        if doc and doc.title not in seen:
            docs.append(doc)
            seen.add(doc.title)
    path = save_documents(docs)
    return {"saved": len(docs), "path": str(path), **stored_metadata()}

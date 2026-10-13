"""Live web search for Knowledge Hub (DuckDuckGo + page excerpts)."""

from __future__ import annotations

import html
import re
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Optional

USER_AGENT = "KICKAI/0.3 (football knowledge; contact: local)"


@dataclass(frozen=True)
class WebHit:
    title: str
    url: str
    snippet: str
    body: str


def _search_duckduckgo(query: str, max_results: int = 5) -> list[dict]:
    try:
        from duckduckgo_search import DDGS

        with DDGS() as ddgs:
            return list(ddgs.text(query, max_results=max_results))
    except Exception:
        return _search_duckduckgo_html(query, max_results)


def _search_duckduckgo_html(query: str, max_results: int) -> list[dict]:
    """Fallback when duckduckgo-search is unavailable."""
    url = "https://html.duckduckgo.com/html/?" + urllib.parse.urlencode({"q": query})
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        raw = urllib.request.urlopen(request, timeout=20).read().decode("utf-8", "replace")
    except Exception:
        return []
    hits = []
    for block in re.findall(r'class="result__body".*?</div>\s*</div>', raw, flags=re.S):
        link = re.search(r'class="result__a"[^>]*href="([^"]+)"', block)
        title = re.search(r'class="result__a"[^>]*>([^<]+)', block)
        snippet = re.search(r'class="result__snippet"[^>]*>(.*?)</', block, flags=re.S)
        if not link:
            continue
        href = html.unescape(link.group(1))
        if "uddg=" in href:
            parsed = urllib.parse.parse_qs(urllib.parse.urlparse(href).query)
            href = parsed.get("uddg", [href])[0]
        hits.append(
            {
                "title": html.unescape(title.group(1)) if title else href,
                "href": href,
                "body": html.unescape(re.sub(r"<[^>]+>", " ", snippet.group(1))) if snippet else "",
            }
        )
        if len(hits) >= max_results:
            break
    return hits


def _fetch_page_text(url: str, max_chars: int = 2000) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        raw = urllib.request.urlopen(request, timeout=15).read().decode("utf-8", "replace")
    except Exception:
        return ""
    text = re.sub(r"(?is)<script.*?>.*?</script>", " ", raw)
    text = re.sub(r"(?is)<style.*?>.*?</style>", " ", text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = html.unescape(re.sub(r"\s+", " ", text)).strip()
    return text[:max_chars]


def search_internet(query: str, max_results: int = 4) -> list[WebHit]:
    rows = _search_duckduckgo(f"{query} football", max_results=max_results)
    hits: list[WebHit] = []
    for row in rows:
        url = row.get("href") or row.get("link") or ""
        if not url:
            continue
        snippet = (row.get("body") or row.get("snippet") or "").strip()
        body = _fetch_page_text(url) or snippet
        if len(body) < 40 and not snippet:
            continue
        hits.append(
            WebHit(
                title=(row.get("title") or url)[:200],
                url=url,
                snippet=snippet[:500],
                body=(body or snippet)[:1800],
            )
        )
    return hits


def format_web_answer(query: str, hits: list[WebHit]) -> dict:
    if not hits:
        return {
            "answer": (
                "I could not retrieve web results for that question. "
                "Check your network connection or try rephrasing."
            ),
            "sources": [],
            "origin": "UNAVAILABLE",
        }
    best = hits[0]
    parts = [f"### Web results for: {query}\n", best.body or best.snippet]
    if len(hits) > 1:
        parts.append("\n\n**Also found:**")
        for hit in hits[1:3]:
            parts.append(f"- {hit.title}: {hit.snippet[:200]}")
    sources = [
        {
            "title": hit.title,
            "category": "Internet",
            "source": hit.url,
            "score": round(5.0 - i * 0.5, 2),
        }
        for i, hit in enumerate(hits)
    ]
    return {
        "answer": "\n".join(parts),
        "sources": sources,
        "origin": "OBSERVED",
    }


def detect_match_query(query: str) -> Optional[tuple[str, str]]:
    patterns = [
        r"(?i)(.+?)\s+vs\.?\s+(.+?)(?:\s+prediction|\s+win|\s+odds|$)",
        r"(?i)(.+?)\s+against\s+(.+?)(?:\s+prediction|$)",
        r"(?i)who will win\s+(.+?)\s+vs\.?\s+(.+)",
        r"(?i)predict\s+(.+?)\s+vs\.?\s+(.+)",
    ]
    for pattern in patterns:
        m = re.search(pattern, query.strip())
        if m:
            home = m.group(1).strip(" ?.")
            away = m.group(2).strip(" ?.")
            if len(home) > 1 and len(away) > 1:
                return home, away
    return None

"""ClubElo ratings — http://clubelo.com/API (CSV, not JSON)."""

from __future__ import annotations

import csv
import io
import re
from dataclasses import dataclass
from datetime import date, timedelta
from difflib import get_close_matches
from pathlib import Path
from typing import Optional

from analytics.providers.http_util import CACHE_DIR, cached_fetch, try_fetch

# Common aliases → ClubElo spelling (spaces removed in URLs).
ALIASES = {
    "manchester united": "ManUnited",
    "man utd": "ManUnited",
    "man united": "ManUnited",
    "manchester city": "ManCity",
    "man city": "ManCity",
    "tottenham": "Tottenham",
    "spurs": "Tottenham",
    "newcastle": "Newcastle",
    "west ham": "WestHam",
    "wolves": "Wolves",
    "brighton": "Brighton",
    "nottingham forest": "NottmForest",
    "nottm forest": "NottmForest",
    "real madrid": "RealMadrid",
    "atletico madrid": "Atletico",
    "athletic bilbao": "Athletic",
    "inter milan": "Inter",
    "ac milan": "Milan",
    "bayern munich": "Bayern",
    "borussia dortmund": "Dortmund",
    "paris saint-germain": "PSG",
    "psg": "PSG",
}


@dataclass(frozen=True)
class ClubEloRating:
    team: str
    elo: float
    country: str
    rank: Optional[int]
    source_url: str
    from_cache: bool
    as_of: str


def _normalize(name: str) -> str:
    return re.sub(r"[^a-z0-9 ]", "", name.lower()).strip()


def _clubelo_name(name: str) -> str:
    key = _normalize(name)
    if key in ALIASES:
        return ALIASES[key]
    # ClubElo uses ManCity style — remove spaces and common suffixes.
    compact = re.sub(r"\bfc\b|\bcf\b|\bsc\b", "", key).strip()
    return "".join(part.capitalize() for part in compact.split())


def _parse_ranking_csv(text: str) -> list[dict]:
    reader = csv.DictReader(io.StringIO(text))
    rows = []
    for row in reader:
        club = row.get("Club") or row.get("club") or row.get("Team") or ""
        elo_raw = row.get("Elo") or row.get("elo") or ""
        if not club or not elo_raw:
            continue
        try:
            elo = float(elo_raw)
        except ValueError:
            continue
        rank_raw = row.get("Rank") or row.get("rank")
        rows.append(
            {
                "team": club.strip(),
                "elo": elo,
                "country": (row.get("Country") or row.get("country") or "").strip(),
                "rank": int(float(rank_raw)) if rank_raw else None,
            }
        )
    return rows


def _load_snapshot() -> list[dict]:
    path = CACHE_DIR / "clubelo_ranking_snapshot.csv"
    if not path.exists():
        return []
    return _parse_ranking_csv(path.read_text(encoding="utf-8", errors="replace"))


def _save_snapshot(text: str) -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    (CACHE_DIR / "clubelo_ranking_snapshot.csv").write_text(text, encoding="utf-8")


def fetch_ranking(as_of: Optional[date] = None, force: bool = False) -> tuple[list[dict], bool]:
    """Full ranking for a day. Returns (rows, from_cache)."""
    day = as_of or date.today()
    if not force:
        return _load_snapshot(), True
    # ClubElo may not have today's file yet — walk back up to 7 days.
    for offset in range(0, 8):
        d = day - timedelta(days=offset)
        url = f"http://api.clubelo.com/{d.isoformat()}"
        try:
            text, from_cache = cached_fetch(f"clubelo-rank-{d.isoformat()}", url, force=force)
            rows = _parse_ranking_csv(text)
            if rows:
                if not from_cache:
                    _save_snapshot(text)
                return rows, from_cache
        except Exception:
            continue
    snapshot = _load_snapshot()
    return snapshot, True


def _match_team(name: str, ranking: list[dict]) -> Optional[dict]:
    if not ranking:
        return None
    target = _normalize(name)
    names = {_normalize(r["team"]): r for r in ranking}
    if target in names:
        return names[target]
    # Try alias compact form against ranking names.
    compact = _normalize(_clubelo_name(name))
    for key, row in names.items():
        if key.replace(" ", "") == compact.replace(" ", ""):
            return row
    choices = list(names.keys())
    hit = get_close_matches(target, choices, n=1, cutoff=0.72)
    if hit:
        return names[hit[0]]
    return None


def fetch_team_elo(team_name: str, force: bool = False) -> Optional[ClubEloRating]:
    ranking, from_cache = fetch_ranking(force=force)
    hit = _match_team(team_name, ranking)
    if hit:
        return ClubEloRating(
            team=hit["team"],
            elo=float(hit["elo"]),
            country=hit.get("country", ""),
            rank=hit.get("rank"),
            source_url="http://api.clubelo.com/",
            from_cache=from_cache,
            as_of=date.today().isoformat(),
        )

    if not force:
        return None

    # Per-team history endpoint (CSV).
    club = _clubelo_name(team_name)
    url = f"http://api.clubelo.com/{club}"
    text = None
    from_cache = False
    try:
        text, from_cache = cached_fetch(f"clubelo-team-{club}", url, force=force)
    except Exception:
        text = try_fetch(url)
    if not text:
        return None
    rows = _parse_ranking_csv(text)
    if not rows:
        return None
    latest = rows[0]
    return ClubEloRating(
        team=latest.get("team") or club,
        elo=float(latest["elo"]),
        country=latest.get("country", ""),
        rank=int(latest["rank"]) if latest.get("rank") else None,
        source_url=url,
        from_cache=from_cache,
        as_of=date.today().isoformat(),
    )

"""Football data scraper — collects top 500 players + 7 popular formations from public APIs."""
from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass, asdict
from typing import Optional

import requests

logger = logging.getLogger(__name__)

# ── Public football data sources ──────────────────────────────────────
TOP_500_PLAYERS_URL = "https://raw.githubusercontent.com/kelvins/football-player-ratings/master/data/players.csv"
FORMATIONS_URL = "https://raw.githubusercontent.com/football-365/football-formations/main/data/formations.json"
TOP_CLUBS_URL = "https://raw.githubusercontent.com/football-365/football-data/master/data/clubs.json"

# ── Popular formations (fallback if scrape fails) ─────────────────────
FALLBACK_FORMATIONS = [
    {"shape": "4-3-3", "name": "4-3-3", "category": "attacking", "description": "Wingers high and wide, 3 midfielders behind, 3 forwards"},
    {"shape": "4-2-3-1", "name": "4-2-3-1", "category": "balanced", "description": "Double pivot in midfield, attacking trio behind a lone striker"},
    {"shape": "4-4-2", "name": "4-4-2", "category": "defensive", "description": "Classic formation, two banks of four, two strikers"},
    {"shape": "3-5-2", "name": "3-5-2", "category": "balanced", "description": "Three centre-backs, five midfielders, two forwards"},
    {"shape": "4-3-1-2", "name": "4-3-1-2", "category": "attacking", "description": "Diamond midfield, three forwards, one defensive midfielder"},
    {"shape": "5-3-2", "name": "5-3-2", "category": "defensive", "description": "Five defenders, three midfielders, two forwards — compact"},
    {"shape": "4-1-4-1", "name": "4-1-4-1", "category": "balanced", "description": "Single holding midfielder, four across midfield, one striker"},
]

FALLBACK_TOP_500 = [
    {"rank": 1, "name": "Erling Haaland", "position": "ST", "club": "Manchester City", "rating": 91},
    {"rank": 2, "name": "Kylian Mbappé", "position": "ST", "club": "Paris Saint-Germain", "rating": 90},
    {"rank": 3, "name": "Lionel Messi", "position": "RW", "club": "Inter Miami", "rating": 89},
    {"rank": 4, "name": "Kevin De Bruyne", "position": "CM", "club": "Manchester City", "rating": 88},
    {"rank": 5, "name": "Harry Kane", "position": "ST", "club": "Bayern Munich", "rating": 88},
]


def _safe_get(url: str, timeout: int = 10) -> Optional[requests.Response]:
    """Fetch URL with error handling."""
    try:
        resp = requests.get(url, timeout=timeout, headers={"User-Agent": "KickAI/1.0"})
        resp.raise_for_status()
        return resp
    except Exception as exc:
        logger.warning(f"Fetch failed: {url} — {exc}")
        return None


def fetch_top_500_players() -> list[dict]:
    """Scrape top 500 football players from public dataset."""
    resp = _safe_get(TOP_500_PLAYERS_URL)
    if not resp:
        logger.info("Using fallback top 500 players list.")
        return FALLBACK_TOP_500

    players = []
    lines = resp.text.strip().split("\n")
    if len(lines) < 2:
        return FALLBACK_TOP_500

    # Skip header
    for i, line in enumerate(lines[1:501]):
        parts = line.split(",")
        if len(parts) >= 4:
            players.append({
                "rank": i + 1,
                "name": parts[0].strip(),
                "position": parts[1].strip() if len(parts) > 1 else "N/A",
                "club": parts[2].strip() if len(parts) > 2 else "Unknown",
                "rating": float(parts[3].strip()) if parts[3].strip().replace('.', '').isdigit() else 80.0,
            })

    if not players:
        return FALLBACK_TOP_500
    return players


def fetch_formations() -> list[dict]:
    """Scrape popular football formations."""
    resp = _safe_get(FORMATIONS_URL)
    if not resp:
        logger.info("Using fallback formations list.")
        return FALLBACK_FORMATIONS

    try:
        data = resp.json()
        if isinstance(data, list) and data:
            return data
    except Exception:
        pass

    return FALLBACK_FORMATIONS


def save_data(data: list[dict], filename: str, cache_dir: str = "data") -> str:
    """Save scraped data to JSON file."""
    os.makedirs(cache_dir, exist_ok=True)
    path = os.path.join(cache_dir, filename)
    with open(path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    logger.info(f"Saved {len(data)} records to {path}")
    return path


def load_cached_data(filename: str, cache_dir: str = "data") -> Optional[list[dict]]:
    """Load previously cached data if available."""
    path = os.path.join(cache_dir, filename)
    if os.path.exists(path):
        try:
            with open(path, "r") as f:
                return json.load(f)
        except Exception:
            return None
    return None


def refresh_all() -> dict:
    """Scrape and cache all football data."""
    players = fetch_top_500_players()
    formations = fetch_formations()

    save_data(players, "top_500_players.json")
    save_data(formations, "formations.json")

    return {
        "players_count": len(players),
        "formations_count": len(formations),
        "players_sample": players[:3],
        "formations_sample": formations[:3],
    }


if __name__ == "__main__":
    result = refresh_all()
    print(json.dumps(result, indent=2))
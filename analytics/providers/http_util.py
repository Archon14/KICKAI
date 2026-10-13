"""HTTP helpers with disk cache. No API keys required for ClubElo / Wikipedia."""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Optional

CACHE_DIR = Path(__file__).resolve().parents[2] / "data" / "cache"
USER_AGENT = "KICKAI/0.3 (football analytics; +https://github.com/kickai)"


def fetch_text(url: str, timeout: float = 25.0) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read().decode("utf-8", errors="replace")


def cache_path(key: str) -> Path:
    safe = "".join(c if c.isalnum() or c in "-_." else "_" for c in key)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    return CACHE_DIR / f"{safe}.json"


def cached_fetch(
    key: str,
    url: str,
    ttl_seconds: int = 86_400,
    force: bool = False,
) -> tuple[str, bool]:
    """Return (body, from_cache)."""
    path = cache_path(key)
    if not force and path.exists():
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
            if time.time() - float(payload.get("ts", 0)) < ttl_seconds:
                return str(payload["body"]), True
        except Exception:
            pass
    body = fetch_text(url)
    path.write_text(
        json.dumps({"ts": time.time(), "url": url, "body": body}, ensure_ascii=False),
        encoding="utf-8",
    )
    return body, False


def try_fetch(url: str, timeout: float = 25.0) -> Optional[str]:
    try:
        return fetch_text(url, timeout=timeout)
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError):
        return None

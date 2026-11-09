"""Unified team lookup: Elo from ClubElo + automatic xG estimate."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from analytics.providers.clubelo import ClubEloRating, fetch_team_elo
from analytics.providers.xg_estimate import MatchXGEstimate, xg_from_clubelo_fixture, xg_from_elo


@dataclass(frozen=True)
class TeamStats:
    query: str
    clubelo_name: str
    elo: float
    elo_origin: str
    elo_source: str
    rank: Optional[int]
    country: str
    from_cache: bool
    notes: list[str]


@dataclass(frozen=True)
class MatchupStats:
    home: TeamStats
    away: TeamStats
    home_xg: float
    away_xg: float
    xg_origin: str
    xg_method: str
    xg_notes: str


def lookup_team(name: str, force: bool = False) -> TeamStats:
    notes: list[str] = []
    rating = fetch_team_elo(name, force=force)
    if rating is None and not force:
        import json
        from pathlib import Path
        ratings_file = Path(__file__).resolve().parents[2] / "data/football/team_ratings.json"
        if ratings_file.exists():
            ratings = json.loads(ratings_file.read_text())
            aliases = {
                "manchester city": "Man City",
                "manchester united": "Man United",
                "nottingham forest": "Nott'm Forest",
                "newcastle united": "Newcastle",
                "tottenham hotspur": "Tottenham",
                "brighton and hove albion": "Brighton",
            }
            team = aliases.get(name.strip().lower(), name.strip())
            match = next((key for key in ratings if key.lower() == team.lower()), None)
            if match:
                return TeamStats(
                    query=name,
                    clubelo_name=match,
                    elo=float(ratings[match]["elo"]),
                    elo_origin="ESTIMATED",
                    elo_source="2025-26 Premier League match results",
                    rank=None,
                    country="England",
                    from_cache=True,
                    notes=["Historical rating estimate, not official ClubElo."],
                )
    if rating is None:
        notes.append("ClubElo lookup failed — API may be down or team name not found.")
        return TeamStats(
            query=name,
            clubelo_name=name,
            elo=1500.0,
            elo_origin="UNAVAILABLE",
            elo_source="",
            rank=None,
            country="",
            from_cache=False,
            notes=notes,
        )
    if rating.from_cache:
        notes.append("Elo served from local cache (ClubElo API may be stale).")
    return TeamStats(
        query=name,
        clubelo_name=rating.team,
        elo=rating.elo,
        elo_origin="OBSERVED",
        elo_source=rating.source_url,
        rank=rating.rank,
        country=rating.country,
        from_cache=rating.from_cache,
        notes=notes,
    )


def lookup_matchup(home_name: str, away_name: str, force: bool = False) -> MatchupStats:
    home = lookup_team(home_name, force=force)
    away = lookup_team(away_name, force=force)

    if home.elo_origin == "OBSERVED" and away.elo_origin == "OBSERVED":
        xg = xg_from_clubelo_fixture(
            ClubEloRating(home.clubelo_name, home.elo, home.country, home.rank, home.elo_source, home.from_cache, ""),
            ClubEloRating(away.clubelo_name, away.elo, away.country, away.rank, away.elo_source, away.from_cache, ""),
        )
    else:
        xg = xg_from_elo(home.elo, away.elo)
        xg = MatchXGEstimate(
            home_xg=xg.home_xg,
            away_xg=xg.away_xg,
            method=xg.method,
            origin="ESTIMATED",
            notes=xg.notes + " One or both Elo values are defaults.",
        )

    return MatchupStats(
        home=home,
        away=away,
        home_xg=xg.home_xg,
        away_xg=xg.away_xg,
        xg_origin=xg.origin,
        xg_method=xg.method,
        xg_notes=xg.notes,
    )

"""Automatic match xG from public team strength when shot-level xG is unavailable."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import numpy as np

from analytics.providers.clubelo import ClubEloRating


@dataclass(frozen=True)
class MatchXGEstimate:
    home_xg: float
    away_xg: float
    method: str
    origin: str  # OBSERVED | ESTIMATED
    notes: str


def xg_from_elo(
    home_elo: float,
    away_elo: float,
    home_advantage_elo: float = 65.0,
    league_total_xg: float = 2.65,
) -> MatchXGEstimate:
    """
    Poisson-style split from Elo strength difference.
    Not shot-level xG — labeled ESTIMATED.
    """
    diff = (home_elo + home_advantage_elo) - away_elo
    home_share = 1.0 / (1.0 + 10.0 ** (-diff / 400.0))
    home_xg = float(np.clip(league_total_xg * home_share * 1.06, 0.35, 3.8))
    away_xg = float(np.clip(league_total_xg * (1.0 - home_share), 0.30, 3.5))
    return MatchXGEstimate(
        home_xg=home_xg,
        away_xg=away_xg,
        method="elo_strength_split",
        origin="ESTIMATED",
        notes=(
            "Derived from ClubElo ratings + home advantage. "
            "This is not shot-level xG from event data."
        ),
    )


def xg_from_clubelo_fixture(
    home: ClubEloRating,
    away: ClubEloRating,
) -> MatchXGEstimate:
    return xg_from_elo(home.elo, away.elo)


def try_understat_season_xg(team_name: str, season: Optional[int] = None) -> Optional[float]:
    """
    Understat no longer embeds JSON in HTML reliably.
    Reserved hook — returns None until a stable public endpoint exists.
    """
    return None

"""Fetch internet team stats and run MatchPredictor in one step."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from analytics.match_predictor import MatchPrediction, MatchPredictor
from analytics.providers.team_stats import MatchupStats, lookup_matchup


@dataclass(frozen=True)
class AutoMatchResult:
    matchup: MatchupStats
    prediction: MatchPrediction
    score_distribution: list[dict]


def auto_predict_match(
    home_team: str,
    away_team: str,
    simulations: int = 10_000,
    seed: Optional[int] = 42,
    force_lookup: bool = False,
) -> AutoMatchResult:
    matchup = lookup_matchup(home_team, away_team, force=force_lookup)
    predictor = MatchPredictor(home_elo=matchup.home.elo, away_elo=matchup.away.elo)
    prediction = predictor.simulate(
        home_xg=matchup.home_xg,
        away_xg=matchup.away_xg,
        simulations=simulations,
        seed=seed,
    )
    distribution = predictor.score_distribution(
        home_xg=matchup.home_xg,
        away_xg=matchup.away_xg,
        simulations=simulations,
        seed=seed,
    )
    return AutoMatchResult(
        matchup=matchup,
        prediction=prediction,
        score_distribution=distribution,
    )

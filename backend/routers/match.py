"""Match simulation router for Kick AI backend."""

from __future__ import annotations

import logging
from fastapi import APIRouter

from backend.config import USE_MOCK_DATA
from backend.mock_data import get_mock_match_response
from backend.schemas import MatchSimulateRequest, MatchSimulateResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/match", tags=["match"])


@router.post("/simulate", response_model=MatchSimulateResponse)
async def simulate_match(payload: MatchSimulateRequest) -> MatchSimulateResponse:
    """Simulate football match using Monte Carlo, Poisson distributions, and Elo ratings."""
    if USE_MOCK_DATA:
        mock_data = get_mock_match_response(
            home_team=payload.home_team,
            away_team=payload.away_team,
            home_elo=payload.home_elo or 1850.0,
            away_elo=payload.away_elo or 1830.0,
            home_xg=payload.home_xg or 1.65,
            away_xg=payload.away_xg or 1.35,
            simulations=payload.simulations,
        )
        return MatchSimulateResponse(**mock_data)

    try:
        from analytics.match_predictor import MatchPredictor

        home_elo = float(payload.home_elo if payload.home_elo is not None else 1500.0)
        away_elo = float(payload.away_elo if payload.away_elo is not None else 1500.0)
        home_xg = float(payload.home_xg if payload.home_xg is not None else 1.5)
        away_xg = float(payload.away_xg if payload.away_xg is not None else 1.2)

        if payload.auto_lookup:
            try:
                from analytics.auto_predict import auto_predict_match

                res = auto_predict_match(
                    home_team=payload.home_team,
                    away_team=payload.away_team,
                    simulations=payload.simulations,
                    seed=payload.seed,
                )
                return MatchSimulateResponse(
                    home_team=payload.home_team,
                    away_team=payload.away_team,
                    home_win_probability=round(res.prediction.home_win_probability, 4),
                    draw_probability=round(res.prediction.draw_probability, 4),
                    away_win_probability=round(res.prediction.away_win_probability, 4),
                    expected_home_goals=round(res.prediction.expected_home_goals, 3),
                    expected_away_goals=round(res.prediction.expected_away_goals, 3),
                    simulations=res.prediction.simulations,
                    most_likely_score=list(res.prediction.most_likely_score),
                    score_distribution=res.score_distribution,
                    home_elo=res.matchup.home.elo,
                    away_elo=res.matchup.away.elo,
                    home_xg=round(res.matchup.home_xg, 2),
                    away_xg=round(res.matchup.away_xg, 2),
                    mock=False,
                )
            except Exception as lookup_exc:
                logger.warning(f"Auto lookup failed ({lookup_exc}), falling back to direct simulator.")

        predictor = MatchPredictor(home_elo=home_elo, away_elo=away_elo)
        pred = predictor.simulate(
            home_xg=home_xg,
            away_xg=away_xg,
            simulations=payload.simulations,
            seed=payload.seed,
        )
        dist = predictor.score_distribution(
            home_xg=home_xg,
            away_xg=away_xg,
            simulations=payload.simulations,
            seed=payload.seed,
        )

        return MatchSimulateResponse(
            home_team=payload.home_team,
            away_team=payload.away_team,
            home_win_probability=round(pred.home_win_probability, 4),
            draw_probability=round(pred.draw_probability, 4),
            away_win_probability=round(pred.away_win_probability, 4),
            expected_home_goals=round(pred.expected_home_goals, 3),
            expected_away_goals=round(pred.expected_away_goals, 3),
            simulations=pred.simulations,
            most_likely_score=list(pred.most_likely_score),
            score_distribution=dist,
            home_elo=home_elo,
            away_elo=away_elo,
            home_xg=home_xg,
            away_xg=away_xg,
            mock=False,
        )
    except Exception as exc:
        logger.error(f"Error simulating match: {exc}", exc_info=True)
        fallback = get_mock_match_response(
            home_team=payload.home_team,
            away_team=payload.away_team,
            home_elo=payload.home_elo or 1850.0,
            away_elo=payload.away_elo or 1830.0,
            home_xg=payload.home_xg or 1.65,
            away_xg=payload.away_xg or 1.35,
            simulations=payload.simulations,
        )
        fallback["mock"] = True
        return MatchSimulateResponse(**fallback)

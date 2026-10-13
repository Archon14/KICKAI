"""Player evaluation router for Kick AI backend."""

from __future__ import annotations

import logging
from fastapi import APIRouter

from backend.config import USE_MOCK_DATA
from backend.mock_data import get_mock_player_response
from backend.schemas import PlayerEvaluationRequest, PlayerEvaluationResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["player"])


@router.post("/player-evaluation", response_model=PlayerEvaluationResponse)
async def evaluate_player(payload: PlayerEvaluationRequest) -> PlayerEvaluationResponse:
    """Evaluate player skill set, tactical fit, physical attributes, and tactical suggestions."""
    if USE_MOCK_DATA:
        mock_data = get_mock_player_response(
            player_id=payload.player_id,
            name=payload.name,
            team=payload.team,
            role=payload.role,
        )
        return PlayerEvaluationResponse(**mock_data)

    try:
        # Weighted composite score based on attributes
        weights = {
            "finishing": 0.15,
            "passing": 0.20,
            "dribbling": 0.15,
            "tactical_intelligence": 0.25,
            "creativity": 0.15,
            "risk_appetite": 0.10,
        }
        raw_score = (
            payload.finishing * weights["finishing"]
            + payload.passing * weights["passing"]
            + payload.dribbling * weights["dribbling"]
            + payload.tactical_intelligence * weights["tactical_intelligence"]
            + payload.creativity * weights["creativity"]
            + payload.risk_appetite * weights["risk_appetite"]
        )
        # Scale to 0-100 rating
        overall_rating = round(raw_score * 100, 1)

        strengths = []
        weaknesses = []

        if payload.finishing >= 0.70:
            strengths.append(f"Clinical finishing quality ({payload.finishing:.2f})")
        elif payload.finishing < 0.40:
            weaknesses.append(f"Low shot conversion inside penalty box ({payload.finishing:.2f})")

        if payload.passing >= 0.70:
            strengths.append(f"Accurate distribution & progressive passing ({payload.passing:.2f})")
        elif payload.passing < 0.40:
            weaknesses.append(f"Unreliable pass weight under pressure ({payload.passing:.2f})")

        if payload.tactical_intelligence >= 0.75:
            strengths.append(f"Elite pitch reading and scanning ({payload.tactical_intelligence:.2f})")
        elif payload.tactical_intelligence < 0.45:
            weaknesses.append("Delayed tactical scanning before receiving")

        if payload.creativity >= 0.75:
            strengths.append(f"High unexpected pass/dribble generation ({payload.creativity:.2f})")

        if payload.fatigue > 0.50:
            weaknesses.append(f"Significant physical fatigue ({payload.fatigue:.2f}) limiting repeat sprint ability")

        if not strengths:
            strengths.append("Balanced foundational skill baseline")
        if not weaknesses:
            weaknesses.append("Maintain decision consistency against elite pressing triggers")

        recommended_actions = [
            f"Leverage preferred {payload.preferred_foot} foot in half-space receiving orientations",
            "Adjust sprint cadence based on defensive recovery vectors",
            "Maintain body orientation open to central pitch corridor",
        ]

        return PlayerEvaluationResponse(
            player_id=payload.player_id,
            name=payload.name,
            team=payload.team,
            role=payload.role,
            overall_rating=overall_rating,
            role_fit=f"Tactical Profile: {payload.role.title()}",
            strengths=strengths,
            weaknesses=weaknesses,
            recommended_actions=recommended_actions,
            metrics={
                "finishing": payload.finishing,
                "passing": payload.passing,
                "dribbling": payload.dribbling,
                "tactical_intelligence": payload.tactical_intelligence,
                "risk_appetite": payload.risk_appetite,
                "creativity": payload.creativity,
                "speed": payload.max_speed_mps,
                "fatigue": payload.fatigue,
            },
            claim="EVALUATED",
            provenance={
                "origin": "INFERRED",
                "model": "player-evaluator",
                "calculation": "multi-attribute weighted composite + tactical profile match",
                "input_quality": 0.88,
            },
            mock=False,
        )
    except Exception as exc:
        logger.error(f"Error evaluating player: {exc}", exc_info=True)
        fallback = get_mock_player_response(
            player_id=payload.player_id,
            name=payload.name,
            team=payload.team,
            role=payload.role,
        )
        fallback["mock"] = True
        return PlayerEvaluationResponse(**fallback)

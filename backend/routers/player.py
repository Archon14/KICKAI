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
        # Position-specific weights for the existing six skill inputs.
        # These are provisional KICKAI assessment weights, not official FC ratings.
        # Eight-skill position weights, each totaling 1.0.
        # Provisional KICKAI assessments, not official game ratings.
        position_weights = {
            "ST":  (0.34, 0.08, 0.20, 0.10, 0.06, 0.06, 0.02, 0.14),
            "RW":  (0.18, 0.12, 0.30, 0.10, 0.12, 0.06, 0.04, 0.08),
            "CAM": (0.10, 0.26, 0.18, 0.18, 0.14, 0.04, 0.04, 0.06),
            "CM":  (0.06, 0.26, 0.12, 0.24, 0.10, 0.04, 0.10, 0.08),
            "CDM": (0.02, 0.20, 0.06, 0.26, 0.04, 0.04, 0.24, 0.14),
            "CB":  (0.02, 0.08, 0.04, 0.22, 0.02, 0.02, 0.38, 0.22),
            "FB":  (0.03, 0.18, 0.12, 0.18, 0.04, 0.03, 0.24, 0.18),
        }

        role = payload.role.strip().lower()
        if role in {"st", "cf", "striker", "centre forward", "center forward"}:
            position = "ST"
        elif role in {"rw", "lw", "winger", "right winger", "left winger",
                      "inverted right winger", "inverted left winger"}:
            position = "RW"
        elif role in {"cam", "attacking midfielder", "advanced playmaker"}:
            position = "CAM"
        elif role in {"cm", "central midfielder", "box-to-box midfielder"}:
            position = "CM"
        elif role in {"cdm", "defensive midfielder", "holding midfielder"}:
            position = "CDM"
        elif role in {"cb", "centre back", "center back", "central defender"}:
            position = "CB"
        elif role in {"lb", "rb", "left back", "right back", "fullback"}:
            position = "FB"
        else:
            position = "DEFAULT"

        weights = position_weights.get(
            position, (0.12, 0.17, 0.12, 0.20, 0.12, 0.07, 0.10, 0.10)
        )
        values = (
            payload.finishing,
            payload.passing,
            payload.dribbling,
            payload.tactical_intelligence,
            payload.creativity,
            payload.risk_appetite,
            payload.defending,
            payload.physical,
        )
        raw_score = sum(value * weight for value, weight in zip(values, weights))
        overall_rating = round(raw_score * 100, 1)

        # Six football-card attributes (0-100).
        # Derived from manually assessed inputs, not verified match data.
        pace = round(100 * (
            0.7 * ((payload.max_speed_mps - 5.0) / 6.0) +
            0.3 * ((payload.accel_limit - 2.0) / 4.5)
        ))
        card_attributes = {
            "PAC": max(0, min(100, pace)),
            "SHO": round(payload.finishing * 100),
            "PAS": round(payload.passing * 100),
            "DRI": round(payload.dribbling * 100),
            "DEF": round(payload.defending * 100),
            "PHY": round(payload.physical * 100),
        }

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

        # Feedback based on manually entered defensive and physical assessments.
        if payload.defending >= 0.75:
            strengths.append(f"Strong defensive ability ({payload.defending:.2f})")
        elif payload.defending < 0.45:
            weaknesses.append(f"Defensive positioning and tackling need improvement ({payload.defending:.2f})")

        if payload.physical >= 0.75:
            strengths.append(f"Strong physical ability ({payload.physical:.2f})")
        elif payload.physical < 0.45:
            weaknesses.append(f"Physical strength and conditioning need improvement ({payload.physical:.2f})")

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

        if position in {"CB", "CDM", "FB"}:
            if payload.defending < 0.70:
                recommended_actions.append(
                    "Practice defensive positioning, jockeying and controlled tackling"
                )
            if payload.physical < 0.70:
                recommended_actions.append(
                    "Develop strength, balance and repeat-effort conditioning"
                )

        return PlayerEvaluationResponse(
            player_id=payload.player_id,
            name=payload.name,
            team=payload.team,
            role=payload.role,
            overall_rating=overall_rating,
            role_fit=f"Position: {position} | {payload.role.title()}",
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
                "max_speed_mps": payload.max_speed_mps,
                "fatigue": payload.fatigue,
                "defending": payload.defending,
                "physical": payload.physical,
                **{key.lower(): float(value) for key, value in card_attributes.items()},
            },
            claim="EVALUATED",
            provenance={
                "origin": "INFERRED",
                "model": "player-evaluator",
                "calculation": f"position-weighted six-skill composite ({position})",
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

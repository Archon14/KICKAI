"""Training lab router for Kick AI backend."""

from __future__ import annotations

import logging
from fastapi import APIRouter

from backend.config import USE_MOCK_DATA
from backend.mock_data import get_mock_training_response
from backend.schemas import DrillModel, TrainingAdaptiveDrillRequest, TrainingAdaptiveDrillResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/training", tags=["training"])


@router.post("/adaptive-drill", response_model=TrainingAdaptiveDrillResponse)
async def generate_adaptive_drill(payload: TrainingAdaptiveDrillRequest) -> TrainingAdaptiveDrillResponse:
    """Generate adaptive football training drill responding to player success streak or failure mode."""
    if USE_MOCK_DATA:
        mock_data = get_mock_training_response(
            success=payload.success,
            error=payload.error,
            current_difficulty=payload.current_difficulty or 0.4,
        )
        return TrainingAdaptiveDrillResponse(**mock_data)

    try:
        from core.training import AdaptiveCoach

        coach = AdaptiveCoach()
        if payload.current_difficulty is not None:
            coach.difficulty = float(payload.current_difficulty)

        plan = coach.observe(payload.success, payload.error)
        drill_dict = {
            "name": plan.drill.name,
            "focus": plan.drill.focus,
            "difficulty": round(float(plan.drill.difficulty), 3),
            "repetitions": plan.drill.repetitions,
            "visual_cues": plan.drill.visual_cues,
            "audio_cues": plan.drill.audio_cues,
            "team": plan.drill.team,
        }

        return TrainingAdaptiveDrillResponse(
            weakness=plan.weakness,
            drill=DrillModel(**drill_dict),
            feedback=plan.feedback,
            failure_mode=plan.failure_mode,
            next_difficulty=round(float(plan.next_difficulty), 3),
            audio_required=plan.audio_required,
            claim=plan.claim.value if hasattr(plan.claim, "value") else str(plan.claim),
            provenance=plan.provenance,
            mock=False,
        )
    except Exception as exc:
        logger.error(f"Error generating adaptive drill: {exc}", exc_info=True)
        fallback = get_mock_training_response(
            success=payload.success,
            error=payload.error,
            current_difficulty=payload.current_difficulty or 0.4,
        )
        fallback["mock"] = True
        return TrainingAdaptiveDrillResponse(**fallback)

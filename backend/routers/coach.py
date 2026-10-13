"""Coach override router for Kick AI backend."""

from __future__ import annotations

import logging
from fastapi import APIRouter

from backend.config import USE_MOCK_DATA
from backend.mock_data import get_mock_coach_override_response
from backend.schemas import CoachOverrideRequest, CoachOverrideResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/coach", tags=["coach"])

# In-memory coach audit log history
_COACH_HISTORY = [
    {
        "id": "log-001",
        "timestamp": "2026-10-12T10:15:22Z",
        "action": "Modify",
        "option_id": "pass-diagonal",
        "note": "Preferred inverted winger underlap over wide cross due to opposition low block.",
        "family": "balanced",
        "provenance": {"origin": "coach_decision_engine", "decision_rule": "tactical_override"},
    },
    {
        "id": "log-002",
        "timestamp": "2026-10-12T11:02:18Z",
        "action": "Accept",
        "option_id": "shoot",
        "note": "Approved high-xG shot from central zone under low pressure.",
        "family": "aggressive",
        "provenance": {"origin": "tactical_evaluation", "confidence": 0.82},
    },
    {
        "id": "log-003",
        "timestamp": "2026-10-12T11:35:40Z",
        "action": "Reject",
        "option_id": "carry",
        "note": "Refused dribble carry into congested half-space; demanded ball retention.",
        "family": "safe",
        "provenance": {"origin": "coach_decision_engine", "fatigue_mitigation": True},
    },
]


@router.get("/history")
async def get_coach_history():
    """Retrieve coach override audit log entries."""
    return {"history": _COACH_HISTORY, "count": len(_COACH_HISTORY)}


@router.post("/override", response_model=CoachOverrideResponse)
async def coach_override(payload: CoachOverrideRequest) -> CoachOverrideResponse:
    """Apply coach override/decision to AI recommendations (AI suggests, coach decides)."""
    import datetime

    entry = {
        "id": f"log-{len(_COACH_HISTORY) + 1:03d}",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "action": payload.action,
        "option_id": payload.option_id,
        "note": payload.note or f"Coach action {payload.action} executed.",
        "family": payload.family or "balanced",
        "provenance": {"origin": "coach_override_api", "seed": payload.seed},
    }
    _COACH_HISTORY.insert(0, entry)

    if USE_MOCK_DATA:
        mock_data = get_mock_coach_override_response(
            action=payload.action,
            option_id=payload.option_id,
            note=payload.note,
            family=payload.family,
        )
        return CoachOverrideResponse(**mock_data)

    try:
        from core.engine import KickAIEngine
        from core.world import simulated_attacking_third

        engine = KickAIEngine()
        state = simulated_attacking_third(payload.seed)
        report = engine.tactics.decide(state, family=payload.family or "balanced")

        result = engine.challenge(
            state=state,
            report=report,
            action=payload.action,
            option_id=payload.option_id,
            note=payload.note,
            family=payload.family,
        )
        result["mock"] = False
        return CoachOverrideResponse(**result)
    except Exception as exc:
        logger.error(f"Error applying coach override: {exc}", exc_info=True)
        fallback = get_mock_coach_override_response(
            action=payload.action,
            option_id=payload.option_id,
            note=payload.note,
            family=payload.family,
        )
        fallback["mock"] = True
        return CoachOverrideResponse(**fallback)

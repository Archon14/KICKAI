"""Tactical analysis router for Kick AI backend."""

from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException

from backend.config import USE_MOCK_DATA
from backend.mock_data import get_mock_tactics_response
from backend.schemas import TacticsAnalyzeRequest, TacticsAnalyzeResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/tactics", tags=["tactics"])


@router.post("/analyze", response_model=TacticsAnalyzeResponse)
async def analyze_tactics(payload: TacticsAnalyzeRequest) -> TacticsAnalyzeResponse:
    """Analyze attacking state and generate physics-aware tactical options."""
    if USE_MOCK_DATA:
        mock_data = get_mock_tactics_response(family=payload.family, seed=payload.seed)
        if payload.match_minute is not None:
            mock_data["match_minute"] = payload.match_minute
        if payload.score is not None:
            mock_data["score"] = payload.score
        return TacticsAnalyzeResponse(**mock_data)

    try:
        from core.engine import KickAIEngine
        from core.world import simulated_attacking_third

        engine = KickAIEngine()
        state = simulated_attacking_third(payload.seed)
        if payload.match_minute is not None:
            state.match_minute = payload.match_minute
            state.timestamp_s = payload.match_minute * 60.0
        if payload.score is not None and len(payload.score) >= 2:
            state.score = (int(payload.score[0]), int(payload.score[1]))

        data = engine.analyze_state(state, family=payload.family)
        data["mock"] = False
        return TacticsAnalyzeResponse(**data)
    except Exception as exc:
        logger.error(f"Error analyzing tactics: {exc}", exc_info=True)
        # Fall back to mock if engine execution fails
        fallback = get_mock_tactics_response(family=payload.family, seed=payload.seed)
        fallback["mock"] = True
        return TacticsAnalyzeResponse(**fallback)

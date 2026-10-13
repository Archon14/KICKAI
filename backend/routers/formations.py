"""Formation recommendation router for Kick AI backend."""

from __future__ import annotations

import logging
from fastapi import APIRouter

from backend.config import USE_MOCK_DATA
from backend.mock_data import get_mock_formations_response
from backend.schemas import FormationRecommendRequest, FormationRecommendResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/formations", tags=["formations"])


@router.post("/recommend", response_model=FormationRecommendResponse)
async def recommend_formation(payload: FormationRecommendRequest) -> FormationRecommendResponse:
    """Recommend and rank tactical formations based on team identity, tempo, risk appetite, and fatigue."""
    if USE_MOCK_DATA:
        mock_data = get_mock_formations_response(team=payload.team, identity=payload.identity)
        return FormationRecommendResponse(**mock_data)

    try:
        from core.formations import recommend_formations
        from core.world import simulated_attacking_third

        state = simulated_attacking_third(7)
        state.tactical.identity = payload.identity
        state.tactical.tempo = payload.tempo
        state.tactical.risk_appetite = payload.risk_appetite
        state.match_minute = payload.match_minute

        for player in state.team_players(payload.team):
            player.fatigue = payload.fatigue

        result = recommend_formations(state, team=payload.team)
        result["mock"] = False
        return FormationRecommendResponse(**result)
    except Exception as exc:
        logger.error(f"Error recommending formations: {exc}", exc_info=True)
        fallback = get_mock_formations_response(team=payload.team, identity=payload.identity)
        fallback["mock"] = True
        return FormationRecommendResponse(**fallback)

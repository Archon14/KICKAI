"""AI Coach assistant router using OpenRouter with mock fallback."""

from __future__ import annotations

import logging
from fastapi import APIRouter
import requests

from backend.config import OPENROUTER_API_KEY, OPENROUTER_MODEL, USE_MOCK_DATA
from backend.mock_data import get_mock_ai_coach_response
from backend.schemas import AiCoachAskRequest, AiCoachAskResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ai", tags=["ai"])

SYSTEM_PROMPT = """You are Kick AI, an elite professional football coaching intelligence system.
You specialize strictly in football (soccer). Never discuss or answer about other sports.
Your domain expertise covers:
1. Physics-aware tactical actions (passing corridors, shooting angles, xG, momentum, ball velocity)
2. Formation setups (4-3-3, 4-2-3-1, 3-2-4-1, 3-5-2, etc.) and in-possession shape rotations
3. Match predictions (Elo ratings, Poisson simulation, open-play expected goals)
4. Adaptive training drills and biomechanics (decision windows, reaction delays, failure modes: late, heavy_touch, closed_body, no_scan, overhit, underhit)
5. Player analytics, scouting, and physical efficiency

Be concise, tactical, sharp, and authoritative like an elite UEFA Pro coach. Mention metrics, space, and timing when relevant."""


def determine_expression(query: str, answer: str) -> str:
    try:
        from core.voice_coach import expression_for
        return expression_for(query)
    except Exception:
        q = (query or "").lower()
        if "vs" in q or "predict" in q or "who will win" in q:
            return "confident"
        if any(w in q for w in ("why", "how", "explain")):
            return "thinking"
        return "speaking"


@router.post("/ask", response_model=AiCoachAskResponse)
async def ask_ai_coach(payload: AiCoachAskRequest) -> AiCoachAskResponse:
    """Ask Kick AI coaching intelligence a question about football tactics, matches, or drills."""
    if USE_MOCK_DATA or not OPENROUTER_API_KEY or OPENROUTER_API_KEY == "your_key_here":
        mock_data = get_mock_ai_coach_response(payload.prompt)
        return AiCoachAskResponse(**mock_data)

    try:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
        ]
        if payload.context:
            messages.append(
                {
                    "role": "system",
                    "content": f"Current match/tactical context: {payload.context}",
                }
            )
        messages.append({"role": "user", "content": payload.prompt})

        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://kickai.football",
                "X-Title": "Kick AI Football Intelligence",
            },
            json={
                "model": OPENROUTER_MODEL,
                "messages": messages,
                "temperature": 0.4,
                "max_tokens": 600,
            },
            timeout=15,
        )

        if response.status_code == 200:
            result = response.json()
            answer = result["choices"][0]["message"]["content"].strip()
            expression = determine_expression(payload.prompt, answer)
            return AiCoachAskResponse(
                query=payload.prompt,
                answer=answer,
                expression=expression,
                origin="INFERRED",
                model=OPENROUTER_MODEL,
                mock=False,
            )
        else:
            logger.warning(
                f"OpenRouter returned status {response.status_code}: {response.text}. Using mock fallback."
            )
            mock_data = get_mock_ai_coach_response(payload.prompt)
            mock_data["mock"] = True
            return AiCoachAskResponse(**mock_data)

    except Exception as exc:
        logger.error(f"Error querying AI coach: {exc}", exc_info=True)
        mock_data = get_mock_ai_coach_response(payload.prompt)
        mock_data["mock"] = True
        return AiCoachAskResponse(**mock_data)

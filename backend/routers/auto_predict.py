"""Automatic match prediction — uses scraper data + tactical engine (no manual Elo)."""
from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from analytics.scraper import refresh_all, load_cached_data
from analytics.auto_predict import auto_predict_match, AutoMatchResult
from analytics.providers.clubelo import ClubEloRating

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auto", tags=["auto_match"])


class AutoPredictRequest(BaseModel):
    home_team: str = Field(default="Arsenal", description="Home team name (scraped from top 500)")
    away_team: str = Field(default="Liverpool", description="Away team name")
    include_formation_recommendation: bool = Field(default=True)
    refresh_data: bool = Field(default=False, description="Re-scrape top 500 players + formations")


class AutoPredictResponse(BaseModel):
    status: str
    home_team: str
    away_team: str
    prediction_source: str  # "scraped", "cached", "fallback"
    predictions: dict
    formations_recommended: list[str]
    data_freshness: str  # timestamp or "old"


@router.post("/predict", response_model=AutoPredictResponse)
async def auto_predict(payload: AutoPredictRequest) -> AutoPredictResponse:
    """Automatic prediction — no manual Elo or xG input required."""
    data_fresh = "cached"

    # Refresh data if requested (or if no cached data exists)
    if payload.refresh_data:
        result = refresh_all()
        data_fresh = "fresh"
        players = result.get("players_sample", [])
        formations = result.get("formations_sample", [])
    else:
        players = load_cached_data("top_500_players.json") or []
        formations = load_cached_data("formations.json") or []
        if not players:
            from analytics.scraper import FALLBACK_TOP_500, FALLBACK_FORMATIONS
            players = FALLBACK_TOP_500
            formations = FALLBACK_FORMATIONS
            data_fresh = "fallback"

    # Find players in dataset (or fall back to defaults)
    home_elo = 1850.0
    away_elo = 1830.0
    home_xg = 1.65
    away_xg = 1.35

    for p in players:
        if payload.home_team.lower() in p.get("club", "").lower() or payload.home_team.lower() == p.get("name", "").lower():
            home_elo = float(p.get("rating", 1850.0))
        if payload.away_team.lower() in p.get("club", "").lower() or payload.away_team.lower() == p.get("name", "").lower():
            away_elo = float(p.get("rating", 1830.0))

    # Reject clubs without a verified rating or historical dataset entry.
    from analytics.providers.team_stats import lookup_team
    for team_name in (payload.home_team, payload.away_team):
        team_stats = lookup_team(team_name)
        if team_stats.elo_origin == "UNAVAILABLE":
            raise HTTPException(
                status_code=422,
                detail=f"Team '{team_name}' not found in available football data."
            )

    # Use the tactical engine to generate predictions automatically
    try:
        result = auto_predict_match(
            home_team=payload.home_team,
            away_team=payload.away_team,
            simulations=10_000,
            seed=42,
            force_lookup=False,
        )
        prediction_dict = {
            "home_win_probability": result.prediction.home_win_probability,
            "draw_probability": result.prediction.draw_probability,
            "away_win_probability": result.prediction.away_win_probability,
            "expected_home_goals": result.prediction.expected_home_goals,
            "expected_away_goals": result.prediction.expected_away_goals,
            "most_likely_score": result.prediction.most_likely_score,
            "simulations": result.prediction.simulations,
            "elo_home": result.matchup.home.elo,
            "elo_away": result.matchup.away.elo,
            "xg_home": result.matchup.home_xg,
            "xg_away": result.matchup.away_xg,
        }
    except Exception as exc:
        logger.warning(f"Auto prediction failed: {exc}, using default predictions.")
        prediction_dict = {
            "status": "fallback",
            "home_win_probability": 0.45,
            "draw_probability": 0.25,
            "away_win_probability": 0.30,
            "expected_home_goals": 1.5,
            "expected_away_goals": 1.3,
            "simulations": 10_000,
            "note": "Used default values; dataset not fully loaded.",
        }

    formations_recommended = [f.get("shape", "4-3-3") for f in formations[:3]] if formations else ["4-3-3", "4-2-3-1", "3-5-2"]

    return AutoPredictResponse(
        status="ok",
        home_team=payload.home_team,
        away_team=payload.away_team,
        prediction_source="scraped" if data_fresh == "fresh" else "cached",
        predictions=prediction_dict,
        formations_recommended=formations_recommended,
        data_freshness=data_fresh,
    )

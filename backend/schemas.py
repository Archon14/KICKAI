"""Pydantic schemas for Kick AI FastAPI backend."""

from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field


# ==========================================
# Health Check
# ==========================================
class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "1.0.0"
    app: str = "Kick AI Football Intelligence API"
    mock_mode: bool = True


# ==========================================
# Tactics Schemas
# ==========================================
class TacticsOptionOutcome(BaseModel):
    label: str
    probability: float


class TacticalOptionModel(BaseModel):
    id: str
    action: str
    expected_value: float
    risk: float
    confidence: float
    family: str
    target_player: Optional[str] = None
    outcomes: list[TacticsOptionOutcome] = Field(default_factory=list)
    why: dict[str, str] = Field(default_factory=dict)
    uncertainty: list[str] = Field(default_factory=list)


class TacticsAnalyzeRequest(BaseModel):
    family: str = Field(
        default="balanced",
        description="Tactical family: balanced, historical, safe, aggressive, creative, experimental",
    )
    seed: int = Field(default=7, description="Random seed for state initialization")
    match_minute: Optional[float] = Field(default=70.0, description="Match minute")
    score: Optional[list[int]] = Field(default=[1, 1], description="Current match score [home, away]")


class TacticsAnalyzeResponse(BaseModel):
    recommendation: Optional[TacticalOptionModel] = None
    options: list[TacticalOptionModel] = Field(default_factory=list)
    failure_modes: list[str] = Field(default_factory=list)
    quality: float
    claim: str
    provenance: dict[str, Any] = Field(default_factory=dict)
    coach_controls: list[str] = Field(
        default_factory=lambda: ["Accept", "Reject", "Modify", "Ask why", "Simulate alternative"]
    )
    match_minute: float
    score: list[int]
    world_origin: str
    ball_origin: str
    players_visible: int
    players_off_camera: int
    pitch_players: list[dict[str, Any]] = Field(default_factory=list)
    ball_position: Optional[dict[str, float]] = None
    ball_carrier_id: Optional[str] = None
    scenario_type: str = "central_attack"
    mock: bool = False


# ==========================================
# Formations Schemas
# ==========================================
class FormationRecommendRequest(BaseModel):
    team: str = Field(default="home", description="Target team: home or away")
    identity: str = Field(default="progressive", description="Team identity/philosophy")
    tempo: float = Field(default=0.62, ge=0.0, le=1.0, description="Tactical tempo")
    risk_appetite: float = Field(default=0.55, ge=0.0, le=1.0, description="Risk appetite")
    match_minute: float = Field(default=70.0, ge=0.0, le=120.0, description="Match minute")
    fatigue: float = Field(default=0.35, ge=0.0, le=1.0, description="Average team fatigue")


class FormationOptionModel(BaseModel):
    shape: str
    score: float
    why: str
    family: str
    claim: str


class FormationRecommendResponse(BaseModel):
    team: str
    best: Optional[str]
    options: list[FormationOptionModel] = Field(default_factory=list)
    origin: str
    claim: str
    provenance: dict[str, Any] = Field(default_factory=dict)
    mock: bool = False


# ==========================================
# Match Simulation Schemas
# ==========================================
class MatchSimulateRequest(BaseModel):
    home_team: str = Field(default="Arsenal", description="Home team name")
    away_team: str = Field(default="Liverpool", description="Away team name")
    home_elo: Optional[float] = Field(default=1850.0, description="Home Elo rating")
    away_elo: Optional[float] = Field(default=1830.0, description="Away Elo rating")
    home_xg: Optional[float] = Field(default=1.65, ge=0.0, le=10.0, description="Home expected goals")
    away_xg: Optional[float] = Field(default=1.35, ge=0.0, le=10.0, description="Away expected goals")
    simulations: int = Field(default=10000, ge=100, le=100000, description="Number of Monte Carlo simulations")
    seed: Optional[int] = Field(default=42, description="Random seed")
    auto_lookup: bool = Field(default=False, description="Whether to lookup stats automatically from providers")


class ScoreDistributionItem(BaseModel):
    home: int
    away: int
    probability: float


class MatchSimulateResponse(BaseModel):
    home_team: str
    away_team: str
    home_win_probability: float
    draw_probability: float
    away_win_probability: float
    expected_home_goals: float
    expected_away_goals: float
    simulations: int
    most_likely_score: list[int]
    score_distribution: list[dict[str, Any]] = Field(default_factory=list)
    home_elo: float
    away_elo: float
    home_xg: float
    away_xg: float
    mock: bool = False


# ==========================================
# Player Evaluation Schemas
# ==========================================
class PlayerEvaluationRequest(BaseModel):
    player_id: str = Field(default="H10", description="Player identifier")
    name: str = Field(default="Martin Odegaard", description="Player full name")
    team: str = Field(default="home", description="Team affiliation")
    role: str = Field(default="attacking midfielder", description="Primary role or position")
    preferred_foot: str = Field(default="left", description="Preferred foot: left, right, both")
    finishing: float = Field(default=0.72, ge=0.0, le=1.0)
    passing: float = Field(default=0.88, ge=0.0, le=1.0)
    dribbling: float = Field(default=0.84, ge=0.0, le=1.0)
    tactical_intelligence: float = Field(default=0.90, ge=0.0, le=1.0)
    risk_appetite: float = Field(default=0.60, ge=0.0, le=1.0)
    creativity: float = Field(default=0.92, ge=0.0, le=1.0)
    max_speed_mps: float = Field(default=8.2, ge=5.0, le=11.0)
    accel_limit: float = Field(default=4.4, ge=2.0, le=6.5)
    fatigue: float = Field(default=0.25, ge=0.0, le=1.0)
    defending: float = Field(default=0.50, ge=0.0, le=1.0)
    physical: float = Field(default=0.50, ge=0.0, le=1.0)


class PlayerEvaluationResponse(BaseModel):
    player_id: str
    name: str
    team: str
    role: str
    overall_rating: float
    role_fit: str
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    recommended_actions: list[str] = Field(default_factory=list)
    metrics: dict[str, float] = Field(default_factory=dict)
    claim: str
    provenance: dict[str, Any] = Field(default_factory=dict)
    mock: bool = False


# ==========================================
# Training Lab Schemas
# ==========================================
class DrillModel(BaseModel):
    name: str
    focus: str
    difficulty: float
    repetitions: int
    visual_cues: list[str] = Field(default_factory=list)
    audio_cues: list[str] = Field(default_factory=list)
    team: bool = False


class TrainingAdaptiveDrillRequest(BaseModel):
    success_streak: int = Field(default=0, ge=0, description="Consecutive successes before the current repetition")
    success: bool = Field(description="Did the player succeed in the previous rep?")
    error: Optional[str] = Field(
        default=None,
        description="Failure mode if success=False: late, heavy_touch, closed_body, no_scan, overhit, underhit",
    )
    current_difficulty: Optional[float] = Field(
        default=0.4, ge=0.15, le=1.0, description="Current drill difficulty level"
    )


class TrainingAdaptiveDrillResponse(BaseModel):
    weakness: str
    drill: DrillModel
    feedback: str
    failure_mode: Optional[str] = None
    next_difficulty: float
    audio_required: bool = False
    claim: str
    provenance: dict[str, Any] = Field(default_factory=dict)
    mock: bool = False


# ==========================================
# Coach Override Schemas
# ==========================================
class CoachOverrideRequest(BaseModel):
    action: str = Field(
        default="Modify",
        description="Coach action: Accept, Reject, Modify, Ask why, Simulate alternative",
    )
    option_id: Optional[str] = Field(default=None, description="Target option ID to accept or reject")
    note: str = Field(default="", description="Coach rationale or tactical notes")
    family: Optional[str] = Field(
        default=None,
        description="Alternative tactical family to simulate: balanced, historical, safe, aggressive, creative, experimental",
    )
    seed: int = Field(default=7, description="Seed for tactical state")


class CoachDecisionModel(BaseModel):
    action: str
    option_id: Optional[str] = None
    note: str = ""
    alternative_family: Optional[str] = None
    provenance: dict[str, Any] = Field(default_factory=dict)


class CoachOverrideResponse(BaseModel):
    coach: CoachDecisionModel
    recommendation: Optional[TacticalOptionModel] = None
    options: list[TacticalOptionModel] = Field(default_factory=list)
    failure_modes: list[str] = Field(default_factory=list)
    quality: float
    claim: str
    provenance: dict[str, Any] = Field(default_factory=dict)
    mock: bool = False


# ==========================================
# AI Coach Schemas
# ==========================================
class AiCoachAskRequest(BaseModel):
    prompt: str = Field(..., min_length=2, description="Football question or coaching query")
    context: Optional[dict[str, Any]] = Field(default=None, description="Optional match or player context")


class AiCoachAskResponse(BaseModel):
    query: str
    answer: str
    expression: str
    origin: str
    model: str
    mock: bool = False

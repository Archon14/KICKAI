"""Architectural responses to the 24 TacticAI-class limitations."""

from __future__ import annotations

LIMITATION_STRATEGIES = {
    1: "Optional PlayerState.z / BallState.z; 2D remains valid when z is None.",
    2: "BallState stores velocity, optional spin, bounce via physics_engine.bounce_speed.",
    3: "Opponent reactions use orientation/momentum/fatigue/role; not a mirrored clone.",
    4: "CSV + video + simulated priors; confidence intervals; no claim of large labeled sets.",
    5: "PlayerProfile skill priors differ by player; cold_start flag for new squads.",
    6: "TacticalState.identity + exploration families prevent one cloned solution.",
    7: "HOG/Hough first; adaptive frame stride; vectorized NumPy; skip LLM for geometry.",
    8: "ingest_csv + file/webcam sources; events.csv schema is player_id,team,x,y.",
    9: "wilson_interval + ClaimStatus; never treat n=5 as proof.",
    10: "Per-player finishing/passing/dribbling/creativity; not population averages only.",
    11: "Environment.wind/rain/surface/slope; pitch is not assumed perfect.",
    12: "fatigue, score, minute, urgency multipliers; emotions are not claimed as measured.",
    13: "ClaimStatus VALIDATED/EXPERIMENTAL/SIMULATED/ESTIMATED/RESEARCH on outputs.",
    14: "CoachOverride Accept/Reject/Modify/Ask why/Simulate alternative.",
    15: "explore_families: historical/safe/aggressive/creative/experimental.",
    16: "Environment fields optional; missing weather is UNAVAILABLE not zero.",
    17: "Counterfactual families + failure_modes; do not assert tactic caused the outcome.",
    18: "cold_start PlayerProfile + coach notes; injuries/lineups are manual ingest.",
    19: "negative_space_contributions scores decoy/occupy without requiring the ball.",
    20: "Visibility enum; off-camera xy is None; no invented far-side coordinates.",
    21: "Provenance on tactics/training; no legal ownership claims.",
    22: "QualityReport + ingest anomaly skips; do not fit on garbage rows.",
    23: "role_fluid is state-capable (false nine, inverted fullback, etc.).",
    24: "creative/experimental families + per-team identity; not a single Nash clone.",
}

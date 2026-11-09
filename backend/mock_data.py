"""Deterministic realistic mock responses for Kick AI endpoints.

Used when USE_MOCK_DATA=true to ensure ultra-fast, zero-token, reliable testing.
All responses include `"mock": True`.
"""

from __future__ import annotations

from typing import Any, Optional


def get_mock_tactics_response(family: str = "balanced", seed: int = 7) -> dict[str, Any]:
    return {
        "recommendation": {
            "id": "shoot",
            "action": "SHOOT",
            "expected_value": 0.3842,
            "risk": 0.6158,
            "confidence": 0.7450,
            "family": family,
            "target_player": None,
            "outcomes": [
                {"label": "Goal", "probability": 0.3842},
                {"label": "Miss", "probability": 0.3421},
                {"label": "Block/save", "probability": 0.2737},
            ],
            "why": {
                "xG": "High shot probability (0.38 xG) from central channel inside the penalty box.",
                "pressure": "Pressure index 0.32 allows clean strike with dominant foot.",
                "angle": "Wide 38° visible goal angle between central defenders.",
            },
            "uncertainty": [
                "shot distance 14.8 (pitch units)",
                "defender recovery velocity vector estimated from single-camera tracking",
            ],
        },
        "options": [
            {
                "id": "shoot",
                "action": "SHOOT",
                "expected_value": 0.3842,
                "risk": 0.6158,
                "confidence": 0.7450,
                "family": family,
                "target_player": None,
                "outcomes": [
                    {"label": "Goal", "probability": 0.3842},
                    {"label": "Miss", "probability": 0.3421},
                    {"label": "Block/save", "probability": 0.2737},
                ],
                "why": {
                    "xG": "High shot probability (0.38 xG) from central channel inside the penalty box.",
                    "pressure": "Pressure index 0.32 allows clean strike with dominant foot.",
                },
                "uncertainty": ["shot distance 14.8 (pitch units)"],
            },
            {
                "id": "pass-diagonal",
                "action": "DIAGONAL PASS",
                "expected_value": 0.3315,
                "risk": 0.2210,
                "confidence": 0.6800,
                "family": family,
                "target_player": "H7",
                "outcomes": [
                    {"label": "Successful completion", "probability": 0.6520},
                    {"label": "Interception", "probability": 0.2210},
                    {"label": "Creates high-value chance", "probability": 0.1270},
                ],
                "why": {
                    "space": "Right half-space winger arriving unmarked behind away fullback.",
                    "lane": "Clear passing corridor between away CB and LB.",
                },
                "uncertainty": ["target runner acceleration upper limit 4.2 m/s²"],
            },
            {
                "id": "carry",
                "action": "CARRY / DRIBBLE",
                "expected_value": 0.2850,
                "risk": 0.3400,
                "confidence": 0.6500,
                "family": family,
                "target_player": None,
                "outcomes": [
                    {"label": "Penetrates final line", "probability": 0.4500},
                    {"label": "Tackled/loss of possession", "probability": 0.3400},
                    {"label": "Draws foul in dangerous area", "probability": 0.2100},
                ],
                "why": {
                    "momentum": "Carrier has positive forward momentum (2.8 m/s).",
                },
                "uncertainty": ["pitch friction and surface drag estimated"],
            },
            {
                "id": "pass-safe",
                "action": "SAFE PASS",
                "expected_value": 0.2410,
                "risk": 0.0850,
                "confidence": 0.8200,
                "family": family,
                "target_player": "H8",
                "outcomes": [
                    {"label": "Successful completion", "probability": 0.8800},
                    {"label": "Interception", "probability": 0.0850},
                    {"label": "Creates high-value chance", "probability": 0.0350},
                ],
                "why": {
                    "security": "Deep pivot in low-pressure zone provides safe reset option.",
                },
                "uncertainty": ["none"],
            },
            {
                "id": "recycle",
                "action": "RECYCLE POSSESSION",
                "expected_value": 0.1980,
                "risk": 0.0420,
                "confidence": 0.8900,
                "family": family,
                "target_player": "H4",
                "outcomes": [
                    {"label": "Retain structure and possession", "probability": 0.9400},
                    {"label": "Interception", "probability": 0.0420},
                    {"label": "Attacking progression", "probability": 0.0180},
                ],
                "why": {
                    "game_state": "Lead protection and control of game tempo.",
                },
                "uncertainty": ["backline passing angle verified"],
            },
        ],
        "failure_modes": [
            "SIMULATED world — calibrated synthetic snapshot",
            "one away defender off-camera on weak side",
        ],
        "quality": 0.7250,
        "claim": "SIMULATED",
        "provenance": {
            "origin": "SIMULATED",
            "model": "tactical-engine",
            "calculation": "geometry+reachability+xG+fatigue+opponent momentum",
            "input_quality": 0.7250,
            "mock": True,
        },
        "coach_controls": ["Accept", "Reject", "Modify", "Ask why", "Simulate alternative"],
        "match_minute": 70.0,
        "score": [1, 1],
        "world_origin": "SIMULATED",
        "ball_origin": "SIMULATED",
        "players_visible": 21,
        "players_off_camera": 1,
        "mock": True,
    }


def get_mock_formations_response(team: str = "home", identity: str = "progressive") -> dict[str, Any]:
    options = [
        {
            "shape": "4-3-3",
            "score": 0.880,
            "why": "Width + pressing triggers; perfectly fits progressive identity and tempo.",
            "family": "aggressive",
            "claim": "EXPERIMENTAL",
        },
        {
            "shape": "4-2-3-1",
            "score": 0.840,
            "why": "Double pivot protects rest-defence while 10 occupies half-spaces.",
            "family": "balanced",
            "claim": "EXPERIMENTAL",
        },
        {
            "shape": "3-2-4-1",
            "score": 0.810,
            "why": "Build-up overloads; inverted fullbacks become extra midfielders.",
            "family": "creative",
            "claim": "EXPERIMENTAL",
        },
        {
            "shape": "3-5-2",
            "score": 0.720,
            "why": "Central density and wing-back height for isolation on flanks.",
            "family": "historical",
            "claim": "EXPERIMENTAL",
        },
        {
            "shape": "4-4-2",
            "score": 0.670,
            "why": "Compact mid-block; safer if fatigue is high.",
            "family": "safe",
            "claim": "EXPERIMENTAL",
        },
        {
            "shape": "5-3-2",
            "score": 0.630,
            "why": "Low block when scoreline protection matters in late phase.",
            "family": "safe",
            "claim": "EXPERIMENTAL",
        },
    ]
    return {
        "team": team,
        "best": "4-3-3",
        "options": options,
        "origin": "INFERRED",
        "claim": "EXPERIMENTAL",
        "provenance": {
            "origin": "INFERRED",
            "model": "formation-ranker",
            "calculation": "identity+tempo+risk+fatigue modifiers over a catalog",
            "input_quality": 0.85,
            "notes": "Catalog ranking evaluated for tactical setup.",
            "mock": True,
        },
        "mock": True,
    }


def get_mock_match_response(
    home_team: str = "Arsenal",
    away_team: str = "Liverpool",
    home_elo: float = 1850.0,
    away_elo: float = 1830.0,
    home_xg: float = 1.65,
    away_xg: float = 1.35,
    simulations: int = 10000,
) -> dict[str, Any]:
    return {
        "home_team": home_team,
        "away_team": away_team,
        "home_win_probability": 0.4485,
        "draw_probability": 0.2642,
        "away_win_probability": 0.2873,
        "expected_home_goals": 1.724,
        "expected_away_goals": 1.312,
        "simulations": simulations,
        "most_likely_score": [2, 1],
        "score_distribution": [
            {"home": 2, "away": 1, "probability": 0.1145},
            {"home": 1, "away": 1, "probability": 0.1082},
            {"home": 1, "away": 0, "probability": 0.0954},
            {"home": 2, "away": 0, "probability": 0.0821},
            {"home": 0, "away": 0, "probability": 0.0652},
            {"home": 1, "away": 2, "probability": 0.0640},
            {"home": 2, "away": 2, "probability": 0.0573},
            {"home": 0, "away": 1, "probability": 0.0558},
            {"home": 3, "away": 1, "probability": 0.0512},
            {"home": 3, "away": 0, "probability": 0.0425},
        ],
        "home_elo": home_elo,
        "away_elo": away_elo,
        "home_xg": home_xg,
        "away_xg": away_xg,
        "mock": True,
    }


def get_mock_player_response(
    player_id: str = "H10",
    name: str = "Martin Odegaard",
    team: str = "home",
    role: str = "attacking midfielder",
) -> dict[str, Any]:
    return {
        "player_id": player_id,
        "name": name,
        "team": team,
        "role": role,
        "overall_rating": 86.4,
        "role_fit": "Elite Playmaker / Advanced Free 8",
        "strengths": [
            "Vision and half-space diagonal passing (0.88 passing rating)",
            "High tactical intelligence under defensive pressure (0.90 IQ)",
            "Exceptional chance generation through disguised weight of pass",
        ],
        "weaknesses": [
            "Aerial duel success in high cross deliveries",
            "Physical recovery speed during negative defensive transitions",
        ],
        "recommended_actions": [
            "Occupy right half-space between opposition lines during settled possession",
            "Trigger high counter-press upon second phase loss within 3-second window",
            "Coordinate third-man runs with overlapping fullback",
        ],
        "metrics": {
            "finishing": 0.72,
            "passing": 0.88,
            "dribbling": 0.84,
            "tactical_intelligence": 0.90,
            "risk_appetite": 0.60,
            "creativity": 0.92,
            "physical_efficiency": 0.78,
        },
        "claim": "EVALUATED",
        "provenance": {
            "origin": "INFERRED",
            "model": "player-evaluator",
            "calculation": "multi-attribute weighted composite + tactical profile match",
            "input_quality": 0.88,
            "mock": True,
        },
        "mock": True,
    }


def get_mock_training_response(
    success: bool,
    error: Optional[str] = None,
    current_difficulty: float = 0.4,
    success_streak: int = 0,
) -> dict[str, Any]:
    if success:
        next_diff = round(
            min(1.0, current_difficulty + 0.08)
            if (success_streak + 1) % 3 == 0
            else current_difficulty,
            3,
        )
        return {
            "weakness": "raise tempo / shrink space",
            "drill": {
                "name": "combination play drill",
                "focus": "combination play",
                "difficulty": next_diff,
                "repetitions": int(8 + next_diff * 10),
                "visual_cues": [
                    "flash target zone",
                    f"{max(0.6, 2.4 - next_diff * 1.4):.1f}s decision window",
                    "arrow for next action",
                    "timer ring",
                ],
                "audio_cues": ["time", "man on", "turn"] if next_diff > 0.5 else ["time"],
                "team": True,
            },
            "feedback": "Consistent success. Increasing pressure, reducing time and space, and adding a second opponent reaction.",
            "failure_mode": None,
            "next_difficulty": next_diff,
            "audio_required": False,
            "claim": "EXPERIMENTAL",
            "provenance": {
                "origin": "INFERRED",
                "model": "adaptive-coach",
                "calculation": "streak-based difficulty + failure-mode mapping",
                "input_quality": 0.6,
                "mock": True,
            },
            "mock": True,
        }
    else:
        err_key = error if error in {"late", "heavy_touch", "closed_body", "no_scan", "overhit", "underhit"} else "late"
        failure_messages = {
            "late": "The action started after the decision window closed.",
            "heavy_touch": "First contact pushed the ball beyond the usable space.",
            "closed_body": "Body orientation blocked the next action.",
            "no_scan": "The player did not check space before receiving.",
            "overhit": "Pass or shot weight exceeded control range.",
            "underhit": "The ball did not beat the pressure line.",
        }
        focus_map = {
            "late": "pressing trigger",
            "heavy_touch": "first touch under pressure",
            "closed_body": "open receiving",
            "no_scan": "scan-before-receive",
            "overhit": "weighted finishing",
            "underhit": "break the line",
        }
        next_diff = round(max(0.15, current_difficulty - 0.06), 3)
        focus = focus_map[err_key]
        return {
            "weakness": failure_messages[err_key],
            "drill": {
                "name": f"{focus} drill",
                "focus": focus,
                "difficulty": next_diff,
                "repetitions": int(8 + next_diff * 10),
                "visual_cues": [
                    "flash target zone",
                    f"{max(0.6, 2.4 - next_diff * 1.4):.1f}s decision window",
                    "arrow for next action",
                    "timer ring",
                ],
                "audio_cues": ["time"],
                "team": err_key in {"late", "underhit"},
            },
            "feedback": failure_messages[err_key] + " Repeat with a longer visual window before raising pressure.",
            "failure_mode": err_key,
            "next_difficulty": next_diff,
            "audio_required": False,
            "claim": "EXPERIMENTAL",
            "provenance": {
                "origin": "INFERRED",
                "model": "adaptive-coach",
                "calculation": "streak-based difficulty + failure-mode mapping",
                "input_quality": 0.6,
                "mock": True,
            },
            "mock": True,
        }


def get_mock_coach_override_response(
    action: str = "Modify",
    option_id: Optional[str] = None,
    note: str = "",
    family: Optional[str] = None,
) -> dict[str, Any]:
    base_tactics = get_mock_tactics_response(family=family or "balanced")
    clean_action = action.strip().title() if action.lower() != "ask why" else "Ask why"
    if clean_action not in ["Accept", "Reject", "Modify", "Ask why", "Simulate alternative"]:
        clean_action = "Modify"

    # If rejected, remove option
    options = list(base_tactics["options"])
    rec = base_tactics["recommendation"]
    if clean_action == "Reject" and options:
        tgt_id = option_id or (rec["id"] if rec else "")
        options = [o for o in options if o["id"] != tgt_id]
        rec = options[0] if options else None

    return {
        "coach": {
            "action": clean_action,
            "option_id": option_id,
            "note": note or "Tactical adjustment instructed by head coach.",
            "alternative_family": family,
            "provenance": {
                "origin": "OBSERVED",
                "model": "coach-override",
                "calculation": "human decision stored; AI is not authority",
                "source": "coach",
                "human_modified": True,
                "notes": note,
                "mock": True,
            },
        },
        "recommendation": rec,
        "options": options,
        "failure_modes": base_tactics["failure_modes"],
        "quality": base_tactics["quality"],
        "claim": "OBSERVED",
        "provenance": {
            "origin": "OBSERVED",
            "model": "coach-override-facade",
            "calculation": "human override applied to tactical engine report",
            "mock": True,
        },
        "mock": True,
    }


def get_mock_ai_coach_response(prompt: str) -> dict[str, Any]:
    p = prompt.lower()
    if "formation" in p or "system" in p:
        answer = (
            "Against a compact mid-block, deploying a 4-3-3 that transforms into a 3-2-4-1 "
            "in possession allows your inverted fullbacks to overload the central midfield. "
            "This draws opposing pivots inward, unlocking half-space diagonal channels for your wingers."
        )
        expression = "confident"
    elif "press" in p or "transition" in p:
        answer = (
            "Initiate counter-pressing within a strict 3-second recovery window immediately upon turnover. "
            "The closest forward curves their run to cut passing lanes to the opposing pivot, "
            "forcing play toward the touchline where numbers create an interception trap."
        )
        expression = "confident"
    elif "drill" in p or "training" in p:
        answer = (
            "To cure late decisions under pressure, run a 4v2 directional rondo with a 1.2s touch timer. "
            "Players must execute shoulder scans prior to receiving. Reduce space by 10% after 5 consecutive successful completions."
        )
        expression = "thinking"
    elif "predict" in p or "vs" in p or "win" in p:
        answer = (
            "Based on Elo ratings and open-play expected goals (xG), home advantage accounts for roughly +65 Elo points. "
            "The home team controls higher shot probability in central zones, yielding an estimated 45% win chance and a most probable 2-1 result."
        )
        expression = "confident"
    else:
        answer = (
            "Football intelligence relies on evaluating player positioning, ball velocity, space occupation, and risk appetite. "
            "Keep tactical structure compact in rest-defence while exploiting weak-side width during high-tempo attacking phases."
        )
        expression = "speaking"

    return {
        "query": prompt,
        "answer": answer,
        "expression": expression,
        "origin": "SIMULATED",
        "model": "kickai-mock-engine",
        "mock": True,
    }

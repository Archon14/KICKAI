"""Adversarial scenarios: ask whether the model may be wrong."""

from __future__ import annotations

import numpy as np

from core.engine import KickAIEngine
from core.provenance import Origin
from core.world import simulated_attacking_third


def chaotic_world(seed: int = 99):
    state = simulated_attacking_third(seed)
    rng = np.random.default_rng(seed)
    for p in state.players:
        if p.xy is not None:
            p.xy = p.xy + rng.normal(0, 12, size=2)
            p.velocity = rng.normal(0, 4, size=2)
            p.origin = Origin.ESTIMATED
            p.confidence = 0.12
            p.identity_confidence = 0.02
    state.quality.tracking_confidence = 0.12
    state.quality.identity_confidence = 0.02
    state.quality.issues.append("deliberate low-quality / chaotic movement (red team)")
    return state


def formation_trap():
    state = simulated_attacking_third(3)
    for p in state.team_players("away"):
        if p.xy is not None:
            p.xy[0] = 95.0
            p.current_action = "low block trap"
    state.tactical.identity = "deep block"
    return state


def run_red_team() -> dict:
    engine = KickAIEngine()
    results = {}
    for name, world in {
        "chaotic": chaotic_world(),
        "low_block": formation_trap(),
        "baseline_simulated": simulated_attacking_third(7),
    }.items():
        report = engine.analyze_state(world)
        results[name] = {
            "quality": report["quality"],
            "failure_modes": report["failure_modes"][:4],
            "recommendation": None if not report["recommendation"] else report["recommendation"]["action"],
            "model_may_be_wrong": report["quality"] < 0.45 or len(report["failure_modes"]) > 2,
        }
    return results

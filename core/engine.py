"""Shared football intelligence facade for Streamlit, API, and future clients."""

from __future__ import annotations

from typing import Any, Optional

from core.coach import CoachOverride
from core.observability import Diagnostics
from core.tactics import (
    DecisionReport,
    TacticalEngine,
    explore_families,
    negative_space_contributions,
)
from core.training import AdaptiveCoach, TrainingPlan
from core.world import WorldState, simulated_attacking_third
from core.xg import ExpectedGoalsModel


class KickAIEngine:
    def __init__(self) -> None:
        self.tactics = TacticalEngine(ExpectedGoalsModel())
        self.coach_override = CoachOverride()
        self.training = AdaptiveCoach()
        self.diagnostics = Diagnostics()

    def analyze_state(self, state: WorldState, family: str = "balanced") -> dict[str, Any]:
        report = self.tactics.decide(state, family=family)
        self.diagnostics.analysis_confidence = report.quality
        return serialize_report(report, state)

    def challenge(
        self,
        state: WorldState,
        report: DecisionReport,
        action: str,
        option_id: Optional[str] = None,
        note: str = "",
        family: Optional[str] = None,
    ) -> dict[str, Any]:
        new_report, record = self.coach_override.apply(
            state, report, action, option_id=option_id, note=note, family=family
        )
        payload = serialize_report(new_report, state)
        payload["coach"] = record.__dict__
        return payload

    def lab(self, seed: int = 7) -> dict[str, Any]:
        state = simulated_attacking_third(seed)
        families = {name: serialize_report(rep, state) for name, rep in explore_families(state).items()}
        return {
            "world_origin": state.provenance.origin.value,
            "claim": "SIMULATED",
            "families": families,
            "negative_space": negative_space_contributions(state, "home"),
            "limitations": state.quality.issues,
        }

    def train(self, success: bool, error: Optional[str] = None) -> TrainingPlan:
        return self.training.observe(success, error)


def serialize_option(option) -> dict[str, Any]:
    return {
        "id": option.option_id,
        "action": option.action,
        "expected_value": round(option.expected_value, 4),
        "risk": round(option.risk, 4),
        "confidence": round(option.confidence, 4),
        "family": option.family,
        "target_player": option.target_player,
        "outcomes": [
            {"label": o.label, "probability": round(o.probability, 4)} for o in option.outcomes
        ],
        "why": option.why,
        "uncertainty": option.uncertainty_notes,
    }


def serialize_report(report: DecisionReport, state: WorldState) -> dict[str, Any]:
    rec = serialize_option(report.recommendation) if report.recommendation else None
    return {
        "recommendation": rec,
        "options": [serialize_option(o) for o in report.options],
        "failure_modes": report.failure_modes,
        "quality": round(report.quality, 4),
        "claim": report.claim.value,
        "provenance": report.provenance,
        "coach_controls": report.coach_controls,
        "match_minute": state.match_minute,
        "score": list(state.score),
        "world_origin": state.provenance.origin.value,
        "ball_origin": state.ball.origin.value,
        "players_visible": len(state.visible_players()),
        "players_off_camera": sum(1 for p in state.players if p.xy is None),
    }

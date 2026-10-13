"""Shot-quality xG. Coefficients come from the existing KICKAI research export."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import numpy as np

from core.math_engine import shot_angle
from core.provenance import ClaimStatus, Origin, make_provenance
from core.world import GOAL_WIDTH, PITCH_LENGTH, PITCH_WIDTH, WorldState


@dataclass(frozen=True)
class XGEstimate:
    xg: float
    distance: float
    angle_radians: float
    defender_density: float
    origin: Origin
    claim: ClaimStatus
    provenance: dict


class ExpectedGoalsModel:
    """Logistic xG used in extra/xg_model.pkl (distance, angle, defender density)."""

    def __init__(self, coef: Optional[np.ndarray] = None, intercept: float = -0.450):
        self.coef = (
            np.asarray(coef, dtype=np.float32)
            if coef is not None
            else np.array([-0.115, 0.782, -0.240], dtype=np.float32)
        )
        self.intercept = float(intercept)

    @classmethod
    def from_pickle(cls, path: str | Path) -> "ExpectedGoalsModel":
        try:
            import joblib
        except ImportError as exc:
            raise RuntimeError("joblib is required to load xg_model.pkl") from exc
        loaded = joblib.load(path)
        if isinstance(loaded, cls):
            return loaded
        coef = getattr(loaded, "coef", None)
        intercept = getattr(loaded, "intercept", -0.450)
        return cls(coef=coef, intercept=intercept)

    def compute_xg(self, distance: float, angle_radians: float, defender_density: float) -> float:
        features = np.asarray([distance, angle_radians, defender_density], dtype=np.float32)
        logit = float(features @ self.coef + self.intercept)
        return float(1.0 / (1.0 + np.exp(-logit)))

    def from_world(self, state: WorldState, shooter_team: str = "home") -> Optional[XGEstimate]:
        if state.ball.xy is None:
            return None
        ball = state.ball.xy[:2]
        goal_y0 = (state.pitch_width - GOAL_WIDTH) / 2.0
        goal_left = np.array([state.pitch_length, goal_y0])
        goal_right = np.array([state.pitch_length, goal_y0 + GOAL_WIDTH])
        if shooter_team == "away":
            goal_left = np.array([0.0, goal_y0])
            goal_right = np.array([0.0, goal_y0 + GOAL_WIDTH])
        dist = float(np.linalg.norm(ball - ((goal_left + goal_right) / 2.0)))
        ang = shot_angle(ball, goal_left, goal_right)
        opponents = [
            p for p in state.team_players("away" if shooter_team == "home" else "home")
            if p.has_position()
        ]
        nearby = 0
        for p in opponents:
            if float(np.linalg.norm(p.xy[:2] - ball)) < 8.0:
                nearby += 1
        density = nearby / 4.0
        xg = float(np.clip(self.compute_xg(dist, ang, density), 0.001, 0.95))
        origin = Origin.ESTIMATED if state.provenance.origin != Origin.SIMULATED else Origin.SIMULATED
        prov = make_provenance(
            origin,
            model="expected-goals-logistic",
            calculation="sigmoid(distance, goal_angle, local_defender_density)",
            input_quality=state.quality.overall,
            notes="Experimental logistic; not a published league-calibrated xG table.",
        )
        return XGEstimate(
            xg=xg,
            distance=dist,
            angle_radians=ang,
            defender_density=density,
            origin=origin,
            claim=ClaimStatus.EXPERIMENTAL,
            provenance=prov.as_dict(),
        )


def load_optional_research_xg() -> ExpectedGoalsModel:
    extra = Path(__file__).resolve().parents[1] / "extra" / "xg_model.pkl"
    if extra.exists():
        try:
            return ExpectedGoalsModel.from_pickle(extra)
        except Exception:
            pass
    return ExpectedGoalsModel()

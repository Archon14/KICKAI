"""Physics-aware tactical options from WorldState. No hard-coded fake percentages."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

import numpy as np

from core.math_engine import distance, point_to_segment_distance, reachable_radius, travel_time, unit
from core.physics_engine import TYPICAL_PLAYER_MASS_KG, intercept_difficulty, momentum, turning_radius
from core.provenance import ClaimStatus, Origin, make_provenance
from core.world import GOAL_WIDTH, PlayerState, WorldState
from core.xg import ExpectedGoalsModel


@dataclass
class OptionOutcome:
    label: str
    probability: float


@dataclass
class TacticalOption:
    option_id: str
    action: str
    expected_value: float
    outcomes: list[OptionOutcome]
    risk: float
    confidence: float
    uncertainty_notes: list[str]
    why: dict[str, str]
    target_player: Optional[str] = None
    family: str = "balanced"


@dataclass
class DecisionReport:
    recommendation: Optional[TacticalOption]
    options: list[TacticalOption]
    failure_modes: list[str]
    quality: float
    claim: ClaimStatus
    provenance: dict
    coach_controls: list[str] = field(
        default_factory=lambda: ["Accept", "Reject", "Modify", "Ask why", "Simulate alternative"]
    )


class TacticalEngine:
    def __init__(self, xg_model: Optional[ExpectedGoalsModel] = None) -> None:
        self.xg_model = xg_model or ExpectedGoalsModel()

    def decide(self, state: WorldState, family: str = "balanced") -> DecisionReport:
        failures = list(state.quality.issues)
        carrier = state.on_ball()
        if carrier is None or state.ball.xy is None:
            failures.append("No on-ball player can be identified with current tracking.")
            return DecisionReport(
                recommendation=None,
                options=[],
                failure_modes=failures,
                quality=state.quality.overall,
                claim=ClaimStatus.EXPERIMENTAL,
                provenance=make_provenance(
                    Origin.UNAVAILABLE,
                    model="tactical-engine",
                    calculation="insufficient ball/player association",
                    input_quality=state.quality.overall,
                ).as_dict(),
            )

        options = [
            self._shoot(state, carrier, family),
            self._pass(state, carrier, family, kind="diagonal"),
            self._pass(state, carrier, family, kind="safe"),
            self._carry(state, carrier, family),
            self._recycle(state, carrier, family),
        ]
        options = [o for o in options if o is not None]
        if family == "creative":
            surprise = self._pass(state, carrier, family, kind="switch")
            if surprise:
                options.append(surprise)

        options.sort(key=lambda o: o.expected_value, reverse=True)
        rec = options[0] if options else None
        origin = Origin.SIMULATED if state.provenance.origin == Origin.SIMULATED else Origin.INFERRED
        return DecisionReport(
            recommendation=rec,
            options=options,
            failure_modes=failures,
            quality=state.quality.overall,
            claim=ClaimStatus.EXPERIMENTAL if origin != Origin.SIMULATED else ClaimStatus.SIMULATED,
            provenance=make_provenance(
                origin,
                model="tactical-engine",
                calculation="geometry+reachability+xG+fatigue+opponent momentum",
                input_quality=state.quality.overall,
            ).as_dict(),
        )

    def _context_mult(self, state: WorldState, carrier: PlayerState) -> float:
        minute = state.match_minute
        fatigue = carrier.fatigue
        score_diff = state.score[0] - state.score[1]
        urgency = 1.0
        if minute > 80 and score_diff < 0:
            urgency = 1.15
        if minute > 85 and score_diff > 0:
            urgency = 0.9
        return float(np.clip((1.0 - 0.25 * fatigue) * urgency, 0.55, 1.2))

    def _shoot(self, state: WorldState, carrier: PlayerState, family: str) -> TacticalOption:
        est = self.xg_model.from_world(state, carrier.profile.team)
        xg = est.xg if est else 0.02
        xg *= 0.7 + 0.6 * carrier.profile.finishing
        xg *= self._context_mult(state, carrier)
        if family == "safe":
            xg *= 0.85
        if family == "aggressive":
            xg *= 1.05
        xg = float(np.clip(xg, 0.005, 0.85))
        # Remaining mass split between miss and block using pressure.
        pressure = _pressure(state, carrier)
        block = float(np.clip(0.12 + 0.35 * pressure, 0.05, 0.55))
        miss = float(np.clip(1.0 - xg - block, 0.05, 0.9))
        total = xg + miss + block
        xg, miss, block = xg / total, miss / total, block / total
        ev = xg * 1.0 + miss * 0.02 + block * 0.0
        notes = _uncertainty(state)
        if est:
            notes.append(f"shot distance {est.distance:.1f} (pitch units)")
        return TacticalOption(
            option_id="shoot",
            action="SHOOT",
            expected_value=ev,
            outcomes=[
                OptionOutcome("Goal", xg),
                OptionOutcome("Miss", miss),
                OptionOutcome("Block/save", block),
            ],
            risk=1.0 - xg,
            confidence=float(np.clip(state.quality.overall * (0.4 + 0.6 * carrier.confidence), 0.05, 0.9)),
            uncertainty_notes=notes,
            why=_why_shoot(state, carrier, xg, pressure),
            family=family,
        )

    def _pass(
        self, state: WorldState, carrier: PlayerState, family: str, kind: str
    ) -> Optional[TacticalOption]:
        teammates = [
            p
            for p in state.team_players(carrier.profile.team)
            if p.profile.player_id != carrier.profile.player_id and p.has_position()
        ]
        if not teammates:
            return None
        scored = []
        for mate in teammates:
            scored.append((self._pass_metrics(state, carrier, mate, kind), mate))
        scored.sort(key=lambda item: item[0]["ev"], reverse=True)
        metrics, mate = scored[0]
        if kind == "safe":
            scored.sort(key=lambda item: item[0]["complete"], reverse=True)
            metrics, mate = scored[0]
        if kind == "switch":
            scored.sort(key=lambda item: item[0]["width"], reverse=True)
            metrics, mate = scored[0]
        complete = metrics["complete"]
        intercept = metrics["intercept"]
        chance = metrics["chance"]
        total = complete + intercept + chance
        complete, intercept, chance = complete / total, intercept / total, chance / total
        ev = complete * 0.35 + chance * 0.85 + intercept * -0.25
        if family == "aggressive" and kind == "diagonal":
            ev *= 1.08
        action = {
            "diagonal": "DIAGONAL PASS",
            "safe": "SAFE PASS",
            "switch": "SWITCH / UNUSUAL PASS",
        }[kind]
        return TacticalOption(
            option_id=f"pass-{kind}",
            action=action,
            expected_value=float(ev),
            outcomes=[
                OptionOutcome("Successful completion", complete),
                OptionOutcome("Interception", intercept),
                OptionOutcome("Creates high-value chance", chance),
            ],
            risk=intercept,
            confidence=float(np.clip(state.quality.overall * mate.confidence, 0.05, 0.85)),
            uncertainty_notes=_uncertainty(state) + metrics["notes"],
            why=_why_pass(state, carrier, mate, metrics),
            target_player=mate.profile.player_id,
            family=family,
        )

    def _pass_metrics(self, state: WorldState, carrier: PlayerState, mate: PlayerState, kind: str) -> dict:
        ball = state.ball.xy[:2]
        dest = mate.xy[:2]
        dist = distance(ball, dest)
        ball_speed = 12.0 if kind != "safe" else 9.0
        tta = travel_time(dist, ball_speed)
        opponents = [p for p in state.players if p.profile.team != carrier.profile.team and p.has_position()]
        lane_clear = 1.0
        intercept_p = 0.05
        for opp in opponents:
            d_lane = point_to_segment_distance(opp.xy, ball, dest)
            reach = reachable_radius(float(np.linalg.norm(opp.velocity)) if opp.velocity is not None else 3.0, tta, opp.profile.accel_limit)
            # Temporal geometry: will the lane still exist when the ball arrives?
            future = opp.xy[:2] + (opp.velocity[:2] if opp.velocity is not None else 0) * tta
            d_future = point_to_segment_distance(future, ball, dest)
            if d_lane < 2.0:
                lane_clear *= 0.55
            if reach > d_lane:
                intercept_p += 0.18 * (1.0 / (1.0 + d_lane))
            if d_future < d_lane:
                intercept_p += 0.08
            if opp.velocity is not None and carrier.velocity is not None:
                intercept_p += 0.05 * intercept_difficulty(
                    momentum(TYPICAL_PLAYER_MASS_KG, carrier.velocity),
                    momentum(TYPICAL_PLAYER_MASS_KG, opp.velocity),
                    d_lane,
                )
        intercept_p = float(np.clip(intercept_p + 0.08 * carrier.fatigue, 0.02, 0.75))
        sep = _separation(mate, opponents)
        complete = float(np.clip(0.92 * lane_clear * (0.7 + 0.3 * carrier.profile.passing) * (1.0 - 0.15 * (dist / 40.0)), 0.05, 0.95))
        complete *= 1.0 - 0.4 * intercept_p
        chance = float(np.clip(0.04 + 0.04 * sep + (0.08 if kind == "diagonal" else 0.0), 0.01, 0.35))
        width = abs(float(dest[1] - ball[1]))
        notes = [
            f"receiver separation {sep:.1f}",
            f"ball travel {tta:.2f}s at assumed {ball_speed:.0f} m/s",
        ]
        if mate.visibility.value != "visible":
            notes.append("receiver visibility is not full — completion down-weighted")
            complete *= 0.6
        return {
            "complete": complete,
            "intercept": intercept_p,
            "chance": chance,
            "ev": complete * 0.35 + chance * 0.85 - intercept_p * 0.25,
            "sep": sep,
            "tta": tta,
            "width": width,
            "notes": notes,
        }

    def _carry(self, state: WorldState, carrier: PlayerState, family: str) -> TacticalOption:
        speed = float(np.linalg.norm(carrier.velocity)) if carrier.velocity is not None else 2.0
        radius = turning_radius(speed)
        pressure = _pressure(state, carrier)
        success = float(np.clip(0.55 * carrier.profile.dribbling * (1.0 - 0.5 * pressure) * (1.0 - 0.2 * carrier.fatigue), 0.08, 0.8))
        turnover = float(np.clip(0.15 + 0.5 * pressure, 0.08, 0.7))
        progress = float(np.clip(1.0 - success - turnover, 0.05, 0.6))
        total = success + turnover + progress
        success, turnover, progress = success / total, turnover / total, progress / total
        ev = success * 0.45 + progress * 0.2 + turnover * -0.3
        return TacticalOption(
            option_id="carry",
            action="CARRY",
            expected_value=float(ev),
            outcomes=[
                OptionOutcome("Beat pressure", success),
                OptionOutcome("Progress under control", progress),
                OptionOutcome("Turnover", turnover),
            ],
            risk=turnover,
            confidence=float(np.clip(state.quality.overall, 0.05, 0.8)),
            uncertainty_notes=_uncertainty(state) + [f"turn radius ~{radius:.1f} at current speed"],
            why={
                "quick": "Carry if nearby space exists and defender momentum is committed.",
                "coach": (
                    f"Pressure index {pressure:.2f}. A tight cut needs space beyond the ~{radius:.1f} "
                    "turn radius implied by current speed."
                ),
                "analyst": (
                    "Carry EV uses dribbling prior, local defender density, fatigue, and inertial turning radius. "
                    "It does not assume the player can stop instantly."
                ),
                "technical": (
                    "success = clip(dribbling*(1-0.5*pressure)*(1-0.2*fatigue)); "
                    f"r = v^2/a_lat with v={speed:.2f}."
                ),
            },
            family=family,
        )

    def _recycle(self, state: WorldState, carrier: PlayerState, family: str) -> TacticalOption:
        pressure = _pressure(state, carrier)
        keep = float(np.clip(0.78 - 0.25 * pressure + 0.1 * carrier.profile.passing, 0.4, 0.93))
        loss = 1.0 - keep
        ev = keep * 0.22 + loss * -0.15
        if family == "safe":
            ev += 0.05
        if family == "aggressive":
            ev -= 0.04
        return TacticalOption(
            option_id="recycle",
            action="RECYCLE POSSESSION",
            expected_value=float(ev),
            outcomes=[
                OptionOutcome("Retain", keep),
                OptionOutcome("Ball loss", loss),
            ],
            risk=loss,
            confidence=float(np.clip(state.quality.overall + 0.1, 0.1, 0.85)),
            uncertainty_notes=_uncertainty(state),
            why={
                "quick": "Recycle when the shot angle is poor and the forward lane is closing.",
                "coach": "Play backwards or square to reset shape rather than force a low-value action.",
                "analyst": "Recycle EV is intentionally lower than a high-value chance but protects against turnover in a press.",
                "technical": f"keep = clip(0.78-0.25*pressure+0.1*passing); pressure={pressure:.3f}",
            },
            family=family,
        )


def explore_families(state: WorldState) -> dict[str, DecisionReport]:
    engine = TacticalEngine()
    return {
        name: engine.decide(state, family=name)
        for name in ("historical", "safe", "aggressive", "creative", "experimental")
    }


def _pressure(state: WorldState, carrier: PlayerState) -> float:
    if not carrier.has_position():
        return 0.5
    opp = [p for p in state.players if p.profile.team != carrier.profile.team and p.has_position()]
    if not opp:
        return 0.15
    dists = [distance(carrier.xy, p.xy) for p in opp]
    nearest = sorted(dists)[:3]
    return float(np.clip(sum(1.0 / (1.0 + d) for d in nearest) / 1.8, 0.0, 1.0))


def _separation(player: PlayerState, opponents: list[PlayerState]) -> float:
    if not opponents or not player.has_position():
        return 8.0
    return min(distance(player.xy, o.xy) for o in opponents)


def _uncertainty(state: WorldState) -> list[str]:
    notes = []
    if state.quality.ball_confidence < 0.4:
        notes.append("ball velocity/position estimate is weak")
    if state.quality.identity_confidence < 0.3:
        notes.append("defender identity confidence is low")
    if any(p.visibility.value == "off-camera" for p in state.players):
        notes.append("far-side tracking incomplete")
    if not state.calibrated:
        notes.append("pitch calibration missing — distances are not guaranteed metres")
    return notes


def _why_shoot(state: WorldState, carrier: PlayerState, xg: float, pressure: float) -> dict[str, str]:
    return {
        "quick": f"Shoot only if the angle and pressure still yield a useful chance (xG {xg:.2f}).",
        "coach": (
            f"Finishing prior {carrier.profile.finishing:.2f}, pressure {pressure:.2f}, minute {state.match_minute:.0f}. "
            "If the window is closing, a pass may be cleaner."
        ),
        "analyst": "xG is experimental logistic of distance, goal opening angle, and local defenders, then adjusted by finishing and fatigue.",
        "technical": f"xg_model.from_world then finishing/fatigue/family modifiers; pressure={pressure:.3f}",
    }


def _why_pass(state: WorldState, carrier: PlayerState, mate: PlayerState, metrics: dict) -> dict[str, str]:
    return {
        "quick": f"Pass to {mate.profile.name} while the lane remains open (~{metrics['tta']:.1f}s travel).",
        "coach": (
            f"Receiver has {metrics['sep']:.1f} of separation. "
            "Time the ball to the space, not the current feet, if the defender is moving across."
        ),
        "analyst": (
            "Completion uses lane clearance now and at arrival, reachability of defenders, passer skill, and fatigue. "
            "Chance value increases with receiver isolation."
        ),
        "technical": (
            f"tta={metrics['tta']:.3f}; intercept={metrics['intercept']:.3f}; complete={metrics['complete']:.3f}"
        ),
    }


def negative_space_contributions(state: WorldState, team: str) -> list[dict]:
    """Players can contribute without touching the ball."""
    rows = []
    on = state.on_ball()
    teammates = [p for p in state.team_players(team) if p.has_position()]
    opponents = [p for p in state.players if p.profile.team != team and p.has_position()]
    for p in teammates:
        if on and p.profile.player_id == on.profile.player_id:
            role = "on ball"
        else:
            dragged = 0
            for opp in opponents:
                if distance(p.xy, opp.xy) < 6:
                    dragged += 1
            role = "decoy / occupy" if dragged else "space creator"
        rows.append(
            {
                "player": p.profile.player_id,
                "role_fluid": p.profile.role_fluid,
                "contribution": role,
                "origin": p.origin.value,
            }
        )
    return rows

"""Synchronized football world state. Partial observability is first-class."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

import numpy as np

from core.provenance import Origin, Provenance, QualityReport, Visibility, make_provenance


PITCH_LENGTH = 105.0
PITCH_WIDTH = 68.0
GOAL_WIDTH = 7.32


@dataclass
class PlayerProfile:
    player_id: str
    team: str
    name: str = "Unknown"
    preferred_foot: str = "unknown"
    mass_kg: float = 75.0
    max_speed_mps: float = 8.5
    accel_limit: float = 4.5
    finishing: float = 0.5
    passing: float = 0.5
    dribbling: float = 0.5
    tactical_intelligence: float = 0.5
    risk_appetite: float = 0.5
    creativity: float = 0.4
    role_fluid: str = "unassigned"
    cold_start: bool = True


@dataclass
class PlayerState:
    profile: PlayerProfile
    xy: Optional[np.ndarray]
    z: Optional[float]
    velocity: Optional[np.ndarray]
    visibility: Visibility
    origin: Origin
    confidence: float
    energy: float = 1.0
    fatigue: float = 0.0
    sprint_capacity: float = 1.0
    reaction_delay_s: float = 0.18
    current_action: str = "unknown"
    identity_confidence: float = 0.0

    def has_position(self) -> bool:
        return self.xy is not None and self.visibility not in {
            Visibility.OFF_CAMERA,
        }


@dataclass
class BallState:
    xy: Optional[np.ndarray]
    z: Optional[float]
    velocity: Optional[np.ndarray]
    spin: Optional[np.ndarray]
    origin: Origin
    confidence: float
    visibility: Visibility = Visibility.UNCERTAIN


@dataclass
class Environment:
    wind_mps: Optional[np.ndarray] = None
    rain: Optional[float] = None
    surface_quality: float = 1.0
    slope: Optional[tuple[float, float]] = None
    lighting: Optional[float] = None
    crowd_noise: Optional[float] = None
    referee_strictness: Optional[float] = None
    origin: Origin = Origin.UNAVAILABLE


@dataclass
class TacticalState:
    formation: str = "unknown"
    possession_team: Optional[str] = None
    phase: str = "unknown"
    identity: str = "balanced"
    tempo: float = 0.5
    risk_appetite: float = 0.5


@dataclass
class WorldState:
    timestamp_s: float
    players: list[PlayerState]
    ball: BallState
    pitch_length: float = PITCH_LENGTH
    pitch_width: float = PITCH_WIDTH
    score: tuple[int, int] = (0, 0)
    match_minute: float = 0.0
    environment: Environment = field(default_factory=Environment)
    tactical: TacticalState = field(default_factory=TacticalState)
    quality: QualityReport = field(default_factory=QualityReport)
    provenance: Provenance = field(
        default_factory=lambda: make_provenance(
            Origin.UNAVAILABLE,
            model="world-state",
            calculation="empty",
        )
    )
    calibrated: bool = False

    def team_players(self, team: str) -> list[PlayerState]:
        return [p for p in self.players if p.profile.team == team]

    def visible_players(self) -> list[PlayerState]:
        return [p for p in self.players if p.has_position() and p.xy is not None]

    def on_ball(self) -> Optional[PlayerState]:
        if self.ball.xy is None:
            return None
        best = None
        best_d = 1e9
        for player in self.visible_players():
            d = float(np.linalg.norm(player.xy[:2] - self.ball.xy[:2]))
            if d < best_d:
                best_d = d
                best = player
        if best is not None and best_d < 2.5:
            return best
        return None


def simulated_attacking_third(seed: int = 7) -> WorldState:
    """Labeled SIMULATED clip for the tactical lab when no tracking exists."""
    rng = np.random.default_rng(seed)

    # Select a reproducible tactical situation for this seed.
    scenario_types = (
        "counterattack",
        "wing_attack",
        "central_attack",
        "high_pressure",
    )
    scenario_type = scenario_types[seed % len(scenario_types)]

    # Realistic 4-3-3 attacking and defensive shapes (105m x 68m).
    home_shape = [
        (8, 34),   # Goalkeeper
        (39, 12), (36, 27), (36, 42), (39, 56),  # Defenders
        (55, 34), (64, 17), (64, 50),             # Midfielders
        (80, 34), (75, 24), (75, 52),             # Forwards
    ]
    away_shape = [
        (99, 34),  # Goalkeeper
        (87, 12), (87, 27), (87, 42), (87, 56),  # Defenders
        (76, 34), (72, 17), (72, 50),             # Midfielders
        (58, 34), (60, 20), (60, 49),             # Forwards
    ]
    # Adjust team shape according to the tactical situation.
    if scenario_type == "counterattack":
        home_shape[5] = (57, 34)
        home_shape[8] = (87, 34)
        home_shape[9] = (82, 18)
        home_shape[10] = (82, 51)
        away_shape[5] = (72, 34)
        away_shape[8] = (65, 34)

    elif scenario_type == "wing_attack":
        wing_y = 12 if seed % 2 == 0 else 56
        home_shape[6] = (75, wing_y)
        home_shape[9] = (83, wing_y)
        home_shape[8] = (86, 34)
        away_shape[5] = (78, wing_y)
        away_shape[6] = (76, 34)

    elif scenario_type == "central_attack":
        home_shape[5] = (62, 34)
        home_shape[6] = (72, 27)
        home_shape[7] = (72, 42)
        home_shape[8] = (86, 34)
        away_shape[5] = (77, 31)
        away_shape[6] = (77, 39)

    elif scenario_type == "high_pressure":
        away_shape[5] = (66, 30)
        away_shape[6] = (65, 40)
        away_shape[7] = (55, 34)
        away_shape[8] = (51, 27)
        home_shape[5] = (57, 34)
        home_shape[6] = (65, 18)

    home = []
    away = []
    for i in range(11):
        home.append(
            PlayerState(
                profile=PlayerProfile(
                    player_id=f"H{i+1}",
                    team="home",
                    name=f"Home {i+1}",
                    finishing=0.4 + 0.05 * (i % 5),
                    passing=0.45 + 0.04 * ((i + 1) % 5),
                    role_fluid=["false nine", "inverted fullback", "roaming midfielder", "hybrid winger", "half-space"][i % 5],
                    cold_start=False,
                ),
                xy=np.array([
                    np.clip(home_shape[i][0] + rng.normal(0, 3), 3, 101),
                    np.clip(home_shape[i][1] + rng.normal(0, 3), 3, 65)
                ], dtype=np.float64),
                z=0.0,
                velocity=np.array([rng.normal(1.5, 0.8), rng.normal(0, 1.0)], dtype=np.float64),
                visibility=Visibility.VISIBLE,
                origin=Origin.SIMULATED,
                confidence=0.55,
                energy=max(0.35, 1.0 - 0.006 * 70),
                fatigue=min(0.8, 0.004 * 70),
                identity_confidence=0.4,
                current_action="positioning",
            )
        )
        away.append(
            PlayerState(
                profile=PlayerProfile(
                    player_id=f"A{i+1}",
                    team="away",
                    name=f"Away {i+1}",
                    role_fluid="pressing trigger" if i == 9 else "defender",
                ),
                xy=np.array([
                    np.clip(away_shape[i][0] + rng.normal(0, 3), 3, 101),
                    np.clip(away_shape[i][1] + rng.normal(0, 3), 3, 65)
                ], dtype=np.float64),
                z=0.0,
                velocity=np.array([rng.normal(-0.6, 0.5), rng.normal(0, 0.8)], dtype=np.float64),
                visibility=Visibility.VISIBLE,
                origin=Origin.SIMULATED,
                confidence=0.55,
                identity_confidence=0.35,
                current_action="recovering",
            )
        )
    # Far-side player deliberately off-camera to encode broadcast limitation.
    away[-1].visibility = Visibility.OFF_CAMERA
    away[-1].xy = None
    away[-1].velocity = None
    away[-1].origin = Origin.UNAVAILABLE
    away[-1].confidence = 0.0

    # Choose a midfielder or forward as the ball carrier.
    # Select a suitable ball carrier for the tactical situation.
    carrier_candidates = {
        "counterattack": [5, 6, 7, 8, 9, 10],
        "wing_attack": [6, 9] if seed % 2 == 0 else [7, 10],
        "central_attack": [5, 7, 8],
        "high_pressure": [5, 6, 7],
    }
    carrier_index = int(rng.choice(carrier_candidates[scenario_type]))
    carrier = home[carrier_index]

    # Keep the carrier close to their formation position.
    carrier_x = float(np.clip(carrier.xy[0] + rng.uniform(-4, 6), 52, 92))
    carrier_y = float(np.clip(carrier.xy[1] + rng.uniform(-4, 4), 5, 63))

    ball = BallState(
        xy=np.array([carrier_x + 1.5, carrier_y + 0.5], dtype=np.float64),
        z=0.15,
        velocity=np.array([2.0, 0.4], dtype=np.float64),
        spin=None,
        origin=Origin.SIMULATED,
        confidence=0.5,
        visibility=Visibility.VISIBLE,
    )
    # Randomize the ball carrier for each simulated scenario.
    carrier.xy = np.array([carrier_x, carrier_y], dtype=np.float64)
    carrier.current_action = "on ball"

    # Defensive pressure varies with the match situation.
    if scenario_type == "high_pressure":
        # Two opponents press from different directions.
        for defender, dx, dy in zip(
            (away[5], away[6]),
            (2.5, 4.0),
            (-1.5, 2.0),
        ):
            defender.xy = np.array([
                float(np.clip(carrier_x + dx, 3, 102)),
                float(np.clip(carrier_y + dy, 3, 65)),
            ], dtype=np.float64)
            defender.current_action = "pressing ball carrier"

    elif scenario_type == "counterattack":
        # Defenders retreat toward their own goal.
        for defender in away[1:5]:
            if defender.xy is not None:
                defender.xy[0] = float(
                    np.clip(defender.xy[0] + 3.0, 3, 102)
                )
                defender.current_action = "retreating"

    quality = QualityReport(
        tracking_confidence=0.5,
        camera_quality=0.6,
        frame_quality=0.6,
        identity_confidence=0.4,
        ball_confidence=0.5,
        calibration_confidence=0.7,
        completeness=0.85,
        issues=["SIMULATED world — not observed tracking", "one defender off-camera"],
    )
    state = WorldState(
        timestamp_s=70.0 * 60.0,
        players=home + away,
        ball=ball,
        score=(1, 1),
        match_minute=70.0,
        environment=Environment(
            wind_mps=np.array([1.2, -0.4]),
            rain=0.1,
            surface_quality=0.9,
            origin=Origin.ESTIMATED,
        ),
        tactical=TacticalState(
            formation="4-3-3",
            possession_team="home",
            phase="attacking third",
            identity="progressive",
            tempo=0.62,
            risk_appetite=0.55,
        ),
        quality=quality,
        calibrated=True,
        provenance=make_provenance(
            Origin.SIMULATED,
            model="world-simulator",
            calculation="synthetic attacking-third snapshot",
            input_quality=0.5,
            notes="Use only when live tracking is unavailable.",
        ),
    )
    state.scenario_type = scenario_type
    return state
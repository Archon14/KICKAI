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
                xy=np.array([70.0 + rng.normal(0, 6), 8 + i * 5.2], dtype=np.float64),
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
                xy=np.array([88.0 + rng.normal(0, 4), 10 + i * 4.8], dtype=np.float64),
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

    ball = BallState(
        xy=np.array([78.0, 34.0], dtype=np.float64),
        z=0.15,
        velocity=np.array([2.0, 0.4], dtype=np.float64),
        spin=None,
        origin=Origin.SIMULATED,
        confidence=0.5,
        visibility=Visibility.VISIBLE,
    )
    home[9].xy = np.array([76.5, 33.5], dtype=np.float64)
    home[9].current_action = "on ball"
    home[9].profile.finishing = 0.72
    home[9].profile.passing = 0.68

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
    return WorldState(
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

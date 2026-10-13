"""Newtonian helpers used only where they improve football reasoning."""

from __future__ import annotations

import numpy as np

from core.math_engine import unit


G = 9.81
BALL_MASS_KG = 0.43
TYPICAL_PLAYER_MASS_KG = 75.0


def force(mass_kg: float, acceleration_mps2: np.ndarray) -> np.ndarray:
    return float(mass_kg) * np.asarray(acceleration_mps2, dtype=np.float64)


def momentum(mass_kg: float, velocity_mps: np.ndarray) -> np.ndarray:
    return float(mass_kg) * np.asarray(velocity_mps, dtype=np.float64)


def kinetic_energy(mass_kg: float, speed_mps: float) -> float:
    return 0.5 * float(mass_kg) * float(speed_mps) ** 2


def potential_energy(mass_kg: float, height_m: float, g: float = G) -> float:
    return float(mass_kg) * g * float(height_m)


def turning_radius(speed_mps: float, max_lateral_accel: float = 5.0) -> float:
    """Inertia: a fast player cannot cut instantly."""
    v = abs(float(speed_mps))
    a = max(float(max_lateral_accel), 1e-6)
    if v < 0.2:
        return 0.15
    return (v * v) / a


def deflection_after_cut(velocity_mps: np.ndarray, desired_dir: np.ndarray, max_lateral_accel: float, dt: float) -> np.ndarray:
    v = np.asarray(velocity_mps, dtype=np.float64)
    desired = unit(desired_dir)
    speed = float(np.linalg.norm(v))
    if speed < 1e-6:
        return desired * 0.0
    current_dir = v / speed
    # Limit heading change by lateral acceleration budget.
    max_dtheta = (max_lateral_accel * max(dt, 1e-6)) / max(speed, 1e-6)
    target = desired if np.linalg.norm(desired) > 0 else current_dir
    cos = float(np.clip(np.dot(current_dir[:2], target[:2]), -1.0, 1.0))
    theta = float(np.arccos(cos))
    if theta <= max_dtheta:
        new_dir = target
    else:
        # Rotate current_dir toward target by max_dtheta in 2D.
        c, s = np.cos(max_dtheta), np.sin(max_dtheta)
        cross = current_dir[0] * target[1] - current_dir[1] * target[0]
        sign = 1.0 if cross >= 0 else -1.0
        rot = np.array(
            [
                current_dir[0] * c - sign * current_dir[1] * s,
                current_dir[1] * c + sign * current_dir[0] * s,
            ]
        )
        new_dir = unit(rot)
    out = np.zeros_like(v)
    out[:2] = new_dir[:2] * speed
    if v.size > 2:
        out[2] = v[2]
    return out


def bounce_speed(incoming_speed: float, restitution: float = 0.6, surface_quality: float = 1.0) -> float:
    return abs(float(incoming_speed)) * float(np.clip(restitution * surface_quality, 0.05, 0.95))


def intercept_difficulty(
    attacker_momentum: np.ndarray,
    defender_momentum: np.ndarray,
    closing_distance_m: float,
) -> float:
    """Higher when defender momentum is away from the contest."""
    a = np.asarray(attacker_momentum, dtype=np.float64)[:2]
    d = np.asarray(defender_momentum, dtype=np.float64)[:2]
    closing = unit(a - d)
    defender_away = float(np.dot(unit(d), -closing))
    dist_term = 1.0 / (1.0 + max(closing_distance_m, 0.0))
    return float(np.clip(0.5 + 0.3 * defender_away + 0.2 * (1.0 - dist_term), 0.0, 1.0))

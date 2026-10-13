"""Reusable football mathematics: geometry, probability, kinematics."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import numpy as np


def finite(value: float, default: float = 0.0) -> float:
    value = float(value)
    return value if np.isfinite(value) else default


def distance(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.linalg.norm(np.asarray(a, dtype=np.float64) - np.asarray(b, dtype=np.float64)))


def angle_abc(a: np.ndarray, b: np.ndarray, c: np.ndarray) -> np.ndarray:
    """Angle ABC in degrees. Accepts (3,) or (N,3)."""
    a = np.asarray(a, dtype=np.float64)
    b = np.asarray(b, dtype=np.float64)
    c = np.asarray(c, dtype=np.float64)
    squeeze = a.ndim == 1
    if squeeze:
        a, b, c = a[None, :], b[None, :], c[None, :]
    ba = a - b
    bc = c - b
    denom = np.linalg.norm(ba, axis=1) * np.linalg.norm(bc, axis=1)
    denom = np.maximum(denom, 1e-8)
    cosine = np.clip(np.sum(ba * bc, axis=1) / denom, -1.0, 1.0)
    out = np.degrees(np.arccos(cosine))
    return out[0] if squeeze else out


def unit(v: np.ndarray) -> np.ndarray:
    v = np.asarray(v, dtype=np.float64).reshape(-1)
    n = float(np.linalg.norm(v))
    if n < 1e-9:
        return np.zeros_like(v)
    return v / n


def line_from_points(p1: np.ndarray, p2: np.ndarray) -> tuple[float, float]:
    """Return (m, b) for y = mx + b. Vertical lines use inf slope and x-intercept in b."""
    x1, y1 = float(p1[0]), float(p1[1])
    x2, y2 = float(p2[0]), float(p2[1])
    dx = x2 - x1
    if abs(dx) < 1e-9:
        return float("inf"), x1
    m = (y2 - y1) / dx
    return m, y1 - m * x1


def line_intersection(
    m1: float, b1: float, m2: float, b2: float
) -> Optional[tuple[float, float]]:
    if np.isinf(m1) and np.isinf(m2):
        return None
    if np.isinf(m1):
        return b1, m2 * b1 + b2
    if np.isinf(m2):
        return b2, m1 * b2 + b1
    if abs(m1 - m2) < 1e-12:
        return None
    x = (b2 - b1) / (m1 - m2)
    return x, m1 * x + b1


def point_to_segment_distance(p: np.ndarray, a: np.ndarray, b: np.ndarray) -> float:
    p = np.asarray(p, dtype=np.float64)[:2]
    a = np.asarray(a, dtype=np.float64)[:2]
    b = np.asarray(b, dtype=np.float64)[:2]
    ab = b - a
    denom = float(np.dot(ab, ab))
    if denom < 1e-12:
        return float(np.linalg.norm(p - a))
    t = float(np.clip(np.dot(p - a, ab) / denom, 0.0, 1.0))
    return float(np.linalg.norm(p - (a + t * ab)))


def convex_hull_2d(points: np.ndarray) -> np.ndarray:
    pts = np.asarray(points, dtype=np.float64)[:, :2]
    pts = np.unique(pts, axis=0)
    if len(pts) <= 2:
        return pts
    pts = pts[np.lexsort((pts[:, 1], pts[:, 0]))]

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    lower: list[np.ndarray] = []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    upper: list[np.ndarray] = []
    for p in pts[::-1]:
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return np.asarray(lower[:-1] + upper[:-1])


def polygon_contains(poly: np.ndarray, point: np.ndarray) -> bool:
    x, y = float(point[0]), float(point[1])
    inside = False
    n = len(poly)
    j = n - 1
    for i in range(n):
        xi, yi = float(poly[i, 0]), float(poly[i, 1])
        xj, yj = float(poly[j, 0]), float(poly[j, 1])
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi):
            inside = not inside
        j = i
    return inside


def shot_angle(ball_xy: np.ndarray, goal_left: np.ndarray, goal_right: np.ndarray) -> float:
    """Opening angle of the goal from the ball, radians."""
    v1 = np.asarray(goal_left, dtype=np.float64)[:2] - np.asarray(ball_xy, dtype=np.float64)[:2]
    v2 = np.asarray(goal_right, dtype=np.float64)[:2] - np.asarray(ball_xy, dtype=np.float64)[:2]
    n1 = np.linalg.norm(v1)
    n2 = np.linalg.norm(v2)
    if n1 < 1e-8 or n2 < 1e-8:
        return 0.0
    cosine = float(np.clip(np.dot(v1, v2) / (n1 * n2), -1.0, 1.0))
    return float(np.arccos(cosine))


def velocity(delta_x: np.ndarray, dt: float) -> np.ndarray:
    dt = max(float(dt), 1e-6)
    return np.asarray(delta_x, dtype=np.float64) / dt


def acceleration(delta_v: np.ndarray, dt: float) -> np.ndarray:
    return velocity(delta_v, dt)


def travel_time(distance_m: float, speed_mps: float) -> float:
    speed_mps = max(float(speed_mps), 1e-6)
    return float(distance_m) / speed_mps


def reachable_radius(speed_mps: float, time_s: float, accel_limit: float = 4.5) -> float:
    """Distance reachable in time with a simple accel-then-cruise model."""
    t = max(float(time_s), 0.0)
    a = max(float(accel_limit), 1e-6)
    v = max(float(speed_mps), 0.0)
    t_acc = min(t, v / a) if a > 0 else 0.0
    d_acc = 0.5 * a * t_acc * t_acc
    d_cruise = v * max(t - t_acc, 0.0)
    return d_acc + d_cruise


def bayes_update(prior: float, likelihood_true: float, likelihood_false: float) -> float:
    prior = float(np.clip(prior, 1e-9, 1 - 1e-9))
    num = likelihood_true * prior
    den = num + likelihood_false * (1.0 - prior)
    return float(num / max(den, 1e-12))


def expected_value(outcomes: np.ndarray, probabilities: np.ndarray) -> float:
    p = np.asarray(probabilities, dtype=np.float64)
    p = p / max(p.sum(), 1e-12)
    return float(np.dot(np.asarray(outcomes, dtype=np.float64), p))


def wilson_interval(successes: int, n: int, z: float = 1.96) -> tuple[float, float]:
    if n <= 0:
        return (0.0, 1.0)
    p = successes / n
    z2 = z * z
    den = 1.0 + z2 / n
    center = (p + z2 / (2 * n)) / den
    half = z * np.sqrt((p * (1 - p) + z2 / (4 * n)) / n) / den
    return float(max(0.0, center - half)), float(min(1.0, center + half))


@dataclass(frozen=True)
class Parabola3D:
    """Vertical ball flight under gravity. z is height in metres."""

    g: float = 9.81

    def height(self, z0: float, vz: float, t: float) -> float:
        return z0 + vz * t - 0.5 * self.g * t * t

    def time_to_ground(self, z0: float, vz: float) -> float:
        disc = vz * vz + 2 * self.g * z0
        if disc < 0:
            return 0.0
        return (vz + np.sqrt(disc)) / self.g

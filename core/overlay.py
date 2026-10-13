"""Tactical overlay primitives (OpenCV). Pixel or pitch depending on calibration."""

from __future__ import annotations

import cv2
import numpy as np

from core.tactics import TacticalOption
from core.world import WorldState


def render_overlay(frame: np.ndarray, state: WorldState, option: TacticalOption | None = None) -> np.ndarray:
    out = frame.copy()
    h, w = out.shape[:2]
    for p in state.visible_players():
        x, y = _map(p.xy, state, w, h)
        color = (33, 212, 123) if p.profile.team == "home" else (90, 90, 255)
        if p.profile.team == "unknown":
            color = (200, 200, 200)
        cv2.circle(out, (x, y), 8, color, -1)
        if p.velocity is not None:
            vx, vy = p.velocity[:2]
            cv2.arrowedLine(out, (x, y), (int(x + vx * 4), int(y + vy * 4)), color, 2, tipLength=0.3)
        label = p.profile.name if p.profile.name and p.profile.name != "Unknown" else p.profile.player_id
        cv2.putText(out, label[:12], (x + 6, y - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
        cv2.putText(
            out,
            f"{int(p.xy[0])},{int(p.xy[1])}",
            (x + 6, y + 12),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.32,
            (167, 181, 174),
            1,
        )
    if state.ball.xy is not None:
        bx, by = _map(state.ball.xy, state, w, h)
        cv2.circle(out, (bx, by), 6, (0, 255, 255), -1)
        cv2.putText(
            out,
            f"ball {int(state.ball.xy[0])},{int(state.ball.xy[1])}",
            (bx + 8, by - 8),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.4,
            (0, 255, 255),
            1,
        )
    if option is not None and "PASS" in option.action:
        carrier = state.on_ball()
        target = next((p for p in state.players if p.profile.player_id == option.target_player), None)
        if carrier and carrier.has_position() and target and target.has_position():
            cv2.line(out, _map(carrier.xy, state, w, h), _map(target.xy, state, w, h), (255, 180, 40), 2)
    return out


def _map(xy: np.ndarray, state: WorldState, w: int, h: int) -> tuple[int, int]:
    if not state.calibrated:
        return int(np.clip(xy[0], 0, w - 1)), int(np.clip(xy[1], 0, h - 1))
    x = int(np.clip(xy[0] / state.pitch_length * w, 0, w - 1))
    y = int(np.clip(xy[1] / state.pitch_width * h, 0, h - 1))
    return x, y

"""Live diagnostics for video and analysis loops."""

from __future__ import annotations

import time
from dataclasses import dataclass, field


@dataclass
class Diagnostics:
    fps: float = 0.0
    processing_latency_ms: float = 0.0
    tracking_latency_ms: float = 0.0
    model_latency_ms: float = 0.0
    dropped_frames: int = 0
    tracking_confidence: float = 0.0
    analysis_confidence: float = 0.0
    last_player_count: int = 0
    frames: int = 0
    _t0: float = field(default_factory=time.perf_counter)

    def mark_frame(self, latency_ms: float) -> None:
        self.frames += 1
        self.processing_latency_ms = latency_ms
        elapsed = max(time.perf_counter() - self._t0, 1e-6)
        self.fps = self.frames / elapsed

    def note_tracking(self, players: int, confidence: float) -> None:
        self.last_player_count = players
        self.tracking_confidence = confidence

    def as_dict(self) -> dict:
        return {
            "fps": round(self.fps, 2),
            "processing_latency_ms": round(self.processing_latency_ms, 2),
            "tracking_latency_ms": round(self.tracking_latency_ms, 2),
            "model_latency_ms": round(self.model_latency_ms, 2),
            "dropped_frames": self.dropped_frames,
            "tracking_confidence": round(self.tracking_confidence, 3),
            "analysis_confidence": round(self.analysis_confidence, 3),
            "players": self.last_player_count,
            "frames": self.frames,
        }

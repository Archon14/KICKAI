"""Player/ball tracking with explicit uncertainty. Off-camera players stay unknown."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import cv2
import numpy as np

from core.observability import Diagnostics
from core.provenance import Origin, QualityReport, Visibility, make_provenance
from core.world import BallState, PlayerProfile, PlayerState, WorldState


@dataclass
class Detection:
    xyxy: np.ndarray
    confidence: float
    label: str


class FrameTracker:
    def __init__(self) -> None:
        self._next_id = 1
        self._tracks: dict[int, np.ndarray] = {}
        self._hog = None
        try:
            hog = cv2.HOGDescriptor()
            hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
            self._hog = hog
        except Exception:
            self._hog = None

    def detect_people(self, frame: np.ndarray) -> list[Detection]:
        if self._hog is None or frame is None or frame.size == 0:
            return []
        h, w = frame.shape[:2]
        scale = 1.0
        work = frame
        if w > 960:
            scale = 960 / w
            work = cv2.resize(frame, (int(w * scale), int(h * scale)))
        rects, weights = self._hog.detectMultiScale(work, winStride=(8, 8), padding=(8, 8), scale=1.05)
        out = []
        for (x, y, bw, bh), conf in zip(rects, weights):
            xyxy = np.array([x, y, x + bw, y + bh], dtype=np.float64) / scale
            out.append(Detection(xyxy=xyxy, confidence=float(np.clip(conf / 2.0, 0.05, 0.95)), label="person"))
        return out

    def detect_ball(self, frame: np.ndarray) -> Optional[Detection]:
        if frame is None or frame.size == 0:
            return None
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.medianBlur(gray, 5)
        h, w = gray.shape[:2]
        min_r = max(3, int(min(h, w) * 0.008))
        max_r = max(min_r + 1, int(min(h, w) * 0.04))
        circles = cv2.HoughCircles(
            gray,
            cv2.HOUGH_GRADIENT,
            dp=1.2,
            minDist=20,
            param1=80,
            param2=28,
            minRadius=min_r,
            maxRadius=max_r,
        )
        if circles is None:
            return None
        x, y, r = circles[0, 0]
        return Detection(
            xyxy=np.array([x - r, y - r, x + r, y + r], dtype=np.float64),
            confidence=0.25,
            label="ball",
        )

    def associate(self, detections: list[Detection]) -> list[tuple[int, Detection]]:
        assigned = []
        used_tracks = set()
        for det in detections:
            c = _center(det.xyxy)
            best_id = None
            best_d = 80.0
            for tid, prev in self._tracks.items():
                if tid in used_tracks:
                    continue
                d = float(np.linalg.norm(c - _center(prev)))
                if d < best_d:
                    best_d = d
                    best_id = tid
            if best_id is None:
                best_id = self._next_id
                self._next_id += 1
            used_tracks.add(best_id)
            self._tracks[best_id] = det.xyxy
            assigned.append((best_id, det))
        return assigned

    def world_from_frame(
        self,
        frame: np.ndarray,
        timestamp_s: float,
        diagnostics: Optional[Diagnostics] = None,
        name_map: Optional[dict[str, str]] = None,
    ) -> WorldState:
        people = self.detect_people(frame)
        ball_det = self.detect_ball(frame)
        tracks = self.associate(people)
        h, w = frame.shape[:2]
        players = []
        for tid, det in tracks:
            cx, cy = _center(det.xyxy)
            # Image coordinates only — no fake pitch mapping without calibration.
            players.append(
                PlayerState(
                    profile=PlayerProfile(
                        player_id=f"T{tid}",
                        team="unknown",
                        name=(name_map or {}).get(f"T{tid}") or f"Track {tid}",
                    ),
                    xy=np.array([cx, cy], dtype=np.float64),
                    z=None,
                    velocity=None,
                    visibility=Visibility.VISIBLE,
                    origin=Origin.ESTIMATED,
                    confidence=det.confidence,
                    identity_confidence=0.05,
                    current_action="detected",
                )
            )
        ball = BallState(
            xy=_center(ball_det.xyxy) if ball_det else None,
            z=None,
            velocity=None,
            spin=None,
            origin=Origin.ESTIMATED if ball_det else Origin.UNAVAILABLE,
            confidence=ball_det.confidence if ball_det else 0.0,
            visibility=Visibility.VISIBLE if ball_det else Visibility.UNCERTAIN,
        )
        quality = QualityReport(
            tracking_confidence=float(np.mean([p.confidence for p in players])) if players else 0.0,
            camera_quality=0.5,
            frame_quality=0.5 if frame.mean() > 12 else 0.15,
            identity_confidence=0.05,
            ball_confidence=ball.confidence,
            calibration_confidence=0.0,
            completeness=min(1.0, len(players) / 22.0),
            issues=_issues(players, ball, w, h),
        )
        if diagnostics is not None:
            diagnostics.note_tracking(len(players), quality.tracking_confidence)
        return WorldState(
            timestamp_s=timestamp_s,
            players=players,
            ball=ball,
            calibrated=False,
            quality=quality,
            provenance=make_provenance(
                Origin.ESTIMATED,
                model="opencv-hog+hough",
                calculation="image-space HOG people + Hough circle ball; no pitch calibration",
                input_quality=quality.overall,
                notes="Positions are image pixels, not metres. Identity is not resolved.",
            ),
        )


def _center(xyxy: np.ndarray) -> np.ndarray:
    return np.array([(xyxy[0] + xyxy[2]) / 2.0, (xyxy[1] + xyxy[3]) / 2.0], dtype=np.float64)


def _issues(players: list[PlayerState], ball: BallState, w: int, h: int) -> list[str]:
    issues = [
        "No pitch calibration — coordinates are image pixels",
        "HOG person detector is ESTIMATED, not a trained football tracker",
        "Identities are track IDs, not player names",
    ]
    if len(players) < 8:
        issues.append("Far-side / occluded players likely missing")
    if ball.xy is None:
        issues.append("Ball tracking is unreliable or unavailable")
    return issues

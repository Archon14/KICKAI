"""Club-scale ingestion: video, CSV, manual events. No data-science department required."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd

from core.provenance import Origin, QualityReport, Visibility, make_provenance
from core.world import BallState, PlayerProfile, PlayerState, WorldState


REQUIRED = ("player_id", "team", "x", "y")


@dataclass
class IngestResult:
    world: Optional[WorldState]
    issues: list[str]
    rows: int


def ingest_csv(path: str | Path) -> IngestResult:
    path = Path(path)
    issues: list[str] = []
    if not path.exists() or path.stat().st_size == 0:
        return IngestResult(None, ["CSV missing or empty"], 0)
    try:
        df = pd.read_csv(path)
    except Exception as exc:
        return IngestResult(None, [f"malformed CSV: {exc}"], 0)
    missing = [c for c in REQUIRED if c not in df.columns]
    if missing:
        return IngestResult(None, [f"missing columns: {missing}"], len(df))
    players = []
    for row in df.itertuples(index=False):
        try:
            x, y = float(row.x), float(row.y)
        except Exception:
            issues.append(f"skipped row with non-numeric x/y for {getattr(row, 'player_id', '?')}")
            continue
        if not np.isfinite(x) or not np.isfinite(y):
            issues.append(f"non-finite coordinates for {row.player_id}")
            continue
        players.append(
            PlayerState(
                profile=PlayerProfile(
                    player_id=str(row.player_id),
                    team=str(row.team),
                    name=str(getattr(row, "name", row.player_id)),
                    cold_start=True,
                ),
                xy=np.array([x, y], dtype=np.float64),
                z=float(row.z) if hasattr(row, "z") and pd.notna(row.z) else None,
                velocity=None,
                visibility=Visibility.VISIBLE,
                origin=Origin.OBSERVED,
                confidence=0.7,
            )
        )
    ball = BallState(
        xy=None,
        z=None,
        velocity=None,
        spin=None,
        origin=Origin.UNAVAILABLE,
        confidence=0.0,
    )
    if {"ball_x", "ball_y"}.issubset(df.columns) and len(df):
        bx, by = df.iloc[0]["ball_x"], df.iloc[0]["ball_y"]
        if pd.notna(bx) and pd.notna(by):
            ball = BallState(
                xy=np.array([float(bx), float(by)]),
                z=None,
                velocity=None,
                spin=None,
                origin=Origin.OBSERVED,
                confidence=0.6,
                visibility=Visibility.VISIBLE,
            )
    quality = QualityReport(
        tracking_confidence=0.7 if players else 0.0,
        completeness=min(1.0, len(players) / 22.0),
        issues=issues,
        calibration_confidence=0.4,
        identity_confidence=0.5,
        ball_confidence=ball.confidence,
        camera_quality=0.0,
        frame_quality=0.0,
    )
    world = WorldState(
        timestamp_s=0.0,
        players=players,
        ball=ball,
        quality=quality,
        calibrated=False,
        provenance=make_provenance(
            Origin.OBSERVED,
            model="csv-ingest",
            calculation="manual/club CSV positions",
            input_quality=quality.overall,
        ),
    )
    return IngestResult(world, issues, len(df))

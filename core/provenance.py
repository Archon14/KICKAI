"""Data quality, provenance, and claim labels. Never silently fabricate."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional
from uuid import uuid4


class Origin(str, Enum):
    OBSERVED = "OBSERVED"
    INFERRED = "INFERRED"
    ESTIMATED = "ESTIMATED"
    SIMULATED = "SIMULATED"
    PREDICTED = "PREDICTED"
    UNAVAILABLE = "UNAVAILABLE"


class ClaimStatus(str, Enum):
    VALIDATED = "VALIDATED"
    EXPERIMENTAL = "EXPERIMENTAL"
    SIMULATED = "SIMULATED"
    ESTIMATED = "ESTIMATED"
    RESEARCH = "RESEARCH"


class Visibility(str, Enum):
    VISIBLE = "visible"
    PARTIAL = "partially visible"
    OCCLUDED = "occluded"
    OFF_CAMERA = "off-camera"
    UNCERTAIN = "uncertain"


@dataclass(frozen=True)
class Provenance:
    origin: Origin
    timestamp: str
    model: str
    model_version: str
    source: str
    input_quality: float
    calculation: str
    human_modified: bool = False
    notes: str = ""
    record_id: str = field(default_factory=lambda: uuid4().hex[:12])

    def as_dict(self) -> dict[str, Any]:
        return {
            "origin": self.origin.value,
            "timestamp": self.timestamp,
            "model": self.model,
            "model_version": self.model_version,
            "source": self.source,
            "input_quality": self.input_quality,
            "calculation": self.calculation,
            "human_modified": self.human_modified,
            "notes": self.notes,
            "record_id": self.record_id,
        }


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def make_provenance(
    origin: Origin,
    *,
    model: str,
    calculation: str,
    source: str = "kickai-core",
    model_version: str = "0.2.0",
    input_quality: float = 0.0,
    notes: str = "",
    human_modified: bool = False,
) -> Provenance:
    return Provenance(
        origin=origin,
        timestamp=now_iso(),
        model=model,
        model_version=model_version,
        source=source,
        input_quality=float(max(0.0, min(1.0, input_quality))),
        calculation=calculation,
        human_modified=human_modified,
        notes=notes,
    )


@dataclass
class QualityReport:
    tracking_confidence: float = 0.0
    camera_quality: float = 0.0
    frame_quality: float = 0.0
    identity_confidence: float = 0.0
    ball_confidence: float = 0.0
    calibration_confidence: float = 0.0
    completeness: float = 0.0
    issues: list[str] = field(default_factory=list)

    @property
    def overall(self) -> float:
        values = [
            self.tracking_confidence,
            self.camera_quality,
            self.frame_quality,
            self.identity_confidence,
            self.ball_confidence,
            self.calibration_confidence,
            self.completeness,
        ]
        return float(sum(values) / len(values))


def unavailable(name: str) -> dict[str, Any]:
    return {"value": None, "status": Origin.UNAVAILABLE.value, "name": name}

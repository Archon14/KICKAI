"""Individual and team training lab. Audio is optional; visual mode is complete."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

import numpy as np

from core.dtw import compute_dtw_distance
from core.provenance import ClaimStatus, Origin, make_provenance


FAILURE_MODES = {
    "late": "The action started after the decision window closed.",
    "heavy_touch": "First contact pushed the ball beyond the usable space.",
    "closed_body": "Body orientation blocked the next action.",
    "no_scan": "The player did not check space before receiving.",
    "overhit": "Pass or shot weight exceeded control range.",
    "underhit": "The ball did not beat the pressure line.",
}


@dataclass
class Drill:
    name: str
    focus: str
    difficulty: float
    repetitions: int
    visual_cues: list[str]
    audio_cues: list[str]
    team: bool = False


@dataclass
class TrainingPlan:
    weakness: str
    drill: Drill
    feedback: str
    failure_mode: Optional[str]
    next_difficulty: float
    audio_required: bool = False
    claim: ClaimStatus = ClaimStatus.EXPERIMENTAL
    provenance: dict = field(default_factory=dict)


class AdaptiveCoach:
    def __init__(self) -> None:
        self.difficulty = 0.4
        self.success_streak = 0
        self.fail_streak = 0

    def observe(self, success: bool, error: Optional[str] = None) -> TrainingPlan:
        if success:
            self.success_streak += 1
            self.fail_streak = 0
            if self.success_streak >= 3:
                self.difficulty = min(1.0, self.difficulty + 0.08)
                self.success_streak = 0
            weakness = "raise tempo / shrink space"
            failure = None
            feedback = (
                "Consistent success. Increasing pressure, reducing time and space, "
                "and adding a second opponent reaction."
            )
        else:
            self.fail_streak += 1
            self.success_streak = 0
            self.difficulty = max(0.15, self.difficulty - 0.06)
            failure = error if error in FAILURE_MODES else "late"
            weakness = FAILURE_MODES[failure]
            feedback = FAILURE_MODES[failure] + " Repeat with a longer visual window before raising pressure."

        drill = self._drill_for(failure or "progress", self.difficulty)
        return TrainingPlan(
            weakness=weakness,
            drill=drill,
            feedback=feedback,
            failure_mode=failure,
            next_difficulty=self.difficulty,
            audio_required=False,
            provenance=make_provenance(
                Origin.INFERRED,
                model="adaptive-coach",
                calculation="streak-based difficulty + failure-mode mapping",
                input_quality=0.6,
            ).as_dict(),
        )

    def from_pose_angles(self, angles: np.ndarray, joint: str, expert: Optional[np.ndarray] = None) -> TrainingPlan:
        mean = float(np.mean(angles))
        rng = float(np.max(angles) - np.min(angles))
        dtw_note = ""
        if expert is not None:
            dist, score = compute_dtw_distance(angles.reshape(-1, 1), expert.reshape(-1, 1))
            dtw_note = f" DTW vs benchmark: {score:.1f} (distance {dist:.2f})."
        if "Knee" in joint and mean < 100:
            error = "closed_body"
        elif "Knee" in joint and mean > 160:
            error = "late"
        elif rng < 15:
            error = "no_scan"
        else:
            return self.observe(True)
        plan = self.observe(False, error)
        plan.feedback += dtw_note
        return plan

    def _drill_for(self, failure: str, difficulty: float) -> Drill:
        reps = int(8 + difficulty * 10)
        visual = [
            "flash target zone",
            f"{max(0.6, 2.4 - difficulty * 1.4):.1f}s decision window",
            "arrow for next action",
            "timer ring",
        ]
        audio = ["time", "man on", "turn"] if difficulty > 0.5 else ["time"]
        team_map = {
            "late": ("pressing trigger", "pressing"),
            "heavy_touch": ("first touch under pressure", "passing"),
            "closed_body": ("open receiving", "buildup"),
            "no_scan": ("scan-before-receive", "movement"),
            "overhit": ("weighted finishing", "finishing"),
            "underhit": ("break the line", "transition"),
            "progress": ("combination play", "overloads"),
        }
        focus, team_theme = team_map.get(failure, ("general technique", "passing"))
        return Drill(
            name=f"{focus} drill",
            focus=focus,
            difficulty=difficulty,
            repetitions=reps,
            visual_cues=visual,
            audio_cues=audio,
            team=failure in {"late", "progress", "underhit"},
        )


TEAM_THEMES = [
    "pressing",
    "buildup",
    "transition",
    "defensive shape",
    "attacking shape",
    "passing",
    "movement",
    "overloads",
    "counterattacks",
    "finishing",
    "set pieces",
]

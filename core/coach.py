"""Coach remains in control. Disagreement is stored with provenance."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from core.provenance import Origin, make_provenance
from core.tactics import DecisionReport, TacticalEngine, TacticalOption
from core.world import WorldState


@dataclass
class CoachDecision:
    action: str
    option_id: Optional[str]
    note: str
    alternative_family: Optional[str] = None
    provenance: dict = field(default_factory=dict)


class CoachOverride:
    def __init__(self) -> None:
        self.history: list[CoachDecision] = []

    def apply(
        self,
        state: WorldState,
        report: DecisionReport,
        action: str,
        option_id: Optional[str] = None,
        note: str = "",
        family: Optional[str] = None,
    ) -> tuple[DecisionReport, CoachDecision]:
        action = action.strip().title() if action.lower() != "ask why" else "Ask why"
        if action not in report.coach_controls:
            action = "Modify"
        record = CoachDecision(
            action=action,
            option_id=option_id,
            note=note,
            alternative_family=family,
            provenance=make_provenance(
                Origin.OBSERVED,
                model="coach-override",
                calculation="human decision stored; AI is not authority",
                source="coach",
                human_modified=True,
                notes=note,
            ).as_dict(),
        )
        self.history.append(record)
        if action == "Simulate alternative" and family:
            report = TacticalEngine().decide(state, family=family)
        if action == "Reject" and report.options:
            remaining = [o for o in report.options if o.option_id != (option_id or (report.recommendation.option_id if report.recommendation else ""))]
            if remaining:
                report.recommendation = remaining[0]
                report.options = remaining
        return report, record

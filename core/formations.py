"""Formation suggestions from team identity. Ranked, not a single Nash clone."""

from __future__ import annotations

from dataclasses import dataclass

from core.provenance import ClaimStatus, Origin, make_provenance
from core.world import WorldState


@dataclass(frozen=True)
class FormationOption:
    shape: str
    score: float
    why: str
    family: str
    claim: str


CATALOG = [
    FormationOption("4-3-3", 0.78, "Width + pressing triggers; fits progressive identity.", "aggressive", ClaimStatus.EXPERIMENTAL.value),
    FormationOption("4-2-3-1", 0.74, "Double pivot protects rest-defence while 10 occupies half-spaces.", "balanced", ClaimStatus.EXPERIMENTAL.value),
    FormationOption("3-2-4-1", 0.71, "Build-up overloads; inverted fullbacks become midfielders.", "creative", ClaimStatus.EXPERIMENTAL.value),
    FormationOption("3-5-2", 0.68, "Central density and wing-back height for isolation on flanks.", "historical", ClaimStatus.EXPERIMENTAL.value),
    FormationOption("4-4-2", 0.62, "Compact mid-block; safer if fatigue is high.", "safe", ClaimStatus.EXPERIMENTAL.value),
    FormationOption("5-3-2", 0.58, "Low block when scoreline protection matters.", "safe", ClaimStatus.EXPERIMENTAL.value),
]


def recommend_formations(state: WorldState, team: str = "home") -> dict:
    identity = (state.tactical.identity or "balanced").lower()
    tempo = state.tactical.tempo
    risk = state.tactical.risk_appetite
    minute = state.match_minute
    fatigue = float(np_mean_fatigue(state, team))

    ranked: list[dict] = []
    for option in CATALOG:
        score = option.score
        if identity in option.why.lower() or option.family == "balanced":
            score += 0.04
        if tempo > 0.6 and option.shape in {"4-3-3", "3-2-4-1"}:
            score += 0.06
        if risk < 0.4 and option.family == "safe":
            score += 0.08
        if minute > 80 and option.shape in {"5-3-2", "4-4-2"}:
            score += 0.05
        if fatigue > 0.55 and option.family == "safe":
            score += 0.05
        ranked.append(
            {
                "shape": option.shape,
                "score": round(float(min(score, 0.97)), 3),
                "why": option.why,
                "family": option.family,
                "claim": option.claim,
            }
        )
    ranked.sort(key=lambda row: row["score"], reverse=True)
    return {
        "team": team,
        "best": ranked[0]["shape"] if ranked else None,
        "options": ranked,
        "origin": Origin.INFERRED.value,
        "claim": ClaimStatus.EXPERIMENTAL.value,
        "provenance": make_provenance(
            Origin.INFERRED,
            model="formation-ranker",
            calculation="identity+tempo+risk+fatigue modifiers over a catalog",
            input_quality=state.quality.overall,
            notes="Not TacticAI graph generation. Catalog ranking only.",
        ).as_dict(),
    }


def np_mean_fatigue(state: WorldState, team: str) -> float:
    players = state.team_players(team) or state.visible_players()
    if not players:
        return 0.3
    return sum(p.fatigue for p in players) / len(players)

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import numpy as np


@dataclass(frozen=True)
class MatchPrediction:
    home_win_probability: float
    draw_probability: float
    away_win_probability: float
    expected_home_goals: float
    expected_away_goals: float
    simulations: int
    most_likely_score: tuple[int, int]


class MatchPredictor:
    """
    Lightweight football match predictor.

    Uses:
        - Elo ratings
        - expected goals
        - Poisson goal generation
        - Monte Carlo simulation

    The implementation is vectorized with NumPy to keep memory usage low.
    """

    DEFAULT_SIMULATIONS = 10_000
    MAX_SIMULATIONS = 100_000

    def __init__(
        self,
        home_elo: float = 1500.0,
        away_elo: float = 1500.0,
    ) -> None:
        self.home_elo = float(home_elo)
        self.away_elo = float(away_elo)

    @staticmethod
    def elo_win_probability(
        home_elo: float,
        away_elo: float,
        home_advantage: float = 65.0,
    ) -> float:
        """
        Calculate expected home-team strength from Elo.
        """

        adjusted_home = home_elo + home_advantage

        return 1.0 / (
            1.0 + 10.0 ** ((away_elo - adjusted_home) / 400.0)
        )

    @staticmethod
    def _validate_xg(value: float, name: str) -> float:
        try:
            value = float(value)
        except (TypeError, ValueError) as exc:
            raise ValueError(f"{name} must be numeric.") from exc

        if not np.isfinite(value):
            raise ValueError(f"{name} must be finite.")

        if value < 0:
            raise ValueError(f"{name} cannot be negative.")

        return min(value, 10.0)

    def simulate(
        self,
        home_xg: float,
        away_xg: float,
        simulations: int = DEFAULT_SIMULATIONS,
        seed: Optional[int] = None,
    ) -> MatchPrediction:

        home_xg = self._validate_xg(home_xg, "Home xG")
        away_xg = self._validate_xg(away_xg, "Away xG")

        simulations = int(simulations)

        if simulations < 100:
            raise ValueError("At least 100 simulations are recommended.")

        simulations = min(simulations, self.MAX_SIMULATIONS)

        rng = np.random.default_rng(seed)

        # Elo strength modifier.
        elo_strength = self.elo_win_probability(
            self.home_elo,
            self.away_elo,
        )

        # Small adjustment around the provided xG.
        # This avoids allowing Elo to completely dominate the model.
        home_factor = 0.90 + 0.20 * elo_strength
        away_factor = 0.90 + 0.20 * (1.0 - elo_strength)

        adjusted_home_xg = np.clip(
            home_xg * home_factor,
            0.01,
            10.0,
        )

        adjusted_away_xg = np.clip(
            away_xg * away_factor,
            0.01,
            10.0,
        )

        # Vectorized Poisson generation.
        home_goals = rng.poisson(
            adjusted_home_xg,
            size=simulations,
        )

        away_goals = rng.poisson(
            adjusted_away_xg,
            size=simulations,
        )

        home_wins = home_goals > away_goals
        draws = home_goals == away_goals
        away_wins = home_goals < away_goals

        home_probability = float(np.mean(home_wins))
        draw_probability = float(np.mean(draws))
        away_probability = float(np.mean(away_wins))

        # Most frequent score.
        score_pairs = np.column_stack(
            (home_goals, away_goals)
        )

        unique_scores, counts = np.unique(
            score_pairs,
            axis=0,
            return_counts=True,
        )

        most_likely_index = int(np.argmax(counts))

        most_likely_score = (
            int(unique_scores[most_likely_index, 0]),
            int(unique_scores[most_likely_index, 1]),
        )

        return MatchPrediction(
            home_win_probability=home_probability,
            draw_probability=draw_probability,
            away_win_probability=away_probability,
            expected_home_goals=float(np.mean(home_goals)),
            expected_away_goals=float(np.mean(away_goals)),
            simulations=simulations,
            most_likely_score=most_likely_score,
        )

    def score_distribution(
        self,
        home_xg: float,
        away_xg: float,
        simulations: int = DEFAULT_SIMULATIONS,
        seed: Optional[int] = None,
        max_goals: int = 6,
    ) -> list[dict]:
        """
        Return compact scoreline probabilities.

        This intentionally returns a small list rather than storing all
        simulation results in Python objects.
        """

        prediction = self.simulate(
            home_xg=home_xg,
            away_xg=away_xg,
            simulations=simulations,
            seed=seed,
        )

        # Re-run with deterministic local RNG for score table.
        rng = np.random.default_rng(seed)

        elo_strength = self.elo_win_probability(
            self.home_elo,
            self.away_elo,
        )

        home_factor = 0.90 + 0.20 * elo_strength
        away_factor = 0.90 + 0.20 * (1.0 - elo_strength)

        home_goals = rng.poisson(
            np.clip(home_xg * home_factor, 0.01, 10.0),
            size=prediction.simulations,
        )

        away_goals = rng.poisson(
            np.clip(away_xg * away_factor, 0.01, 10.0),
            size=prediction.simulations,
        )

        mask = (
            (home_goals <= max_goals)
            & (away_goals <= max_goals)
        )

        pairs = np.column_stack(
            (home_goals[mask], away_goals[mask])
        )

        if len(pairs) == 0:
            return []

        unique, counts = np.unique(
            pairs,
            axis=0,
            return_counts=True,
        )

        total = float(len(pairs))

        rows = []

        for pair, count in zip(unique, counts):
            rows.append(
                {
                    "Score": f"{int(pair[0])}-{int(pair[1])}",
                    "Probability": float(count / total),
                    "Count": int(count),
                }
            )

        rows.sort(
            key=lambda row: row["Probability"],
            reverse=True,
        )

        return rows[:15]

    def simulate_shots(
        self,
        home_xg_shots: list[float],
        away_xg_shots: list[float],
        simulations: int = DEFAULT_SIMULATIONS,
        seed: Optional[int] = None,
    ) -> dict:
        """Bernoulli-per-shot Monte Carlo from the existing research notebook."""
        simulations = min(max(int(simulations), 100), self.MAX_SIMULATIONS)
        rng = np.random.default_rng(seed)
        home = np.clip(np.asarray(home_xg_shots, dtype=np.float32), 0.0, 1.0)
        away = np.clip(np.asarray(away_xg_shots, dtype=np.float32), 0.0, 1.0)
        home_goals = (
            rng.binomial(1, home, size=(simulations, home.size)).sum(axis=1)
            if home.size
            else np.zeros(simulations, dtype=np.int16)
        )
        away_goals = (
            rng.binomial(1, away, size=(simulations, away.size)).sum(axis=1)
            if away.size
            else np.zeros(simulations, dtype=np.int16)
        )
        return {
            "home_win_prob": float(np.mean(home_goals > away_goals)),
            "away_win_prob": float(np.mean(away_goals > home_goals)),
            "draw_prob": float(np.mean(home_goals == away_goals)),
            "expected_home_goals": float(home_goals.mean()),
            "expected_away_goals": float(away_goals.mean()),
            "variance_home": float(home_goals.var()),
            "variance_away": float(away_goals.var()),
            "simulations": simulations,
            "claim": "EXPERIMENTAL",
        }


def predict_match(
    home_elo: float,
    away_elo: float,
    home_xg: float,
    away_xg: float,
    simulations: int = 10_000,
    seed: Optional[int] = 42,
) -> MatchPrediction:
    """
    Convenience function.
    """

    predictor = MatchPredictor(
        home_elo=home_elo,
        away_elo=away_elo,
    )

    return predictor.simulate(
        home_xg=home_xg,
        away_xg=away_xg,
        simulations=simulations,
        seed=seed,
    )

"""Elo engine extracted from the existing research notebook, kept separate from xG Poisson sim."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class SoccerEloEngine:
    k_factor: float = 32.0
    home_advantage: float = 65.0
    default_rating: float = 1500.0
    ratings: dict[str, float] = field(default_factory=dict)

    def get_rating(self, team: str) -> float:
        return self.ratings.get(team, self.default_rating)

    def expected_home(self, home_team: str, away_team: str) -> float:
        r_home = self.get_rating(home_team) + self.home_advantage
        r_away = self.get_rating(away_team)
        return 1.0 / (1.0 + 10.0 ** ((r_away - r_home) / 400.0))

    def update_ratings(self, home_team: str, away_team: str, home_score: int, away_score: int) -> None:
        r_home = self.get_rating(home_team)
        r_away = self.get_rating(away_team)
        score_home = 1.0 if home_score > away_score else 0.5 if home_score == away_score else 0.0
        expected_home = self.expected_home(home_team, away_team)
        delta = self.k_factor * (score_home - expected_home)
        self.ratings[home_team] = round(r_home + delta, 1)
        self.ratings[away_team] = round(r_away - delta, 1)

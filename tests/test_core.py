from __future__ import annotations

import unittest
from pathlib import Path

import numpy as np

from analytics.match_predictor import MatchPredictor
from core.dtw import compute_dtw_distance
from core.engine import KickAIEngine
from core.ingest import ingest_csv
from core.math_engine import (
    Parabola3D,
    angle_abc,
    bayes_update,
    distance,
    line_from_points,
    line_intersection,
    reachable_radius,
    shot_angle,
    wilson_interval,
)
from core.physics_engine import kinetic_energy, momentum, turning_radius
from core.formations import recommend_formations
from core.hover_board import apply_name_map
from core.pose_extend import extend_landmarks
from core.redteam import run_red_team
from core.world import simulated_attacking_third
from core.xg import ExpectedGoalsModel


class MathTests(unittest.TestCase):
    def test_distance(self):
        self.assertAlmostEqual(distance([0, 0], [3, 4]), 5.0)

    def test_angle(self):
        ang = angle_abc([1, 0, 0], [0, 0, 0], [0, 1, 0])
        self.assertAlmostEqual(float(ang), 90.0, places=5)

    def test_line_intersection(self):
        m1, b1 = line_from_points([0, 0], [1, 1])
        m2, b2 = line_from_points([0, 1], [1, 0])
        pt = line_intersection(m1, b1, m2, b2)
        self.assertIsNotNone(pt)
        self.assertAlmostEqual(pt[0], 0.5, places=5)

    def test_reachability_increases_with_time(self):
        self.assertGreater(reachable_radius(7.0, 1.0), reachable_radius(7.0, 0.2))

    def test_shot_angle_positive(self):
        ang = shot_angle([90, 34], [105, 30.34], [105, 37.66])
        self.assertGreater(ang, 0.0)

    def test_bayes_and_wilson(self):
        post = bayes_update(0.5, 0.8, 0.2)
        self.assertGreater(post, 0.5)
        lo, hi = wilson_interval(3, 10)
        self.assertLess(lo, hi)


class PhysicsTests(unittest.TestCase):
    def test_ke_and_turning(self):
        self.assertGreater(kinetic_energy(75, 8), kinetic_energy(75, 3))
        self.assertGreater(turning_radius(8.0), turning_radius(1.0))
        p = momentum(75, np.array([2.0, 0.0]))
        self.assertAlmostEqual(p[0], 150.0)

    def test_parabola_lands(self):
        t = Parabola3D().time_to_ground(2.0, 4.0)
        self.assertGreater(t, 0.0)


class FootballTests(unittest.TestCase):
    def test_match_poisson_sums(self):
        pred = MatchPredictor(1550, 1500).simulate(1.6, 1.2, simulations=2000, seed=1)
        total = pred.home_win_probability + pred.draw_probability + pred.away_win_probability
        self.assertAlmostEqual(total, 1.0, places=5)

    def test_shot_mc(self):
        out = MatchPredictor().simulate_shots([0.4, 0.2], [0.1], simulations=1000, seed=2)
        self.assertAlmostEqual(out["home_win_prob"] + out["draw_prob"] + out["away_win_prob"], 1.0, places=5)

    def test_xg_range(self):
        xg = ExpectedGoalsModel().compute_xg(12.0, 0.4, 0.5)
        self.assertTrue(0.0 < xg < 1.0)

    def test_tactical_options_sum(self):
        state = simulated_attacking_third(7)
        report = KickAIEngine().tactics.decide(state)
        self.assertTrue(report.options)
        for opt in report.options:
            s = sum(o.probability for o in opt.outcomes)
            self.assertAlmostEqual(s, 1.0, places=5)
        self.assertEqual(state.provenance.origin.value, "SIMULATED")
        off = [p for p in state.players if p.xy is None]
        self.assertTrue(off)

    def test_dtw(self):
        d, score = compute_dtw_distance(np.zeros((8, 2)), np.zeros((9, 2)))
        self.assertGreaterEqual(score, 0.0)
        self.assertTrue(np.isfinite(d))

    def test_ingest_example(self):
        result = ingest_csv(Path("data/events.example.csv"))
        self.assertIsNotNone(result.world)
        self.assertGreaterEqual(len(result.world.players), 2)

    def test_ingest_empty(self):
        result = ingest_csv(Path("data/events.csv"))
        self.assertIsNone(result.world)

    def test_redteam_flags_low_quality(self):
        out = run_red_team()
        self.assertTrue(out["chaotic"]["model_may_be_wrong"])

    def test_extend_landmarks_35(self):
        dummy = np.zeros((33, 4), dtype=np.float32)
        dummy[:, 3] = 1.0
        dummy[0, :2] = [0.5, 0.2]
        dummy[7, :2] = [0.4, 0.25]
        dummy[8, :2] = [0.6, 0.25]
        dummy[31, :2] = [0.4, 0.9]
        dummy[32, :2] = [0.6, 0.9]
        dummy[27, :2] = [0.4, 0.8]
        dummy[28, :2] = [0.6, 0.8]
        out = extend_landmarks(dummy)
        self.assertEqual(out.shape, (35, 4))

    def test_formations_rank(self):
        state = simulated_attacking_third(7)
        rec = recommend_formations(state, "home")
        self.assertTrue(rec["best"])
        self.assertGreaterEqual(len(rec["options"]), 4)

    def test_rename_player(self):
        state = simulated_attacking_third(7)
        pid = state.team_players("home")[0].profile.player_id
        apply_name_map(state, {pid: "Saka"})
        self.assertEqual(state.team_players("home")[0].profile.name, "Saka")


if __name__ == "__main__":
    unittest.main()

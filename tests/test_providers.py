import unittest

from analytics.providers.clubelo import _clubelo_name, _match_team, _parse_ranking_csv
from analytics.providers.xg_estimate import xg_from_elo
from analytics.providers.team_stats import lookup_matchup
from knowledge.web_search import detect_match_query


class ProviderTests(unittest.TestCase):
    def test_clubelo_name_aliases(self):
        self.assertEqual(_clubelo_name("Manchester City"), "ManCity")
        self.assertEqual(_clubelo_name("man utd"), "ManUnited")

    def test_parse_ranking_csv(self):
        csv_text = "Rank,Club,Country,Level,Elo,From,To\n1,Arsenal,ENG,1,2010.5,2024-01-01,2024-01-07\n"
        rows = _parse_ranking_csv(csv_text)
        self.assertEqual(rows[0]["team"], "Arsenal")
        self.assertAlmostEqual(rows[0]["elo"], 2010.5)

    def test_fuzzy_team_match(self):
        ranking = [{"team": "Liverpool", "elo": 2000.0, "country": "ENG", "rank": 2}]
        hit = _match_team("liverpool fc", ranking)
        self.assertIsNotNone(hit)
        self.assertEqual(hit["team"], "Liverpool")

    def test_xg_from_elo_sums_reasonable(self):
        est = xg_from_elo(1900, 1700)
        self.assertGreater(est.home_xg, est.away_xg)
        self.assertAlmostEqual(est.home_xg + est.away_xg, 2.65, delta=0.8)
        self.assertEqual(est.origin, "ESTIMATED")

    def test_lookup_matchup_structure(self):
        m = lookup_matchup("Arsenal", "Liverpool")
        self.assertGreater(m.home_xg, 0)
        self.assertGreater(m.away_xg, 0)
        self.assertIn(m.xg_origin, ("ESTIMATED", "OBSERVED"))

    def test_match_query_detection(self):
        teams = detect_match_query("Arsenal vs Liverpool prediction")
        self.assertIsNotNone(teams)
        self.assertIn("Arsenal", teams[0])
        self.assertIn("Liverpool", teams[1])


if __name__ == "__main__":
    unittest.main()

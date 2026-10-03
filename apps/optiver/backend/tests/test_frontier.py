"""The reliability sweep must expose failed searches and held-out failures."""

import unittest
from unittest.mock import patch

from optiver.frontier import LEVELS, analyse_frontier, markdown
from optiver.model import Credit


class FrontierTests(unittest.TestCase):
    def test_missing_candidates_have_no_cost_or_false_pass(self):
        with patch("optiver.frontier.build", return_value=(None, 6)):
            result = analyse_frontier([], 1234, 5000, 100, 100, 42, [0, 0.6])
        self.assertEqual(
            [p["required_reliability"] for p in result["points"]], list(LEVELS)
        )
        self.assertTrue(all(p["cost_usd"] is None for p in result["points"]))
        self.assertTrue(all(not p["validated"] for p in result["points"]))
        self.assertIn("1,234", markdown(result))
        self.assertIn("$5,000.00", markdown(result))

    def test_training_candidate_can_fail_fresh_evaluation(self):
        credit = Credit("test", "Test", 1, 10000, 0.1, 1, "UK", "Dev", "VCS", "Wind")
        with (
            patch("optiver.frontier.build", return_value=([(credit, 100)], 6)),
            patch("optiver.frontier.simulate", return_value=[100] * 80 + [0] * 20),
        ):
            result = analyse_frontier([credit], 100, 1000, 100, 100, 42, [0])
        self.assertTrue(all(p["cost_usd"] == 100 for p in result["points"]))
        self.assertTrue(all(not p["validated"] for p in result["points"]))
        self.assertEqual(result["points"][0]["status"], "Held-out requirement missed")


if __name__ == "__main__":
    unittest.main()

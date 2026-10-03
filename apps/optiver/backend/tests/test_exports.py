"""Export scores stay bounded and comparison rows reconcile to held-out results."""

import csv
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from optiver.exports import holding_records, weighted_quality, write_comparison
from optiver.frontier import analyse_frontier
from optiver.model import Credit


class ExportTests(unittest.TestCase):
    def credit(self, year: float | None) -> Credit:
        return Credit(
            "id",
            "Test",
            2,
            1000,
            0.1,
            1,
            "UK",
            "D",
            "VCS",
            "Wind",
            year,
            " Removal ",
            " Completed ",
        )

    def test_quality_score_is_bounded_and_handles_missing_vintage(self):
        self.assertAlmostEqual(self.credit(1990).quality_score, 0.7)
        self.assertAlmostEqual(self.credit(2050).quality_score, 1)
        self.assertAlmostEqual(self.credit(None).quality_score, 0.7)
        rows = holding_records([(self.credit(2025), 100)])
        self.assertEqual(rows[0]["quality_score"], 1)
        self.assertEqual(rows[0]["cost_usd"], 200)
        self.assertAlmostEqual(
            weighted_quality([(self.credit(2025), 1), (self.credit(1990), 3)]), 0.775
        )

    def test_comparison_emits_one_row_per_model(self):
        report = {
            "Demo": {
                "cost_usd": 200,
                "projects": 1,
                "nominal_tonnes": 100,
                "expected_tonnes": 90,
                "within_budget": True,
                "meets_modelled_requirement": False,
                "tonnes_weighted_quality_score": 0.7,
                "evaluations": {
                    "0": {"success_rate": 0.9, "ci_low": 0.8},
                    "0.6": {"success_rate": 0.85, "ci_low": 0.75},
                },
            }
        }
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "comparison.csv"
            write_comparison(path, report, 0.95)
            with path.open(newline="") as handle:
                rows = list(csv.DictReader(handle))
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[1]["shared_latent_variance"], "0.6")
        self.assertEqual(float(rows[1]["success_rate"]), 0.85)
        self.assertEqual(rows[1]["meets_modelled_requirement"], "False")
        self.assertEqual(float(rows[1]["required_reliability"]), 0.95)

    def test_batch_respects_requested_levels_and_marks_failed_searches(self):
        with patch("optiver.frontier.build", return_value=(None, 6)) as search:
            result = analyse_frontier(
                [], 100, 1000, 100, 100, 42, [0], levels=[0.81, 0.91, 0.98]
            )
        self.assertEqual(search.call_count, 3)
        self.assertEqual(
            [p["required_reliability"] for p in result["points"]], [0.81, 0.91, 0.98]
        )
        self.assertTrue(all(p["cost_usd"] is None for p in result["points"]))


if __name__ == "__main__":
    unittest.main()

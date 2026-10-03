import csv
import tempfile
import unittest
from pathlib import Path

from optiver.model import Credit, baseline, load_credits, metrics, simulate, validate
from optiver.search import build


def credit(identifier: str = "a", probability: float = 0.2, loss: float = 1) -> Credit:
    return Credit(
        identifier,
        identifier,
        2,
        10000,
        probability,
        loss,
        "country",
        "developer",
        "registry",
        "type",
    )


class ModelTests(unittest.TestCase):
    def test_probability_and_buffer_marginals_survive_correlation(self):
        for rho in (0, 0.6, 1):
            outcomes = simulate([(credit(loss=0.5), 100)], 12000, 19, rho)
            self.assertEqual(set(outcomes), {50, 100})
            rate = sum(x == 50 for x in outcomes) / len(outcomes)
            self.assertAlmostEqual(rate, 0.2, delta=0.015)

    def test_same_groups_at_full_correlation_fail_together(self):
        outcomes = simulate([(credit("a"), 50), (credit("b"), 50)], 1000, 4, 1)
        self.assertEqual(set(outcomes), {0, 100})

    def test_simulation_reproducible(self):
        p = [(credit(), 100.0)]
        self.assertEqual(simulate(p, 100, 5, 0.3), simulate(p, 100, 5, 0.3))
        self.assertNotEqual(simulate(p, 100, 5, 0.3), simulate(p, 100, 6, 0.3))

    def test_capacity_budget_and_duplicate_guard(self):
        for p, budget in [
            ([(credit(), 10001.0)], 100000),
            ([(credit(), 10.0)], 1),
            ([(credit(), 10.0), (credit(), 10.0)], 1000),
        ]:
            with self.assertRaises(ValueError):
                validate(p, budget)

    def test_expected_baseline_and_shortfall(self):
        p = baseline([credit()], 80, True)
        self.assertAlmostEqual(p[0][1], 100)
        result = metrics([0, 100], 80)
        self.assertEqual(result["success_rate"], 0.5)
        self.assertEqual(result["mean_shortfall"], 40)

    def test_no_candidate_does_not_invent_feasibility(self):
        result, _ = build([credit()], 100, 1, 0.95, 100, 1, [0])
        self.assertIsNone(result)

    def test_loader_rules_and_unknown_rating(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "test.csv"
            headers = [
                "credit_id",
                "project_name",
                "price_usd_per_t",
                "available_tonnes",
                "risk_rating",
                "has_buffer_pool",
                "had_reversal",
                "country",
                "developer",
                "registry",
                "project_type",
            ]

            def write(rating):
                with path.open("w", newline="") as handle:
                    writer = csv.writer(handle)
                    writer.writerow(headers)
                    writer.writerow(
                        ["a", "a", 2, 100, rating, "Yes", "Yes", "c", "d", "r", "t"]
                    )

            write("")
            result = load_credits(path)[0]
            self.assertAlmostEqual(result.probability, 0.225)
            self.assertEqual(result.loss, 0.5)
            write("UNKNOWN")
            with self.assertRaises(ValueError):
                load_credits(path)


if __name__ == "__main__":
    unittest.main()

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from optiver.audit import audit


class ExportAuditTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.workspace = tempfile.TemporaryDirectory()
        cls.addClassCleanup(cls.workspace.cleanup)
        cls.directory = Path(cls.workspace.name) / "run"
        subprocess.run(
            [sys.executable, "-m", "optiver", "--output", str(cls.directory)],
            check=True,
            capture_output=True,
            text=True,
        )
        cls.source = Path(__file__).resolve().parents[1] / "data" / "credits.csv"
        cls.report_path = cls.directory / "report.json"
        cls.holdings_path = cls.directory / "portfolio.csv"
        cls.original = cls.report_path.read_text()
        cls.holdings = cls.holdings_path.read_text()

    def setUp(self):
        self.report = json.loads(self.original)
        self.report_path.write_text(self.original)
        self.holdings_path.write_text(self.holdings)

    def check_report(self):
        self.report_path.write_text(json.dumps(self.report))
        return audit(self.report_path, self.holdings_path, self.source)

    def test_real_cli_export_reconciles(self):
        self.assertTrue(
            any("holdings reconcile" in line for line in self.check_report())
        )

    def test_mixed_dataset_is_rejected(self):
        self.report["data_sha256"] = "another dataset"
        with self.assertRaisesRegex(ValueError, "checksum"):
            self.check_report()

    def test_wrong_cost_is_rejected(self):
        self.report["portfolios"]["Diversified candidate"]["cost_usd"] += 100
        with self.assertRaisesRegex(ValueError, "candidate cost"):
            self.check_report()

    def test_false_pass_is_rejected(self):
        self.report["portfolios"]["Cheapest nominal"]["meets_modelled_requirement"] = (
            True
        )
        with self.assertRaisesRegex(ValueError, "reliability flag"):
            self.check_report()

    def test_missing_scenario_is_rejected(self):
        del self.report["portfolios"]["Diversified candidate"]["evaluations"]["0.6"]
        with self.assertRaisesRegex(ValueError, "scenarios"):
            self.check_report()

    def test_mixed_holdings_are_rejected(self):
        self.holdings_path.write_text(self.holdings.replace("VCS", "WRONG", 1))
        with self.assertRaises((ValueError, KeyError)):
            self.check_report()

    def test_no_candidate_cannot_keep_stale_holdings(self):
        del self.report["portfolios"]["Diversified candidate"]
        self.report["status"] = "NO VALIDATED CANDIDATE"
        with self.assertRaisesRegex(ValueError, "Holdings file exists"):
            self.check_report()
        self.holdings_path.unlink()
        self.assertIn("No-candidate report is consistent", self.check_report())


if __name__ == "__main__":
    unittest.main()

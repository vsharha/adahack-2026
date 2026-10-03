"""Check a saved demo's JSON/CSV contract without changing either file."""

import argparse
import csv
import hashlib
import json
import math
import sys
from pathlib import Path

from optiver.exports import holding_records, weighted_quality
from optiver.model import GROUPS, Portfolio, cost, exposures, load_credits, validate


def number(value: object, label: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (float, int)):
        raise ValueError(f"{label}: expected a number")
    if not math.isfinite(value):
        raise ValueError(f"{label}: must be finite")
    return float(value)


def close(actual: object, expected: float, label: str, tolerance: float = 1e-6):
    if not math.isclose(
        number(actual, label), expected, abs_tol=tolerance, rel_tol=1e-9
    ):
        raise ValueError(f"{label}: does not reconcile with source/holdings")


def audit(report_path: Path, holdings_path: Path, source_path: Path) -> list[str]:
    report = json.loads(report_path.read_text())
    checksum = hashlib.sha256(source_path.read_bytes()).hexdigest()
    if report["data_sha256"] != checksum:
        raise ValueError("Dataset checksum mismatch: report uses a different snapshot")
    target = number(report["target"], "target")
    budget = number(report["budget"], "budget")
    reliability = number(report["reliability"], "reliability")
    if target <= 0 or not 0 < budget <= 1_000_000 or not 0.5 <= reliability < 1:
        raise ValueError("Invalid target, budget or reliability")
    correlations = [
        number(rho, "correlation") for rho in report["shared_latent_variances"]
    ]
    if not correlations or any(not 0 <= rho <= 1 for rho in correlations):
        raise ValueError("Invalid or missing scenario settings")
    portfolios = report["portfolios"]
    if not portfolios:
        raise ValueError("No portfolios in report")
    for name, summary in portfolios.items():
        evaluations = summary["evaluations"]
        if len(evaluations) != len(correlations) or {
            float(key) for key in evaluations
        } != set(correlations):
            raise ValueError(f"{name}: missing or mismatched scenarios")
        nominal = number(summary["nominal_tonnes"], "nominal tonnes")
        spending = number(summary["cost_usd"], "cost")
        if nominal <= 0 or spending <= 0:
            raise ValueError(f"{name}: nonpositive quantity or cost")
        passes = spending <= budget
        if summary["within_budget"] is not passes:
            raise ValueError(f"{name}: incorrect budget flag")
        for result in evaluations.values():
            rate = number(result["success_rate"], "success rate")
            low = number(result["ci_low"], "interval lower bound")
            high = number(result["ci_high"], "interval upper bound")
            if not 0 <= low <= rate <= high <= 1:
                raise ValueError(f"{name}: invalid confidence interval")
            passes = passes and low >= reliability
            for field, maximum in (
                ("mean_tonnes", nominal),
                ("p05_tonnes", nominal),
                ("mean_shortfall", target),
            ):
                if not -1e-7 <= number(result[field], field) <= maximum + 1e-7:
                    raise ValueError(f"{name}: invalid {field}")
        if summary["meets_modelled_requirement"] is not passes:
            raise ValueError(f"{name}: reliability flag contradicts evaluation")
        for group in GROUPS:
            shares = summary["exposures_by_tonnes"][group]
            values = [number(value, "exposure") for value in shares.values()]
            if not values or any(not 0 <= value <= 1 for value in values):
                raise ValueError(f"{name}: invalid {group} shares")
            close(sum(values), 1, f"{name}: {group} shares")
    candidate = portfolios.get("Diversified candidate")
    passed = candidate is not None and candidate["meets_modelled_requirement"]
    expected_status = "PASS under tested models" if passed else "NO VALIDATED CANDIDATE"
    if report["status"] != expected_status:
        raise ValueError("Headline status contradicts candidate evaluation")
    if candidate is None:
        if holdings_path.exists():
            raise ValueError("Holdings file exists but report has no candidate")
        return ["Dataset checksum matches", "No-candidate report is consistent"]
    credits = {credit.credit_id: credit for credit in load_credits(source_path)}
    holdings: Portfolio = []
    with holdings_path.open(newline="") as handle:
        for row in csv.DictReader(handle):
            credit = credits[row["credit_id"]]
            quantity = float(row["tonnes"])
            holdings.append((credit, quantity))
            close(float(row["price_usd_per_t"]), credit.price, "holding price")
            close(
                float(row["cost_usd"]), credit.price * quantity, "holding cost", 0.011
            )
            close(float(row["failure_probability"]), credit.probability, "failure risk")
            close(float(row["loss_fraction"]), credit.loss, "recovery")
            if "quality_score" in row:
                close(
                    float(row["quality_score"]), credit.quality_score, "quality score"
                )
            if row["project_name"] != credit.name or any(
                row[group] != getattr(credit, group) for group in GROUPS
            ):
                raise ValueError(f"{credit.credit_id}: metadata differs from source")
    validate(holdings, budget)
    if "tonnes_weighted_quality_score" in candidate:
        close(
            candidate["tonnes_weighted_quality_score"],
            weighted_quality(holdings),
            "weighted quality score",
        )
    if "holdings" in candidate:
        if candidate["holdings"] != holding_records(holdings):
            raise ValueError("JSON holdings do not reconcile with CSV and source")
    close(candidate["projects"], len(holdings), "project count")
    close(candidate["cost_usd"], cost(holdings), "candidate cost")
    close(candidate["nominal_tonnes"], sum(q for _, q in holdings), "nominal tonnes")
    close(
        candidate["expected_tonnes"],
        sum(c.retained * q for c, q in holdings),
        "expected tonnes",
    )
    for group, shares in exposures(holdings).items():
        actual = candidate["exposures_by_tonnes"][group]
        if set(actual) != set(shares):
            raise ValueError(f"Candidate {group} labels differ from holdings")
        for label, share in shares.items():
            close(actual[label], share, f"{group}: {label}")
    return [
        "Dataset checksum matches",
        f"{len(holdings)} holdings reconcile with source",
        "Costs, quantities, recovery, exposures and status flags agree",
        "Audit checks consistency, not simulation correctness or real-world delivery",
    ]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "directory", type=Path, help="Contains report.json and portfolio.csv"
    )
    parser.add_argument(
        "--data",
        type=Path,
        default=Path(__file__).resolve().parents[2] / "data" / "credits.csv",
    )
    args = parser.parse_args()
    try:
        messages = audit(
            args.directory / "report.json", args.directory / "portfolio.csv", args.data
        )
    except (ValueError, KeyError, TypeError, AttributeError, OSError) as exc:
        print(f"AUDIT FAILED: {exc}", file=sys.stderr)
        return 1
    print("AUDIT PASSED\n" + "\n".join(messages))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

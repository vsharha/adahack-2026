"""Run with uv run python -m optiver."""

import argparse
import csv
import hashlib
import json
import math
import sys
from pathlib import Path

from optiver.model import (
    Portfolio,
    baseline,
    cost,
    exposures,
    load_credits,
    metrics,
    simulate,
    validate,
)
from optiver.search import build


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Build and stress-test a carbon portfolio"
    )
    parser.add_argument(
        "--data",
        type=Path,
        default=Path(__file__).resolve().parents[2] / "data" / "credits.csv",
    )
    parser.add_argument("--target", type=float, default=100_000)
    parser.add_argument("--budget", type=float, default=1_000_000)
    parser.add_argument("--reliability", type=float, default=0.95)
    parser.add_argument("--training-scenarios", type=int, default=2000)
    parser.add_argument("--scenarios", type=int, default=10_000)
    parser.add_argument("--seed", type=int, default=20261003)
    parser.add_argument("--correlations", type=float, nargs="+", default=[0, 0.3, 0.6])
    parser.add_argument(
        "--output",
        type=Path,
        help="New output directory for report.md, report.json and portfolio.csv",
    )
    args = parser.parse_args()
    if (
        not math.isfinite(args.target)
        or args.target <= 0
        or not math.isfinite(args.budget)
        or not 0 < args.budget <= 1_000_000
        or not 0.5 <= args.reliability < 1
        or min(args.scenarios, args.training_scenarios) < 100
        or any(not math.isfinite(r) or not 0 <= r <= 1 for r in args.correlations)
    ):
        parser.error(
            "Require positive target, budget <= $1m, reliability in [0.5,1), "
            "at least 100 scenarios and correlations in [0,1]"
        )
    if args.output and args.output.exists():
        parser.error("Output directory already exists; choose a new path")
    try:
        credits = load_credits(args.data)
        nominal = baseline(credits, args.target, False)
        expected = baseline(credits, args.target, True)
        print(
            f"Loaded {len(credits):,} projects. Searching candidates...",
            file=sys.stderr,
        )
        selected, attempted = build(
            credits,
            args.target,
            args.budget,
            args.reliability,
            args.training_scenarios,
            args.seed,
            args.correlations,
        )
        portfolios = {"Cheapest nominal": nominal, "Cheapest expected": expected}
        if selected:
            validate(selected, args.budget)
            portfolios["Diversified candidate"] = selected
        reports: dict[str, dict] = {}
        for name, portfolio in portfolios.items():
            print(f"Evaluating {name}...", file=sys.stderr)
            evaluations = {
                str(rho): metrics(
                    simulate(portfolio, args.scenarios, args.seed + 1, rho), args.target
                )
                for rho in args.correlations
            }
            reports[name] = {
                "cost_usd": cost(portfolio),
                "within_budget": cost(portfolio) <= args.budget,
                "nominal_tonnes": sum(q for _, q in portfolio),
                "expected_tonnes": sum(q * c.retained for c, q in portfolio),
                "projects": len(portfolio),
                "evaluations": evaluations,
                "exposures_by_tonnes": exposures(portfolio),
                "meets_modelled_requirement": cost(portfolio) <= args.budget
                and all(
                    result["ci_low"] >= args.reliability
                    for result in evaluations.values()
                ),
            }
        success = bool(
            selected and reports["Diversified candidate"]["meets_modelled_requirement"]
        )
        state = "PASS under tested models" if success else "NO VALIDATED CANDIDATE"
        lines = [
            "# Carbon portfolio report",
            "",
            state,
            "",
            f"Target: {args.target:,.0f} tCO2e. Budget: ${args.budget:,.2f}. "
            f"Required modelled reliability: {args.reliability:.1%}.",
            "",
            "Synthetic prices and ratings. Correlation strengths are assumptions, "
            "not organiser-supplied estimates. No real-world delivery guarantee.",
            "",
            "| Portfolio | Cost | Projects | Nominal tonnes | Within budget |",
            "| --- | ---: | ---: | ---: | --- |",
        ]
        for name, report in reports.items():
            lines.append(
                f"| {name} | ${report['cost_usd']:,.2f} | {report['projects']} | "
                f"{report['nominal_tonnes']:,.0f} | {report['within_budget']} |"
            )
        lines += [
            "",
            "| Portfolio | Shared variance | Target hit rate | 95% interval | "
            "5th percentile tonnes | Mean shortfall |",
            "| --- | ---: | ---: | --- | ---: | ---: |",
        ]
        for name, report in reports.items():
            for rho, result in report["evaluations"].items():
                lines.append(
                    f"| {name} | {rho} | {result['success_rate']:.2%} | "
                    f"{result['ci_low']:.2%}–{result['ci_high']:.2%} | "
                    f"{result['p05_tonnes']:,.0f} | {result['mean_shortfall']:,.0f} |"
                )
        lines += [
            "",
            "Pass requires the lower end of each individual 95% Wilson interval "
            "to reach the requested reliability, plus capacity and budget checks. "
            "Intervals are not a simultaneous confidence guarantee across models.",
            "",
            f"Search: {attempted} feasible allocation templates, "
            f"{args.training_scenarios:,} training scenarios per model; "
            f"{args.scenarios:,} fresh evaluation scenarios per model. "
            f"Training seed {args.seed}; evaluation seed {args.seed + 1}.",
            "",
            "This is a bounded heuristic, not a global cost optimum. A failed search "
            "does not prove that no feasible portfolio exists.",
        ]
        if selected:
            lines += ["", "## Largest exposures by purchased tonnes", ""]
            for group, values in exposures(selected).items():
                label, share = next(iter(values.items()))
                lines.append(f"- {group}: {label} ({share:.1%})")
        report_text = "\n".join(lines) + "\n"
        print(report_text)
        if args.output:
            args.output.mkdir(parents=True)
            (args.output / "report.md").write_text(report_text)
            (args.output / "report.json").write_text(
                json.dumps(
                    {
                        "status": state,
                        "target": args.target,
                        "budget": args.budget,
                        "reliability": args.reliability,
                        "seed": args.seed,
                        "training_scenarios": args.training_scenarios,
                        "evaluation_scenarios": args.scenarios,
                        "shared_latent_variances": args.correlations,
                        "data_sha256": hashlib.sha256(
                            args.data.read_bytes()
                        ).hexdigest(),
                        "portfolios": reports,
                    },
                    indent=2,
                )
                + "\n"
            )
            if selected:
                write_portfolio(args.output / "portfolio.csv", selected)
        return 0 if success else 2
    except (ValueError, OSError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 2


def write_portfolio(path: Path, portfolio: Portfolio) -> None:
    with path.open("w", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(
            [
                "credit_id",
                "project_name",
                "tonnes",
                "price_usd_per_t",
                "cost_usd",
                "failure_probability",
                "loss_fraction",
                "country",
                "developer",
                "registry",
                "project_type",
            ]
        )
        for c, q in portfolio:
            writer.writerow(
                [
                    c.credit_id,
                    c.name,
                    q,
                    c.price,
                    round(q * c.price, 2),
                    c.probability,
                    c.loss,
                    c.country,
                    c.developer,
                    c.registry,
                    c.project_type,
                ]
            )


if __name__ == "__main__":
    raise SystemExit(main())

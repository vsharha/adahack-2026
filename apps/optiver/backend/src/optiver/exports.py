"""Small, auditable output contracts for holdings and comparison tables."""

import csv
from pathlib import Path

from optiver.model import Portfolio

QUALITY_METHOD = (
    "Metadata heuristic in [0,1]: vintage recency 30%, removal/reduction 40%, "
    "completed/registered status 30%. Missing signals contribute zero. "
    "Not a certified quality rating or a failure probability; not used by the search."
)


def holding_records(portfolio: Portfolio) -> list[dict]:
    return [
        {
            "credit_id": c.credit_id,
            "project_name": c.name,
            "tonnes": q,
            "price_usd_per_t": c.price,
            "cost_usd": round(q * c.price, 2),
            "failure_probability": c.probability,
            "loss_fraction": c.loss,
            "country": c.country,
            "developer": c.developer,
            "registry": c.registry,
            "project_type": c.project_type,
            "quality_score": round(c.quality_score, 6),
            "vintage_year": c.vintage_year,
            "reduction_or_removal": c.reduction_or_removal,
            "status": c.status,
        }
        for c, q in portfolio
    ]


def weighted_quality(portfolio: Portfolio) -> float:
    total = sum(q for _, q in portfolio)
    return sum(q * c.quality_score for c, q in portfolio) / total if total else 0


def write_holdings(path: Path, portfolio: Portfolio) -> None:
    records = holding_records(portfolio)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(records[0]))
        writer.writeheader()
        writer.writerows(records)


def write_comparison(path: Path, reports: dict[str, dict], reliability: float) -> None:
    fields = [
        "portfolio",
        "cost_usd",
        "projects",
        "nominal_tonnes",
        "expected_tonnes",
        "required_reliability",
        "shared_latent_variance",
        "success_rate",
        "ci_low",
        "ci_high",
        "p05_tonnes",
        "mean_shortfall",
        "within_budget",
        "meets_modelled_requirement",
        "tonnes_weighted_quality_score",
    ]
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for name, report in reports.items():
            for rho, result in report["evaluations"].items():
                writer.writerow(
                    {
                        "portfolio": name,
                        **{key: report[key] for key in fields if key in report},
                        "required_reliability": reliability,
                        "shared_latent_variance": rho,
                        **{key: result[key] for key in fields if key in result},
                    }
                )

"""Held-out evaluation of a cost/reliability sweep over the bounded search."""

from optiver.model import Credit, cost, metrics, simulate, validate
from optiver.search import build

LEVELS = (0.80, 0.85, 0.90, 0.95, 0.99)


def analyse_frontier(
    credits: list[Credit],
    target: float,
    budget: float,
    training_scenarios: int,
    evaluation_scenarios: int,
    seed: int,
    correlations: list[float],
) -> dict:
    points = []
    for reliability in LEVELS:
        portfolio, attempted = build(
            credits, target, budget, reliability, training_scenarios, seed, correlations
        )
        point = {
            "required_reliability": reliability,
            "cost_usd": None,
            "projects": 0,
            "nominal_tonnes": None,
            "evaluations": {},
            "validated": False,
            "status": "No candidate found",
            "templates_searched": attempted,
        }
        if portfolio:
            validate(portfolio, budget)
            evaluations = {
                str(rho): metrics(
                    simulate(portfolio, evaluation_scenarios, seed + 1, rho), target
                )
                for rho in correlations
            }
            passed = all(r["ci_low"] >= reliability for r in evaluations.values())
            point.update(
                cost_usd=cost(portfolio),
                projects=len(portfolio),
                nominal_tonnes=sum(q for _, q in portfolio),
                evaluations=evaluations,
                validated=passed,
                status="Validated" if passed else "Held-out requirement missed",
            )
        points.append(point)
    return {
        "target": target,
        "budget": budget,
        "training_scenarios": training_scenarios,
        "evaluation_scenarios": evaluation_scenarios,
        "seed": seed,
        "shared_latent_variances": correlations,
        "method": "Bounded heuristic cost curve; not a globally optimal frontier",
        "points": points,
    }


def markdown(frontier: dict) -> str:
    lines = [
        "# Cost versus reliability",
        "",
        f"Target: {frontier['target']:,.0f} tCO2e. Budget: ${frontier['budget']:,.2f}.",
        "",
        frontier["method"] + ".",
        "Fresh evaluation scenarios; validation requires every model's "
        "95% Wilson lower bound to reach the requested reliability.",
        "",
        "| Required reliability | Cost | Projects | Worst hit rate | "
        "Lowest confidence bound | Result |",
        "| ---: | ---: | ---: | ---: | ---: | --- |",
    ]
    for point in frontier["points"]:
        price = "—" if point["cost_usd"] is None else f"${point['cost_usd']:,.2f}"
        evaluations = list(point["evaluations"].values())
        hit = (
            f"{min(r['success_rate'] for r in evaluations):.2%}" if evaluations else "—"
        )
        low = f"{min(r['ci_low'] for r in evaluations):.2%}" if evaluations else "—"
        lines.append(
            f"| {point['required_reliability']:.0%} | {price} | "
            f"{point['projects']} | {hit} | {low} | {point['status']} |"
        )
    return "\n".join(lines) + "\n"

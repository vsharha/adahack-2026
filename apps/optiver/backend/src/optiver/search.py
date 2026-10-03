"""Bounded candidate search; does not claim a global optimum."""

import math
from collections import defaultdict

from optiver.model import GROUPS, Credit, Portfolio, cost, exposures, simulate


def concentration_warnings(portfolio: Portfolio, threshold: float = 0.4) -> list[str]:
    """Flag concentration risks exceeding threshold (default 40%)."""
    warnings_list = []
    exp = exposures(portfolio)
    for group_name, values in exp.items():
        for label, share in values.items():
            if share > threshold:
                warnings_list.append(
                    f"High concentration: {label} ({group_name}) at "
                    f"{share:.1%} > {threshold:.0%}"
                )
    return warnings_list


def candidate(
    credits: list[Credit],
    target: float,
    project_cap: float,
    group_cap: float,
    reserve: float,
    risk_power: float,
) -> Portfolio:
    ordered = sorted(
        credits, key=lambda c: (c.price / c.retained**risk_power, c.credit_id)
    )
    allocated: dict[tuple[str, str], float] = defaultdict(float)
    remaining = target
    result: Portfolio = []
    for credit in ordered:
        caps = [remaining, target * project_cap, credit.available / reserve]
        for name in GROUPS:
            cap = max(group_cap, 0.6) if name == "registry" else group_cap
            caps.append(target * cap - allocated[(name, getattr(credit, name))])
        quantity = min(caps)
        if quantity <= 1e-8:
            continue
        result.append((credit, quantity))
        for name in GROUPS:
            allocated[(name, getattr(credit, name))] += quantity
        remaining -= quantity
        if remaining <= 1e-7:
            return result
    return []


def build(
    credits: list[Credit],
    target: float,
    budget: float,
    reliability: float,
    training_count: int,
    seed: int,
    correlations: list[float],
) -> tuple[Portfolio | None, int]:
    best: Portfolio | None = None
    attempted = 0
    # Reserve supply for subsequent scaling to the target's lower-tail delivery.
    for project_cap, group_cap in ((0.05, 0.25), (0.1, 0.35), (0.2, 0.5)):
        for risk_power in (1.0, 3.0):
            portfolio = candidate(
                credits, target, project_cap, group_cap, 3, risk_power
            )
            if not portfolio:
                continue
            attempted += 1
            scale = 1.0
            training_goal = min(0.999, reliability + 0.015)
            for rho in correlations:
                outcomes = sorted(simulate(portfolio, training_count, seed, rho))
                tail_index = max(0, int((1 - training_goal) * training_count) - 1)
                tail = outcomes[tail_index]
                if tail <= 0:
                    scale = math.inf
                    break
                scale = max(scale, target / tail)
            if not math.isfinite(scale):
                continue
            scaled = [(c, float(math.ceil(q * scale))) for c, q in portfolio]
            if any(q > c.available for c, q in scaled) or cost(scaled) > budget:
                continue
            if best is None or cost(scaled) < cost(best):
                best = scaled
    return best, attempted

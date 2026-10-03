"""Challenge data and reproducible portfolio evaluation."""

import csv
import math
import random
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from statistics import NormalDist

RATINGS = {
    "AAA": 0.01,
    "AA": 0.02,
    "A": 0.04,
    "BBB": 0.07,
    "BB": 0.12,
    "B": 0.20,
    "CCC": 0.35,
    "": 0.15,
}
GROUPS = ("country", "developer", "registry", "project_type")


@dataclass(frozen=True)
class Credit:
    credit_id: str
    name: str
    price: float
    available: float
    probability: float
    loss: float
    country: str
    developer: str
    registry: str
    project_type: str
    vintage_year: float | None = None
    reduction_or_removal: str = ""
    status: str = ""

    @property
    def retained(self) -> float:
        return 1 - self.probability * self.loss

    @property
    def quality_score(self) -> float:
        """Higher is better: vintage recency, removal preference, completed status."""
        score = 0.0
        # Vintage recency (newer projects potentially more durable)
        if self.vintage_year and self.vintage_year > 0:
            vintage_score = min(1.0, (self.vintage_year - 2000) / 25)
            score += vintage_score * 0.3
        # Removal projects may have higher permanence
        if self.reduction_or_removal.lower() == "removal":
            score += 0.4
        elif self.reduction_or_removal.lower() == "reduction":
            score += 0.2
        # Completed status indicates operational track record
        if self.status.lower() == "completed":
            score += 0.3
        elif self.status.lower() == "registered":
            score += 0.15
        return score


def load_credits(path: Path) -> list[Credit]:
    credits: list[Credit] = []
    seen: set[str] = set()
    required = {
        "credit_id",
        "project_name",
        "price_usd_per_t",
        "available_tonnes",
        "risk_rating",
        "has_buffer_pool",
        "had_reversal",
        *GROUPS,
    }
    with path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        if not required.issubset(reader.fieldnames or []):
            raise ValueError("CSV is missing required challenge columns")
        for line, row in enumerate(reader, 2):
            try:
                identifier = row["credit_id"]
                if not identifier or identifier in seen:
                    raise ValueError("empty or duplicate credit_id")
                price = float(row["price_usd_per_t"])
                available = float(row["available_tonnes"])
                if not all(math.isfinite(x) and x > 0 for x in (price, available)):
                    raise ValueError(
                        "price and availability must be positive finite numbers"
                    )
                if any(not row[key] for key in GROUPS):
                    raise ValueError("missing exposure group")
                if any(
                    row[key] not in {"Yes", "No"}
                    for key in ("has_buffer_pool", "had_reversal")
                ):
                    raise ValueError("buffer and reversal flags must be Yes or No")
                probability = RATINGS[row["risk_rating"]]
                probability = min(
                    1, probability * (1.5 if row["had_reversal"] == "Yes" else 1)
                )
                # Parse optional quality signals
                vintage = row.get("vintage_year", "")
                vintage_year = float(vintage) if vintage else None
                reduction_or_removal = row.get("reduction_or_removal", "")
                status = row.get("status", "")
                credits.append(
                    Credit(
                        identifier,
                        row["project_name"],
                        price,
                        available,
                        probability,
                        0.5 if row["has_buffer_pool"] == "Yes" else 1,
                        row["country"],
                        row["developer"],
                        row["registry"],
                        row["project_type"],
                        vintage_year,
                        reduction_or_removal,
                        status,
                    )
                )
                seen.add(identifier)
            except (ValueError, KeyError, TypeError) as exc:
                raise ValueError(f"Invalid CSV row {line}: {exc}") from exc
    if not credits:
        raise ValueError("CSV contains no projects")
    return credits


Portfolio = list[tuple[Credit, float]]


def cost(portfolio: Portfolio) -> float:
    return math.fsum(c.price * q for c, q in portfolio)


def validate(portfolio: Portfolio, budget: float) -> None:
    ids: set[str] = set()
    if not portfolio:
        raise ValueError("empty portfolio")
    for credit, quantity in portfolio:
        if credit.credit_id in ids:
            raise ValueError("duplicate holding")
        ids.add(credit.credit_id)
        if (
            not math.isfinite(quantity)
            or quantity <= 0
            or quantity > credit.available + 1e-8
        ):
            raise ValueError("holding exceeds capacity or has invalid quantity")
    if cost(portfolio) > budget + 1e-6:
        raise ValueError("portfolio exceeds budget")


def baseline(credits: list[Credit], target: float, expected: bool) -> Portfolio:
    ordered = sorted(
        credits,
        key=lambda c: (
            c.price / (c.retained if expected else 1),
            c.probability,
            c.credit_id,
        ),
    )
    result: Portfolio = []
    remaining = target
    for credit in ordered:
        factor = credit.retained if expected else 1
        quantity = min(credit.available, remaining / factor)
        result.append((credit, quantity))
        remaining -= quantity * factor
        if remaining <= 1e-7:
            return result
    raise ValueError("Insufficient total supply for baseline target")


def simulate(portfolio: Portfolio, count: int, seed: int, rho: float) -> list[float]:
    """Gaussian group factors preserve marginal probabilities at every rho.

    rho is total shared latent variance, not a binary failure correlation.
    Sorted group labels make common shocks repeatable across portfolios.
    """
    if not 0 <= rho <= 1 or count < 1:
        raise ValueError("Invalid simulation parameters")
    thresholds = [NormalDist().inv_cdf(c.probability) for c, _ in portfolio]
    group_keys = sorted(
        {(name, getattr(c, name)) for c, _ in portfolio for name in GROUPS}
    )
    # Keyed streams keep each group's shocks identical across candidate portfolios.
    streams = {key: random.Random(f"{seed}:{key!r}") for key in group_keys}
    individual = [random.Random(f"{seed}:project:{c.credit_id}") for c, _ in portfolio]
    shared_weight = math.sqrt(rho / len(GROUPS))
    private_weight = math.sqrt(1 - rho)
    total = math.fsum(q for _, q in portfolio)
    outcomes: list[float] = []
    for _ in range(count):
        factors = {key: stream.gauss(0, 1) for key, stream in streams.items()}
        losses = 0.0
        for i, (credit, quantity) in enumerate(portfolio):
            latent = private_weight * individual[i].gauss(0, 1)
            latent += shared_weight * sum(
                factors[(name, getattr(credit, name))] for name in GROUPS
            )
            if latent < thresholds[i]:
                losses += quantity * credit.loss
        outcomes.append(total - losses)
    return outcomes


def wilson(successes: int, count: int) -> tuple[float, float]:
    z = 1.959963984540054
    p = successes / count
    denominator = 1 + z * z / count
    center = (p + z * z / (2 * count)) / denominator
    radius = (
        z * math.sqrt(p * (1 - p) / count + z * z / (4 * count * count)) / denominator
    )
    return max(0, center - radius), min(1, center + radius)


def metrics(outcomes: list[float], target: float) -> dict[str, float]:
    ordered = sorted(outcomes)
    successes = sum(value >= target - 1e-7 for value in outcomes)
    lower, upper = wilson(successes, len(outcomes))
    return {
        "success_rate": successes / len(outcomes),
        "ci_low": lower,
        "ci_high": upper,
        "mean_tonnes": math.fsum(outcomes) / len(outcomes),
        "p05_tonnes": ordered[int(0.05 * (len(ordered) - 1))],
        "mean_shortfall": math.fsum(max(0, target - x) for x in outcomes)
        / len(outcomes),
    }


def exposures(portfolio: Portfolio) -> dict[str, dict[str, float]]:
    total = sum(q for _, q in portfolio)
    result: dict[str, dict[str, float]] = {}
    for name in GROUPS:
        groups: dict[str, float] = defaultdict(float)
        for credit, quantity in portfolio:
            groups[getattr(credit, name)] += quantity / total
        result[name] = dict(sorted(groups.items(), key=lambda item: -item[1]))
    return result

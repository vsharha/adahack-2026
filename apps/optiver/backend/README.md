# Optiver carbon portfolio builder

Python-only, offline command-line demo using the organiser's 4,355-project dataset. No runtime dependencies beyond Python 3.12.

From the repository root:

```bash
uv sync --directory apps/optiver/backend
uv --directory apps/optiver/backend run python -m optiver
```

Export a report and selected holdings to a **new directory outside the repo**:

```bash
uv --directory apps/optiver/backend run python -m optiver --output /tmp/optiver-report
```

Outputs: `report.md`, machine-readable `report.json`, and `portfolio.csv` when a candidate is found. Existing output directories are rejected to prevent overwriting a previous run.

## Controls

```bash
uv --directory apps/optiver/backend run python -m optiver --help
uv --directory apps/optiver/backend run python -m optiver --budget 200000 --reliability 0.95 --target 100000
```

Defaults: 100,000 tonnes, USD 1m maximum budget, 95% required modelled reliability, 2,000 training scenarios and 10,000 independent evaluation scenarios per model. `--seed` sets reproducible scenarios. `--data` accepts another CSV with the same schema. `--correlations 0 0.3 0.6` selects total shared latent variance assumptions; these are not observed binary failure correlations.

Exit 0 means the selected candidate passes budget/capacity constraints and the lower end of each individual 95% Wilson interval reaches the requested reliability. Exit 2 means invalid inputs, insufficient baseline supply or no validated candidate. This does not prove global infeasibility. The exported candidate remains a candidate if the report says it failed evaluation.

## Method

1. Validate IDs, prices, quantities, rating categories, exposure fields and recovery flags. Missing ratings use the supplied 15% probability. Unknown ratings fail validation.
2. Compare cheapest nominal and cheapest expected-delivery baselines. Fractional quantities are retained in baselines as lower-cost benchmarks.
3. Construct six allocation templates using three concentration-cap settings and two price/risk rankings. Reserve supply, then scale holdings to cover lower-tail delivery in training scenarios. Candidate quantities round up to whole tonnes.
4. Choose the cheapest training candidate within capacity and budget, then evaluate once on fresh scenarios. A failed held-out result is reported, not used to retune the portfolio.
5. Report cost, target-hit rate, Wilson intervals, lower-tail delivery, average shortfall and largest group exposures by purchased tonnes.

A project fails as a whole; all purchased credits from it share the failure event. The supplied reversal multiplier adjusts its probability and a buffer recovers half the lost quantity. Gaussian shared factors for country, developer, registry and type preserve the supplied marginal probabilities while varying dependence. Four group factors split the shared variance equally. Simulations use keyed streams so different portfolios encounter the same group/project shocks under the same seed.

This is a bounded heuristic, not a globally optimal solver. Dependence settings and the 95% requirement are engineering assumptions pending organiser clarification. Simulation intervals describe sampling uncertainty within the assumed model; they do not quantify uncertainty in the assumptions or establish real-world carbon delivery.

## Verification

```bash
uv --directory apps/optiver/backend run python -m unittest discover -s tests -v
pnpm check:optiver
pnpm verify
```

The tests cover marginal probabilities with correlated failures, shared-group failure, recovery, reproducibility, capacity/budget validation, unrated and reversal handling, invalid ratings, baseline arithmetic and failed search. Tests use only the Python standard library.

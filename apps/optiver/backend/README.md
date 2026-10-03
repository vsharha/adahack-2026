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

### Cost versus reliability curve

Run `uv run python -m optiver --frontier --output /tmp/optiver-frontier` with a new output directory. This runs the bounded search at 80%, 85%, 90%, 95% and 99% required reliability and writes `frontier.json` and `frontier.md` alongside the usual report and holdings. All CLI target, budget, seed and scenario settings apply to the sweep. Each point is checked against fresh scenarios for every configured shared-risk model; a candidate that misses its confidence threshold is recorded as failed, and a search with no candidate has a null cost. These are heuristic results, not a globally optimal efficient frontier.

The frontend's curve is an offline snapshot in `frontend/src/data/frontier.json`, with its download copy in `frontend/public/data/frontier.json`. Regenerate both together when the source data or modelling settings change.

### Comparison CSV and reliability batches

`uv run python -m optiver --csv-summary --output /tmp/optiver-comparison` writes `comparison.csv`: one row per portfolio and shared-risk model, with cost, project count, target hit rate, confidence bounds and validation status. The usual outputs are retained. `--csv-summary` and `--one-pager` require a new output directory.

`uv run python -m optiver --batch --output /tmp/optiver-batch` evaluates ten default reliability requirements: 80/82/84/86/88/90/92/94/96/99%. Supply explicit levels with `--batch 0.81 0.91 0.98`. Levels must be unique and in [0.5, 1). `batch.json` and `batch.md` retain missing searches and failed held-out checks; an unsuccessful search is not a proof of infeasibility. CLI target, budget, seeds and scenario counts apply to every run.

Holdings now include `quality_score`, vintage, reduction/removal and status in both JSON and CSV. Each portfolio also includes a tonnes-weighted score. This is the existing metadata heuristic (30% vintage recency, 40% removal/reduction, 30% status), bounded to [0,1], with zero contribution from missing signals. It is not a certified quality rating, not a failure probability, and does not influence allocation or simulated reliability. The source-export audit reconciles these fields.

### Saved PDF and dashboard refresh

From the repository root, run `bash apps/optiver/refresh-demo.sh`. It builds and audits the report, cost curve and comparison, renders the one-pager Markdown to a PDF with ReportLab through uv, then refreshes the displayed JSON and the downloadable assets together. The renderer needs DejaVu Sans fonts (available on this development machine). The page loads its holdings from the same JSON as its metrics. The PDF is the saved executive summary at the representative shared-risk setting (default 0.3), rather than a capture of the current table filters.

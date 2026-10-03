# Optiver carbon portfolio

AdaHack 2026 challenge demo: build a carbon credit portfolio that aims to deliver 100,000 tCO₂e within a budget while accounting for project failure and shared risks. The Python CLI searches for a diversified candidate and compares it with two cheap baselines. The Next.js dashboard presents a saved, audited run; it does not call a live backend.

## Run the demo

From the repository root, with [uv](https://docs.astral.sh/uv/) and [pnpm](https://pnpm.io/) installed:

```bash
bash apps/optiver/start.sh
```

The script regenerates and audits the report, cost curve and downloads, then starts the dashboard at <http://localhost:3000>. Refreshing the saved data runs the simulation and may take a few minutes. If you only need to view the committed snapshot, run `pnpm --dir apps/optiver/frontend dev` from the repository root.

In the dashboard, choose a shared-risk scenario (ρ = 0, 0.3 or 0.6), compare the three portfolios, inspect the cost curve and map, run the deterministic group-failure drill, and search or filter the 13 selected holdings. The drill shows how many tonnes remain if every project in one exposure group fails together, including buffer recovery; it is not a failure probability. The PDF summary and data downloads reflect the saved run. The PDF does not change with the selected scenario, drill or table filters.

## Saved result

The committed demo snapshot has a 100,000 tCO₂e target, a $1 million budget and a 95% modelled reliability requirement. The diversified candidate costs $181,658.56, buys 166,671 nominal tonnes across 13 projects, and has a 98.31% simulated target-hit rate at the ρ = 0.3 setting. It passes the configured checks in all three tested shared-risk settings. These are simulation results, not delivery guarantees or measured environmental impact.

The two comparison baselines cost $94,276.70 (cheapest nominal) and $115,294.12 (cheapest expected delivery). They illustrate the cost of adding resilience under the model; neither is selected as the validated candidate. The search is a bounded heuristic, so the result is not a proven global optimum.

## Run the CLI

All commands below run from the repository root:

```bash
uv --directory apps/optiver/backend run python -m optiver
uv --directory apps/optiver/backend run python -m optiver --help
uv --directory apps/optiver/backend run python -m optiver \
  --frontier --csv-summary --one-pager --output /tmp/optiver-report
```

Use a **new output directory** for each export; the CLI rejects an existing one. The last command writes `report.md`, `report.json`, `portfolio.csv`, `frontier.json`, `frontier.md`, `comparison.csv` and `one-pager.md`. For a fresh dashboard snapshot and PDF, run `bash apps/optiver/refresh-demo.sh` from the repository root. See the [backend README](backend/README.md) for modelling assumptions and more CLI options.

## Verify

From the repository root:

```bash
pnpm fix:optiver
pnpm verify:optiver
uv --directory apps/optiver/backend run python -m unittest discover -s tests -v
```

The [frontend README](frontend/README.md) has its local commands and saved-data details.

## Scope and sources

- The organiser's dataset provides 4,355 UC Berkeley registry projects with synthetic prices and failure ratings. The committed CSV and its provenance are documented in [backend/data/README.md](backend/data/README.md).
- The model treats each project as a whole-project failure, includes the supplied reversal and buffer fields, and tests assumed shared country, developer, registry and type risks. Correlation strengths and the 95% requirement are demo assumptions.
- The dashboard uses static files in `frontend/src/data/`; `refresh-demo.sh` regenerates them and the matching downloads in `frontend/public/data/`. There is no live API or carbon transaction.
- The [challenge brief](../../docs/optiver/brief.md), [product decisions](../../docs/optiver/product.md), [verified status](../../docs/optiver/status.md) and [judge demo notes](../../docs/optiver/pitch/judges/demo-checklist.md) give the wider context.

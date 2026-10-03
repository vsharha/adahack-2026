# Optiver - Carbon Portfolio Optimizer

AdaHack 2026 challenge: Build a carbon credit portfolio that delivers 100,000 tCO₂e on a budget and survives project failures.

## Demo Screenshot

![Optiver Dashboard](../../docs/optiver/screenshot.png)
*Dashboard showing portfolio comparison, diversification breakdown, and risk metrics*

## Quick Results

| Metric | Value |
|--------|------:|
| **Target** | 100,000 tCO₂e |
| **Budget** | $1,000,000 |
| **Diversified Cost** | $181,659 |
| **Projects** | 13 credits |
| **Success Rate** | 98.3% (ρ=0.3) |
| **5th Percentile** | 110,970 tonnes |

**Status:** ✅ PASS under tested models

---

## Quick Start

### Launch Everything (Backend + Frontend)

```bash
./apps/optiver/start.sh
```

This will:

1. Generate a fresh portfolio report from the backend
2. Copy the data to the frontend
3. Start the Next.js dev server on http://localhost:3000

Access the dashboard at **http://localhost:3000**

---

## Manual Commands

### Backend (Python CLI)

```bash
# Basic run - shows report in terminal
uv --directory apps/optiver/backend run python -m optiver

# Export full report (Markdown + JSON + CSV)
uv --directory apps/optiver/backend run python -m optiver --output /tmp/optiver-report

# With stress tests and one-pager export
uv --directory apps/optiver/backend run python -m optiver --output /tmp/report --stress --one-pager

# Sensitivity analysis (90%, 95%, 99% reliability)
uv --directory apps/optiver/backend run python -m optiver --sensitivity

# Custom settings
uv --directory apps/optiver/backend run python -m optiver \
  --target 100000 \
  --budget 500000 \
  --reliability 0.90 \
  --output /tmp/my-report

# Help
uv --directory apps/optiver/backend run python -m optiver --help
```

### Frontend (Next.js Dashboard)

```bash
# Start dev server
cd apps/optiver/frontend
pnpm dev

# Build for production
pnpm build

# Run E2E tests
pnpm exec playwright test
```

---

## Sample CLI Output

```
Loaded 4,355 projects. Searching candidates...
Evaluating Cheapest nominal...
Evaluating Cheapest expected...
Evaluating Diversified candidate...

# Carbon portfolio report

PASS under tested models

Target: 100,000 tCO2e. Budget: $1,000,000.00. Required modelled reliability: 95.0%.

| Portfolio            | Cost        | Projects | Nominal tonnes | Within budget |
|----------------------|------------:|---------:|---------------:|--------------:|
| Cheapest nominal     | $94,276.70  |        2 |        100,000 | True          |
| Cheapest expected    | $115,294.12 |        1 |        117,647 | True          |
| Diversified candidate| $181,658.56 |       13 |        166,671 | True          |

## Stress Test Scenarios

### Scenario 1: Budget Cut (-20%)
Budget: $1,000,000 → $800,000
Within stressed budget: ✓ Yes

### Scenario 2: Target Increase (+25%)
Target: 100,000 → 125,000 tonnes
  ρ=0: Hit rate 89.8% (vs 100,000t: 99.3%)
  ρ=0.3: Hit rate 87.7% (vs 100,000t: 98.3%)

### Scenario 3: Developer Failure Stress
  Developer: Jaiprakash Power Ventures Limited
  ρ=0.3: Hit rate 98.3% → 96.1% (Δ -2.2pp)
```

---

## Project Structure

```
apps/optiver/
├── backend/           # Python portfolio optimizer
│   ├── src/optiver/   # Main code (model.py, search.py, __main__.py)
│   ├── tests/         # Unit tests (14 tests)
│   └── data/          # Dataset (credits.csv - 4,355 projects)
├── frontend/          # Next.js dashboard
│   ├── src/app/       # Pages (page.tsx, layout.tsx)
│   ├── src/components/# UI (theme-toggle, skeletons, charts)
│   ├── src/lib/       # Utilities (appearance, data)
│   ├── tests/         # E2E tests (Playwright)
│   └── data/          # report.json, portfolio.csv
├── start.sh           # Quick launch script
└── README.md          # This file
```

---

## What It Does

1. **Loads 4,355 carbon credit projects** from the UC Berkeley dataset
2. **Compares 3 strategies:**
   - Cheapest nominal (~68% success rate, $94k)
   - Cheapest expected (~85% success rate, $115k)
   - **Diversified candidate** (~98% success rate, $182k) ← Our solution
3. **Stress-tests** with 10,000 simulated failure scenarios per correlation setting
4. **Exports** Markdown report, JSON data, CSV holdings, and judge one-pager

---

## Key Features

### Backend
- ✅ Portfolio optimization with diversification constraints
- ✅ Correlated failure simulation (Gaussian shared factors)
- ✅ Concentration risk warnings (>40% threshold)
- ✅ Stress testing (budget cut, target increase, developer failure)
- ✅ Quality scoring (vintage, removal/reduction, completion status)
- ✅ Sensitivity analysis (90%/95%/99% reliability)
- ✅ One-pager export for judges

### Frontend
- ✅ Interactive dashboard with portfolio comparison charts
- ✅ Dark/Light/System theme toggle
- ✅ Copy-to-clipboard summary
- ✅ Print-ready stylesheet (Ctrl+P)
- ✅ Mobile responsive (390px width tested)
- ✅ Loading skeletons for future API integration
- ✅ E2E tests with Playwright

---

## Key Outputs

| File            | Description                        |
| --------------- | ---------------------------------- |
| `report.md`     | Human-readable summary with tables |
| `report.json`   | Machine-readable data for frontend |
| `portfolio.csv` | Selected projects with details     |
| `one-pager.md`  | Judge-facing executive summary     |

---

## Judge Resources

- **[Pitch Notes](../../docs/optiver/pitch/judges/talking-points.md)**: 2-minute demo flow, Q&A prep
- **[Summary](../../docs/optiver/pitch/judges/summary.md)**: 1-page problem/approach/results
- **[Status](../../docs/optiver/status.md)**: Feature verification table

---

## Tech Stack

- **Backend:** Python 3.12, uv, standard library only
- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Recharts, Radix UI
- **Testing:** Playwright (E2E), unittest (backend)
- **Dataset:** UC Berkeley Voluntary Registry (4,355 projects)

---

## Verification

```bash
# Backend tests (14 tests)
uv --directory apps/optiver/backend run python -m unittest discover -s tests -v

# Frontend E2E tests
cd apps/optiver/frontend && pnpm exec playwright test

# Full verification (lint + type check)
pnpm verify
```

---

## Caveats

- Prices and ratings are **synthetic** (organiser-provided)
- Correlation strengths are **assumptions** (0, 0.3, 0.6 shared variance)
- Search is a **heuristic** (6 templates, not global optimum)
- Results are **modelled** (not real-world delivery guarantees)
- No real carbon transactions or environmental impact claims

---

## Demo Video

A 2-minute walkthrough is available at: [Loom link pending]

---

**Built for AdaHack 2026 • Optiver Challenge**

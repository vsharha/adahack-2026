# Optiver - Carbon Portfolio Optimizer

AdaHack 2026 challenge: Build a carbon credit portfolio that delivers 100,000 tCO₂e on a budget and survives project failures.

## Quick Start

### Launch Everything (Backend + Frontend)

```bash
./apps/optiver/start.sh
```

This will:
1. Generate a fresh portfolio report from the backend
2. Copy the data to the frontend
3. Start the Next.js dev server on http://localhost:3000

---

## Manual Commands

### Backend (Python CLI)

```bash
# Basic run - shows report in terminal
uv --directory apps/optiver/backend run python -m optiver

# Export full report (Markdown + JSON + CSV)
uv --directory apps/optiver/backend run python -m optiver --output /tmp/optiver-report

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

# Run tests
pnpm test
```

---

## Project Structure

```
apps/optiver/
├── backend/           # Python portfolio optimizer
│   ├── src/optiver/   # Main code
│   ├── tests/         # Unit tests
│   └── data/          # Dataset (credits.csv)
├── frontend/          # Next.js dashboard
│   ├── src/app/       # Pages
│   ├── src/components/# UI components
│   └── data/          # Report JSON/CSV
├── start.sh           # Quick launch script
└── README.md          # This file
```

---

## What It Does

1. **Loads 4,355 carbon credit projects** from the UC Berkeley dataset
2. **Compares 3 strategies:**
   - Cheapest nominal (~68% success rate)
   - Cheapest expected (~85% success rate)
   - Diversified candidate (~97-99% success rate)
3. **Stress-tests** with 10,000 simulated failure scenarios
4. **Exports** Markdown report, JSON data, and CSV holdings

---

## Key Outputs

| File | Description |
|------|-------------|
| `report.md` | Human-readable summary with tables |
| `report.json` | Machine-readable data for frontend |
| `portfolio.csv` | Selected projects with details |

---

## Judge-Facing Summary

See [`docs/optiver/pitch/judges/summary.md`](../../docs/optiver/pitch/judges/summary.md) for a 1-page explanation of the problem, approach, and results.

---

## Tech Stack

- **Backend:** Python 3.12, uv, no external dependencies
- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Recharts
- **Dataset:** 4,355 projects, synthetic prices and failure probabilities

---

## Verification

```bash
# Run tests
uv --directory apps/optiver/backend run python -m unittest discover -s tests -v

# Check linting and types
pnpm check:optiver
```

---

## Caveats

- Prices and ratings are **synthetic** (organiser-provided)
- Correlation strengths are **assumptions** (0, 0.3, 0.6 shared variance)
- Search is a **heuristic** (6 templates, not global optimum)
- Results are **modelled** (not real-world delivery guarantees)

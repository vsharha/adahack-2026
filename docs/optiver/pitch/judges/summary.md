# Optiver Challenge: Carbon Portfolio Diversity

## Problem

Build a carbon credit portfolio that delivers 100,000 tonnes of CO₂e while surviving project failures. The challenge: cheapest projects often fail together, so minimising cost alone risks missing the target.

## Our Approach

We built a Python tool that:

1. **Analyses 4,355 carbon credit projects** from the UC Berkeley Voluntary Registry Offsets Database with synthetic prices and failure probabilities provided by organisers.

2. **Compares three strategies:**
   - _Cheapest nominal_: Buy the lowest-cost projects until reaching 100,000 tonnes ($94,277, 2 projects). **Fails 32% of the time** under our models.
   - _Cheapest expected_: Buy projects with best cost-per-expected-tonne ($115,294, 1 project). **Fails 15% of the time**.
   - _Diversified candidate_: Our heuristic search balances cost against concentration risk ($181,659, 13 projects). **Hits target 97–99% of the time** across different correlation assumptions.

3. **Stress-tests portfolios** using 10,000 simulated failure scenarios with varying degrees of correlation (projects failing together by country, developer, registry, or type).

## Key Trade-off: Cost vs. Reliability

| Portfolio                     | Cost         | Projects | Modelled Success Rate |
| ----------------------------- | ------------ | -------- | --------------------- |
| Cheapest nominal              | $94,277      | 2        | ~68%                  |
| Cheapest expected             | $115,294     | 1        | ~85%                  |
| **Our diversified candidate** | **$181,659** | **13**   | **~97–99%**           |

Spending roughly **2× more** than the bare minimum buys **30 percentage points higher reliability**. For a buyer who must credibly claim 100,000 tonnes delivered, this trade-off matters.

## How It Works (Simplified)

1. **Diversification caps**: Six templates combine project limits of 5%, 10% or 20% of the initial target allocation with group concentration limits. The selected default portfolio has about 10% of purchased tonnes in its largest project and 60% in its largest registry.
2. **Risk-adjusted ranking**: Projects ranked by cost divided by expected retained tonnes (accounts for failure probability and buffer recovery).
3. **Reserve + scale-up**: Hold extra capacity in reserve, then scale purchases to cover the lower tail of simulated outcomes.
4. **Held-out evaluation**: Select on 2,000 training scenarios, evaluate on 10,000 fresh scenarios to avoid overfitting.

## Important Caveats

- **Synthetic data**: Prices and ratings are organiser-provided synthetic values, not real market prices.
- **Assumed correlations**: We test multiple correlation strengths (0, 0.3, 0.6 shared variance) because organisers did not specify how failures correlate.
- **Heuristic search**: We evaluate 6 candidate templates on training scenarios, select the cheapest qualifying candidate, then check it on fresh evaluation scenarios. A failed evaluation is reported. This is **not** a proven global optimum—there may be cheaper portfolios we did not find.
- **Model uncertainty**: Confidence intervals cover sampling error within our assumptions, not uncertainty about whether the assumptions match reality.

## What the Tool Produces

- **Interactive failure drill**: A full VCS registry failure leaves 66,668 tonnes and misses the target; a full China group failure leaves 108,336 tonnes and meets it. These are hypothetical simultaneous failures with buffer recovery, not estimated event probabilities.
- **Markdown report**: Human-readable summary with portfolio comparison and stress-test results.
- **JSON export**: Machine-readable data for integration with dashboards or further analysis.
- **CSV holdings**: Selected projects with IDs, quantities, costs, countries, and risk attributes.

## Reproduce

```bash
uv --directory apps/optiver/backend run python -m optiver --output /tmp/optiver-report
```

Exit code 0 means a candidate passed all modelled requirements. Exit code 2 means no validated candidate was found (does not prove impossibility).

---

_Prepared for AdaHack 2026 Optiver challenge judges. All figures are modelled simulation outputs, not real-world carbon delivery claims._

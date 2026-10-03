# Optiver judge demo checklist

## Before judges arrive

1. Open the already-running Optiver dashboard at <http://localhost:3000>. If it is not running, use `pnpm --dir apps/optiver/frontend dev` to show the saved run. `bash apps/optiver/start.sh` regenerates data first and takes longer.
2. Confirm the hero shows 100,000 tCO₂e, $1 million budget and the $181,659 candidate.
3. Select ρ=0.6 and confirm the candidate hit rate becomes 97.0% (96.99% before rounding).
4. Open **Shock check**: VCS shows 66,668 tCO₂e and a missed target; China shows 108,336 tCO₂e and a met target.
5. Open the PDF summary once. It is a saved summary at ρ=0.3, not a live export of selected filters.
6. Agree on one accurate sentence describing each teammate's contribution.

## Three-minute flow

Use [the timed script](script.md). Show the comparison, change the shared-risk setting, then use the shock check to contrast VCS with China. Explain that the shock check is hypothetical and the hit rates are simulated. Keep the browser on the dashboard for questions.

## Numbers to remember

| Measure                |                          Saved result |
| ---------------------- | ------------------------------------: |
| Target                 |                         100,000 tCO₂e |
| Dataset budget ceiling |                            $1,000,000 |
| Cheapest nominal       |  $94,276.70; 69.06% hit rate at ρ=0.6 |
| Diversified candidate  | $181,658.56; 96.99% hit rate at ρ=0.6 |
| Selected holdings      |        13 projects across 6 countries |
| Largest exposure       | VCS registry, 60% of purchased tonnes |

The hit rates are simulated. The team chose the 95% reliability requirement and shared-risk settings. The search does not prove a global cost minimum.

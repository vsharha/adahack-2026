# Optiver judge talking points

Use the [three-minute script](script.md) for the live pitch and the [checklist](demo-checklist.md) to test the screen first.

## The comparison

| Portfolio                  |        Cost | Projects | Modelled target-hit rate at ρ=0.6 |
| -------------------------- | ----------: | -------: | --------------------------------: |
| Cheapest nominal           |  $94,276.70 |        2 |                            69.06% |
| Cheapest expected delivery | $115,294.12 |        1 |                            84.61% |
| Diversified candidate      | $181,658.56 |       13 |                            96.99% |

The diversified portfolio buys 166,671 **nominal** tonnes across six countries. It costs $87,381.86 more than the cheapest nominal baseline. All three portfolios stay fixed when the shared-risk setting changes; the screen selects among saved simulation results.

## What we built

- A Python CLI reads 4,355 supplied projects, validates inputs, compares two cheap baselines and searches six diversified allocation templates.
- Each project can fail as a whole. The model includes supplied ratings, reversal flags and buffer recovery, plus assumed shared country, developer, registry and project-type factors.
- The search uses 2,000 training scenarios per setting. A selected candidate is checked on 10,000 fresh scenarios per setting; the dashboard presents that saved run.
- A cost curve, holdings table, map, concentration breakdown, deterministic group-failure drill and PDF summary help judges inspect the trade-off. The drill shows severity if a whole group fails, not the probability of that event.

## Be clear about the limits

- Synthetic prices and ratings are challenge data. The $1 million ceiling comes from the workbook. The 95% reliability requirement and ρ settings are team assumptions.
- A 96.99% hit rate is a modelled result, not a guarantee of delivery or real-world emissions reduction.
- The search is a bounded heuristic. There may be a cheaper portfolio that it did not find.
- The largest registry still holds 60% of purchased tonnes. Present that as an open concentration risk.
- The metadata quality score is a separate heuristic; it is not a certified credit rating and does not affect selection or simulated reliability.

## Likely questions

**Why not just buy the cheapest credits?** At ρ=0.6, the $94,276.70 nominal baseline misses the 100,000-tonne target in 30.94% of our simulated outcomes. The $181,658.56 diversified candidate misses it in 3.01%.

**Is the failure model realistic?** We preserve the supplied marginal failure rates and test three assumed levels of shared risk. We cannot validate those assumptions against actual project outcomes with this dataset.

**Why 95%?** The brief does not specify a probability threshold. We chose 95% to make the cost-versus-reliability trade-off concrete.

**What did each person do?** Give the actual contributions of each teammate. Do not infer them from the Git history alone.

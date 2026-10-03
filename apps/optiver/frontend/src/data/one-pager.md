# Optiver Carbon Portfolio — Executive Summary

## Challenge Objective

Build a portfolio delivering **100,000 tonnes CO₂e** on a **$1,000,000 budget** that survives project failures. This demo tests a team-chosen **95% modelled reliability** requirement.

## Key Results

| Metric                      |          Value |
| --------------------------- | -------------: |
| **Total Cost**              |    $181,658.56 |
| **Projects**                |     13 credits |
| **Nominal Tonnes**          |  166,671 tCO₂e |
| **Modelled Success Rate**   |  98.3% (ρ=0.3) |
| **95% CI Lower Bound**      |          98.0% |
| **5th Percentile Delivery** | 110,970 tonnes |

**Status:** ✓ PASS

## Portfolio Quality Signals

- **Tonnes-weighted metadata score:** 0.42/1.0
- Metadata heuristic, not a certified quality rating; unused by the optimiser.
- **Removal Projects:** 0.0% of portfolio
- **Known-vintage weighted average:** 2011

## Top Holdings (by cost)

| Project                                                                       | Country | Tonnes |    Cost |
| ----------------------------------------------------------------------------- | ------- | -----: | ------: |
| Xundian Jinfeng 12.6MW Hydropower Project                                     | China   | 16,667 | $20,000 |
| Canakkale WPP                                                                 | Türkiye | 16,667 | $19,834 |
| Inner Mongolia Sunjiaying 50.25MW Wind Power Project                          | China   | 16,667 | $18,334 |
| Monjolinho Energética S/A Hydropower Plant Project (Alzir dos Santos Antunes) | Brazil  | 16,295 | $17,599 |
| 2x50 MW Orange Suvaan Solar Photovoltaic Power Project in Maharashtra India   | India   | 16,667 | $17,500 |

## Risk Management

- **Diversification:** Spread across countries, developers, registries, and project types
- **Buffer Pools:** 50% recovery on projects with buffer protection
- **Stress Testing:** Validated under multiple correlation scenarios

## Method Summary

1. **Baselines:** Compare cheapest nominal vs. expected delivery approaches
2. **Search:** Bounded heuristic across 6 allocation templates
3. **Evaluation:** 10,000 Monte Carlo scenarios per correlation setting
4. **Validation:** Wilson score 95% confidence intervals

---

_Generated for AdaHack 2026 • Optiver Challenge • Modelled results, not real-world guarantees_

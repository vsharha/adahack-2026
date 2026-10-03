# Optiver: status

The offline Python portfolio builder is working. The frontend remains empty. All delivery and reliability figures below are modelled challenge results using synthetic prices and ratings, not environmental impact evidence.

## Features

Verified 2026-10-03 for commit `Polish Optiver reports and add sensitivity analysis` (the commit introducing this entry).

| Feature                                 | State   | Verification or reason                                                                                                                                                                                                                                                        |
| --------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Offline dataset ingestion               | Works   | All 4,355 source projects load; CSV provenance and checksums in `apps/optiver/backend/data/README.md`. Rejects malformed required inputs; unrated projects use 15% probability. Verified 2026-10-03, commit `Build offline Optiver portfolio builder and risk reports`.        |
| Cheapest nominal and expected baselines | Works   | Default CLI reproduces USD 94,276.70 nominal and USD 115,294.12 expected-delivery baselines from research. Verified 2026-10-03.                                                                                                                                               |
| Diversified candidate search            | Works   | Six templates evaluated. Default run selects 13 projects, 166,671 nominal tonnes at USD 181,658.56; budget and availability checks pass. This is a heuristic, not a proven optimum. Verified 2026-10-03.                                                                        |
| Correlated failure and buffer recovery  | Works   | Unit tests verify marginal failure rates, shared-group dependence, 50% loss recovery, reversal multipliers and seeded repeatability. Assumed Gaussian country/developer/registry/type factors preserve supplied marginal probabilities. Verified 2026-10-03.                   |
| Held-out evaluation                     | Works   | Default run: 2,000 training scenarios and 10,000 fresh evaluation scenarios per shared-variance setting, seeds 20261003/20261004. Candidate hit rates: 99.27% at 0, 98.31% at 0.3, 96.99% at 0.6. Lowest individual 95% Wilson lower bound: 96.64%, exceeding configured 95%. |
| Markdown report with holdings table     | Works   | Report includes full portfolio holdings table (project name, ID, country, tonnes, price, cost, failure%, buffer). Verified 2026-10-03, commit `Polish Optiver reports and add sensitivity analysis`.                                                                            |
| Sensitivity analysis (90/95/99%)        | Works   | `--sensitivity` flag compares cost and project count across reliability levels. Default run: 90% ($161,727, 8 projects), 95% ($181,659, 13 projects), 99% ($282,130, 15 projects). All pass their respective requirements. Verified 2026-10-03.                              |
| Judge-facing summary                    | Works   | `docs/optiver/pitch/judges/summary.md` explains problem, approach and trade-offs in plain language. Derived from verified default run. Verified 2026-10-03.                                                                                                                   |
| Reports and portfolio export            | Works   | Default CLI exported valid Markdown, JSON and CSV outside the repository. CSV contains selected quantities and costs; JSON includes source checksum, settings and exposure shares. Existing output directories are protected. Verified 2026-10-03.                            |
| Unsuccessful search                     | Works   | `--budget 1000 --scenarios 100 --training-scenarios 100` reports no validated candidate, marks baselines over budget and exits 2. Does not claim global infeasibility. Verified 2026-10-03.                                                                                   |
| Frontend                                | Planned | Empty placeholder; framework and scope not chosen. Qwen is building the frontend separately.                                                                                                                                                                                  |

## Reproduce

From the root, run `uv --directory apps/optiver/backend run python -m optiver --output /tmp/optiver-report` with a new output path. Run tests with `uv --directory apps/optiver/backend run python -m unittest discover -s tests -v`. Full usage is in `apps/optiver/backend/README.md`.

## Limits and open questions

The 100,000-tonne target interpretation, 95% reliability requirement, whole-project failure severity and correlation strengths need organiser confirmation. Costs and ratings are synthetic. Statistical intervals cover sampling error within these assumed models, not real-world model uncertainty. No web app or real carbon transaction exists.

## Impact evidence

No real-world emissions or impact claims. The cost and reliability figures above are reproducible simulation outputs only.

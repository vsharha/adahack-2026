# Optiver dataset research

Inspected 2026-10-03. This is research and a revised recommendation, not an accepted product decision or a built feature.

## Source and method

Downloaded the actual [organiser workbook](https://docs.google.com/spreadsheets/d/1d3YKqXgVyYUkYA9aYVlmE6ryc5MrrasY/edit) using its public `export?format=xlsx` endpoint. Read every populated row in both sheets using openpyxl through the bundled Python runtime, launched with uv. The earlier browser retrieval failure did not mean the file was inaccessible. No raw dataset is committed.

Workbook SHA-256: `44beb48fb6f1954112035d31ef931a53d234338c60e8d4d94d5bd79b122229bf`.

Sources within the workbook: `README!A1:A27` and `CREDITS!A1:P4356`. README has formatting through row 1007, but no populated content after row 27. There are no formulas. Reproduce the descriptive results by counting nonempty project rows, distinct values and blanks by column. Reproduce the arithmetic examples below from the cited project rows and rating table.

## Rules found in the workbook

- README A2 says the winner achieves the target at the lowest total acquisition cost. This is more specific than the PDF's general judging criteria; confirm how these criteria interact with organisers.
- A22 sets a maximum spend of USD 1,000,000.
- A10 and A23 allow any quantity up to each project's `available_tonnes`, defined as issued but unretired credits.
- A11 defines `price_usd_per_t` as synthetic USD per tonne CO2e. The PDF provides a target of 100,000; interpreting that as tonnes CO2e is consistent with this schema, but confirm with organisers.
- A12 and A21 define a noisy rating and its base failure probability: AAA 1%, AA 2%, A 4%, BBB 7%, BB 12%, B 20%, CCC 35%, unrated 15%.
- A18 multiplies failure probability by 1.5 for a recorded reversal, capped at 100%.
- A19 recovers 50% of credit losses on failure when a buffer pool exists.
- A17 explicitly says failures are correlated by country, developer, registry and project type. It does not give correlation strengths or a joint sampling algorithm.
- Prices and ratings are synthetic, not observed market values. Do not train a predictive model and describe its output as real-world failure prediction.

## Actual dataset profile

There are 4,355 project rows with 16 columns and 4,355 unique `credit_id` values. Names are not unique (4,347 distinct), so use IDs as keys.

| Field or group    | Observed coverage               | Use                                                                |
| ----------------- | ------------------------------- | ------------------------------------------------------------------ |
| Country           | 111 distinct values             | Geographic exposure                                                |
| Developer         | 1,570 distinct values           | Shared developer exposure                                          |
| Registry          | 6                               | Registry exposure                                                  |
| Project type      | 76                              | Shared technology/type exposure                                    |
| Scope             | 10                              | Broad explanation and filtering                                    |
| Region            | 13                              | Optional broad geographic reporting                                |
| Vintage           | 1996–2026; median 2019          | Descriptive context; no supplied extra risk multiplier             |
| Price             | USD 0.93–457.45/t; median 6.98  | Acquisition cost                                                   |
| Available tonnes  | 1,000–45,762,713; median 57,879 | Per-project purchase cap                                           |
| Risk rating       | 571 missing (13.11%)            | Apply the supplied 15% unrated probability; do not drop these rows |
| Buffer pool       | 813 Yes                         | 50% recovery on failure                                            |
| Recorded reversal | 28 Yes; 26 also have a buffer   | Probability multiplier, then recovery                              |

All fields except rating are populated; no blank strings were found. All prices and quantities are positive. Ratings are AAA 285, AA 323, A 402, BBB 576, BB 704, B 736, CCC 758 and unrated 571. The README's approximately 12% unrated is approximate; the actual file has 13.11%.

Reduction/removal labels: Reduction 3,757, Impermanent Removal 323, Mixed 268 and Long-Duration Removal 7. Status has 20 categories. The workbook does not impose eligibility restrictions by status, vintage or removal category, so do not silently exclude projects on those grounds.

## What simple baselines reveal

For each project, set `p = min(1, base_probability * reversal_multiplier)` and `loss_fraction = 0.5` with a buffer, otherwise `1`. Expected retained fraction is `1 - p * loss_fraction`. This arithmetic assumes a whole-project failure event with the stated recovery. Clarify failure severity with organisers. Expected values do not require independent project failures; target-hit probabilities do.

### Cheapest nominal 100,000 tonnes

Sort by price, then adjusted failure probability, then ID to resolve ties. Buy up to capacity until the nominal target is met:

| Project                                     | Source row       | Tonnes  | Price USD/t | Failure probability | Cost USD  |
| ------------------------------------------- | ---------------- | ------- | ----------- | ------------------- | --------- |
| VCS1974: Srepok 1 Solar Power Project       | CREDITS row 3799 | 74,466  | 0.93        | 20%                 | 69,253.38 |
| VCS173: Vishnuprayag Hydro-electric Project | CREDITS row 2961 | 25,534  | 0.98        | 15% (unrated)       | 25,023.32 |
| Total                                       |                  | 100,000 |             |                     | 94,276.70 |

Expected surviving tonnes: `74,466 * 0.8 + 25,534 * 0.85 = 81,276.70`. Both lack a buffer and neither has a recorded reversal. Under independent binary failures, both must survive to meet the target, giving `0.8 * 0.85 = 68%`. That 68% is only an independence illustration, not a validated score: both projects share VCS, and the organisers explicitly specify correlated failures.

### Cheapest expected 100,000 tonnes

Sort by `price / expected_retained_fraction` and buy enough expected delivery, respecting capacities. VCS173 ranks first at USD 1.152941 per expected retained tonne. A fractional purchase of 117,647.0588 tonnes costs USD 115,294.12 and has expected delivery of 100,000 tonnes. If whole tonnes are required, round up and recalculate.

This puts everything into one project. In the binary model it delivers the full purchased amount 85% of the time and zero 15% of the time. This demonstrates why optimising the average alone does not provide a strong reliability guarantee. It is a research calculation, not a finished optimiser or a proposed final portfolio.

## Revised directions

| Direction                                 | Fit to the actual data                                                                | Recommendation                                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Cheapest reliable portfolio               | Uses costs, capacities, rating probabilities, recovery and exposure groups            | Strongest main product, once the reliability rule is agreed                              |
| Hidden concentration report               | Explains when many project IDs still share developers, registries, countries or types | Strong supporting feature with no external dataset needed                                |
| Cost of reliability                       | Compares minimum modelled cost across success-rate requirements                       | Strong evaluation chart; confidence thresholds are user choices, not organiser rules yet |
| Buffer-pool value                         | Compares recovery benefits with price premiums and concentration                      | Useful focused experiment, not a blanket preference for buffered projects                |
| Disaster simulator                        | Uses shared failure groups from the README                                            | Demo for the portfolio method; actual joint model remains unspecified                    |
| Predict real-world carbon quality with ML | No observed failure outcomes or calibrated labels                                     | Unsupported by this dataset alone; avoid for the initial scope                           |

Proposed objective: minimise acquisition cost while satisfying capacities, the USD 1m ceiling and an explicitly chosen target-hit requirement under a stated scenario model. Do not spend the full budget just because it is available. A simple first candidate can use concentration caps plus a quantity reserve, compared against the two baselines. A later scenario-based optimisation can be considered after the scoring rule is known. No particular algorithm has been approved.

Correlation must be treated as uncertain. If the organisers do not provide a generator, compare an independence baseline with several explicitly assumed strengths of shared country/developer/registry/type risk. Preserve each project's supplied marginal failure probability when modelling dependence, rather than adding new shocks on top and silently inflating it. Evaluate on fresh scenarios rather than the same scenarios used to choose the portfolio. Report sensitivity and simulation uncertainty, not a real-world guarantee.

## External data research

[Berkeley's database description](https://gspp.berkeley.edu/berkeley-carbon-trading-project/offsets-database) explains project, issuance and retirement coverage. Its [calculation notes](https://gspp.berkeley.edu/assets/uploads/page/VROD-Calculations-through-v10.pdf) provide historical methodology context; they predate the challenge's v2026-06 snapshot and do not define this challenge's synthetic prices or risks. Consulted 2026-10-03.

The supplied workbook already has the grouping fields needed for this prototype. External wildfire, weather or financial data is unnecessary for the recommended first version. Registry quantities are treated as purchase caps because the challenge instructs that; unretired registry balances are not proof of executable real-market supply at the synthetic prices.

## Human teammate collaboration

Bring three questions to organisers: what exactly counts as achieving the target, how joint failures are sampled, and whether quantities must be whole tonnes. Also confirm the target units and how lowest cost interacts with general judging criteria.

Suggested brief teammate review: independently recalculate the two baselines, find concentrated exposures in candidate portfolios, and challenge the chosen correlation assumptions. The user can own Python implementation after the direction is agreed. No teammates have been contacted and no responsibilities assigned.

## Verification

All rows and both worksheets inspected on 2026-10-03. Counts, missingness, positive prices/capacities, duplicate IDs, rating categories and the two baseline calculations were checked directly against the downloaded workbook. Commit: `Research actual Optiver dataset and revise directions` (the commit introducing this report). No product feature or environmental impact has been measured.

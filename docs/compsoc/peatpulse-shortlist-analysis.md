# PeatPulse: shortlist size comparison

Verified locally on 3 October 2026 using the existing grouped out-of-fold predictions. No models were retrained. This is an exploratory analysis of the same development benchmark, not new independent test data.

## Results

PeatPulse here means the Random Forest using weather and CEMS indices, the strongest model for the original alert policy.

| Locations per day per held-out fold | PeatPulse burn groups caught | FWI burn groups caught | Total alerts per method |
| ----------------------------------- | ---------------------------- | ---------------------- | ----------------------- |
| 1                                   | 6/25 (24%)                   | 2/25 (8%)              | 14,256                  |
| 3                                   | 11/25 (44%)                  | 7/25 (28%)             | 42,752                  |
| 5                                   | 13/25 (52%)                  | 8/25 (32%)             | 71,248                  |

The increase comes from checking more locations. The model and its scores are unchanged. Both methods receive the same daily budget and candidate locations. When a date has fewer than the requested number of candidates, all available candidates are selected.

## Where the original 19 missed groups ranked

For each group, take its best cell rank over its eligible positive prediction windows:

| Best PeatPulse rank | Originally missed groups |
| ------------------- | ------------------------ |
| 2–3                 | 5                        |
| 4–5                 | 2                        |
| 6–10                | 4                        |
| Above 10            | 8                        |

Seven of the 19 misses become catches with a five-location shortlist. Twelve remain outside the top five throughout their eligible positive windows. These are retrospective diagnostic ranks; future burn outcomes were not used to select daily alerts.

## Workload and unmatched alerts

“Positive alert rows” counts selected cell-days with a qualified mapped burn in the next seven days. Repeated rows may concern the same burn group. “Provisional negative” means the dataset's usable satellite outcome is negative; it does not prove that no fire occurred. Unknown outcomes remain unknown.

| Method    | Shortlist | Positive alert rows | Provisional negative alerts | Unknown outcomes | Positive share of alerts with usable outcomes |
| --------- | --------- | ------------------- | --------------------------- | ---------------- | --------------------------------------------- |
| PeatPulse | 1         | 6                   | 7,641                       | 6,609            | 0.0785%                                       |
| FWI       | 1         | 2                   | 8,018                       | 6,236            | 0.0249%                                       |
| PeatPulse | 3         | 15                  | 22,797                      | 19,940           | 0.0658%                                       |
| FWI       | 3         | 11                  | 23,805                      | 18,936           | 0.0462%                                       |
| PeatPulse | 5         | 22                  | 37,927                      | 33,299           | 0.0580%                                       |
| FWI       | 5         | 21                  | 39,471                      | 31,756           | 0.0532%                                       |

More groups caught does not establish a manageable inspection workload. At five locations, the methods catch different numbers of groups but have similar positive alert-row counts. A forced daily shortlist still produces many alerts without a subsequent mapped burn, and numerous outcomes cannot be evaluated.

## Timing before the first mapped burn in a group

The main outcome allows a later-burning cell within an already burning group to count. Restrict successful alerts to those issued at least 24 hours before the group's earliest conservative mapped burn interval:

| Shortlist | PeatPulse groups | FWI groups |
| --------- | ---------------- | ---------- |
| 1         | 5/25             | 0/25       |
| 3         | 6/25             | 4/25       |
| 5         | 7/25             | 5/25       |

This timing check uses the same alert selections; it does not change the ranking. It is not a verified ignition-time benchmark. Satellite-mapped burns can include managed burning and spread.

## Verification and saved outputs

The analysis ranked all 976,800 scored candidates within each date and held-out fold, using descending score and the existing deterministic `tie_key`. It retained unknown-outcome candidates. Assertions confirmed identical candidate sets for both methods, equal alert totals at each budget, all 218 positive rows across 25 groups, one fold per group, unique cell/date rows, and exact reproduction of the original top-one event identities and 14,256 alert counts.

Saved locally under `apps/compsoc/backend/data/expanded/models/grouped_cv/shortlist_analysis/`:

- `comparison.csv`: counts, workload and timing at each budget.
- `event_best_ranks.csv`: best eligible rank for each of the 25 groups.
- `positive_row_ranks.csv`: rank, score and timing for each positive row and method.
- `summary.json`: method, verification and missed-group rank distribution.

Training and test calendar years overlap in the underlying grouped validation. These results do not establish future-year forecast performance. No operating shortlist was selected by this analysis. Changes remain local and uncommitted, as requested.

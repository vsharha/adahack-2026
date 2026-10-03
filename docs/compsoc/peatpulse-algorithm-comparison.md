# PeatPulse: algorithm comparison

## Result

**Winner for our current alert policy: Random Forest using weather + CEMS indices.** It caught **6 of 25 mapped burn groups**. The new gradient-boosting model caught 3, Extra Trees caught 2 and logistic regression caught 2, using their weather/CEMS inputs. Raw FWI caught 2. None of the added radar versions improved their family's group-catch count.

**Extra Trees won on overall ranking quality:** mean fold average precision was **0.01770**, versus **0.00630** for Random Forest, approximately **2.8 times higher**. Its mean ROC AUC was 0.820 versus Random Forest's 0.815. Average precision evaluates ranking across all eligible rows and dates; the alert policy chooses one cell within each day. Better overall ranking did not yield more groups caught with this fixed daily budget.

| Method                             | Groups caught | Ordinary accuracy | Mean fold ROC AUC | Mean fold average precision |
| ---------------------------------- | ------------: | ----------------: | ----------------: | --------------------------: |
| Copernicus FWI                     |          2/25 |            98.46% |             0.629 |                     0.00085 |
| Random Forest: weather + FWI       |          6/25 |            98.53% |             0.815 |                     0.00630 |
| Random Forest: + radar             |          3/25 |            98.53% |             0.763 |                     0.00335 |
| Logistic regression: weather + FWI |          2/25 |            98.50% |             0.812 |                     0.00214 |
| Logistic regression: + radar       |          0/25 |            98.48% |             0.800 |                     0.00180 |
| Extra Trees: weather + FWI         |          2/25 |            98.53% |             0.820 |                     0.01770 |
| Extra Trees: + radar               |          2/25 |            98.51% |             0.788 |                     0.01371 |
| Gradient boosting: weather + FWI   |          3/25 |            98.52% |             0.781 |                     0.00771 |
| Gradient boosting: + radar         |          1/25 |            98.56% |             0.778 |                     0.00516 |
| Selected using inner folds         |          2/25 |            98.54% |             0.830 |                     0.01397 |

All methods issued **14,256 alerts** over the five held-out folds. Accuracy is calculated only where outcomes are usable. For example, boosting with radar has the highest ordinary accuracy here (98.56%) but catches only one group; always predicting no burn scores 99.96% and catches none. Unknown-outcome alerts range from 6,236 to 6,772 and remain unverified, rather than being declared successes or false alarms.

The selector based on inner average precision caught **2/25 groups**. It chose Extra Trees in four outer folds and boosting in one. For a final refit on all usable rows, aggregated inner scores selected **Extra Trees with radar, flexible settings**. That saved ranking model is separate from the Random Forest that leads the outer group-catch benchmark. The original best alert model remains at `data/expanded/models/grouped_cv/strong_weather.pkl`.

The secondary same-weather comparison gives boosting with radar a 54.0% pair-ranking score against a 50% weather tie, over 17 burn groups. Its overall group catch falls from 3 to 1 when radar is added, so this isolated secondary score does not establish an improvement in the alert system.

**Practical choice:** retain the weather + CEMS Random Forest for the current one-alert-per-day demonstration. Extra Trees is a useful candidate when investigating overall ranking. These findings apply to the same historical development benchmark; this run adds algorithms, not new independent test events.

Training completed in **389 seconds (6.5 minutes) on the local CPU**, including the final selected-model refit. All original Random Forest results were preserved.

## What a data point means

**One row is one 1 km peatland cell on one issue date.** Inputs describe the conditions available before that issue time. The outcome asks whether a quality-qualified satellite burn interval falls within the following seven days.

| Dataset count                                  |          Value |
| ---------------------------------------------- | -------------: |
| Sampled Scottish cells                         |            346 |
| Cells with usable training/test rows           |            342 |
| Period                                         |      2018–2025 |
| Full panel, before quality and outcome filters | 1,011,012 rows |
| Usable rows                                    |    **535,473** |
| Positive rows                                  |        **218** |
| Provisional negative rows                      |        535,255 |
| Distinct cells contributing positive rows      |            119 |
| Mapped burn groups with usable positive rows   |         **25** |
| Linked positive validation groups              |             22 |

Nearby cells and repeated dates can belong to the same burn group. We retain each cell as an example and keep related cells together during validation. Missing outcomes are not changed into negatives. Satellite-mapped burns can include managed fires and later spread across cells.

## Training versus testing

We use the same five grouped outer folds as the first Random Forest run. Every usable row is tested once and participates in training for the other four folds. There is no separate permanently held-out year. Test cells and linked events are excluded from that fold's training; calendar years overlap.

| Fold | Training rows | Training positive rows | Test rows | Test positive rows | Test burn groups |
| ---- | ------------: | ---------------------: | --------: | -----------------: | ---------------: |
| 1    |       486,545 |                    202 |    48,928 |                 16 |                5 |
| 2    |       369,146 |                    162 |   166,327 |                 56 |                6 |
| 3    |       467,075 |                    173 |    68,398 |                 45 |                5 |
| 4    |       342,499 |                    148 |   192,974 |                 70 |                5 |
| 5    |       476,627 |                    187 |    58,846 |                 31 |                4 |

The folds have unequal row counts because entire cells and connected events stay together. The test columns total 535,473 rows, 218 positives and 25 mapped burn groups.

## Algorithms and inputs

- **Random Forest:** the existing two-configuration result, reused without changing its predictions.
- **Logistic regression:** a regularized linear model with feature scaling fitted only on training rows.
- **Extra Trees:** an ensemble using randomized tree splits.
- **Histogram gradient boosting:** sequential trees trained to improve the preceding ensemble.

Each family is compared using **weather + four CEMS indices (16 predictors)** and those inputs **plus radar (24 predictors)**. Predictor lists, labels, data rows, five outer folds and daily alert budget are unchanged.

Each new family has two predeclared settings. Inside every outer training partition, the same three inner grouped folds select settings by mean average precision. Inner fits use all positives and at most 50,000 sampled quiet rows; outer fits use all eligible training rows. Class balancing and equal total positive-event weights match the Random Forest setup. Boosting's internal random-row early stopping is disabled.

A separate **inner-fold model selector** chooses family, inputs and settings without seeing the outer test outcomes. Its outer predictions show how that selection procedure performs. The leaderboard of individual algorithms describes their observed performance on this development benchmark. The final saved model is selected using inner scores, so it can differ from the individual model with the best outer headline metric.

## Comparison with the official index

The reference uses actual historical **Copernicus CEMS FWI values**, accessed through the Climate Engine Earth Engine collection. We rank exactly the same candidate locations on exactly the same dates and permit **one cell alert per day per held-out fold**. A shared deterministic rule breaks ties.

The FWI catch count is produced by **our backtest of the official index**. We are not reproducing a published government accuracy score or testing SFRS regional warning decisions. [Copernicus describes the Fire Weather Index](https://climate.copernicus.eu/fire-weather-index).

The main practical comparison is mapped burn groups caught at that fixed budget. We also report ordinary accuracy, average precision, ROC AUC and radar's ranking within an identical weather grid and date. The always-no-burn accuracy is 99.96%; it catches zero groups. Unknown alert outcomes are reported separately.

## Files and reproduction

All outputs stay local under `apps/compsoc/backend/data/expanded/models/algorithm_comparison/`:

- `frozen_experiment.json`: settings and data fingerprint recorded before fitting.
- `comparison.csv`, `fold_metrics.csv`, `inner_tuning.csv`: all results and tuning evidence.
- `fold_model_selection.csv`: the family and inputs selected within each outer training partition.
- `out_of_fold_predictions.parquet`: predictions used for evaluation.
- `event_alert_results.csv`, `alert_outcomes.csv`: event catches and unknown-outcome counts.
- `selected_model.pkl`: model refitted on all usable rows, with its predictor list.
- `leaderboard.png`, `findings.json`, `summary.json`: chart and measured findings.

```sh
export PEATPULSE_DATA_DIR="$PWD/apps/compsoc/backend/data/expanded"
export PEATPULSE_END_YEAR=2025
uv --directory apps/compsoc/backend run python -m compsoc.peatpulse.compare_algorithms
uv --directory apps/compsoc/backend run python -m compsoc.peatpulse.report_algorithms
```

Run from the repository root. Training uses the local CPU. The existing Random Forest experiment is preserved in `models/grouped_cv/`. No commits or pushes are requested for this work.

## Verification

Verified on 3 October 2026: all 23 tests pass, including equal positive-event weighting, training-only feature scaling and disabling the boosting model's random-row validation split. All three new model families passed real-data fit/prediction smoke checks. Ruff, formatting and Pyright pass. Runtime checks confirm the unchanged data fingerprint, disjoint train/test groups, complete out-of-fold scores, equal total alert budgets, recomputed event catch totals and a saved-model reload within `1e-12`. The leaderboard chart was inspected visually. Everything remains local; no commits or pushes were performed.

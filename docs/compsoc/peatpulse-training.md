# PeatPulse: first local training results

Trained and verified on **3 October 2026**, entirely on this Mac's CPU. Three saved models and historical predictions now exist. **Adding radar produced exactly the same predictions as the stronger weather model in this run. No improvement has been demonstrated.**

## What was trained

| Model          | Inputs                                                                                                |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| Basic weather  | 12 temperature, humidity, wind, rainfall, dryness and season features                                 |
| Strong weather | Those 12 plus CEMS FWI, Drought Code, Duff Moisture Code and Fine Fuel Moisture Code                  |
| PeatPulse      | Those 16 plus eight Sentinel-1 backscatter, anomaly, change, persistence and observation-age features |

All three use the same 50-tree Random Forest, depth 3, minimum 10 rows per leaf, balanced classes and seed 42. Positive rows are weighted so each positive cell episode contributes equally. Features, settings and the one-cell-per-day inspection budget were fixed before inspecting results; no tuning was performed on the later years. The [Random Forest documentation](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestClassifier.html) describes the estimator.

The target is **a new satellite-mapped burn within the next seven days**, with at least 24 hours of conservative lead time and the coverage/exclusion rules in the [outcome audit](peatpulse-outcomes.md). It can include managed burning. The independently documented wildfire cases are replayed separately; their unknown outcomes are never converted to negative training examples.

## Actual sample

45 sampled 1 km cells in Highland, Scotland, during 2018–2024. A row is one cell on one day. Complete inputs and an eligible provisional outcome give:

| Split      | Years     |   Rows | Positive rows | Positive cell episodes |
| ---------- | --------- | -----: | ------------: | ---------------------: |
| Training   | 2018–2021 | 32,199 |             5 |                      3 |
| Validation | 2022      |  7,632 |             0 |                      0 |
| Test       | 2023–2024 | 17,027 |             0 |                      0 |

All positive examples come from locations selected using known historical burn cases. The independently sampled geography has no positive examples. These are feasibility models; the sample does not represent a validated operational population.

We also score rows with unknown outcomes. Predictions are available for **112,995 of 115,065 cell-days**; 2,070 have missing comparison inputs. Every method uses the same input-complete candidate cells. Future labels and observation coverage do not determine which cells can receive a score or daily priority. Ties use a fixed cell/date hash.

## What happened

- **Strong weather and PeatPulse scores are identical across all scored rows**: maximum absolute difference 0. All eight radar features have zero tree-split importance in this fit. That describes this tiny sample and model, not the usefulness of radar generally.
- Test ROC AUC and average precision are **undefined** because there are no eligible satellite-positive test rows. Training AUCs in the machine-readable output are explicitly marked as in-sample diagnostics; they are not an accuracy headline.
- At one cell per day, none of the methods prioritised the separately documented **Glenuig 2023** case in its eligible pre-event window. Basic weather's best daily rank was 5; strong weather and PeatPulse ranked it 14 at best. This is only one held-out case.
- All learned models prioritised **West Halladale on 6 May 2019**, 130 hours before the lower bound of its reported event day. This is a **training-period replay**, not independent evidence of advance detection. Skail was not prioritised.
- The raw CEMS FWI is included as a fourth ranking reference. This compares against a published fire-weather index, not a reconstruction of a government's complete operational warning service.

Scores are **uncalibrated model scores**, not real-world fire probabilities. Reported event days/response intervals are not exact ignition times. Weather reanalysis and assumed radar availability support a historical reconstruction, not a verified real-time warning claim. No avoided emissions or improved wildfire detection can be claimed from this run.

## Saved outputs

All are local under `apps/compsoc/backend/data/models/local_rf/` and excluded from Git:

| File                                                       | Use                                                                                                  |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `basic_weather.pkl`, `strong_weather.pkl`, `peatpulse.pkl` | Saved models with their feature lists; approximately 302 KB each                                     |
| `predictions.parquet`                                      | Every original row, outcome, score, rank and daily priority, including explicit missing-input states |
| `comparison.csv`                                           | Identical-budget comparison and split counts; unavailable metrics stay blank                         |
| `verified_event_replay.csv`                                | Separate results for the three documented wildfires                                                  |
| `demo_replay.csv`, `fire_replay.png`                       | Historical case windows for a demo and a readable figure                                             |
| `training_feature_importance.csv`                          | In-sample feature diagnostic                                                                         |
| `summary.json`                                             | Parameters, timings, data/code fingerprints, counts and limitations                                  |

The three fits took **0.87 seconds combined**, prediction/ranking 0.47 seconds, and the full run with report generation 2.38 seconds on this machine. These timings exclude data acquisition and preprocessing. No GPU or cloud training was used.

## Reproduce and use the models

From the repository root:

```sh
uv --directory apps/compsoc/backend run python -m compsoc.peatpulse.train
```

Score an existing input-only table with the saved models:

```sh
uv --directory apps/compsoc/backend run python -m compsoc.peatpulse.train \
  --score-only data/processed/model_inputs.parquet \
  --output data/models/local_rf/inference_check.parquet
```

Paths in that command are relative to the backend directory. The input needs `cell_id`, `date` and the 24 named predictors; labels are not required. Generate new features with the same units, seasonal training baseline and time cutoffs. Load only trusted local pickle files.

## Verification and remaining limit

All **15 tests pass**, including chronological training selection, unknown-label exclusion, label-independent scoring, identical daily budgets and undefined single-class metrics. Project Python lint, formatting and type checks pass. Reloaded models reproduce all 115,065 stored prediction/status rows exactly; data and training-code fingerprints match. The case plot was visually inspected.

Commit: local working changes based on `2d630af`. The project-wide gate is blocked by the separate map preview's bundled `map-preview/vendor/leaflet.js` lint errors/warnings. No lint rule was disabled; commit/push remains pending that gate.

The next data improvement is additional independently reviewed burn events across a wider sampled area, including positives in later years. Preserve this first result when expanding the dataset; the already-inspected Glenuig case is no longer a fresh test for subsequent tuning.

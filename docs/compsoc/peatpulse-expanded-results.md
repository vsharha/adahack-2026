# PeatPulse: expanded local experiment

## Question

Can weather and Sentinel-1 radar rank Scottish peatland cells with satellite-mapped burning in the next seven days better than directly ranking the same cells by Copernicus Fire Weather Index?

The secondary question, set before fitting, is whether radar distinguishes burning and quiet patches **within the same weather grid on the same day**. This tests local targeting when weather cannot distinguish the patches.

## Result

**The weather + CEMS model is the strongest version in this experiment.** At the fixed budget it alerted on **6 of 25 mapped burn groups**, compared with **2 of 25 for raw FWI**. That is four additional groups, or three times the observed count in this sample. Adding radar alerted on 3 of 25 groups and reduced performance relative to the trained weather model.

| Method                 | Burn groups alerted | Ordinary accuracy | Mean fold ROC AUC | Mean fold average precision |
| ---------------------- | ------------------: | ----------------: | ----------------: | --------------------------: |
| Raw Copernicus FWI     |              2 / 25 |            98.46% |             0.629 |                    0.000846 |
| Basic weather model    |              0 / 25 |            98.53% |             0.786 |                    0.003229 |
| Weather + CEMS model   |          **6 / 25** |        **98.53%** |         **0.815** |                **0.006298** |
| Weather + CEMS + radar |              3 / 25 |            98.53% |             0.763 |                    0.003350 |

All methods issued 14,256 alerts across the five held-out folds. Accuracy uses only rows with usable outcomes. Always predicting no burn achieves **99.96% accuracy and catches zero burn groups**. Ordinary accuracy therefore does not demonstrate useful burn detection here. Average precision is also low in absolute terms; the system still produces many alerts without a matched subsequent burn.

The separate same-weather patch test includes **17 burn groups**. Radar's average pair-ranking score is **45.5%**, versus **50%** for the tied weather and FWI scores. This result does not support the proposed radar-localisation advantage.

### Pitch supported by this run

“We trained a peatland burn-ranking model using historical satellite burn maps and weather. In grouped testing, the weather + CEMS version flagged six of 25 mapped burn groups, versus two for directly ranked FWI at the same alert budget. The weather + CEMS version is our best-performing candidate; adding radar did not improve it.”

This result applies to the 25 mapped burn groups in this benchmark. They are not all independently verified wildfires, and a warning before a cell burns can occur after another part of the same group has started burning.

The weather + CEMS gain in group recall is 16 percentage points. A paired bootstrap over the 22 linked positive validation groups gives an approximate 95% interval of **+3.7 to +33.3 percentage points**, conditional on these predictions and this sample. This does not include uncertainty from retraining or deploying elsewhere. Five of its six successful alerts precede the earliest conservative mapped-burn interval in their group by at least 24 hours. Median conservative lead to the alerted cell's burn interval is 47 hours.

There are **6,609 alerts with unknown outcomes** for the strongest model, versus 6,236 for FWI. These are not counted as confirmed false alarms or successes. The strongest model has six positives among 7,647 alerts with usable outcomes, so the current one-alert-per-day policy remains unsuitable for operational use without better targeting and threshold evaluation.

## Saved deliverables and verification

- `data/expanded/processed/training_ready.parquet` and `.csv.gz`: the complete usable dataset.
- `data/expanded/processed/dataset_examples.csv`: readable examples from every eligible burn group and ten quiet rows.
- `data/expanded/models/grouped_cv/strong_weather.pkl`: the strongest model version, refitted on all usable rows; the basic-weather and radar versions are also saved.
- `data/expanded/models/grouped_cv/out_of_fold_predictions.parquet`: held-out scores for the common candidate population.
- `data/expanded/models/grouped_cv/comparison.csv`, `fold_metrics.csv`, `inner_tuning.csv`, `event_alert_results.csv`, `alert_outcomes.csv` and `uncertainty.json`: complete comparison evidence.
- `data/expanded/models/grouped_cv/comparison.png`: presentation chart.

Paths above are relative to `apps/compsoc/backend/`. Models run on the local CPU and are approximately 4.6–4.7 MB each. Scores are uncalibrated ranking scores. Use the saved bundle's feature list when running inference.

Verified on 3 October 2026: all 20 tests pass; unique joins, observation coverage, feature cutoffs, group separation, complete out-of-fold scoring and saved-model reloads are checked. Parallel tree prediction can differ at machine-rounding precision; reload verification uses an absolute tolerance of `1e-12`. Project Python checks pass. The complete project gate is blocked by the separate map preview's bundled Leaflet file (one lint error, 363 warnings). Changes remain local on base commit `bda1258`; nothing was committed or pushed past that failure.

## Dataset

The frozen sample has **346 cells, each 1 km across**, spanning Scotland during 2018–2025. It retains every discovered burned cell, one geographically selected comparison cell per candidate burn group, and the original 45 audit cells. It is a sample enriched with historical burns; its prevalence does not estimate the prevalence of fire across Scotland.

The complete panel has 1,011,012 cell-days. After outcome, timing and input checks, **535,473 rows from 342 cells** are usable: **218 positives and 535,255 provisional negatives**. The positives cover 119 distinct cells and 25 mapped burn groups, linked into 22 validation groups. All 65 validation groups, including groups with only quiet observations, are divided into five folds. There are 82 positive rows before the earliest mapped burn interval of their group; 136 may represent subsequent spread. These counts do not represent 218 independent fires.

- **Inputs:** trailing ERA5 temperature, humidity, wind, vapour-pressure deficit, precipitation and dry spells; season; CEMS FWI, drought code, duff moisture code and fine-fuel moisture code; same-orbit Sentinel-1A VV/VH backscatter and changes.
- **Radar timing:** historical observations only, with a 48-hour assumed delivery delay and an 18-day age limit. Anomalies use the preceding 90 days, excluding the current scene, with at least three earlier observations. Radar measures backscatter, not underground moisture directly.
- **Outcome:** a quality-qualified MODIS MCD64A1 mapped-burn interval entirely inside the next seven days, with at least 24 hours of conservative lead time to that cell's burn interval. Missing observations remain unknown. Observation-qualified no-mapped-burn windows are provisional negatives.
- **Checks on negatives:** recent burns and contradictory nearby thermal or dated burn evidence exclude uncertain negatives. The separately reviewed wildfire target remains available; most satellite burn groups do not have individually verified wildfire type.

Cells from one burn remain distinct rows. Connected burn groups and shared mapped extents link their cells and comparison cells into validation groups. A whole cell's history stays in the same fold.

### Actual example rows

A row is a 1 km cell on an issue date. Outcome 1 means a qualified mapped burn in the next seven days; 0 means observation-qualified no mapped burn.

| Cell              | Date       | Temperature C | Rain, previous 7 days, mm |  FWI | Outcome |
| ----------------- | ---------- | ------------: | ------------------------: | ---: | ------: |
| BNG_112000_899000 | 2019-03-31 |           8.5 |                       4.4 | 0.69 |       1 |
| BNG_128000_848000 | 2019-04-20 |          12.0 |                       4.2 | 3.40 |       1 |
| BNG_152000_666000 | 2018-07-05 |          13.5 |                       0.0 | 8.80 |       1 |
| BNG_242000_965000 | 2020-04-06 |           8.3 |                      20.7 | 2.11 |       0 |
| BNG_283000_952000 | 2021-10-19 |          14.3 |                      10.4 | 0.12 |       0 |

## Models and comparison

Three local Random Forest models use identical eligible rows:

1. Basic weather: 12 predictors.
2. Weather plus CEMS indices: 16 predictors.
3. PeatPulse: those 16 predictors plus eight radar predictors.

The fourth method is the published CEMS FWI value itself, ranked directly. FWI is an established fire-danger reference, not a classifier trained for this exact satellite-burn label. This experiment does not score SFRS regional assessments.

Grouped outer cross-validation produces every reported prediction. Within each outer training partition, up to three inner group folds select between a shallow 50-tree forest and a deeper 100-tree forest by average precision. All three learned models receive the same tuning budget. Positive weighting gives each mapped burn group equal total influence. Inner fitting keeps all positives and at most 50,000 quiet rows; outer fitting uses all eligible training rows.

The alert budget is **one cell per day per held-out fold**. Every method sees the same input-complete candidates, including those with unknown outcomes; a shared deterministic rule breaks ties. We report unknown-outcome alerts separately. Final models refitted on all eligible rows are saved for inference; their fitted scores are never used as test results.

Ordinary accuracy is also reported: an alerted cell predicts a burn and all other cells predict no burn, scored on rows with usable outcomes. The always-no-burn accuracy provides context for the many quiet days. This shared alert policy makes the accuracy comparison consistent with the FWI reference.

The same-weather metric compares positive and quiet cells sharing an exact weather-grid identifier and date within a held-out fold. A correct ordering scores one, a tie one-half. We average within each positive row and then within each event, followed by an equal-event average. Weather-only methods necessarily tie on these pairs. Confidence intervals resample linked validation groups, preserving dependence between related events.

## Reproduce locally

Run from the repository root with the existing Earth Engine authentication:

```sh
uv --directory apps/compsoc/backend run python -m compsoc.peatpulse.expand --project anybrew-7c6c1 --national
uv --directory apps/compsoc/backend run python -m compsoc.peatpulse.expand --project anybrew-7c6c1 --prepare
uv --directory apps/compsoc/backend run python -m compsoc.peatpulse.expand --project anybrew-7c6c1 --run
export PEATPULSE_DATA_DIR="$PWD/apps/compsoc/backend/data/expanded"
export PEATPULSE_END_YEAR=2025
uv --directory apps/compsoc/backend run python -m compsoc.peatpulse.train_cv
uv --directory apps/compsoc/backend run python -m compsoc.peatpulse.report_cv
```

Downloads are cached. Data, fitted models and generated figures remain local under `apps/compsoc/backend/data/expanded/`. The original 45-cell experiment is preserved.

## Scope of the evidence

This is a retrospective comparison across sampled locations and years. It does not establish live forecasting performance, calibrated fire probabilities, underground drying detection, wildfire ignition prediction or avoided emissions. Satellite burns can include managed burning and fire spread. A later-period operational test and independent incident labels would be needed for those claims.

Sources: [Copernicus FWI](https://climate.copernicus.eu/fire-weather-index), [MODIS burned-area documentation](https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MCD64A1), [NatureScot burn extents](https://services1.arcgis.com/LM9GyVFsughzHdbO/arcgis/rest/services/Scottish_Wildfire_and_Muirburn_Extents/FeatureServer/0), [SFRS regional assessments](https://www.firescotland.gov.uk/outdoors/wildfires/wildfire-danger-assessments/). Sources inspected on 3 October 2026.

# PeatPulse: downloaded data and first audit

**Scope:** Highland council area, 2018–2024. Downloaded and analysed on 3 October 2026. This is a data-feasibility audit, with real observations and no measured fire-prediction improvement.

## Open the result

- Visual report: `apps/compsoc/backend/data/report/index.html`
- Model input table: `apps/compsoc/backend/data/processed/model_inputs.parquet`
- Portable table: `apps/compsoc/backend/data/processed/model_inputs.csv.gz`
- Feature definitions: `apps/compsoc/backend/data/processed/feature_dictionary.csv`
- Source URLs, requests and hashes: `source_manifest.json` in the processed folder.
- Every cached raw file and its hash: `raw_file_inventory.json` in the processed folder.
- Validation results: `apps/compsoc/backend/data/report/validation.json`

Downloaded data and generated reports are local and excluded from Git. The pipeline and this explanation are committed; teammates can reproduce the downloads.

## What is in the dataset?

The screen contains **10,787 fixed 1km cells** with at least 50% coverage by NatureScot's Class 1/2 priority peat map. The initial extraction uses **45 cells**: 32 selected for geographical coverage, 12 selected as descriptive burn cases, and one Forsinard context cell. These map to **41 weather sampling locations**.

The resulting table has one row per cell per day: **115,065 rows** over 2,557 days. This sample checks feasibility and feature quality. It is not the full evaluation population; the burn-case locations must not be used to estimate population fire prevalence or headline performance.

| Source                                                                                                                                                 | Actual data obtained                                                                                              | Use and limitations                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Open-Meteo ERA5](https://open-meteo.com/en/docs/historical-weather-api)                                                                               | Hourly temperature, relative humidity, wind, precipitation and vapour-pressure deficit at 41 locations, 2017–2024 | Basic weather; 2017 supplies trailing-window and index warm-up. Approximately 0.25° weather, not independent 1km observations.                                                                                                                                                                       |
| [CEMS via Climate Engine](https://www.climateengine.org/datasets/hazards/cemsfire_daily_800/)                                                          | FWI, DC, DMC and FFMC from `projects/climate-engine-pro/assets/ce-cems-fire-daily-4-1`                            | Selected historical weather-index baseline. 2,554 usable days; missing 5 December 2023, 8 August 2024 and 9 December 2024. The 2023 image is listed but its backing file is unreadable. Leave these gaps blank. Source documentation conflicts on start date, so use the actual collection coverage. |
| [Sentinel-1 GRD](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S1_GRD)                                                        | 10,083 area-scene records; 10,080 pass the coverage rule                                                          | Sentinel-1A, descending, relative orbit selected using 2018–2021 coverage. All selected cells use orbit 125. VV/VH medians over each peat footprint, sampled at 30m. Adjacent swath slices are deduplicated before daily joining.                                                                    |
| [NatureScot peat mapping](https://gis-downloads.nature.scot/)                                                                                          | 25,309 Class 1/2 polygons in the Highland bounding box; 16,819 intersect the council boundary                     | Fixed 2016 land mask and peat fraction. Priority peat presence does not establish that a later fire burned the peat itself.                                                                                                                                                                          |
| [NatureScot burn catalogue](https://services1.arcgis.com/LM9GyVFsughzHdbO/arcgis/rest/services/Scottish_Wildfire_and_Muirburn_Extents/FeatureServer/0) | 358 dated Highland records in 2018–2024; 291 overlap priority peat; 172 candidate groups                          | Includes unresolved wildfire/muirburn and uncertain date meanings. **Zero primary verified wildfire labels.** Connected grouping within 1km and seven recorded days only creates a review list.                                                                                                      |
| [NASA FIRMS in Earth Engine](https://developers.google.com/earth-engine/datasets/catalog/FIRMS)                                                        | 372 MODIS raster detections inside Highland, confidence ≥80, 2018–2024                                            | Corroborating thermal observations. Rasterized near-real-time product; observations are not distinct fire events, proof of wildfire, or ignition timestamps. No hotspots enter prediction features.                                                                                                  |
| [CentrePeat Forsinard field archive](https://zenodo.org/records/11186744)                                                                              | 44 water-level sensors; 56,299 nonmissing readings after QC 0/1; 16,996 site/treatment days with ≥2 sensors       | Independent supporting hydrology evidence. QC 2 sensors are excluded. Group averages are correlated; treatment differences are not causal estimates.                                                                                                                                                 |
| NatureScot peat surveys                                                                                                                                | 189 survey points in 6 of 45 audit cells                                                                          | Too patchy for the initial common feature set. Many surveys postdate training years. A historical as-of join would be required before use.                                                                                                                                                           |

The table above records the initial input audit. The subsequent [outcome join](peatpulse-outcomes.md) adds provisional satellite labels and independently reviewed wildfire events for the existing sample; use that report for current output counts.

## Initial feature list

**Basic weather model:** noon temperature, humidity, wind, atmospheric drying demand, preceding 24-hour/7-day/30-day precipitation, dry-spell length and seasonal sine/cosine. Seven-day temperature and drying-demand averages are ablation candidates.

**Strong weather model:** the basic weather inputs plus the four historical CEMS indices. CEMS FWI also supplies a directly ranked reference, without a learned classifier.

**Land-controlled model:** the strong weather inputs plus mapped peat fraction. Additional peat depth, restoration and drainage history remain deferred until dated coverage is established.

**PeatPulse:** the same weather and land controls plus VV/VH seasonal anomalies, pass-to-pass changes, persistence over three passes, and age/availability of the last radar observation. Raw VV/VH and pass gap remain diagnostic/ablation candidates. A negative radar change does not by itself prove drying.

Locally reconstructed xclim FWI-family indices are retained as diagnostics. The selected reference is the historical CEMS collection. The reference represents the established FWI method, not the actual warnings issued by Scottish authorities.

## Timing and missing data

- Daily issue time is **13:00 UTC**; weather windows end at **12:00 UTC**. No future observed weather enters those windows.
- Radar observations are joined backwards with an **assumed 48-hour availability lag**. Signal features become missing when the acquisition is over **18 days old**.
- Radar seasonal medians and orbit selection use **2018–2021 only**. Future test-year observations do not set these transformations.
- Train: 2018–2021; validation: 2022; test: 2023–2024. The last seven days before each outcome/split boundary are excluded from later scoring.
- Historical ERA5/CEMS and retrospectively processed radar support a **hindcast**. Their original delivery times are not established, so this is not proof of operational warning lead time.
- No future burn perimeter defines a predictor footprint. Descriptive case selection is explicitly marked and excluded from correlation analysis.
- Missing fire evidence remains unknown: `fire_next_7d` is blank everywhere. Unrecorded fires cannot safely be encoded as negatives.

## What the visuals tell us

The report includes a study map, a weather/radar timeline around a training-period recorded burn, input completeness by location, actual water levels and feature correlations.

Spearman correlations use the 32 geography-selected locations and training years only. Joint weather/radar analysis keeps one row per cell/overpass so repeated daily radar values do not create repeated evidence. Weather-only correlations count each weather location/day once. A second matrix removes each cell/month median to reduce shared seasonal/site patterns. Rows remain spatially and temporally dependent; no independence-based significance claim is made.

High correlation suggests a controlled removal test, not automatic feature deletion. Low correlation does not establish predictive value. Compare the same small model with and without each feature family once labels are defensible.

## What remains before an accuracy comparison

1. Review candidate events: wildfire versus managed burn, duplicate identity, earliest credible onset, source evidence and mapped-peat overlap.
2. Establish observation coverage and defensible negative examples; source absence alone is insufficient.
3. Extract the full agreed evaluation population or define a documented sampling design with appropriate weights. The 45-cell feasibility sample cannot support a population risk claim.
4. Freeze the warning budget on validation data. Compare CEMS FWI, weather, weather plus land, and weather plus land plus radar on identical unseen events. Publish event counts alongside percentages.

## Reproduce

Run from the repository root. Earth Engine must already be authenticated and the chosen project registered. Credentials stay in the local Earth Engine credential store and must never enter Git.

```sh
uv sync --directory apps/compsoc/backend
uv --directory apps/compsoc/backend run python -m compsoc.peatpulse.fetch
uv --directory apps/compsoc/backend run python -m compsoc.peatpulse.spatial
uv --directory apps/compsoc/backend run python -m compsoc.peatpulse.field
uv --directory apps/compsoc/backend run python -m compsoc.peatpulse.weather --project YOUR_EE_PROJECT
uv --directory apps/compsoc/backend run python -m compsoc.peatpulse.radar --project YOUR_EE_PROJECT
uv --directory apps/compsoc/backend run python -m compsoc.peatpulse.thermal --project YOUR_EE_PROJECT
uv --directory apps/compsoc/backend run python -m compsoc.peatpulse.validate
uv --directory apps/compsoc/backend run python -m compsoc.peatpulse.report
uv --directory apps/compsoc/backend run python -m unittest discover -s tests -v
```

Downloads are cached and rerunnable. Public provider limits can make a fresh run slow. Generation time, Earth Engine extraction time and later local model-scoring time are separate quantities.

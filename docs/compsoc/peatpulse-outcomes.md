# PeatPulse: matched outcomes

Built and checked **3 October 2026**. Every one of the **115,065 rows** now has an outcome record with an evidence status. Unknown outcomes remain blank. This is the original **45 cells, each 1km × 1km, across Highland, Scotland, during 2018–2024**.

## What we now have

| Output                                                       | Positive rows | Negative rows | Unknown rows |
| ------------------------------------------------------------ | ------------: | ------------: | -----------: |
| Provisional satellite burn in the next seven days            |             7 |        57,353 |       57,705 |
| Independently verified wildfire event in the next seven days |            16 |             0 |      115,049 |

**A positive row is a forecast date for a location, not another independent fire.** The satellite extraction contains **seven burned pixel records in four cell episodes**. Independent reports verify **three wildfire events** intersecting our cells. The two targets overlap and must not be added together.

**The label pipeline is complete for the current sample; the sample is too sparse for a credible model comparison.** No satellite positives survive the rules in validation (2022) or test (2023–2024). All positive examples occur at locations deliberately selected from known burn cases. The geography-selected sample contains no positives. Expand the geographic sample and independently review more events before claiming predictive improvement. [The first local models](peatpulse-training.md) are now trained; adding radar produced no improvement over strong weather in this run.

## Open the data

All paths below are relative to the repository root. Downloaded tables remain local and are excluded from Git.

- **Inputs and both outputs:** `apps/compsoc/backend/data/processed/model_dataset.parquet`, with a compressed CSV copy `model_dataset.csv.gz`.
- **Easy examples:** [labelled_examples_readable.csv](../../apps/compsoc/backend/data/processed/labelled_examples_readable.csv).
- **All 45 map points and their output counts:** [cell_outcome_summary.csv](../../apps/compsoc/backend/data/processed/cell_outcome_summary.csv).
- **Outcomes only, every row:** `labels_daily.parquet` and `labels_daily.csv.gz` in the same folder.
- **Verified events and sources:** [verified_wildfire_events.csv](../../apps/compsoc/backend/data/processed/verified_wildfire_events.csv).
- **Review of all 17 catalogue records intersecting the sample:** [burn_record_reviews.csv](../../apps/compsoc/backend/data/processed/burn_record_reviews.csv).
- **Counts, allowed predictors and validation:** [label_summary.json](../../apps/compsoc/backend/data/processed/label_summary.json).

The original `model_inputs.parquet` is preserved. Rebuilding inputs requires rerunning the label join; the summary stores the input file's SHA256 to detect stale outputs.

## Independently verified fires

| Event                           | Our matching cell   | Date evidence                                                                                                           | Source                                                                                                                                                                                                                                                                  |
| ------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Skail / Strath Naver, 2018      | `BNG_265000_949000` | Reported start: 15 April. Two NatureScot fragments count as one event.                                                  | [Copernicus event report](https://mapping.emergency.copernicus.eu/news/the-copernicus-emergency-management-service-monitors-wildfires-in-northern-scotland/)                                                                                                            |
| West Halladale, 2019            | `BNG_280000_953000` | Independently reported event day: 12 May. Exact ignition time remains unknown.                                          | [JNCC Report 730, printed page 27](https://data.jncc.gov.uk/data/9d119d39-111f-4fcf-966a-b8e98b0e6b6f/jncc-report-730.pdf)                                                                                                                                              |
| Glenuig / Kinloch Moidart, 2023 | `BNG_168000_777000` | Reported response: 19–21 April. Retain the whole interval; the catalogue's 21 April date is not assumed to be ignition. | [Local reporting with resident testimony](https://westword.org.uk/may2023.html); [FBU report, page 7](https://www.fbu.org.uk/sites/default/files/21018%20OPT%203%20FBU%20Wildfire%20Scorched%20Firefighters%20and%20resilience%20of%20wildfire%20%283%29%20%281%29.pdf) |

The geographic association uses the named/date-matched NatureScot event extent intersecting the cell's mapped peat. It does not establish the time the fire reached each individual cell or prove subsurface peat combustion. `verified_wildfire_next_7d` means that a verified event affecting the cell has its **reported event-day interval** inside the prediction window. This is a retrospective event target with documented timing limits. Missing event reports cannot establish verified wildfire negatives, so this column has **1 or unknown**, never an invented zero.

Internet research also identified a date trap: [JNCC Report 682, printed page 2](https://data.jncc.gov.uk/data/c7d28386-f917-4de9-9293-da2d93bdab27/JNCC-Report-682-FINAL-WEB.pdf) describes Skye mapping between images on **25 February and 17 March 2018**. The three selected Skye records carrying 25 February match the pre-fire image date. Their individual fire type and ignition date remain unresolved; they do not supply dated positive labels.

## How the satellite target works

Source: [NASA MODIS MCD64A1 Collection 6.1 in Earth Engine](https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MCD64A1), using `BurnDate`, `Uncertainty`, `QA`, `FirstDay` and `LastDay`. [NASA's user guide](https://modis-land.gsfc.nasa.gov/pdf/MODIS_C61_BA_User_Guide_1.0.pdf) defines the quality bits and date fields.

1. Extract native MODIS pixel centres inside the mapped peat part of each cell. The nominal product resolution is 500m; grid spacing is approximately 463m. There are **151 cell/pixel combinations across 44 cells**, and **12,986 monthly observations**, including December 2017 and January 2025 for boundary checks. One cell (`BNG_176000_828000`) contains no native pixel centre inside its fragmented peat footprint.
2. A provisional negative requires usable mapping for **every included native pixel on all eight calendar dates touched by the 13:00 UTC, 168-hour forecast window**. Require land, valid reflectance observations, no special unburned QA condition, and days inside the reliable mapping interval. Partial coverage remains unknown. Pixel centres provide a coarse sampled footprint; they do not establish observation of every square metre.
3. Earth Engine returns masked `BurnDate` values at many non-detections even when QA is 3. The raw mask is preserved as `-9999`. A provisional zero means **no mapped burn under the QA/date coverage rule**; it does not mean that the source explicitly returned an unburned zero, nor prove there was no small or undetected fire. Missing or invalid QA cannot create a negative.
4. Expand estimated burn dates by the supplied uncertainty on each side, including the entire last day. This is an explicit screening buffer, not a statistical confidence interval. Group overlapping/nearby intervals within a cell into episodes. Assign 1 only when the entire episode interval fits after issue time and before the horizon ends. Boundary-overlapping intervals remain unknown.
5. Remove rows during or within 30 days after known/possible burning. Nearby FIRMS detections within 1km of the peat footprint veto unsupported negatives and recent-event rows. FIRMS is corroborating evidence, partly shared with MODIS, not an independent wildfire truth source.
6. NatureScot burn records veto negative labels within ±30 recorded days; spring-labelled Skye cases use January–June because the catalogue timing is unresolved. These deliberately conservative review buffers are documented assumptions. They do not generate positive wildfire labels.

Managed burns may be present in the satellite target. Neither target measures unusual heat or soil drying directly.

## Input/output pairs and splits

| Split            | All rows | Satellite positive | Satellite negative | Satellite unknown | Verified wildfire positive |
| ---------------- | -------: | -----------------: | -----------------: | ----------------: | -------------------------: |
| Train, 2018–2021 |   65,745 |                  7 |             32,251 |            33,487 |                         12 |
| Validation, 2022 |   16,425 |                  0 |              7,889 |             8,536 |                          0 |
| Test, 2023–2024  |   32,895 |                  0 |             17,213 |            15,682 |                          4 |

Requiring at least **24 hours of conservative lead time** for positives and excluding the existing split-boundary windows leaves **57,358 provisional labelled pairs**, including **five positive rows**. Requiring every listed weather, CEMS and radar predictor to be present leaves **56,858 complete pairs**, still with five positives. These figures describe data availability; they do not make the sample adequate for fitting or evaluating a useful fire classifier.

`exploratory_training_pairs.parquet` retains the original split and sample-role columns. Keep the known-burn case sample separate in reporting. Use `model_feature_columns.json` as the predictor allowlist: outcome coverage, review status, event IDs, future observations and label eligibility are **never model inputs**. Comparisons must use the same eligible rows and account for repeated days from one event.

## Reproduce and check

From the repository root, with the existing Earth Engine account:

```sh
uv --directory apps/compsoc/backend run python -m compsoc.peatpulse.burned_area --project anybrew-7c6c1
uv --directory apps/compsoc/backend run python -m compsoc.peatpulse.labels
uv --directory apps/compsoc/backend run python -m unittest discover -s tests
pnpm check:compsoc
```

The extractor caches nine annual requests. The join verifies all 115,065 unique cell/date keys, negative observation coverage, recent-burn exclusions, event references and raw download checksums. Eleven tests cover weather timing, absent observations, partial spatial coverage, shortened mapping periods, date uncertainty, year boundaries, episode grouping and separation of satellite negatives from verified wildfire truth. Project Ruff/Pyright checks pass.

The repository-wide check currently stops on an unrelated Optiver line-length error in `apps/optiver/backend/src/optiver/__main__.py:81`. The separate map preview also previously failed the root lint gate. No files from those areas were changed. Commit/push remains pending the repository gate.

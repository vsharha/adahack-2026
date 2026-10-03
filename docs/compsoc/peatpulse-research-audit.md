# PeatPulse research audit

Checked **3 October 2026**. This audit supports the rewritten [project plan](peatpulse-plan.md). It distinguishes published findings, our source-file checks, and hypotheses that remain to be tested. No satellite model or operational alert has been validated in this task.

## Scope update following the user's clarification

The user clarified on **3 October 2026** that the headline experiment must compare historical actual-fire prediction using weather alone with the same prediction using extra peat observations. The current [plan](peatpulse-plan.md) adopts that outcome. The earlier inspection-focused proposal is preserved as a [supporting hydrology experiment](peatpulse-hydrology-study.md). The audit below records why its scientific precautions still matter; its inspection-only scope has been superseded.

### Newly checked fire evidence

The public [NatureScot Scottish Wildfire and Muirburn Extents layer](https://services1.arcgis.com/LM9GyVFsughzHdbO/arcgis/rest/services/Scottish_Wildfire_and_Muirburn_Extents/FeatureServer/0) was queried directly on 3 October 2026. `where=1=1&returnCountOnly=true` returned **20,587 polygons**. `REC_DATE IS NOT NULL` returned **1,163**. These are record counts, not independent wildfire events or eligible peatland fires. Source grouping returned 940 EFFIS records, 15 JHI records, 219 NatureScot manual records and 19,413 automated records across two spelling variants.

The fields include `NAME`, `SOURCE`, `REC_DATE`, `PREFIREDATE`, `POSTFIREDATE`, `MONTHYEAR`, `AREA_HA`, `SEASON` and `REGION`. The inspected schema has no explicit wildfire-versus-muirburn class. The publisher warns that satellite availability and staff resources make coverage incomplete. A non-null recorded date does not establish ignition timing.

| Actual queried record | Recorded information                                                                  | Meaning for the experiment                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| OBJECTID 35873        | Caithness and Sutherland; EFFIS; `REC_DATE` 23 March 2022; 13.71944397 ha             | A candidate burn record. Wildfire status, true start time, peat overlap and independence remain unverified. |
| OBJECTID 35880        | Glen Beasdale; NatureScot manual; `REC_DATE` 19 May 2021; 105.4825527 ha              | A named candidate for corroboration; it is not yet an accepted test event.                                  |
| OBJECTID 35286        | Automated; no `REC_DATE`; pre-fire image 19 March 2022, post-fire image 13 April 2022 | A broad observation interval cannot establish a seven-day forecast outcome or precise warning lead.         |

The [FIRMS archive](https://firms.modaps.eosdis.nasa.gov/download/) documents VIIRS S-NPP coverage from January 2012 and NOAA-20 from April 2018, and offers historical downloads. The endpoint was inspected; no authenticated study extract was obtained. FIRMS detects thermal activity that needs interpretation, including possible non-vegetation sources. [NASA explanation](https://wiki.earthdata.nasa.gov/spaces/FIRMS/blog/2025/02/28/425855667/FIRMS%2Bincorporates%2Bstatic%2Bthermal%2Banomalies%2Bdata%2Bto%2Bhelp%2Busers%2Bdifferentiate%2Bbetween%2Bvegetation%2Band%2Bnon%2Bvegetation%2Bfires.).

[EFFIS documentation](https://forest-fire.emergency.copernicus.eu/about-effis/technical-background/rapid-damage-assessment) explicitly distinguishes mapped start/update dates from ignition/extinction. [SFRS research data](https://www.gov.scot/publications/provision-analyses-scottish-fire-rescue-service-sfrs-incident-reporting-system-irs-data-relation-wildfire-incidents/pages/3/) included incident dates and grid coordinates, but public access to that specific table remains unverified. [Published total-fire statistics](https://data.gov.scot/dataset/total_fires) aggregate by area and year and cannot provide the required daily event labels.

This establishes accessible candidate fire records and important label limitations. It does not establish enough eligible independent fires, confirmed non-fire controls, or any predictive improvement. Radar/field drying evidence and fire-outcome evidence remain separate.

## Holes in the earlier inspection-focused proposal

| Hole                                                                         | Why it changes the project                                                                                                                                   | Correction in the rewritten plan                                                                                                                                |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The novelty was mainly “radar + weather + restoration + a map.”              | Radar wetness, drought recovery, restoration classes, control comparisons and decision dashboards already exist.                                             | Make the contribution a measurable improvement in choosing two inspection destinations, and test the added local-control features against a strong radar model. |
| The weather baseline was too easy to beat.                                   | Rain minus evapotranspiration does not represent all existing fire-weather approaches. Drought and Duff Moisture Codes explicitly retain drying information. | Include persistent moisture indices and VPD where available; distinguish our baseline implementation from official warnings.                                    |
| “Dry despite rain” was treated as inherently surprising.                     | Recent rain changes surface scattering; subsurface response can lag normally. Existing drought methods already contain memory.                               | Measure departure from each plot's normal behavior; treat rain at acquisition as a confounder.                                                                  |
| Arbitrary neighboring “twins” could be misleading.                           | Neighbors can differ in vegetation, slope, drainage, baseline wetness or radar geometry. Selecting peers after seeing an event biases the result.            | Use documented slope-matched experimental controls, selected before evaluation. Treat the paired feature as a testable addition.                                |
| A control-only difference can hide a widespread drought.                     | Target and control may dry together, producing little difference.                                                                                            | Keep the target's absolute seasonal anomaly and weather features alongside the paired features.                                                                 |
| Water level, surface wetness and fire probability were too easy to conflate. | C-band surface sensitivity, water-table depth and combustion thresholds describe different physical quantities.                                              | Primary result is a water-table anomaly. Surface moisture is a separate corroboration subset. Fire prediction is outside the validated claim.                   |
| Deep peat was implicitly pushed up the risk list.                            | Peat depth can describe material present, but greater depth is not a universal indicator of ignition or burn severity.                                       | Remove monotonic depth weighting. Use dated depth measurements as context, with no emissions calculation.                                                       |
| A long field time series looked like a large independent test set.           | Nearby loggers and successive days are correlated. Multiple pixels can represent one patch.                                                                  | Aggregate replicates into plot groups; report distinct episodes, dates and plot counts; use blocked uncertainty estimates.                                      |
| The data were named without inspecting the validation files.                 | Coordinates, quality flags, sensor failure and missing records determine whether a comparison can run.                                                       | Downloaded the primary field archive, read its methods notes, counted usable groups and exposed specific metadata problems.                                     |
| The plan could claim success without proving its proposed contribution.      | Beating weather alone does not show that the extra restoration/control idea helped.                                                                          | Compare standard radar + weather + condition with the same model plus paired features.                                                                          |
| “Early” and “live” were underspecified.                                      | Reanalysis and corrected field observations are retrospective; satellite gaps and processing delay affect warning availability.                              | Present a dated historical replay. Do not claim measured lead time or live readiness.                                                                           |
| The scope scattered effort across too many layers.                           | InSAR history, footpaths, peat depth, hotspots and national mapping introduce different targets and time windows.                                            | Commit the proposed demo to five measured plots, one contribution test and one inspection workflow.                                                             |

## Prior art that narrows our claim

**Drought recovery already exists:** [Lees et al. 2021](https://doi.org/10.1016/j.scitotenv.2020.143312) used Sentinel-1 to study recovery from the 2018 drought in UK peatlands, including the Flow Country, and related lower resilience to drainage. This directly weakens any claim that “radar detects hidden peat drying/recovery” is our invention.

**Restoration-aware radar models already exist:** the [2023 Forsinard study](https://www.mdpi.com/2072-4292/15/7/1900) uses VV/VH, season, year, site and condition categories. Its full results distinguish training RMSE of 2.1 cm from validation RMSE of 4.2 cm, with validation R² of 0.60. It reports difficulty during deep drawdown. Our study should therefore report dry-period performance and not compare our test result against its training figure.

**Control comparisons already exist:** [a 2024 multisensor restoration study](https://doi.org/10.1016/j.rse.2024.114144) compares changes near restoration measures with control areas. We can reuse this experimental principle while claiming a specific inspection-ranking experiment as our contribution.

**The operational baseline is more sophisticated than a rain map:** [CEMS historical fire-danger data](https://ewds.climate.copernicus.eu/datasets/cems-fire-historical-v1?tab=overview) provide Drought and Duff Moisture Codes. The historical reanalysis grid is 0.25°, which differs from current forecast products. [Scottish research covering 92 fires](https://www.sciencedirect.com/science/article/pii/S0048969724028936) identifies VPD and Drought Code as relevant severity predictors. Those are fire-severity findings, not proof that either predicts our field water-table labels, so we will test them on the same label.

**A dashboard is not enough novelty:** [AI2Peat's own demo](https://ai2peat.ie/demo) advertises satellite/sensor condition maps and hydrological services. This is evidence of a neighboring product offering; we did not independently test its accuracy or establish equivalence to PeatPulse.

**Peat depth needs careful interpretation:** [Wilkinson et al. 2020](https://doi.org/10.1088/1748-9326/aba7e8) reports vulnerability of shallow peat in a Canadian landscape. Its numerical relationships should not be imported directly into Scotland, but it disproves the general assumption that greater depth always means greater fire vulnerability. [Experimental combustion research](https://doi.org/10.1071/WF24204) also finds moisture thresholds differ with peat properties; a generic percentile is not an ignition threshold.

## Newly verified field data

Source: [CentrePeat Forsinard archive, DOI 10.5281/zenodo.11186744](https://zenodo.org/records/11186744), version 1. The Zenodo API returned **CC BY 4.0**. The five deposited files were downloaded to a temporary research directory and inspected. The four-page README was also rendered and read, including its two treatment-history tables. The following counts are our calculations from the downloaded CSVs, not model results.

| File                                                         | What the raw file contains                                                                                                 | Use and interpretation                                                                                                                                                                          |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Forsinard_P1_JHI_Odysseys_compiled_2018-2023_forZenodo.csv` | 44 series; 1,892 dated rows, 9 July 2018–12 September 2023; 60,618 nonmissing measurement cells before quality exclusions. | Primary water-table archive. Values are signed metres relative to the peat surface, with negative values below ground.                                                                          |
| `Forsinard_P1_WTD_QCflags.csv`                               | 26 series rated 0, 14 rated 1 and four rated 2.                                                                            | All four `CL-FTW` replicates are flag 2 and excluded from the proposed primary analysis. Flags 0/1 still have measurement uncertainty; the metadata's manual-match description is within 10 cm. |
| `Acclima loggers Forsinard Phase 1 2018-2022_for Zenodo.csv` | 11 series; 1,559 dated rows; 9,048 nonmissing cells before additional screening.                                           | Soil-moisture sensors at 5 cm depth, with uneven coverage. This is not a complete 2018–2022 record at each location.                                                                            |
| `Forsinard_P0_JHI_Odysseys_compiled_2017-2018_forZenodo.csv` | 36 earlier water-table series with a different experimental layout.                                                        | Excluded from the primary experiment to avoid casually stitching different monitoring arrangements together.                                                                                    |
| `README_CentrePeat_Forsinard_WTDandSMC_May2024.docx`         | Methods, units, British National Grid coordinates, treatment definitions, intervention years and control design.           | Establishes the field relationships and measurement limitations.                                                                                                                                |

The Phase 1 experiment covers Cross Lochs (`CL`), Talaheel (`TA`) and Lonielist (`LO`). `CON` groups are the documented slope-matched controls. `EC` is an additional reference that is not slope-matched. These relationships are the useful extra information we can carry into the radar comparison.

### Coverage check used to select the proposed demo

For every daily row, remove `-9999` and quality-2 loggers. Count a target/control pair only when each side has at least two remaining measurements. This yields **9,771 paired plot-days before satellite matching** across six restoration groups over the full archive. It does not yield 9,771 independent events.

| Restoration group | Paired days in 2022 | Proposed primary test           |
| ----------------- | ------------------: | ------------------------------- |
| CL-BCFB           |                 365 | Include                         |
| LO-BCFB           |                 365 | Include                         |
| LO-CT             |                 365 | Include                         |
| LO-FTW            |                 365 | Include                         |
| TA-BCFB           |                 365 | Include                         |
| TA-FTW            |                  94 | Exclude for incomplete coverage |

This supports a concrete five-plot 2022 test with an earlier training/validation period. Radar coverage and the frequency of actual dry episodes remain unknown. Selection based on coverage is documented here before any model scores are inspected.

### Soil-moisture problems we must preserve rather than silently repair

- We counted **288 readings above 100% volumetric moisture**: 287 in `TA-CON` and one in `LO-CON`. These need a documented quality treatment; clipping them to 100 and treating them as validated would hide the issue.
- `LO-CON` and `CL-CON-SMC` share the exact declared coordinate **297241, 946061**, despite different site labels.
- `CL-FTW-SMC` and `CL-BCFB-SMC` share **285877, 945986**, despite different treatment labels.
- The `LO-FTW` soil-moisture coordinate coincides with the water-table file's `LO-BCFB4`, rather than its named FTW group. This may be a metadata or label issue; we have not determined which.
- Coverage varies sharply: `TA-FTW` has only 106 nonmissing days, all in 2018. Several series end before 2022. The README reports equipment problems.

Quarantine unresolved coordinate/label series from spatial validation. Do not guess a correction from a convenient nearby point. Retain raw files and a machine-readable exclusion reason when the pipeline is implemented. These findings make water-table data the practical primary target, with surface moisture as a separate, limited corroboration study.

## What this research has and has not established

We have verified that a small, controlled Scottish field dataset exists and that five treatment/control groups support a year of ground observations. We have also identified genuine prior art and a more demanding comparison for our proposed contribution.

We have not extracted the matched Sentinel-1 pixels, run the models, shown that paired controls improve ranking, established transfer to a new peatland, or tested a real land manager's workflow. Those are the outstanding implementation and adoption questions. The rewritten plan specifies the result and evidence required without presenting a sequence of expanding prototypes.

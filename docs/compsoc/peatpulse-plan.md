# PeatPulse: does observing the peat improve fire warnings?

Updated **3 October 2026** to reflect the user's clarified objective. The main result is a historical fire-prediction comparison. No model performance or warning improvement has been measured. Exact study settings below are proposed implementation choices.

## The result we want to deliver

**Show how many historical fires on Scottish peatland we could have warned about using weather alone, and how many more we could have warned about by adding observations of the peat itself, with the same warning budget.**

The finished product is a historical replay: move to a date before a fire, compare the weather model with PeatPulse, then reveal the recorded fires. Its scorecard reports fires anticipated, alerts without a recorded fire, and warning lead time across the entire unseen test period.

The proposed prediction is: **will a new recorded wildfire affect this peatland area within the next seven days?** Both models predict exactly this outcome. Water-table anomaly prediction provides supporting evidence about one input; fire outcomes determine the main result.

Call the precursor **drying or fuel stress**. Sentinel-1 supplies radar backscatter from which wetness-related signals can be inferred; it does not measure peat temperature. Literal warming requires separate temperature observations. Hot or dry conditions do not inevitably become a fire: ignition and combustible vegetation matter, and Scottish fires also occur in cold, dry weather. [ESA radar application](https://www.esa.int/Applications/Observing_the_Earth/Copernicus/Sentinel-1/Zooming_in_on_drought_from_space), [SFRS explanation](https://www.firescotland.gov.uk/outdoors/wildfires/understanding-wildfires-in-scotland/).

## The contribution we want to prove

**Does observed, persistent peat drying add useful warning information beyond the drying already represented in weather-based fire-danger indices?**

Our hypothesis is that areas under similar weather can have different ground conditions because of vegetation, drainage and restoration history. The useful extra feature could be the mismatch between recent weather and the land's response: a wetness-related signal that remains unusually low despite apparent weather recovery.

Radar wetness, drought recovery and restoration monitoring already appear in published research. The contribution is their measured extra value for advance fire warnings in this Scottish setting. Existing Drought Code and Duff Moisture Code already retain moisture history; weather must not be represented by temperature alone. [Prior-art audit](peatpulse-research-audit.md), [CEMS indices](https://ewds.climate.copernicus.eu/datasets/cems-fire-historical-v1?tab=overview).

## The comparison shown to judges

| Method                 | Information available before the prediction                                                        | Purpose                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Basic weather          | Temperature, rainfall history, humidity/drying demand, wind and season                             | The intuitive weather-only comparison.               |
| Strong weather         | Basic weather plus fire-weather indices, including Drought Code and Duff Moisture Code             | Tests against established drying information.        |
| Weather + land history | Strong weather plus dated peat/vegetation/condition information where verified                     | Separates static geography from additional tracking. |
| **PeatPulse**          | The same inputs plus pre-fire radar anomalies, persistence and recovery relative to seasonal norms | Measures the value of observing changes in the peat. |

Use the same small classifier family, training examples and tuning allowance for the learned models; a shallow 50-tree random forest is the proposed default. Also show a directly ranked fire-weather-index reference. Keep outcome, candidate areas, time cutoffs and warning budgets identical.

Show PeatPulse versus both weather models. Comparison with weather + land history isolates the dynamic tracking contribution. Give weather methods the same radar-eligible subset for the main comparison, and report their broader daily coverage separately.

## Historical fire evidence

The fire outcome needs independently recorded fires, locations and defensible time bounds. Forsinard's water-table archive can validate a drying signal; it cannot supply fire labels or determine the whole fire study's extent.

| Source                                                                                                                                                                                                                      | Role                                                    | Verified status and constraints                                                                                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [NatureScot Scottish Wildfire and Muirburn Extents](https://services1.arcgis.com/LM9GyVFsughzHdbO/arcgis/rest/services/Scottish_Wildfire_and_Muirburn_Extents/FeatureServer/0)                                              | Candidate burned geometries and references              | API queried on 3 October: 20,587 polygon records; 1,163 have a non-null `REC_DATE`. These are not independent confirmed wildfires. Includes managed burns, incomplete coverage, and no explicit burn-type classification in the inspected schema. |
| [NASA FIRMS archive](https://firms.modaps.eosdis.nasa.gov/download/)                                                                                                                                                        | Corroborating thermal detections and timestamps         | Archive availability checked; study records not downloaded. First detection is thermal-activity evidence, not proof of ignition time or underground peat combustion.                                                                              |
| [EFFIS burned areas](https://forest-fire.emergency.copernicus.eu/about-effis/technical-background/rapid-damage-assessment)                                                                                                  | Corroborate burned extent and event identity            | Dates may differ from ignition/extinction; small burns can be missed. EFFIS also contributes to NatureScot, so agreement is not necessarily independent confirmation.                                                                             |
| [SFRS incident data description](https://www.gov.scot/publications/provision-analyses-scottish-fire-rescue-service-sfrs-incident-reporting-system-irs-data-relation-wildfire-incidents/pages/3/) and official event reports | Establish wildfire status and timing                    | A government study used incident coordinates/dates. Public access to that exact incident table remains unverified. Annual area totals cannot replace it. No request has been sent.                                                                |
| [NatureScot peat/condition maps](https://gis-downloads.nature.scot/)                                                                                                                                                        | Define eligible peatland independently of fire outcomes | Preserve map vintage and class meaning. Overlap establishes a fire on mapped peatland, not combustion of the peat itself.                                                                                                                         |

Primary positives must be corroborated wildfires affecting mapped peatland, with time bounds adequate for the forecast window. Exclude confirmed managed burns and unresolved burn type/timing from the primary score. Deduplicate polygons, detections and reports into events. Publish the eligible event count and exclusions.

If evidence only establishes subsequent satellite fire detection, label that outcome precisely; it cannot establish true ignition lead time. A sparse event set supports a case study rather than general predictive accuracy. Enough eligible independent fires have not yet been established.

## The experiment that makes the result believable

**Units:** proposed fixed 1 km grid over a documented Scottish peatland study area, with daily issue times. Define the area/grid before inspecting performance. Extract radar from peat-covered parts of cells. Future burn perimeters provide labels only; never use them to select prediction-time feature footprints. Burned location and ignition location are different outcomes. Grid spacing does not imply ignition precision.

**Features:** weather ending at issue time; latest eligible same-orbit VV/VH; seasonal deviations; changes; persistence; and radar age/quality. Fit transformations on training data. Do not assume negative backscatter change always means drying. Account for vegetation, standing water, freezing, terrain and rain around acquisition. Missing/stale radar has an explicit evidence state.

**Timing:** inputs must precede issuance. Operational lead-time claims also require that data were available to users then. Reanalysis and retrospectively processed radar support a hindcast unless historical availability is established. Never use future observed weather as a forecast, same-fire hotspots as a precursor, centered smoothing, or post-fire condition maps. Archived weather forecasts would require a separate source shared by all models.

**Outcome and lead:** label new eligible fire affecting a cell within seven days. Count it as warned in the headline only when an alert precedes the earliest credible onset by at least 24 hours. Use conservative bounds for date-only records; omit broad onset intervals from this lead-time score. Report lead relative to first satellite detection separately. Exclude already-burning areas and merge repeat detections into the ongoing event.

**Comparisons without fire:** include hot/dry periods with no recorded fire and comparable neighboring peat areas. Evaluate the full eligible candidate population within the study area and test dates, rather than a handpicked balance of fires and wet negatives. Catalogue absence means no recorded fire, not certain absence. Screen observation coverage using available imagery/incident sources; mark uncertain outcomes unknown and report exclusions. A weather-stressed subset directly tests which dry spells precede fire, with its stress rule fixed using training data.

**Splits:** proposed archive window 2018–2024; training 2018–2021, validation 2022, test 2023–2024. Freeze the event manifest and coverage before inspecting predictions. Keep all records of a fire together, purge overlapping seven-day outcome windows at boundaries, and group neighboring cells from one event. A geographically held-out evaluation depends on event coverage; make only the generalization claim actually tested.

**Measures of success:** fraction of distinct fires warned about at an identical daily warning budget; alerts per detected fire; alerts without a recorded fire; and lead-time distribution. Multiple cells/repeated warnings about one fire do not create extra successes. Choose budget and thresholds on validation data, then freeze them. Report PR-AUC, test prevalence and event counts. Claim calibrated probabilities only after representative-prevalence evaluation using Brier score/reliability. Estimate uncertainty with event/region-time blocks, not correlated pixels. Overall percentage accuracy is misleading when most days have no fire.

The headline to earn is: **“At the same warning budget, weather alone anticipated X% of eligible historical fires; adding peat observations anticipated Y%, with at least 24 hours of evidence-supported warning.”** Leave X and Y blank until measured. Report percentage-point change, false-alert burden, sample size and uncertainty together.

## The finished product and ownership

One cached historical replay application presents a map, pre-fire date slider, both methods' warnings, observation ages, and recorded fire outcomes. A persistent scorecard covers the full test. Present a useful extra warning, a false alert and a missed fire; keep illustrative cases separate from aggregate evidence.

The pitch: **“Weather tells us when conditions favour fire. We test whether watching the peat itself tells us more about where fire will occur.”** The competitive strength is a clear comparison, a specific physical hypothesis, historical evidence and a fast local model. No improvement or prize is guaranteed.

| Owner    | Complete deliverable                                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| You      | Fire-event manifest, matched pre-event features, identical model comparisons, held-out predictions, uncertainty and quality/source records. |
| Teammate | Comparison map, historical timeline, outcome reveal, complete scorecard and presentation using the real result bundle.                      |
| Together | Verify every headline against the full evaluation and explain where the approach succeeds or fails.                                         |

The shared record contains cell/event IDs, issue time, model, score, rank, feature timestamps, availability and quality. Store outcome labels, onset uncertainty and burn polygons separately from prediction inputs. Report local scoring time, memory and data volume separately from satellite extraction costs.

## Supporting science and remaining feasibility

The [Forsinard hydrology experiment](peatpulse-hydrology-study.md) preserves the inspected field archive and a possible validation against water levels. Documented paired controls exist there; do not invent equivalent controls around every fire or claim Forsinard accuracy transfers everywhere.

Required inputs are [Sentinel-1 extraction](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S1_GRD), [historical weather](https://open-meteo.com/en/docs/historical-weather-api), [CEMS indices](https://ewds.climate.copernicus.eu/datasets/cems-fire-historical-v1?tab=overview), and an eligible fire-event manifest. Fire-layer queries succeeded; event eligibility, peat overlap, weather/radar joins and model results remain unverified. These are data dependencies. Drying accuracy does not substitute for the requested actual-fire comparison.

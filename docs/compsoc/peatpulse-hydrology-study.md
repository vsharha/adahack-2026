# PeatPulse supporting hydrology experiment

**Supporting experiment, 3 October 2026.** This preserves the earlier inspection proposal and its field-data protocol. The user clarified that the main submission must compare prediction of historical fires using weather alone versus additional peat observations. The current [project plan](peatpulse-plan.md) supersedes the product, demo and ownership sections below. These field measurements can validate a drying signal; they do not establish a fire outcome. No experiment has run yet.

## The product we want to deliver

**PeatPulse tells a peatland manager which two restoration plots to inspect after a satellite pass, using unusual drying, the land's management history, and the behaviour of a nearby documented control plot.**

The demo covers five restored peat plots in Forsinard, Scotland. It replays a withheld historical year, shows the two plots selected by each competing method, then reveals the water levels actually measured there. The user sees whether our choices would have found more unusually dry peat for the same number of inspections.

Our pitch is: **“Two bogs can experience similar weather but respond differently because of their drainage and restoration history. PeatPulse uses those differences to choose where a limited inspection team should check for abnormal drying.”**

The intended users are peatland restoration managers and estate conservation teams. They can check dipwells, drainage structures, or vegetation at a flagged plot. Drying also matters to wildfire preparedness, but the validated output is a hydrological inspection priority. An alarm does not demonstrate ignition, underground burning, or a quantified probability of fire.

Two visits is our fixed demonstration budget. An actual manager's capacity, access restrictions and response workflow have not yet been confirmed; the benchmark tests selection quality rather than claiming adoption or proven operational savings.

## What makes our contribution distinctive

The contribution is a **tested decision rule for scarce field visits**, built around documented experimental controls. The scientific question is precise:

**Does comparing each restored plot's radar behaviour with its documented local control improve the selection of unusually dry plots beyond an ordinary weather + radar + condition model?**

The extra information is the site's history: forestry, felling, drain blocking and later restoration treatments. We use that history to identify meaningful comparisons and explain the resulting alerts. We also retain each plot's normal seasonal behaviour, so a naturally persistent difference between plots is not repeatedly announced as a new anomaly.

Three deliverables make this contribution visible:

- **The inspection decision:** two named plots, dates, evidence, observation age and a concrete field-check question.
- **The controlled comparison:** the same model with and without the extra local-control features, evaluated on exactly the same unseen dates and inspection budget.
- **The reproducible evidence:** fixed source files, quality exclusions, field labels, model settings, predictions and counts behind every result shown to judges.

This is an applied contribution. Radar-based water-table estimation, restoration monitoring, drought recovery, and comparison with control sites already appear in the literature. Our originality claim is the particular open, resource-constrained inspection workflow and its measured incremental value. We have not established that nobody has implemented a similar system.

## The finished demonstration

The screen opens on a real Forsinard map with **five eligible restoration plots** and their reference areas. A dated weather strip shows rain, atmospheric drying demand and the latest available radar observation. The plot boundaries shown must come from documented geometry; where only logger coordinates exist, show sample neighborhoods explicitly rather than inventing an estate boundary.

The central interaction is **“You have two inspection visits.”** Changing the replay date updates two ranked recommendations. A plot card shows its treatment history, estimated departure from normal water level, comparison with its control, and whether the observation passed quality checks. The two views compare the standard model with PeatPulse; neither gets extra visits or extra test information.

The evidence panel reveals the withheld field readings and the whole-test score. A judge can inspect a successful alert, a false alert, and a missed dry episode. The map exports the chosen inspection locations as GeoJSON/CSV with source timestamps. The replay is visibly historical; it must not look like a live operational warning.

A 90-second presentation tells one story: the manager's two-visit constraint, a real pair of differently managed plots, our choices, the sensor readings, and the measured difference from the stronger baseline. Numbers in that story come from the finished evaluation.

## The data that make this possible

| Dataset                                                                                                                                                                                       | Use in the finished product                                                                                                                | Evidence and limits                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [CentrePeat Forsinard field archive](https://zenodo.org/records/11186744)                                                                                                                     | Primary validation data, management labels, coordinates and documented control groups. Use its Phase 1 water-table file and quality flags. | Downloaded and inspected. It contains 44 water-table series with daily rows spanning 2018–2023. These are clustered measurements across three experimental sites, not 44 independent peatlands.                                                                       |
| [Archive README](https://zenodo.org/records/11186744/files/README_CentrePeat_Forsinard_WTDandSMC_May2024.docx?download=1)                                                                     | Defines the real treatment/control relationships and historical intervention dates.                                                        | Includes slope-matched controls and treatments such as felling to waste, brash crushing/furrow blocking, and later reprofiling. Historical treatment differences are not randomized evidence of why an individual alert occurred.                                     |
| [Sentinel-1 GRD](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S1_GRD), accessed through [Earth Engine](https://developers.google.com/earth-engine/guides/sentinel1) | Calibrated VV/VH backscatter at the target and control sample neighborhoods, acquired on comparable passes.                                | This is the selected extraction route; account access and actual pixel extraction remain unverified. Export a small reproducible table and cropped map data, with image IDs, orbit, time, units and masks. Catalogue metadata alone does not satisfy this dependency. |
| [Open-Meteo historical weather](https://open-meteo.com/en/docs/historical-weather-api)                                                                                                        | Rainfall history, temperature, vapour-pressure deficit and modeled soil-moisture context.                                                  | Select one documented model consistently. Reanalysis is a historical estimate and can arrive after the nominal observation date. It supports a retrospective benchmark, not proof of real-time delivery or forecast lead time.                                        |
| [CEMS historical fire-danger indices](https://ewds.climate.copernicus.eu/datasets/cems-fire-historical-v1?tab=overview)                                                                       | Drought Code and Duff Moisture Code as serious weather-based reference signals.                                                            | Published daily global archive; download access remains untested. If locally recomputed, document the implementation, input timing, initialization and warm-up; do not label it an official historical EFFIS forecast.                                                |
| [NatureScot depth, condition and restoration records](https://gis-downloads.nature.scot/)                                                                                                     | Optional evidence attached to a selected plot where an actual nearby dated record exists.                                                  | Earlier spatial queries succeeded. They do not improve the numerical score merely by being present. No “deeper peat means greater ignition risk” rule.                                                                                                                |
| [Forsinard surface-moisture file](https://zenodo.org/records/11186744/files/Acclima%20loggers%20Forsinard%20Phase%201%202018-2022_for%20Zenodo.csv?download=1)                                | A separate check of whether the water-table signal agrees with moisture near the surface.                                                  | Downloaded: 11 series. Sparse coverage, values above 100%, and duplicated/cross-site coordinates require exclusions. It cannot support a complete 2022 surface-moisture validation across the five target plots.                                                      |

The field archive is available under **CC BY 4.0**. Preserve its attribution. Numerical extraction findings, exact filenames, counts and coordinate issues are recorded in the [audit](peatpulse-research-audit.md).

## The exact experiment

### Study units and ground truth

The primary units are the **CL-BCFB, LO-BCFB, LO-CT, LO-FTW and TA-BCFB** restoration groups, each compared with its same-site `CON` group. Our archive check found field coverage on all 365 days of 2022 for these five target/control pairs when requiring at least two eligible water-table loggers on each side. Satellite matching will reduce the final evaluation dates.

Exclude water-table quality flag 2. Use flags 0 and 1 in the main analysis and report a stricter flag-0 sensitivity check on its stated coverage. Aggregate eligible readings within a group by their median. Treat the group, not each nearby logger or radar pixel, as one inspection destination. The `EC` reference is not slope-matched and is not substituted for a same-site control.

Convert the archive's signed water level in metres into centimetres below the surface consistently. More negative source readings mean a deeper water table. Missing `-9999` values remain missing.

The primary label is **unusually low water level for that plot and season**. Estimate its seasonal baseline from training years, then define a dry episode as at least three consecutive measured days beyond a fixed dry-tail threshold chosen before test evaluation. The primary threshold is the training residual's 90th percentile after conversion to depth below ground; report 80th and 95th percentiles as prespecified sensitivity checks without selecting whichever produces the best test score. This is a statistical anomaly definition, not a combustion threshold. Field measurements create the labels; weather predictions never create their own ground truth.

### The models and contribution test

Use one small model family for the main comparisons: a random forest with 50 trees and constrained depth, trained on one record per plot and satellite acquisition. Predict the seasonal water-table anomaly and rank its departure from the plot's training-period distribution. Fix the common capacity and select any settings using validation data. This is ordinary laptop-scale tabular modeling once the radar table exists.

| Comparison           | Inputs                                                                                                                            | Question answered                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Seasonal reference   | Training-period normal behaviour for each plot and season                                                                         | Are we learning more than which plots are usually dry?                                   |
| Weather model        | Season, plot's historical baseline, treatment category, rainfall history, drying demand and available Drought/Duff Moisture Codes | What can a strong weather/history model already tell us?                                 |
| Standard radar model | Weather-model inputs plus the target's VV/VH, recent changes and seasonal radar deviations                                        | How much does satellite information add?                                                 |
| **PeatPulse**        | Standard-radar inputs plus target-minus-control radar deviations and changes                                                      | Does the documented local comparison add useful information beyond existing ingredients? |

The decisive comparison is **PeatPulse versus the standard radar model**. Beating the weather model alone would not establish the value of our distinctive idea. If the official code archive is inaccessible, identify the exact weather baseline used; the broader claim about improvement over operational danger indices remains untested.

For each polarization, the paired feature is the target's departure from its normal seasonal backscatter minus the equivalent departure at its control. Both come from the same satellite acquisition where possible. Add the change in that gap since the previous usable pass. This asks whether the restored plot is changing unusually relative to its local reference. The target's own features remain in the model, allowing a drought affecting **both** plots to be detected. Control field measurements are withheld evaluation evidence, never inputs at prediction time.

Radar measures scattering, not water content directly. Use a consistent relative orbit, pass, polarization and processing convention. Reject invalid/edge pixels; record standing water, vegetation disturbance, freezing and rain around acquisition as possible confounders. A fixed recent-rain exclusion can be chosen on validation data, but must apply equally to all models and its coverage cost must be reported. Use trailing features and weather hours ending at acquisition; centered smoothing or later weather would leak information. Field truth is a daily average, so it cannot establish subdaily warning lead time.

### Evidence that earns the headline

Train on **2018–2020**, choose settings on **2021**, and evaluate once on **2022**. Fit normalization, seasonal baselines, labels and pair selection without test outcomes. The five plot groups were selected for field-data coverage, not favorable model scores. Report their final radar coverage and excluded observations.

On each common eligible pass, each method selects two distinct plots. The principal score is **sensor-confirmed dry plots found per two visits**. Count wasted visits and unique dry episodes detected as well, so repeatedly visiting one persistent dry patch does not inflate apparent success. Report water-table error in cm as a secondary measure, including error specifically during the driest periods. This matters because a model can fit normal days well while missing the events we care about.

Use the same eligible dates and plot set for every main comparison, with deterministic tie handling for coarse weather scores. Report weather-only availability on all days separately so radar-related exclusions do not conceal its coverage advantage. Show raw counts and paired differences, and estimate uncertainty with blocks of time rather than treating consecutive days as independent trials. The primary experiment measures temporal performance at these known plots; transfer to unseen peatlands is untested.

**The result we want to earn:** “With the same two inspections per pass, adding the documented local-control signal found more genuinely dry plots than weather and radar alone.” The improvement percentage is measured after implementation. There is no evidence yet that it will be positive, and no promised prize outcome.

## What research already establishes

- [Lees et al. 2021](https://doi.org/10.1016/j.scitotenv.2020.143312) already used Sentinel-1 to study peat drought recovery and drainage. Drought recovery is an established idea.
- The [2023 Forsinard study](https://www.mdpi.com/2072-4292/15/7/1900) already included site and condition categories in radar models. It reported poorer behavior during water-table drawdown; its 2.1 cm RMSE was a training result, while the reported validation RMSE was 4.2 cm. Adding a restoration label is not sufficient novelty.
- [A 2024 restoration study](https://doi.org/10.1016/j.rse.2024.114144) already compared remotely sensed water-table changes in restored and control areas. Experimental controls themselves are not our invention.
- [NatureScot's toolkit](https://www.nature.scot/doc/naturescot-research-report-1362-developing-toolkit-monitoring-success-peatland-restoration-projects) already combines radar and weather for water-table estimates. Its published accuracy is context; a fair performance comparison would need the same data and evaluation protocol.
- [Scottish fire-danger research](https://www.scottishfiredangerratingsystem.co.uk/) and [CEMS indices](https://ewds.climate.copernicus.eu/datasets/cems-fire-historical-v1?tab=overview) already consider fuel moisture and persistent drying. We cannot assume warnings forget drought when rain returns. A [Scottish study of 92 fires](https://www.sciencedirect.com/science/article/pii/S0048969724028936) makes VPD and Drought Code relevant reference variables.
- [AI2Peat/PeatSense](https://ai2peat.ie/demo) advertises satellite/sensor maps and hydrological services. A useful dashboard alone is a weak originality claim; our demonstration must expose the actual selection experiment and measured added value. The advertised service capabilities are not an independent performance evaluation.

## How we aim to stand out in judging

The strongest presentation is a visible decision with a hidden answer: **choose two plots, then reveal the sensors**. It makes the baseline, added data, and outcome understandable in seconds. The management history supplies a specific Scottish explanation rather than another generic red heatmap.

The sustainability claim is about better targeting of inspections on vulnerable peat. We do not count carbon “saved” from a predicted alert or multiply peat depth into invented emissions. We report runtime, peak memory and data size for the actual local scoring run, separately from satellite retrieval/preprocessing. That directly addresses the [CompSoc small-compute and verification criteria](brief.md).

Field-data quality is part of the contribution: show which records were excluded and how that affects coverage. The product has an explicit “insufficient evidence” state rather than presenting missing or stale radar data as a safe green patch.

## Ownership and the finished handoff

| Owner    | Complete responsibility                                                                                              | Deliverable                                                                                                                       |
| -------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| You      | Scientific result: dataset integrity, radar extraction, models, paired features and identical benchmark conditions.  | A reproducible result bundle containing observations, predictions for every method, test metrics, exclusions and source metadata. |
| Teammate | Inspection workflow: map, treatment/control comparison, two-visit selection, sensor reveal, export and presentation. | A working interface consuming the real bundle, with a complete successful-alert and false-alert story.                            |
| Together | Interpretation and presentation of measured results.                                                                 | Agreement on what the result supports, a practiced 90-second demo and visible attribution of each person's work.                  |

The shared record contains `plot_id`, `control_id`, geometry type, acquisition time, observation age, treatment, predicted water-table anomaly, method name, rank, quality state and source IDs. Hidden evaluation fields contain observed water level and dry-episode ID. A separate summary contains eligibility counts and benchmark results. Keep evaluation readings out of the displayed prediction logic until the judge reveals them.

The deliverable is one local replay application with a cached, real result bundle. The frontend reads the bundle directly; a live API, accounts, notification service and automated authority contact add no evidence to this experiment.

## Scope boundaries that protect the result

This submission does not include a Scotland-wide fire probability map, carbon-loss estimates, walking-route ignition scores, or an extra InSAR processing pipeline. NatureScot bog-breathing maps remain useful background research, but their long time windows can include future observations relative to our replay, and adding them would distract from the identifiable contribution.

Water-table anomalies demonstrate hydrological stress. Surface-moisture corroboration uses its own quality-screened subset and named dates; it must not be presented as complete coverage of the primary test. Peat ignition additionally depends on material properties and an ignition source. This defines the meaning of the finished product while keeping its inspection decision concrete.

# CompSoc: status

The record of what is built for the CompSoc project. Pitch claims come from here, so every line must be true of the current code.

## Features

Each feature has a build state: works, mocked, planned or cut.

- A working feature records the verified flow, the result, the date, the commit, and a test or recording link when there is one.
- A mocked feature says which parts are mocked and how to reproduce the demo.
- A cut feature keeps its line with the reason, so it is not proposed again.

| Feature                                  | State   | Verification or reason                                                                                                                                                                                                                                     |
| ---------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PeatPulse historical fire-warning replay | Planned | User clarified the target on 3 October 2026: compare weather-only predictions with added peat tracking against actual historical fires. The [plan](peatpulse-plan.md) specifies an identical outcome and warning budget. No model or interface exists yet. |
| Inspection-only headline demo            | Cut     | Superseded by the user’s actual-fire comparison. The [Forsinard protocol](peatpulse-hydrology-study.md) remains supporting validation of drying, not the fire-prediction result.                                                                           |
| Matched radar and field-data benchmark   | Planned | Supporting hydrology study: the field archive was inspected on 3 October 2026; matched Sentinel-1 extraction and model results remain outstanding. See the [research audit](peatpulse-research-audit.md).                                                  |

## Impact evidence

Each figure records its basis: a measured result with the method, or an estimate with its inputs, sources, calculation and limits. External facts include their source and retrieval date.

| Claim                                                                                                     | Basis                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Five Forsinard treatment/control pairs have field coverage throughout 2022 under the stated quality rule. | Downloaded [CentrePeat archive](https://zenodo.org/records/11186744) on 3 October 2026. Excluded quality-2 loggers and required at least two measurements in both target and control per day; each selected pair had 365 days before radar matching. These are correlated observations, not independent events. [Method and counts](peatpulse-research-audit.md). |
| No measured detection improvement, fire prediction, or avoided emissions.                                 | Source research and plan revision only. Fire labels, matched predictors and held-out results remain outstanding. Compare actual-fire outcomes against basic and strong weather baselines and isolate added radar value from static land history.                                                                                                                  |

### Fire-data feasibility checked on 3 October 2026

The public [NatureScot burn layer](https://services1.arcgis.com/LM9GyVFsughzHdbO/arcgis/rest/services/Scottish_Wildfire_and_Muirburn_Extents/FeatureServer/0) returned 20,587 polygons and 1,163 records with a non-null recorded date. These include muirburn and duplicate/event-fragment possibilities; they are not counts of confirmed wildfires or peatland test events. Date meaning, event type, peat overlap and matched pre-fire observations need validation. The [audit](peatpulse-research-audit.md) records queries and actual samples. FIRMS archive availability was checked, but no historical extract was obtained.

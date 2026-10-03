# CompSoc: status

The record of what is built for the CompSoc project. Pitch claims come from here, so every line must be true of the current code.

## Features

Each feature has a build state: works, mocked, planned or cut.

- A working feature records the verified flow, the result, the date, the commit, and a test or recording link when there is one.
- A mocked feature says which parts are mocked and how to reproduce the demo.
- A cut feature keeps its line with the reason, so it is not proposed again.

| Feature                                | State   | Verification or reason                                                                                                                                                                                                         |
| -------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PeatPulse historical inspection replay | Planned | The [revised proposal](peatpulse-plan.md) specifies five Forsinard restoration plots, two inspections per satellite pass, and comparison with held-out field measurements. No pipeline, trained model or interface exists yet. |
| Matched radar and field-data benchmark | Planned | The field archive was inspected on 3 October 2026; matched Sentinel-1 extraction and model results remain outstanding. See the [research audit](peatpulse-research-audit.md).                                                  |

## Impact evidence

Each figure records its basis: a measured result with the method, or an estimate with its inputs, sources, calculation and limits. External facts include their source and retrieval date.

| Claim                                                                                                     | Basis                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Five Forsinard treatment/control pairs have field coverage throughout 2022 under the stated quality rule. | Downloaded [CentrePeat archive](https://zenodo.org/records/11186744) on 3 October 2026. Excluded quality-2 loggers and required at least two measurements in both target and control per day; each selected pair had 365 days before radar matching. These are correlated observations, not independent events. [Method and counts](peatpulse-research-audit.md). |
| No measured detection improvement, fire prediction, or avoided emissions.                                 | This task completed source research and plan revision only. The plan's contribution must be evaluated against a standard weather + radar + condition model.                                                                                                                                                                                                       |

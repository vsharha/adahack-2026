# PeatPulse

If a land manager can check only a few peatland patches, which should receive attention first?

PeatPulse ranks Scottish peatland cells for satellite-mapped burning within the next seven days. It gives each 1 km square a score, then sorts the squares from highest to lowest. The score shows relative concern. It is not a real-world fire probability.

## The result

On the five-patch daily shortlist in our historical test, PeatPulse matched 13 of 25 mapped burn areas. Ranking the same patches by Copernicus’s Fire Weather Index (FWI) matched 8 of 25. That is a 20 percentage point difference on this benchmark. Adding radar did not improve the result.

## How it works

We joined public weather, fire-danger, peatland and satellite records by place and date. The dataset covers 2018–2025, with 346 sampled peatland cells and 535,473 usable cell-days. The Random Forest uses 16 weather and Copernicus fire-danger measurements to rank the locations. Satellite records are checked afterward to see which ranked locations had mapped burning.

We tested the model with five-fold grouped cross-validation. Related locations stay together in each fold, and FWI is ranked on the same dates and locations. The benchmark was reused while comparing models and shortlist sizes, so the result is a retrospective research comparison. It does not establish live warning performance or confirmed peat ignition.

## Try the demo

Open the [PeatPulse website](https://peatpulse.pages.dev/). Choose **Read the report** for the data, model, historical example, results and limitations. **Read the story** opens a work-in-progress page.

To serve the website locally from the repository root:

```sh
uv --directory apps/compsoc/backend run python -m http.server 4317 --bind 127.0.0.1 --directory ../frontend
```

Then open <http://127.0.0.1:4317>.

## Project files

- `frontend/` contains the website.
- `backend/src/compsoc/peatpulse/` contains the data pipeline, model and reports.
- `backend/tests/` contains 23 tests.
- `../docs/compsoc/` contains the experiment notes and detailed results.

Source downloads and cached model files are kept out of Git. The [reproduction notes](../docs/compsoc/peatpulse-expanded-results.md) describe the experiment and local run steps.

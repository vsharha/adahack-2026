# PeatPulse

PeatPulse asks a practical question: **if a land manager can check only a few peatland patches, which should receive attention first?**

We rank Scottish peatland cells for satellite-mapped burning within the next seven days. Each cell is a 1 km square. The score sorts patches by relative concern; it is not a real-world fire probability.

## What we built

The report website has three pages:

- The home page introduces PeatPulse.
- **Read the story** opens a work-in-progress page.
- **Read the report** explains the problem, data, model, historical test, results and limits.

The site is plain HTML and CSS. It has no frontend build step or package dependencies. The peatland cover is an illustration, not a photograph of a study site.

**Live website:** [peatpulse.pages.dev](https://peatpulse.pages.dev/)

## Data and method

We joined public datasets by location and date for 2018–2025. The report describes 346 sampled peatland cells and 535,473 usable cell-days. Each model row contains weather and Copernicus fire-danger readings. Satellite-mapped burn records provide the outcome we check afterward.

The best model for the daily shortlist is a Random Forest. It gives each cell a score, then sorts cells from highest to lowest. We compared it with ranking the same cells by Copernicus’s Fire Weather Index (FWI) alone. Five-fold grouped testing keeps related locations together so they do not appear on both sides of a fold.

With five cells selected per day in each test fold, PeatPulse matched 13 of 25 mapped burn areas; FWI matched 8 of 25. That is a 20 percentage point difference on this historical benchmark. The tested radar features did not improve the result.

These are historical satellite-mapped outcomes, not confirmed reports of peat ignition. The benchmark was reused while comparing models and shortlist sizes. The scores have not been calibrated as real-world fire probabilities, and live warning performance has not been tested.

## Run the website locally

From the repository root, start a local web server:

```sh
uv --directory apps/compsoc/backend run python -m http.server 4317 --bind 127.0.0.1 --directory ../frontend
```

Then open <http://127.0.0.1:4317>.

## Project files

- `index.html`: home page
- `story.html`: work-in-progress story page
- `report.html`: technical report
- `styles.css`: shared page styles
- `assets/`: illustration, site icon and downloadable shortlist results

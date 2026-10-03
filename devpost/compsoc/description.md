# PeatPulse

If a land manager can check only a few peatland patches, which should receive attention first?

PeatPulse ranks Scottish peatland cells for satellite-mapped burning within the next seven days. It gives each 1 km square a score and sorts the squares from highest to lowest, helping land managers decide which patches to check first. The score shows relative concern. It is not a real-world fire probability.

## The problem

Peatlands are wetlands where waterlogged conditions slow the breakdown of dead plants, allowing layers of peat to build up over time. When peat burns, carbon stored in the ground can be released into the atmosphere. A study of UK fires from 2001 to 2021 found that fires burning into peat caused up to 90% of annual UK fire-driven carbon emissions in particularly dry years.

## What we built

We joined public data by location and date to make one row for each 1 km peatland square on each prediction day. The dataset covers 2018 to 2025, with 346 sampled cells and 535,473 usable cell-days.

The model uses 16 measurements: daily and recent weather, season, and four Copernicus fire-danger readings. A Random Forest gives each cell a score, then ranks the cells. We also tested logistic regression, Extra Trees, gradient boosting and satellite radar features.

Our sources include NatureScot’s Carbon and Peatland Map, ERA5 weather through Open-Meteo, Copernicus fire-danger data through Climate Engine and Earth Engine, Sentinel-1 radar, and satellite burn records from MODIS and NASA FIRMS. Burn records are checked after the ranking to see whether a selected location had mapped burning.

## What we found

We tested the model with five-fold grouped cross-validation. Related locations stay together in each fold. We compared its rankings with the official historical Copernicus Fire Weather Index (FWI), using the same test dates and locations.

With a shortlist of five cells per day in each test fold, PeatPulse matched 13 of 25 mapped burn areas. Ranking by FWI alone matched 8 of 25. That is a 20 percentage point difference on this historical benchmark. Adding radar did not improve the best result.

All model fitting and scoring ran on a laptop’s local CPU. The algorithm comparison took about 6.5 minutes.

## What this result means

This is a historical ranking test against satellite-mapped burning. It does not confirm that peat itself combusted, that every mapped event was an unreported wildfire, or that a real warning system would perform the same way. The benchmark was reused while comparing models and shortlist sizes, and the scores have not been calibrated as real-world fire probabilities. A later independent test and verified incident records are needed before operational use.

## Try the demo

Visit the [PeatPulse website](https://peatpulse.pages.dev/) and choose **Read the report** for the full methods, a historical example, results and sources. **Read the story** opens a work-in-progress page.

## Repository

The PeatPulse project code and experiment notes are in [`apps/compsoc/`](https://github.com/vsharha/adahack-2026/tree/main/apps/compsoc) and [`docs/compsoc/`](https://github.com/vsharha/adahack-2026/tree/main/docs/compsoc).

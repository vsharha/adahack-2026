# PeatPulse validation map

The map compares held-out predictions from raw Copernicus FWI and the weather + CEMS model. It shows only validation alert locations, not historical burns. Each cell is colored by which method selected it more often across the same five folds and one-alert-per-day budget: teal means FWI selected it more often; purple means the model did. Equal-frequency cells are left clear. Both colors use the same intensity scale, so stronger color means a larger difference in alert frequency.

The controls also show how many of the 25 mapped burn groups each method caught: FWI 2/25 and the model 6/25. These are provisional satellite-burn results, not confirmed wildfire counts or live warnings.

## Run

From the repository root:

```sh
uv run apps/compsoc/map-preview/serve.py
```

Open `http://127.0.0.1:8766/`.

Refresh the local map data after rerunning grouped cross-validation:

```sh
uv --directory apps/compsoc/backend run python ../map-preview/export_data.py
```

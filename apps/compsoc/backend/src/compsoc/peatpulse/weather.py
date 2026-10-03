"""ERA5 weather and explicitly labelled, locally reconstructed FWI features."""

import json
from concurrent.futures import ThreadPoolExecutor, as_completed

import numpy as np
import pandas as pd
import xarray as xr
from xclim.indices.fire import cffwis_indices

from .cems import download as download_cems
from .fetch import END_YEAR, PROCESSED, fetch, json_data

WEATHER_URL = "https://archive-api.open-meteo.com/v1/archive"
VARIABLES = (
    "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,"
    "vapour_pressure_deficit"
)
FEATURES = [
    "temperature_c",
    "relative_humidity_pct",
    "wind_kmh",
    "vpd_kpa",
    "precip_24h_mm",
    "precip_7d_mm",
    "precip_30d_mm",
    "dry_spell_days",
    "temperature_7d_mean_c",
    "vpd_7d_mean_kpa",
    "season_sin",
    "season_cos",
    "dc_reconstructed",
    "dmc_reconstructed",
    "ffmc_reconstructed",
    "isi_reconstructed",
    "bui_reconstructed",
    "fwi_reconstructed",
    "cems_dc",
    "cems_dmc",
    "cems_ffmc",
    "cems_fwi",
]


def weather_params(lat, lon):
    return {
        "latitude": lat,
        "longitude": lon,
        "start_date": "2017-01-01",
        "end_date": f"{END_YEAR}-12-31",
        "hourly": VARIABLES,
        "models": "era5",
        "timezone": "GMT",
        "wind_speed_unit": "kmh",
        "elevation": "nan",
    }


def daily_features(hourly, latitude):
    """Compute strictly trailing inputs at noon for a 13:00 UTC issue time."""
    h = hourly.copy().sort_index()
    assert h.index.is_unique
    expected = pd.date_range(h.index.min(), h.index.max(), freq="h")
    assert h.index.equals(expected), "Missing hourly timestamps"
    noon = h.index.hour == 12
    d = (
        h.loc[noon]
        .rename(
            columns={
                "temperature_2m": "temperature_c",
                "relative_humidity_2m": "relative_humidity_pct",
                "wind_speed_10m": "wind_kmh",
                "vapour_pressure_deficit": "vpd_kpa",
            }
        )
        .drop(columns="precipitation")
    )
    for days, name in [
        (1, "precip_24h_mm"),
        (7, "precip_7d_mm"),
        (30, "precip_30d_mm"),
    ]:
        d[name] = (
            h.precipitation.rolling(days * 24, min_periods=days * 24).sum().loc[noon]
        )
    d["temperature_7d_mean_c"] = h.temperature_2m.rolling(168).mean().loc[noon]
    d["vpd_7d_mean_kpa"] = h.vapour_pressure_deficit.rolling(168).mean().loc[noon]
    dry = d.precip_24h_mm.lt(1) & d.precip_24h_mm.notna()
    d["dry_spell_days"] = dry.groupby((~dry).cumsum()).cumsum().astype(int)
    d["season_sin"] = np.sin(2 * np.pi * (d.index.dayofyear - 1) / 365.25)
    d["season_cos"] = np.cos(2 * np.pi * (d.index.dayofyear - 1) / 365.25)
    d = d.loc[d.precip_24h_mm.notna()].copy()
    if (
        d[["temperature_c", "relative_humidity_pct", "wind_kmh", "precip_24h_mm"]]
        .isna()
        .any()
        .any()
    ):
        raise ValueError("FWI input missing; no implicit filling allowed")

    def array(column, unit):
        return xr.DataArray(
            d[column].to_numpy(),
            dims="time",
            coords={"time": d.index},
            attrs={"units": unit},
        )

    indices = cffwis_indices(
        tas=array("temperature_c", "degC"),
        pr=array("precip_24h_mm", "mm/day"),
        sfcWind=array("wind_kmh", "km h-1"),
        hurs=array("relative_humidity_pct", "%"),
        lat=xr.DataArray(latitude, attrs={"units": "degrees_north"}),
        season_method=None,
        overwintering=False,
        dc0=xr.DataArray(15.0, attrs={"units": "1"}),
        dmc0=xr.DataArray(6.0, attrs={"units": "1"}),
        ffmc0=xr.DataArray(85.0, attrs={"units": "1"}),
    )
    for name, values in zip(
        ["dc", "dmc", "ffmc", "isi", "bui", "fwi"], indices, strict=True
    ):
        d[name + "_reconstructed"] = values.values
    d["weather_cutoff_utc"] = d.index
    d["issue_time_utc"] = d.index + pd.Timedelta(hours=1)
    d["date"] = d.index.strftime("%Y-%m-%d")
    d["split"] = np.select(
        [d.index.year <= 2021, d.index.year == 2022],
        ["train", "validation"],
        default="test",
    )
    # Keep final outcome windows from crossing split boundaries.
    boundary = (
        (d.index.month == 12)
        & (d.index.day >= 25)
        & np.isin(d.index.year, [2021, 2022, END_YEAR])
    )
    d["split_boundary_excluded"] = boundary
    return d.loc[d.index.year >= 2018].reset_index(drop=True)


def weather(project):
    locations = pd.read_csv(PROCESSED / "weather_locations.csv")

    def download(row):
        name = f"weather/{row.weather_id}.json"
        path = fetch(
            name,
            WEATHER_URL,
            weather_params(row.weather_lat_request, row.weather_lon_request),
        )
        paths = [path]
        last_year = int(json_data(path)["hourly"]["time"][-1][:4])
        if last_year < END_YEAR:
            paths.append(
                fetch(
                    f"weather/{row.weather_id}_{last_year + 1}_{END_YEAR}.json",
                    WEATHER_URL,
                    {
                        **weather_params(
                            row.weather_lat_request, row.weather_lon_request
                        ),
                        "start_date": f"{last_year + 1}-01-01",
                    },
                )
            )
        return row.weather_id, paths

    paths = []
    errors = []
    with ThreadPoolExecutor(max_workers=2) as pool:
        tasks = {
            pool.submit(download, row): str(locations.iloc[index]["weather_id"])
            for index, row in enumerate(locations.itertuples())
        }
        for task in as_completed(tasks):
            try:
                paths.append(task.result())
                print(f"Weather downloaded {len(paths)}/{len(locations)}", flush=True)
            except Exception as exc:
                errors.append({"weather_id": tasks[task], "error": str(exc)})
                print(f"Weather failed {tasks[task]}: {exc}", flush=True)
    (PROCESSED / "weather_errors.json").write_text(json.dumps(errors, indent=2))
    if errors:
        raise RuntimeError(
            f"{len(errors)} weather downloads failed; see weather_errors.json"
        )
    tables = []
    returned_locations = []
    for weather_id, pieces in sorted(paths):
        raw = json_data(pieces[0])
        h = pd.concat(
            [pd.DataFrame(json_data(p)["hourly"]) for p in pieces], ignore_index=True
        )
        h.index = pd.DatetimeIndex(pd.to_datetime(h.pop("time")))
        d = daily_features(h, raw["latitude"])
        d["weather_id"] = weather_id
        tables.append(d)
        returned_locations.append(
            {
                "weather_id": weather_id,
                "returned_latitude": raw["latitude"],
                "returned_longitude": raw["longitude"],
                "elevation_m": raw.get("elevation"),
                "hourly_records": len(h),
            }
        )
    frame = pd.concat(tables, ignore_index=True)
    cems, cems_summary = download_cems(project, locations)
    frame = frame.merge(
        cems,
        on=["weather_id", "date"],
        how="left",
        validate="one_to_one",
    )
    frame.to_parquet(PROCESSED / "weather_daily.parquet", index=False)
    pd.DataFrame(returned_locations).to_csv(
        PROCESSED / "weather_grid_audit.csv", index=False
    )
    cells = pd.read_csv(PROCESSED / "audit_cells.csv")
    joined = cells.merge(frame, on="weather_id", validate="many_to_many")
    joined["label_status"] = "unknown_not_yet_verified"
    joined["fire_next_7d"] = pd.Series(pd.NA, index=joined.index, dtype="Int8")
    joined["radar_status"] = "awaiting_authenticated_pixel_extraction"
    joined.to_parquet(PROCESSED / "model_inputs.parquet", index=False)
    joined.head(100).to_csv(PROCESSED / "model_inputs_sample.csv", index=False)
    print(f"Saved {len(frame):,} weather days; {len(joined):,} area-days", flush=True)
    manifest = {
        "source": WEATHER_URL,
        "model": "ERA5",
        "requested_period": f"2017-{END_YEAR}",
        "analysis_period": f"2018-{END_YEAR}",
        "issue_time": "13:00 UTC",
        "latest_weather": "12:00 UTC same day",
        "precipitation": "Open-Meteo past-hour total precipitation, includes snow",
        "fwi_status": (
            "local xclim reconstruction; historical CEMS indices are separate features"
        ),
        "fwi_initialization": (
            "2017-01-02: FFMC=85, DMC=6, DC=15; always-on; 2017 discarded"
        ),
        "fwi_limitation": (
            "No seasonal shutdown or overwintering; total precipitation includes snow"
        ),
        "hindcast_only": True,
        "weather_locations": len(locations),
        "weather_days": len(frame),
        "cems": cems_summary,
        "model_input_rows": len(joined),
        "features": FEATURES,
    }
    (PROCESSED / "weather_summary.json").write_text(
        json.dumps(manifest, indent=2) + "\n"
    )
    # Refresh cached radar joins when rebuilding weather so inputs stay complete.
    if (PROCESSED / "radar_observations.csv").exists():
        from .radar import join

        join()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--project", required=True)
    weather(parser.parse_args().project)

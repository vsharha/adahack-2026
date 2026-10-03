"""Download historical CEMS fire-danger indices for audit locations."""

import hashlib
import json
import time
from datetime import UTC, datetime

import ee
import ee.data as ee_data
import pandas as pd

from .fetch import END_YEAR, PROCESSED, RAW, sample_cache

COLLECTION = "projects/climate-engine-pro/assets/ce-cems-fire-daily-4-1"
BANDS = {
    "fire_weather_index": "cems_fwi",
    "drought_code": "cems_dc",
    "duff_moisture_code": "cems_dmc",
    "fine_fuel_moisture_code": "cems_ffmc",
}


def download(project, locations):
    """Fetch a cached daily CEMS pixel series for each weather grid location."""
    ee.Initialize(project=project)
    ee_data.setDeadline(60_000)
    RAW.mkdir(parents=True, exist_ok=True)
    PROCESSED.mkdir(parents=True, exist_ok=True)
    raw_folder = sample_cache("cems", "weather_locations.csv")

    points = ee.FeatureCollection(
        [
            ee.Feature(
                ee.Geometry.Point(
                    [float(row.weather_lon_request), float(row.weather_lat_request)]
                ),
                {"weather_id": str(row.weather_id)},
            )
            for row in locations.itertuples()
        ]
    )
    collection = ee.ImageCollection(COLLECTION).select(list(BANDS))
    projection = ee.Image(collection.first()).select("fire_weather_index").projection()
    chunks = []
    expected = {}

    def retrieve(start, end):
        start_key = start.strftime("%Y-%m-%d")
        images = collection.filterDate(start_key, end.strftime("%Y-%m-%d"))

        def sample_image(image):
            image = ee.Image(image)
            date = ee.Date(image.get("system:time_start")).format("YYYY-MM-dd")
            return image.sampleRegions(
                collection=points,
                projection=projection,
                geometries=False,
            ).map(lambda sampled: sampled.set("date", date))

        features = ee.FeatureCollection(images.map(sample_image)).flatten()
        try:
            return features.getInfo()
        except ee.EEException as exc:
            duration = (end - start).days
            if duration > 1:
                midpoint = start + pd.Timedelta(days=duration // 2)
                print(
                    f"CEMS {start_key}: splitting a {duration}-day request after "
                    "Earth Engine could not read the full batch",
                    flush=True,
                )
                left = retrieve(start, midpoint)
                right = retrieve(midpoint, end)
                return {"features": left["features"] + right["features"]}
            if "No such object" in str(exc) or "Failed to read object" in str(exc):
                print(
                    f"CEMS {start_key}: source image unavailable; recording gap",
                    flush=True,
                )
                return {"features": []}
            raise

    for year in range(2018, END_YEAR + 1):
        start = pd.Timestamp(year=year, month=1, day=1)
        year_end = start + pd.DateOffset(years=1)
        year_rows = 0
        while start < year_end:
            end = min(start + pd.Timedelta(days=14), year_end)
            key = start.strftime("%Y-%m-%d")
            path = raw_folder / f"{key}.json"
            if path.exists():
                payload = json.loads(path.read_text())
            else:
                payload = None
                for attempt in range(4):
                    try:
                        payload = retrieve(start, end)
                        break
                    except ee.EEException as exc:
                        if attempt == 3:
                            raise
                        if not any(
                            marker in str(exc).lower()
                            for marker in ("429", "too many concurrent", "internal")
                        ):
                            raise
                        time.sleep(5 * (attempt + 1))
                if payload is None:
                    raise ValueError(f"CEMS returned no response for {key}")
                path.write_text(json.dumps(payload, separators=(",", ":")))
            records = [feature["properties"] for feature in payload["features"]]
            if records:
                chunks.append(pd.DataFrame(records))
            year_rows += len(records)
            print(
                f"CEMS {key}: retrieved {len(records):,} location-days",
                flush=True,
            )
            start = end
        expected[str(year)] = year_rows
    frame = pd.concat(chunks, ignore_index=True)
    frame = frame.rename(columns=BANDS)
    frame["date"] = pd.to_datetime(frame["date"]).dt.strftime("%Y-%m-%d")
    frame = frame.sort_values(["weather_id", "date"]).reset_index(drop=True)
    frame.to_parquet(PROCESSED / "cems_daily.parquet", index=False)
    frame.to_csv(
        PROCESSED / "cems_daily.csv.gz",
        index=False,
        compression="gzip",
    )

    counts = frame.groupby("date").size()
    dates = pd.date_range("2018-01-01", f"{END_YEAR}-12-31", freq="D").strftime(
        "%Y-%m-%d"
    )
    missing_dates = [date for date in dates if counts.get(date, 0) == 0]
    duplicate_rows = int(frame.duplicated(["weather_id", "date"]).sum())
    coverage = {
        "source": "Copernicus CEMS fire-danger indices via Climate Engine Earth Engine",
        "collection": COLLECTION,
        "earth_engine_project": project,
        "retrieved_utc": datetime.now(UTC).isoformat(),
        "analysis_period": f"2018-01-01 through {END_YEAR}-12-31",
        "resolution_degrees": 0.25,
        "bands": BANDS,
        "weather_locations": int(frame.weather_id.nunique()),
        "location_day_rows": len(frame),
        "rows_by_year": expected,
        "missing_dates": missing_dates,
        "duplicate_location_days": duplicate_rows,
        "missing_values_by_band": {
            band: int(frame[column].isna().to_numpy().sum())
            for band, column in BANDS.items()
        },
        "parquet_sha256": hashlib.sha256(
            (PROCESSED / "cems_daily.parquet").read_bytes()
        ).hexdigest(),
    }
    (PROCESSED / "cems_summary.json").write_text(json.dumps(coverage, indent=2) + "\n")
    if duplicate_rows:
        raise ValueError(f"CEMS contains {duplicate_rows} duplicate location-days")
    return frame, coverage


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--project", required=True)
    args = parser.parse_args()
    locations = pd.read_csv(PROCESSED / "weather_locations.csv")
    _, summary = download(args.project, locations)
    print(json.dumps(summary, indent=2), flush=True)

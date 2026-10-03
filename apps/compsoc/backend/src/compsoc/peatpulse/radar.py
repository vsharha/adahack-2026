"""Extract real Sentinel-1 observations and join only earlier acquisitions."""

import argparse
import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import UTC, datetime

import ee
import ee.data as ee_data
import numpy as np
import pandas as pd
from shapely.geometry import mapping, shape

from .fetch import END_YEAR, PROCESSED, json_data, sample_cache

RADAR_FEATURES = [
    "vv_db",
    "vh_db",
    "vv_seasonal_anomaly_db",
    "vh_seasonal_anomaly_db",
    "vv_change_db",
    "vh_change_db",
    "vv_last3_anomaly_db",
    "radar_age_days",
    "radar_pass_gap_days",
]


def extract(project):
    ee.Initialize(project=project)
    ee_data.setDeadline(120000)
    folder = sample_cache("radar")
    locations = pd.read_csv(PROCESSED / "audit_cells.csv").set_index("cell_id")

    def bounds(ids):
        selected = locations.loc[ids]
        return ee.Geometry.Rectangle(
            [
                float(selected.longitude.min()) - 0.02,
                float(selected.latitude.min()) - 0.02,
                float(selected.longitude.max()) + 0.02,
                float(selected.latitude.max()) + 0.02,
            ],
            geodesic=False,
        )

    features = []
    for feature in json_data(PROCESSED / "audit_peat_footprints.geojson")["features"]:
        geom = shape(feature["geometry"]).buffer(0).simplify(5, preserve_topology=True)
        features.append(
            ee.Feature(
                ee.Geometry(mapping(geom), proj="EPSG:27700", geodesic=False),
                {
                    "cell_id": feature["properties"]["cell_id"],
                    "peat_area_m2": geom.area,
                },
            )
        )
    cells = ee.FeatureCollection(features)
    collection = (
        ee.ImageCollection("COPERNICUS/S1_GRD")
        .filterBounds(bounds(locations.index.tolist()))
        .filter(ee.Filter.eq("instrumentMode", "IW"))
        .filter(ee.Filter.eq("resolution_meters", 10))
        .filter(ee.Filter.eq("orbitProperties_pass", "DESCENDING"))
        .filter(ee.Filter.eq("platform_number", "A"))
        .filter(ee.Filter.listContains("transmitterReceiverPolarisation", "VV"))
        .filter(ee.Filter.listContains("transmitterReceiverPolarisation", "VH"))
    )
    orbit_file = folder / "orbit_selection.json"
    if not orbit_file.exists():

        def count_orbits(feature):
            return feature.setGeometry(None).set(
                "orbit_counts",
                collection.filterBounds(feature.geometry())
                .filterDate("2018-01-01", "2022-01-01")
                .aggregate_histogram("relativeOrbitNumber_start"),
            )

        orbit_points = [
            ee.Feature(
                ee.Geometry.Point([float(row.longitude), float(row.latitude)]),
                {"cell_id": cell},
            )
            for cell, row in locations.iterrows()
        ]
        records = []
        for offset in range(0, len(orbit_points), 40):
            batch = (
                ee.FeatureCollection(orbit_points[offset : offset + 40])
                .map(count_orbits)
                .getInfo()
            )
            records.extend(batch["features"])
            print(
                f"Radar orbit selection: {min(offset + 40, len(orbit_points))}"
                f"/{len(orbit_points)}",
                flush=True,
            )
        raw = {"type": "FeatureCollection", "features": records}
        orbit_file.write_text(json.dumps(raw))
    choices = []
    for f in json_data(orbit_file)["features"]:
        p = f["properties"]
        histogram = p["orbit_counts"]
        if not histogram:
            raise ValueError(f"No eligible training radar orbit for {p['cell_id']}")
        orbit_key = max(histogram, key=lambda k: (histogram[k], -float(k)))
        orbit = int(float(orbit_key))
        choices.append(
            {
                "cell_id": p["cell_id"],
                "relative_orbit": orbit,
                "training_scene_count": histogram[orbit_key],
            }
        )
    choices = pd.DataFrame(choices)
    choices.to_csv(PROCESSED / "radar_orbits.csv", index=False)

    monthly_folder = folder / "monthly"
    monthly_folder.mkdir(exist_ok=True)

    def month_batch(orbit, year, month):
        path = monthly_folder / f"orbit{orbit}_{year}_{month:02d}.json"
        if path.exists():
            return path
        start = f"{year}-{month:02d}-01"
        end = f"{year + (month == 12)}-{1 if month == 12 else month + 1:02d}-01"
        old_quarter = (
            folder / f"orbit{orbit}_{year}_{1 + 3 * ((month - 1) // 3):02d}.json"
        )
        if old_quarter.exists():
            payload = json_data(old_quarter)
            payload["features"] = [
                f
                for f in payload["features"]
                if pd.Timestamp(f["properties"]["time_ms"], unit="ms").month == month
            ]
            path.write_text(json.dumps(payload))
            return path
        ids = choices.loc[choices.relative_orbit == orbit, "cell_id"].tolist()
        group = cells.filter(ee.Filter.inList("cell_id", ids))
        scenes = (
            collection.filterBounds(bounds(ids))
            .filter(ee.Filter.eq("relativeOrbitNumber_start", orbit))
            .filterDate(start, end)
        )
        reducer = ee.Reducer.median().combine(ee.Reducer.count(), sharedInputs=True)

        def masked_bands(value):
            image = ee.Image(value)
            angle = image.select("angle")
            return image.select(["VV", "VH", "angle"]).updateMask(
                angle.gt(30).And(angle.lt(46))
            )

        # One stacked reduction avoids Earth Engine's concurrent aggregation limit.
        output = (
            scenes.map(masked_bands)
            .toBands()
            .reduceRegions(
                collection=group,
                reducer=reducer,
                scale=30,
                crs="EPSG:27700",
                tileScale=4,
            )
            .map(lambda feature: feature.setGeometry(None))
        )
        scene_times = dict(
            zip(
                scenes.aggregate_array("system:index").getInfo(),
                scenes.aggregate_array("system:time_start").getInfo(),
                strict=True,
            )
        )
        for attempt in range(3):
            try:
                wide = output.getInfo()
                if wide is None:
                    raise RuntimeError("Earth Engine returned no feature collection")
                records = []
                for feature in wide["features"]:
                    props = feature["properties"]
                    for scene_id, time_ms in scene_times.items():
                        if not props.get(scene_id + "_VV_count", 0):
                            continue
                        values = {
                            name: props.get(scene_id + "_" + name)
                            for name in [
                                "VV_median",
                                "VH_median",
                                "angle_median",
                                "VV_count",
                                "VH_count",
                                "angle_count",
                            ]
                        }
                        values.update(
                            {
                                "cell_id": props["cell_id"],
                                "peat_area_m2": props["peat_area_m2"],
                                "scene_id": scene_id,
                                "time_ms": time_ms,
                                "relative_orbit": orbit,
                                "platform": "S1A",
                                "pass": "DESCENDING",
                            }
                        )
                        records.append({"type": "Feature", "properties": values})
                payload = {"type": "FeatureCollection", "features": records}
                path.write_text(json.dumps(payload))
                print(
                    f"Radar {orbit}, {start}: {len(payload['features'])} area-scenes",
                    flush=True,
                )
                return path
            except ee.EEException as exc:
                print(f"Radar retry {start}: {exc}", flush=True)
                if attempt == 2:
                    raise
                time.sleep(5 * (attempt + 1))
        raise RuntimeError("Unreachable radar retry state")

    tasks = [
        (int(orbit), year, month)
        for orbit in choices.relative_orbit.unique()
        for year in range(2018, END_YEAR + 1)
        for month in range(1, 13)
    ]
    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = [pool.submit(month_batch, *task) for task in tasks]
        for result in as_completed(futures):
            result.result()
    rows = [
        f["properties"]
        for path in sorted(monthly_folder.glob("orbit[0-9]*_*.json"))
        for f in json_data(path)["features"]
    ]
    frame = pd.DataFrame(rows)
    frame["radar_time_utc"] = pd.to_datetime(frame.time_ms, unit="ms")
    frame["valid_fraction_approx"] = frame.VV_count * 900 / frame.peat_area_m2
    frame["quality_eligible"] = (
        frame.VV_median.notna()
        & frame.VH_median.notna()
        & (frame.valid_fraction_approx >= 0.5)
    )
    frame.to_csv(PROCESSED / "radar_observations.csv", index=False)
    provenance = {
        "collection": "COPERNICUS/S1_GRD",
        "project": project,
        "retrieved_utc": datetime.now(UTC).isoformat(),
        "platform": "Sentinel-1A only",
        "pass": "DESCENDING",
        "orbit_selection": "Most scenes covering the cell centre during 2018-2021",
        "extraction_scale_m": 30,
        "input_pixel_spacing_m": 10,
        "geometry": "2016 priority peat within fixed 1km cells; simplified 5m",
        "aggregation": "Median dB; angle 30-46 deg; >=50% approximate coverage",
        "processing": (
            "EE calibrated/terrain-corrected sigma0; no radiometric terrain flattening"
        ),
        "meaning": "Backscatter observations, not direct moisture or temperature",
        "rows": len(frame),
        "quality_eligible_rows": int(frame.quality_eligible.sum()),
    }
    (PROCESSED / "radar_summary.json").write_text(
        json.dumps(provenance, indent=2) + "\n"
    )


def join():
    raw = pd.read_csv(PROCESSED / "radar_observations.csv")
    raw["radar_time_utc"] = pd.to_datetime(raw.radar_time_utc)
    raw = raw.loc[raw.quality_eligible].copy()
    # Adjacent swath slices can duplicate one overpass; keep the best covered slice.
    raw["pass_date"] = raw.radar_time_utc.dt.normalize()
    raw = raw.sort_values("VV_count", ascending=False).drop_duplicates(
        ["cell_id", "pass_date"]
    )
    raw = raw.rename(columns={"VV_median": "vv_db", "VH_median": "vh_db"})
    raw["month"] = raw.radar_time_utc.dt.month
    training = raw.loc[raw.radar_time_utc.dt.year <= 2021]
    normals = training.groupby(["cell_id", "month"])[["vv_db", "vh_db"]].median()
    normals = normals.rename(columns={"vv_db": "vv_normal_db", "vh_db": "vh_normal_db"})
    normals.to_csv(PROCESSED / "radar_training_normals.csv")
    raw = raw.merge(normals, on=["cell_id", "month"], validate="many_to_one")
    raw = raw.sort_values(["cell_id", "radar_time_utc"])
    for band in ["vv", "vh"]:
        raw[band + "_seasonal_anomaly_db"] = (
            raw[band + "_db"] - raw[band + "_normal_db"]
        )
        raw[band + "_change_db"] = raw.groupby("cell_id")[band + "_db"].diff()
    raw["radar_pass_gap_days"] = (
        raw.groupby("cell_id").radar_time_utc.diff().dt.total_seconds() / 86400
    )
    raw["vv_last3_anomaly_db"] = raw.groupby(
        "cell_id"
    ).vv_seasonal_anomaly_db.transform(lambda x: x.rolling(3, min_periods=3).mean())
    # A 48h delivery lag is assumed; historical availability is not verified.
    raw["radar_available_assumed_utc"] = raw.radar_time_utc + pd.Timedelta(hours=48)
    inputs = pd.read_parquet(PROCESSED / "model_inputs.parquet")
    inputs = inputs.drop(
        columns=[
            c
            for c in RADAR_FEATURES
            + [
                "radar_time_utc",
                "radar_available_assumed_utc",
                "scene_id",
                "radar_stale",
            ]
            if c in inputs.columns
        ]
    )
    joined = []
    for cell_id, frame in inputs.groupby("cell_id"):
        observations = raw.loc[raw.cell_id == cell_id].sort_values(
            "radar_available_assumed_utc"
        )
        cols = ["radar_time_utc", "radar_available_assumed_utc", "scene_id"] + [
            c for c in RADAR_FEATURES if c != "radar_age_days"
        ]
        merged = pd.merge_asof(
            frame.sort_values("issue_time_utc"),
            observations[cols],
            left_on="issue_time_utc",
            right_on="radar_available_assumed_utc",
            direction="backward",
            allow_exact_matches=False,
        )
        merged["radar_age_days"] = (
            merged.issue_time_utc - merged.radar_time_utc
        ).dt.total_seconds() / 86400
        merged["radar_stale"] = (
            merged.radar_age_days.gt(18) | merged.radar_age_days.isna()
        )
        signal_cols = [c for c in RADAR_FEATURES if c != "radar_age_days"]
        merged.loc[merged.radar_stale, signal_cols] = np.nan
        merged["radar_status"] = np.where(
            merged.radar_stale, "missing_or_older_than_18d", "available_hindcast"
        )
        joined.append(merged)
    combined = pd.concat(joined, ignore_index=True)
    combined.to_parquet(PROCESSED / "model_inputs.parquet", index=False)
    combined.head(100).to_csv(PROCESSED / "model_inputs_sample.csv", index=False)
    print(
        f"Radar joined: {int((~combined.radar_stale).sum())}/{len(combined)} area-days",
        flush=True,
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--project")
    parser.add_argument("--join-only", action="store_true")
    args = parser.parse_args()
    if not args.join_only:
        if not args.project:
            parser.error("--project is required for extraction")
        extract(args.project)
    join()

"""Read the current PeatPulse downloads and export a map snapshot."""

import gzip
import json
from datetime import UTC, datetime
from pathlib import Path

import numpy as np
import pandas as pd
from pyproj import Transformer
from shapely import make_valid
from shapely.geometry import mapping, shape
from shapely.ops import transform

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT.parent / "backend/data"
PROCESSED = SOURCE / "processed"
RAW = SOURCE / "raw"
TO_LL = Transformer.from_crs(27700, 4326, always_xy=True)


def read_json(path):
    return json.loads(path.read_text())


def geo(geometry, tolerance=50):
    return mapping(transform(TO_LL.transform, geometry.simplify(tolerance)))


def clean(value):
    if isinstance(value, dict):
        return {str(k): clean(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [clean(v) for v in value]
    if isinstance(value, np.generic):
        return clean(value.item())
    if isinstance(value, float):
        return round(value, 4) if np.isfinite(value) else None
    if pd.isna(value):
        return None
    return value


def export():
    cells = pd.read_csv(PROCESSED / "audit_cells.csv")
    eligible = pd.read_csv(PROCESSED / "eligible_cells.csv")
    boundary = make_valid(
        shape(read_json(RAW / "highland.geojson")["features"][0]["geometry"])
    )
    audit = pd.read_csv(PROCESSED / "burn_record_audit.csv")
    records = {
        int(row.record_id): row._asdict() for row in audit.itertuples(index=False)
    }
    footprint_source = read_json(PROCESSED / "audit_peat_footprints.geojson")[
        "features"
    ]
    footprint_shapes = {
        feature["properties"]["cell_id"]: make_valid(shape(feature["geometry"]))
        for feature in footprint_source
    }
    burns = []
    for feature in read_json(RAW / "dated_burns.geojson")["features"]:
        record_id = int(feature["properties"]["OBJECTID"])
        if record_id not in records:
            continue
        polygon = make_valid(shape(feature["geometry"])).intersection(boundary)
        properties = clean(records[record_id])
        properties["audit_cell_ids"] = [
            cell_id
            for cell_id, footprint in footprint_shapes.items()
            if footprint.intersects(polygon)
        ]
        burns.append(
            {"type": "Feature", "properties": properties, "geometry": geo(polygon, 15)}
        )
    footprints = []
    for feature in footprint_source:
        footprints.append(
            {
                "type": "Feature",
                "properties": {"cell_id": feature["properties"]["cell_id"]},
                "geometry": geo(shape(feature["geometry"]), 5),
            }
        )
    weather = {}
    for weather_id in cells.weather_id.unique():
        path = RAW / "weather" / f"{weather_id}.json"
        if not path.exists():
            continue
        try:
            data = read_json(path)
        except json.JSONDecodeError:
            continue
        frame = pd.DataFrame(data["hourly"])
        frame.index = pd.DatetimeIndex(pd.to_datetime(frame.pop("time")))
        noon = frame.index.hour == 12
        daily = frame.loc[noon].copy()
        daily["precip_24h_mm"] = frame.precipitation.rolling(24).sum().loc[noon]
        daily["precip_7d_mm"] = frame.precipitation.rolling(168).sum().loc[noon]
        daily["precip_30d_mm"] = frame.precipitation.rolling(720).sum().loc[noon]
        daily = daily.loc[daily.index.year >= 2018]
        columns = [
            "temperature_2m",
            "relative_humidity_2m",
            "wind_speed_10m",
            "vapour_pressure_deficit",
            "precip_24h_mm",
            "precip_7d_mm",
            "precip_30d_mm",
        ]
        weather[weather_id] = {
            "latitude": data["latitude"],
            "longitude": data["longitude"],
            "start": daily.index.min().strftime("%Y-%m-%d"),
            "columns": columns,
            "values": clean(daily[columns].to_numpy().round(2).tolist()),
        }
    # Prefer monthly exports; any quarter export supplies still-missing months.
    radar_records = {}
    radar_paths = list((RAW / "radar").glob("orbit[0-9]*_*.json"))
    radar_paths += list((RAW / "radar/monthly").glob("orbit[0-9]*_*.json"))
    for path in radar_paths:
        try:
            features = read_json(path)["features"]
        except (json.JSONDecodeError, KeyError):
            continue
        for f in features:
            p = f["properties"]
            if not p.get("VV_median") or not p.get("VH_median"):
                continue
            fraction = p.get("VV_count", 0) * 900 / p.get("peat_area_m2", 1)
            if fraction < 0.5:
                continue
            radar_records[(p["cell_id"], p["scene_id"])] = p
    radar = {}
    for p in radar_records.values():
        radar.setdefault(p["cell_id"], []).append(
            [
                p["time_ms"],
                round(p["VV_median"], 3),
                round(p["VH_median"], 3),
                p["scene_id"],
                p["relative_orbit"],
                p.get("VV_count"),
            ]
        )
    for rows in radar.values():
        rows.sort(key=lambda row: row[0])
    surveys = pd.read_csv(PROCESSED / "peat_surveys.csv")
    survey_points = []
    for row in surveys.to_dict("records"):
        if pd.isna(row.get("X")) or pd.isna(row.get("Y")):
            continue
        lon, lat = TO_LL.transform(row["X"], row["Y"])
        survey_points.append(
            {
                "longitude": lon,
                "latitude": lat,
                "cell_id": row["cell_id"],
                "date": str(row.get("survey_date", ""))[:10],
                "depth_cm": row.get("DEPTH_CM"),
                "condition": row.get("CONDITION"),
            }
        )
    water = pd.read_csv(PROCESSED / "forsinard_group_daily.csv")
    field = pd.read_parquet(PROCESSED / "forsinard_water_levels.parquet")
    sensor_points = field.drop_duplicates("sensor_id")[
        ["sensor_id", "site", "treatment", "easting", "northing", "qc_flag"]
    ]
    sensors = []
    for row in sensor_points.to_dict("records"):
        lon, lat = TO_LL.transform(row.pop("easting"), row.pop("northing"))
        sensors.append({**row, "longitude": lon, "latitude": lat})
    field_days = water.loc[water.eligible].to_dict("records")
    prediction_path = (
        SOURCE / "expanded/models/grouped_cv/out_of_fold_predictions.parquet"
    )
    prediction_columns = [
        "cell_id",
        "date",
        "longitude",
        "latitude",
        "cv_fold",
        "tie_key",
        "cv_eligible",
        "satellite_burn_next_7d",
        "event_group_id",
        "strong_weather_oof_score",
        "cems_fwi_reference_oof_score",
    ]
    if not prediction_path.exists():
        raise FileNotFoundError(
            "Expanded held-out predictions are missing; run the grouped CV first."
        )
    predictions = pd.read_parquet(prediction_path, columns=prediction_columns)
    event_rows = predictions.loc[
        predictions.cv_eligible
        & predictions.satellite_burn_next_7d.eq(1)
        & predictions.event_group_id.notna()
    ]
    evaluated_events = int(event_rows.event_group_id.nunique())
    comparison = {}
    for name, score in [
        ("fwi", "cems_fwi_reference_oof_score"),
        ("our_model", "strong_weather_oof_score"),
    ]:
        candidates = predictions.loc[predictions[score].notna()]
        alerts = candidates.sort_values(
            ["cv_fold", "date", score, "tie_key"],
            ascending=[True, True, False, True],
        ).drop_duplicates(["cv_fold", "date"])
        hits = alerts.loc[alerts.cv_eligible & alerts.satellite_burn_next_7d.eq(1)]
        locations = (
            alerts.groupby("cell_id", as_index=False)
            .agg(
                latitude=("latitude", "first"),
                longitude=("longitude", "first"),
                weight=("date", "size"),
            )
            .to_dict("records")
        )
        comparison[name] = {
            "alerts": clean(locations),
            "alert_days": len(alerts),
            "caught_groups": int(hits.event_group_id.nunique()),
            "burn_groups": evaluated_events,
        }
    fwi_counts = pd.DataFrame(comparison["fwi"]["alerts"])
    model_counts = pd.DataFrame(comparison["our_model"]["alerts"])
    differences = fwi_counts.merge(
        model_counts,
        on="cell_id",
        how="outer",
        suffixes=("_fwi", "_model"),
    ).fillna(0)
    for column in ["latitude_fwi", "longitude_fwi"]:
        model_column = column.removesuffix("_fwi") + "_model"
        differences[column] = differences[column].where(
            differences[column] != 0, differences[model_column]
        )
    differences["difference"] = differences["weight_model"] - differences["weight_fwi"]
    fwi_more = differences.loc[differences.difference < 0].assign(
        weight=lambda frame: -frame.difference,
        latitude=lambda frame: frame.latitude_fwi,
        longitude=lambda frame: frame.longitude_fwi,
    )
    model_more = differences.loc[differences.difference > 0].assign(
        weight=lambda frame: frame.difference,
        latitude=lambda frame: frame.latitude_fwi.where(
            frame.latitude_fwi != 0, frame.latitude_model
        ),
        longitude=lambda frame: frame.longitude_fwi.where(
            frame.longitude_fwi != 0, frame.longitude_model
        ),
    )
    summary = read_json(PROCESSED / "spatial_summary.json")
    snapshot = {
        "created": datetime.now(UTC).isoformat(),
        "start": "2018-01-01",
        "end": "2024-12-31",
        "boundary": {
            "type": "Feature",
            "properties": {},
            "geometry": geo(boundary, 150),
        },
        "cells": clean(cells.to_dict("records")),
        "eligible": clean(
            eligible[["latitude", "longitude"]].round(5).to_numpy().tolist()
        ),
        "footprints": footprints,
        "burns": burns,
        "evaluation": {
            "burn_groups": evaluated_events,
            "fwi": comparison["fwi"],
            "our_model": comparison["our_model"],
            "differences": {
                "fwi_more": clean(
                    fwi_more[["latitude", "longitude", "weight"]].to_dict("records")
                ),
                "our_model_more": clean(
                    model_more[["latitude", "longitude", "weight"]].to_dict("records")
                ),
                "largest_cell_difference": int(differences.difference.abs().max()),
            },
        },
        "weather": weather,
        "radar": radar,
        "surveys": clean(survey_points),
        "sensors": clean(sensors),
        "water": clean(field_days),
        "summary": summary,
        "counts": {
            "weather_locations": len(weather),
            "radar_observations": len(radar_records),
            "radar_cells": len(radar),
            "survey_points": len(survey_points),
        },
    }
    out = ROOT / "data"
    out.mkdir(exist_ok=True)
    encoded = json.dumps(
        clean(snapshot), separators=(",", ":"), allow_nan=False
    ).encode()
    compressed = gzip.compress(encoded)
    temporary = out / "snapshot.part"
    temporary.write_bytes(compressed)
    temporary.replace(out / "snapshot.json.gz")
    print(
        f"Snapshot: {len(cells)} cells, {evaluated_events} evaluated burn groups, "
        f"{len(weather)} weather locations, "
        f"{len(radar_records)} radar observations; "
        f"{len(compressed):,} compressed bytes",
        flush=True,
    )
    return snapshot["counts"]


if __name__ == "__main__":
    export()

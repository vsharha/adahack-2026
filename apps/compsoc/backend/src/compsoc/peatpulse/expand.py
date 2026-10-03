"""Discover additional peat burn episodes and build a separate expanded sample."""

import argparse
import hashlib
import json
import os
import shutil
import subprocess
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime
from pathlib import Path

import ee
import ee.data as ee_data
import pandas as pd
from shapely import STRtree, make_valid, prepare, union_all
from shapely.geometry import Point, box, mapping, shape

from .fetch import BOUNDARY_URL, PEAT_URL, fetch, json_data
from .labels import burn_interval, valid_quality
from .spatial import TO_BNG, TO_LL

BASE = Path(__file__).resolve().parents[3] / "data"
EXPANDED = BASE / "expanded"


def national_foundation():
    folder = EXPANDED / "raw/foundation"
    boundary_path = fetch(
        "scotland.geojson",
        BOUNDARY_URL,
        {"where": "1=1", "f": "geojson", "outFields": "NAME", "outSR": 27700},
        root=folder,
    )
    boundary = union_all(
        [make_valid(shape(f["geometry"])) for f in json_data(boundary_path)["features"]]
    )
    params = {
        "service": "WFS",
        "version": "2.0.0",
        "request": "GetFeature",
        "typeNames": "renewables:carbonpeatlandmap2016",
        "CQL_FILTER": "importance IN (1,2)",
        "outputFormat": "application/json",
        "srsName": "EPSG:27700",
        "propertyName": "the_geom,importance",
        "count": 2000,
    }
    first = fetch(
        "peat/00000.geojson", PEAT_URL, {**params, "startIndex": 0}, root=folder
    )
    total = int(json_data(first)["totalFeatures"])

    def page(offset):
        return fetch(
            f"peat/{offset:05d}.geojson",
            PEAT_URL,
            {**params, "startIndex": offset},
            root=folder,
        )

    with ThreadPoolExecutor(max_workers=3) as pool:
        paths = [first, *pool.map(page, range(2000, total, 2000))]
    features = [f for p in paths for f in json_data(p)["features"]]
    assert len({f["id"] for f in features}) == len(features) == total
    peat = [make_valid(shape(f["geometry"])) for f in features]
    print(f"Scotland foundation: {len(peat)} priority peat polygons", flush=True)
    return boundary, peat


def discover(project, national=False):
    """Sample mapped burn pixels before choosing extra cells."""
    ee.Initialize(project=project)
    ee_data.setDeadline(120000)
    folder = EXPANDED / "raw" / ("discovery_scotland" if national else "discovery")
    folder.mkdir(parents=True, exist_ok=True)
    if national:
        boundary, peat = national_foundation()
    else:
        boundary = shape(
            json_data(BASE / "raw/highland.geojson")["features"][0]["geometry"]
        )
        peat = [
            make_valid(shape(f["geometry"]))
            for p in sorted((BASE / "raw/peat").glob("*.geojson"))
            for f in json_data(p)["features"]
        ]
    region = ee.Geometry(
        mapping(boundary.simplify(100)), proj="EPSG:27700", geodesic=False
    )
    collection = ee.ImageCollection("MODIS/061/MCD64A1")
    projection = ee.Image(collection.first()).select("BurnDate").projection()

    def year_batch(year):
        path = folder / f"{year}.json"
        if path.exists():
            return path
        images = collection.filterDate(f"{year}-01-01", f"{year + 1}-01-01")

        def pixels(value):
            im = ee.Image(value)
            return (
                im.select(["BurnDate", "Uncertainty", "QA"])
                .addBands(ee.Image.pixelCoordinates(projection))
                .updateMask(im.select("BurnDate").gt(0))
                .sample(
                    region=region, projection=projection, geometries=True, tileScale=4
                )
                .map(lambda f: f.set("product_month", im.date().format("YYYY-MM-dd")))
            )

        result = ee.FeatureCollection(images.map(pixels)).flatten().getInfo()
        if result is None:
            raise ValueError(f"No discovery result for {year}")
        result["retrieved_utc"] = datetime.now(UTC).isoformat()
        path.write_text(json.dumps(result))
        print(f"Discovery {year}: {len(result['features'])} burned pixels", flush=True)
        return path

    with ThreadPoolExecutor(max_workers=2) as pool:
        paths = list(pool.map(year_batch, range(2018, 2026 if national else 2025)))
    peat_tree = STRtree(peat)
    prepare(boundary)
    cells = {}
    records = []
    for path in paths:
        for feature in json_data(path)["features"]:
            props = feature["properties"]
            if not valid_quality(int(props["QA"])):
                continue
            lon, lat = feature["geometry"]["coordinates"]
            east, north = TO_BNG.transform(lon, lat)
            x, y = int(east // 1000) * 1000, int(north // 1000) * 1000
            cell = f"BNG_{x}_{y}"
            if cell not in cells:
                square = box(x, y, x + 1000, y + 1000)
                indices = peat_tree.query(square, predicate="intersects")
                footprint = union_all([peat[i].intersection(square) for i in indices])
                if not national:
                    footprint = footprint.intersection(boundary)
                cl, ca = TO_LL.transform(x + 500, y + 500)
                cells[cell] = {
                    "cell_id": cell,
                    "easting": x + 500,
                    "northing": y + 500,
                    "longitude": cl,
                    "latitude": ca,
                    "peat_fraction": footprint.area / 1e6,
                }
            if cells[cell]["peat_fraction"] < 0.5:
                continue
            point = Point(east, north)
            if not boundary.covers(point) or not len(
                peat_tree.query(point, predicate="intersects")
            ):
                continue
            date, lower, upper = burn_interval(
                props["product_month"],
                int(props["BurnDate"]),
                int(props["Uncertainty"]),
            )
            records.append(
                {
                    "cell_id": cell,
                    "longitude": lon,
                    "latitude": lat,
                    "easting": east,
                    "northing": north,
                    "pixel_id": f"modis_{int(props['x'])}_{int(props['y'])}",
                    "date": date,
                    "lower": lower,
                    "upper": upper,
                    "uncertainty_days": props["Uncertainty"],
                    "qa": props["QA"],
                }
            )
    pixels = pd.DataFrame(records).drop_duplicates(["pixel_id", "date"])
    pixels = pixels.sort_values(["date", "pixel_id"]).reset_index(drop=True)
    # Deliberately merge nearby detections across cells to avoid inflating events.
    parent = list(range(len(pixels)))

    def root(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    tree = STRtree(
        [Point(e, n) for e, n in zip(pixels.easting, pixels.northing, strict=True)]
    )
    for i, row in enumerate(pixels.to_dict("records")):
        for j in tree.query(
            Point(row["easting"], row["northing"]).buffer(5000), predicate="intersects"
        ):
            if abs((row["date"] - pixels.iloc[j].date).days) <= 14:
                parent[root(int(j))] = root(i)
    groups = {
        r: f"burncluster_{k:03d}"
        for k, r in enumerate(sorted({root(i) for i in parent}), 1)
    }
    pixels["event_group"] = [groups[root(i)] for i in range(len(pixels))]
    output = EXPANDED / ("processed" if national else "highland_discovery")
    output.mkdir(parents=True, exist_ok=True)
    pixels.to_csv(output / "discovered_burn_pixels.csv", index=False)
    pd.DataFrame(cells.values()).to_csv(output / "discovered_cells.csv", index=False)
    events = (
        pixels.groupby("event_group")
        .agg(
            first_burn=("date", "min"),
            last_burn=("date", "max"),
            pixels=("pixel_id", "nunique"),
            cells=("cell_id", "nunique"),
            best_uncertainty_days=("uncertainty_days", "min"),
        )
        .reset_index()
    )
    events["year"] = events.first_burn.dt.year
    events["wildfire_status"] = "satellite_burn_type_unverified"
    events.to_csv(output / "discovered_event_groups.csv", index=False)
    print(events.groupby("year").size().to_string(), flush=True)
    print(
        f"Peat discovery: {len(pixels)} pixels, {len(events)} candidate event groups",
        flush=True,
    )
    (output / "discovery_summary.json").write_text(
        json.dumps(
            {
                "area": "Scotland" if national else "Highland",
                "period": "2018-2025" if national else "2018-2024",
                "burn_pixels": len(pixels),
                "event_groups": len(events),
                "grouping": (
                    "Connected detections within 5 km and 14 days; "
                    "provisional event groups, not confirmed fires"
                ),
                "raw_hashes": {
                    p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in paths
                },
            },
            indent=2,
        )
    )


def prepare_sample():
    """Freeze case cells and geography-matched controls before reading predictors."""
    output = EXPANDED / "processed"
    raw = EXPANDED / "raw"
    boundary, peat = national_foundation()
    tree = STRtree(peat)
    pixels = pd.read_csv(
        output / "discovered_burn_pixels.csv", parse_dates=["date", "lower", "upper"]
    )
    events = pd.read_csv(
        output / "discovered_event_groups.csv", parse_dates=["first_burn", "last_burn"]
    )
    original = pd.read_csv(BASE / "processed/audit_cells.csv")
    cell_rows = {r["cell_id"]: r for r in original.to_dict("records")}
    footprints = {
        f["properties"]["cell_id"]: shape(f["geometry"])
        for f in json_data(BASE / "processed/audit_peat_footprints.geojson")["features"]
    }

    def add_cell(x, y, role):
        key = f"BNG_{x}_{y}"
        if key in cell_rows:
            return key
        square = box(x, y, x + 1000, y + 1000)
        indices = tree.query(square, predicate="intersects")
        footprint = union_all([peat[i].intersection(square) for i in indices])
        fraction = footprint.area / 1e6
        if fraction < 0.5:
            return None
        lon, lat = TO_LL.transform(x + 500, y + 500)
        cell_rows[key] = {
            "cell_id": key,
            "easting": x + 500,
            "northing": y + 500,
            "longitude": lon,
            "latitude": lat,
            "peat_fraction": fraction,
            "sample_role": role,
        }
        footprints[key] = footprint
        return key

    choices = []
    for event in events.to_dict("records"):
        group = pixels.loc[pixels.event_group.eq(event["event_group"])].copy()
        event_cells = sorted(group.cell_id.unique())
        for cell_id in event_cells:
            cx, cy = (int(v) for v in cell_id.split("_")[1:])
            assert add_cell(cx, cy, "burn_case_expansion") is not None
        # Earliest detections limit selecting a spreading fire's late affected cell.
        group = group.loc[group.date <= event["first_burn"] + pd.Timedelta(days=2)]
        candidate = group.sort_values(["uncertainty_days", "date", "cell_id"]).iloc[0]
        x, y = (int(v) for v in candidate.cell_id.split("_")[1:])
        case = add_cell(x, y, "burn_case_expansion")
        offsets = [
            (dx, dy)
            for dx in range(-10, 11)
            for dy in range(-10, 11)
            if 25 <= dx * dx + dy * dy <= 100
        ]
        offsets.sort(key=lambda xy: hashlib.sha256(f"{case}:{xy}".encode()).hexdigest())
        control = None
        for dx, dy in offsets:
            control = add_cell(
                x + dx * 1000, y + dy * 1000, "nearby_geographic_comparison"
            )
            if control and control != case:
                break
        choices.append(
            {
                **event,
                "case_cell": case,
                "burned_cell_ids": "|".join(event_cells),
                "comparison_cell": control,
                "selection": (
                    "Every discovered burned 1 km cell retained; "
                    "earliest-2-day representative locates comparison cell"
                ),
                "control_selection": (
                    "Fixed hash order among 5-10 km grid offsets; "
                    "geography only, outcome not screened"
                ),
            }
        )
    pd.DataFrame(choices).to_csv(output / "sampled_event_manifest.csv", index=False)
    sample = pd.DataFrame(cell_rows.values()).sort_values("cell_id")
    sample["weather_lat_request"] = (sample.latitude * 4).round() / 4
    sample["weather_lon_request"] = (sample.longitude * 4).round() / 4
    sample["weather_id"] = [
        f"era5_{a:.2f}_{o:.2f}"
        for a, o in zip(
            sample.weather_lat_request, sample.weather_lon_request, strict=True
        )
    ]
    sample.to_csv(output / "audit_cells.csv", index=False)
    sample[
        ["weather_id", "weather_lat_request", "weather_lon_request"]
    ].drop_duplicates().to_csv(output / "weather_locations.csv", index=False)
    geojson = {
        "type": "FeatureCollection",
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::27700"}},
        "features": [
            {
                "type": "Feature",
                "properties": row,
                "geometry": mapping(footprints[row["cell_id"]]),
            }
            for row in sample.to_dict("records")
        ],
    }
    (output / "audit_peat_footprints.geojson").write_text(json.dumps(geojson))
    (raw / "highland.geojson").write_text(
        json.dumps(
            {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {"NAME": "Scotland"},
                        "geometry": mapping(boundary),
                    }
                ],
            }
        )
    )
    # Reuse immutable cached weather; new locations download into the new folder.
    (raw / "weather").mkdir(exist_ok=True)
    for source in (BASE / "raw/weather").glob("*"):
        destination = raw / "weather" / source.name
        if not destination.exists():
            os.link(source, destination)
    shutil.copy2(BASE / "raw/dated_burns.geojson", raw / "dated_burns.geojson")
    burn_rows = []
    for feature in json_data(raw / "dated_burns.geojson")["features"]:
        p = feature["properties"]
        date = pd.to_datetime(p["REC_DATE"], unit="ms", utc=True)
        if not 2018 <= date.year <= 2025:
            continue
        geometry = make_valid(shape(feature["geometry"]))
        matched = [key for key, geom in footprints.items() if geom.intersects(geometry)]
        burn_rows.append(
            {
                "record_id": p["OBJECTID"],
                "name": p.get("NAME"),
                "source": p.get("SOURCE"),
                "recorded_date": date.date().isoformat(),
                "year": date.year,
                "cell_ids": "|".join(sorted(matched)),
            }
        )
    pd.DataFrame(burn_rows).to_csv(output / "burn_record_audit.csv", index=False)
    info = {
        "area": "Scotland",
        "cells": len(sample),
        "original_cells": len(original),
        "candidate_event_groups": len(events),
        "weather_locations": int(sample.weather_id.nunique()),
        "sample_roles": sample.sample_role.value_counts().to_dict(),
        "sampling": (
            "Case-enriched feasibility panel; all dates retained, "
            "never balance by dropping quiet days"
        ),
        "frozen_before_predictors": datetime.now(UTC).isoformat(),
    }
    (output / "sample_manifest.json").write_text(json.dumps(info, indent=2))
    print(json.dumps(info, indent=2), flush=True)


def run_pipeline(project):
    """Run cached extraction jobs in separate local processes and join at the end."""
    env = {
        **os.environ,
        "PEATPULSE_DATA_DIR": str(EXPANDED),
        "PEATPULSE_END_YEAR": "2025",
    }
    log_folder = EXPANDED / "logs"
    log_folder.mkdir(exist_ok=True)
    backend = Path(__file__).resolve().parents[3]

    def stage(name, arguments):
        print(f"Starting {name}", flush=True)
        with (log_folder / f"{name}.log").open("w") as log:
            subprocess.run(
                ["uv", "--directory", str(backend), "run", "python", *arguments],
                env=env,
                stdout=log,
                stderr=subprocess.STDOUT,
                check=True,
            )
        print(f"Finished {name}", flush=True)

    def outcomes():
        for module in ("burned_area", "thermal"):
            stage(module, ["-m", f"compsoc.peatpulse.{module}", "--project", project])

    with ThreadPoolExecutor(max_workers=3) as pool:
        futures = [
            pool.submit(
                stage,
                "weather",
                ["-m", "compsoc.peatpulse.weather", "--project", project],
            ),
            pool.submit(
                stage,
                "radar",
                [
                    "-c",
                    "from compsoc.peatpulse.radar import extract; "
                    f"extract({project!r})",
                ],
            ),
            pool.submit(outcomes),
        ]
        for future in futures:
            future.result()
    stage("radar_join", ["-m", "compsoc.peatpulse.radar", "--join-only"])
    stage("labels", ["-m", "compsoc.peatpulse.labels"])
    stage("dataset", ["-m", "compsoc.peatpulse.expanded_dataset"])


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--project", required=True)
    parser.add_argument("--national", action="store_true")
    parser.add_argument("--prepare", action="store_true")
    parser.add_argument("--run", action="store_true")
    args = parser.parse_args()
    if args.run:
        run_pipeline(args.project)
    elif args.prepare:
        prepare_sample()
    else:
        discover(args.project, args.national)

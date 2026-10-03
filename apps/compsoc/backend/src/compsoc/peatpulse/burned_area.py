"""Download MODIS burned-area observations and their observation-quality bands."""

import argparse
import hashlib
import json
from datetime import UTC, datetime

import ee
import ee.data as ee_data
import pandas as pd
from shapely.geometry import Point, mapping, shape

from .fetch import END_YEAR, PROCESSED, RAW, json_data, sample_cache
from .spatial import TO_BNG

COLLECTION = "MODIS/061/MCD64A1"
BANDS = ["BurnDate", "Uncertainty", "QA", "FirstDay", "LastDay"]


def extract(project):
    ee.Initialize(project=project)
    ee_data.setDeadline(120000)
    folder = sample_cache("burned_area")
    footprints = json_data(PROCESSED / "audit_peat_footprints.geojson")["features"]
    geometries = {
        f["properties"]["cell_id"]: shape(f["geometry"]).buffer(0) for f in footprints
    }
    regions = ee.FeatureCollection(
        [
            ee.Feature(
                ee.Geometry(
                    mapping(geometries[f["properties"]["cell_id"]]),
                    proj="EPSG:27700",
                    geodesic=False,
                ),
                {"cell_id": f["properties"]["cell_id"]},
            )
            for f in footprints
        ]
    )
    collection = ee.ImageCollection(COLLECTION).select(BANDS)
    projection = ee.Image(collection.first()).select("BurnDate").projection()
    projection_info = projection.getInfo()
    records = []
    # Padding covers year-end outcomes and the exclusion of recent prior burns.
    for year in range(2017, END_YEAR + 2):
        start = f"{year}-01-01" if year > 2017 else "2017-12-01"
        end = f"{year + 1}-01-01" if year <= END_YEAR else f"{END_YEAR + 1}-02-01"
        path = folder / f"{year}.json"
        if path.exists():
            payload = json_data(path)
        else:
            images = collection.filterDate(start, end).sort("system:time_start")
            dates = dict(
                zip(
                    images.aggregate_array("system:index").getInfo(),
                    images.aggregate_array("system:time_start").getInfo(),
                    strict=True,
                )
            )
            stack = images.map(lambda im: im.unmask(-9999)).toBands()
            stack = stack.addBands(ee.Image.pixelCoordinates(projection))
            samples = stack.sampleRegions(
                collection=regions,
                projection=projection,
                geometries=True,
                tileScale=4,
            ).getInfo()
            if samples is None:
                raise RuntimeError(f"No MODIS response for {year}")
            payload = {
                "dates": dates,
                "samples": samples,
                "retrieved_utc": datetime.now(UTC).isoformat(),
            }
            path.write_text(json.dumps(payload))
        kept = 0
        for feature in payload["samples"]["features"]:
            props = feature["properties"]
            lon, lat = feature["geometry"]["coordinates"]
            e, n = TO_BNG.transform(lon, lat)
            # sampleRegions may include edge pixels; require the centre in peat.
            if not geometries[props["cell_id"]].covers(Point(e, n)):
                continue
            pixel_id = f"modis_{int(props['x'])}_{int(props['y'])}"
            for image_id, millis in payload["dates"].items():
                records.append(
                    {
                        "cell_id": props["cell_id"],
                        "pixel_id": pixel_id,
                        "product_month": pd.Timestamp(millis, unit="ms")
                        .date()
                        .isoformat(),
                        "image_id": image_id,
                        "longitude": lon,
                        "latitude": lat,
                        **{b: props.get(f"{image_id}_{b}", -9999) for b in BANDS},
                    }
                )
                kept += 1
        print(f"MODIS {year}: {kept:,} cell/pixel/month records", flush=True)
    frame = pd.DataFrame(records)
    assert not frame.duplicated(["cell_id", "pixel_id", "product_month"]).any()
    frame.to_parquet(PROCESSED / "burned_area_pixels.parquet", index=False)
    frame.loc[frame.BurnDate.gt(0)].to_csv(
        PROCESSED / "burned_area_positive_pixels.csv", index=False
    )
    manifest = {
        "collection": COLLECTION,
        "bands": BANDS,
        "project": project,
        "projection": projection_info,
        "sampling": "Native MODIS pixel centres inside each mapped peat footprint",
        "pixel_spacing_m": abs(projection_info["transform"][0]),
        "product_period": f"2017-12 through {END_YEAR + 1}-01",
        "cell_pixel_months": len(frame),
        "cells_with_pixels": int(frame.cell_id.nunique()),
        "unique_cell_pixels": len(frame[["cell_id", "pixel_id"]].drop_duplicates()),
        "raw_files": [
            {
                "file": str(p.relative_to(RAW)),
                "sha256": hashlib.sha256(p.read_bytes()).hexdigest(),
            }
            for p in sorted(folder.glob("*.json"))
        ],
        "source": "https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MCD64A1",
        "interpretation": (
            "Burned-area classification, including managed burning; "
            "not ignition or wildfire type"
        ),
    }
    (PROCESSED / "burned_area_summary.json").write_text(
        json.dumps(manifest, indent=2) + "\n"
    )
    print(json.dumps(manifest, indent=2), flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--project", required=True)
    extract(parser.parse_args().project)

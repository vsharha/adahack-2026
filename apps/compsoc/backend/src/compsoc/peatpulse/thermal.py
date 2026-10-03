"""Obtain corroborating NASA FIRMS detections through the authenticated EE catalogue."""

import argparse
import json
from concurrent.futures import ThreadPoolExecutor, as_completed

import ee
import ee.data as ee_data
import pandas as pd
from shapely import prepare
from shapely.geometry import Point, mapping, shape

from .fetch import END_YEAR, PROCESSED, RAW, json_data, sample_cache
from .spatial import TO_BNG


def thermal(project):
    ee.Initialize(project=project)
    ee_data.setDeadline(120000)
    folder = sample_cache("firms")
    region = ee.Geometry.Rectangle([-7.1, 56.4, -3.0, 58.75], geodesic=False)
    if (PROCESSED / "sample_manifest.json").exists():
        footprints = json_data(PROCESSED / "audit_peat_footprints.geojson")["features"]
        region = ee.FeatureCollection(
            [
                ee.Feature(
                    ee.Geometry(
                        mapping(shape(f["geometry"]).buffer(0)),
                        proj="EPSG:27700",
                        geodesic=False,
                    ).buffer(1500)
                )
                for f in footprints
            ]
        ).geometry(maxError=5)
    collection = ee.ImageCollection("FIRMS")

    def quarter(year, month):
        path = folder / f"{year}_{month:02d}.json"
        if path.exists():
            return
        start = f"{year}-{month:02d}-01"
        end = f"{year + (month == 10)}-{1 if month == 10 else month + 3:02d}-01"
        images = collection.filterDate(start, end)

        def band_image(image):
            hot = image.updateMask(image.select("confidence").gte(80))
            return hot.unmask(-9999)

        stack = (
            images.map(band_image)
            .toBands()
            .updateMask(images.select("confidence").max().gte(80))
        )
        # Stack dates before one sampling reduction to avoid concurrent aggregations.
        sampled = stack.sample(region=region, scale=1000, geometries=True, tileScale=4)
        wide = sampled.getInfo()
        if wide is None:
            raise ValueError("FIRMS request returned no result")
        features = []
        date_lookup = dict(
            zip(
                images.aggregate_array("system:index").getInfo(),
                images.aggregate_array("system:time_start").getInfo(),
                strict=True,
            )
        )
        for feature in wide["features"]:
            props = feature["properties"]
            for name, confidence in props.items():
                if name.endswith("_confidence") and confidence >= 80:
                    day = name.split("_")[0]
                    features.append(
                        {
                            "type": "Feature",
                            "geometry": feature["geometry"],
                            "properties": {
                                "date": pd.Timestamp(date_lookup[day], unit="ms")
                                .date()
                                .isoformat(),
                                "confidence": confidence,
                                "T21": props[day + "_T21"],
                                "line_number": props[day + "_line_number"],
                            },
                        }
                    )
        result = {"type": "FeatureCollection", "features": features}
        if result is None:
            raise ValueError("FIRMS request returned no result")
        path.write_text(json.dumps(result))
        print(
            f"FIRMS {year}-{month:02d}: {len(result['features'])} raster detections",
            flush=True,
        )

    with ThreadPoolExecutor(max_workers=1) as pool:
        futures = [
            pool.submit(quarter, y, m)
            for y in range(2018, END_YEAR + 1)
            for m in [1, 4, 7, 10]
        ]
        for task in as_completed(futures):
            task.result()
    boundary = shape(json_data(RAW / "highland.geojson")["features"][0]["geometry"])
    prepare(boundary)
    rows = []
    for path in sorted(folder.glob("*.json")):
        for f in json_data(path)["features"]:
            lon, lat = f["geometry"]["coordinates"]
            e, n = TO_BNG.transform(lon, lat)
            if boundary.covers(Point(e, n)):
                rows.append(
                    {
                        **f["properties"],
                        "longitude": lon,
                        "latitude": lat,
                        "easting": e,
                        "northing": n,
                    }
                )
    columns = [
        "date",
        "T21",
        "confidence",
        "line_number",
        "longitude",
        "latitude",
        "easting",
        "northing",
    ]
    data = pd.DataFrame(rows, columns=columns)
    data.to_csv(PROCESSED / "firms_highland_raster_detections.csv", index=False)
    summary = {
        "collection": "FIRMS",
        "sensor": "MODIS",
        "confidence_min": 80,
        "period": f"2018-{END_YEAR}",
        "highland_raster_detections": len(data),
        "distinct_date_source_lines": len(
            data.drop_duplicates(["date", "line_number"])
        ),
        "meaning": "Thermal activity; not verified wildfire or ignition times",
        "quality": "Rasterized NRT product, not the science-quality VIIRS archive",
        "resolution_m": 1000,
        "source": "https://developers.google.com/earth-engine/datasets/catalog/FIRMS",
    }
    (PROCESSED / "firms_summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    print(json.dumps(summary, indent=2), flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--project", required=True)
    thermal(parser.parse_args().project)

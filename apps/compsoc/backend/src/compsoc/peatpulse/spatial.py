"""Define fixed peatland cells and audit burn records without inventing fire labels."""

import json

import numpy as np
import pandas as pd
from pyproj import Transformer
from shapely import STRtree, make_valid, prepare, union_all
from shapely.geometry import box, mapping, shape

from .fetch import PROCESSED, RAW, json_data

TO_LL = Transformer.from_crs(27700, 4326, always_xy=True)
TO_BNG = Transformer.from_crs(4326, 27700, always_xy=True)


def spatial():
    boundary = make_valid(
        shape(json_data(RAW / "highland.geojson")["features"][0]["geometry"])
    )
    prepare(boundary)
    peat = []
    peat_ids = set()
    expected = None
    for path in sorted((RAW / "peat").glob("*.geojson")):
        data = json_data(path)
        expected = int(data["totalFeatures"])
        for feature in data["features"]:
            if feature["id"] in peat_ids:
                raise ValueError("Duplicate peat polygon across pages")
            peat_ids.add(feature["id"])
            geom = make_valid(shape(feature["geometry"]))
            if boundary.intersects(geom):
                peat.append(
                    geom if boundary.covers(geom) else geom.intersection(boundary)
                )
    assert len(peat_ids) == expected, (len(peat_ids), expected)
    peat_tree = STRtree(peat)
    minx, miny, maxx, maxy = boundary.bounds
    cells = []
    geometries = []
    for x in range(int(minx // 1000) * 1000, int(maxx) + 1000, 1000):
        for y in range(int(miny // 1000) * 1000, int(maxy) + 1000, 1000):
            cell = box(x, y, x + 1000, y + 1000)
            indices = peat_tree.query(cell, predicate="intersects")
            if not len(indices):
                continue
            footprint = union_all([peat[i].intersection(cell) for i in indices])
            fraction = footprint.area / 1e6
            if fraction < 0.5:
                continue
            lon, lat = TO_LL.transform(x + 500, y + 500)
            cells.append(
                {
                    "cell_id": f"BNG_{x}_{y}",
                    "easting": x + 500,
                    "northing": y + 500,
                    "longitude": lon,
                    "latitude": lat,
                    "peat_fraction": fraction,
                }
            )
            geometries.append(footprint)
    cells = pd.DataFrame(cells)
    cells.to_csv(PROCESSED / "eligible_cells.csv", index=False)
    tree = STRtree(geometries)
    burn_rows = []
    burn_geometries = []
    burns = json_data(RAW / "dated_burns.geojson")["features"]
    for feature in burns:
        props = feature["properties"]
        date = pd.to_datetime(props["REC_DATE"], unit="ms", utc=True)
        if not 2018 <= date.year <= 2024:
            continue
        geom = make_valid(shape(feature["geometry"]))
        if not geom.intersects(boundary):
            continue
        geom = geom.intersection(boundary)
        pindices = peat_tree.query(geom, predicate="intersects")
        peat_area = union_all([peat[i].intersection(geom) for i in pindices]).area
        indices = tree.query(geom, predicate="intersects")
        centroid = geom.representative_point()
        lon, lat = TO_LL.transform(centroid.x, centroid.y)
        burn_rows.append(
            {
                "record_id": props["OBJECTID"],
                "name": props.get("NAME"),
                "source": props.get("SOURCE"),
                "recorded_date": date.date().isoformat(),
                "year": date.year,
                "longitude": lon,
                "latitude": lat,
                "highland_area_ha": geom.area / 10000,
                "peat_overlap_ha": peat_area / 10000,
                "cell_ids": "|".join(cells.iloc[indices].cell_id),
                "wildfire_status": "unresolved_wildfire_or_muirburn",
                "date_status": "recorded_date_not_verified_ignition",
                "primary_label_eligible": False,
                "prefire_image_date": props.get("PREFIREDATE"),
                "postfire_image_date": props.get("POSTFIREDATE"),
            }
        )
        burn_geometries.append(geom)
    records = pd.DataFrame(burn_rows)
    # Conservative candidate grouping, not a count of independent verified fires.
    parent = list(range(len(records)))

    def root(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    burn_tree = STRtree(burn_geometries)
    dates = pd.to_datetime(records.recorded_date)
    for i, geom in enumerate(burn_geometries):
        for j in burn_tree.query(geom.buffer(1000), predicate="intersects"):
            if abs((dates.iloc[i] - dates.iloc[j]).days) <= 7:
                parent[root(int(j))] = root(i)
    roots = sorted({root(i) for i in range(len(records))})
    group_ids = {r: f"candidate_{j:03d}" for j, r in enumerate(roots, 1)}
    records["candidate_group"] = [group_ids[root(i)] for i in range(len(records))]
    records.to_csv(PROCESSED / "burn_record_audit.csv", index=False)
    groups = (
        records.groupby("candidate_group")
        .agg(
            record_count=("record_id", "size"),
            first_recorded_date=("recorded_date", "min"),
            last_recorded_date=("recorded_date", "max"),
            names=("name", lambda x: " | ".join(sorted(set(x.dropna())))),
            sources=("source", lambda x: " | ".join(sorted(set(x.dropna())))),
            peat_overlap_ha_sum=("peat_overlap_ha", "sum"),
        )
        .reset_index()
    )
    groups["status"] = "candidate_only_needs_event_and_timing_confirmation"
    groups.to_csv(PROCESSED / "candidate_event_manifest.csv", index=False)

    # Spatial coverage sample is fixed using peat geography, without fire outcomes.
    xy = cells[["easting", "northing"]].to_numpy()
    centre = xy.mean(axis=0)
    selected = [int(np.argmin(((xy - centre) ** 2).sum(axis=1)))]
    distances = np.full(len(cells), np.inf)
    for _ in range(31):
        distances = np.minimum(distances, ((xy - xy[selected[-1]]) ** 2).sum(axis=1))
        selected.append(int(np.argmax(distances)))
    roles = {i: "spatial_coverage" for i in selected}
    # Additional cases support descriptive timelines only, not unbiased evaluation.
    candidate_cells = (
        records.loc[records.peat_overlap_ha > 0]
        .sort_values("peat_overlap_ha", ascending=False)
        .drop_duplicates("candidate_group")
    )
    for _, record in candidate_cells.head(12).iterrows():
        options = record.cell_ids.split("|")
        eligible = cells.index[cells.cell_id.isin(options)]
        if len(eligible):
            i = int(eligible.to_numpy()[0])
            if i not in roles:
                selected.append(i)
                roles[i] = "burn_case_descriptive_only"
    for name, lon, lat in [("forsinard", -3.95, 58.4)]:
        e, n = TO_BNG.transform(lon, lat)
        i = int(np.argmin(((xy - [e, n]) ** 2).sum(axis=1)))
        if i not in roles:
            selected.append(i)
            roles[i] = name + "_field_context"
    sample = cells.loc[selected].copy()
    sample["sample_role"] = [roles[i] for i in selected]
    sample["weather_lat_request"] = (sample.latitude * 4).round() / 4
    sample["weather_lon_request"] = (sample.longitude * 4).round() / 4
    sample["weather_id"] = [
        f"era5_{a:.2f}_{o:.2f}"
        for a, o in zip(
            sample.weather_lat_request, sample.weather_lon_request, strict=True
        )
    ]
    sample.to_csv(PROCESSED / "audit_cells.csv", index=False)
    sample[
        ["weather_id", "weather_lat_request", "weather_lon_request"]
    ].drop_duplicates().to_csv(PROCESSED / "weather_locations.csv", index=False)
    footprints = [
        {
            "type": "Feature",
            "properties": sample.loc[i].to_dict(),
            "geometry": mapping(geometries[i]),
        }
        for i in selected
    ]
    (PROCESSED / "audit_peat_footprints.geojson").write_text(
        json.dumps(
            {
                "type": "FeatureCollection",
                "crs": {
                    "type": "name",
                    "properties": {"name": "urn:ogc:def:crs:EPSG::27700"},
                },
                "features": footprints,
            }
        )
    )
    info = {
        "peat_source_polygons": len(peat_ids),
        "peat_highland_polygons": len(peat),
        "eligible_1km_cells": len(cells),
        "audit_cells": len(sample),
        "weather_locations": int(sample.weather_id.nunique()),
        "highland_dated_burn_records": len(records),
        "peat_intersecting_burn_records": int((records.peat_overlap_ha > 0).sum()),
        "candidate_groups_on_peat": int(
            records.loc[records.peat_overlap_ha > 0, "candidate_group"].nunique()
        ),
        "verified_primary_fire_labels": 0,
    }
    (PROCESSED / "spatial_summary.json").write_text(json.dumps(info, indent=2) + "\n")
    print(json.dumps(info, indent=2), flush=True)


if __name__ == "__main__":
    spatial()

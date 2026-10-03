"""Download public source data with an on-disk cache and provenance."""

import hashlib
import json
import os
import shutil
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime
from pathlib import Path
from threading import Lock

import requests

DATA = Path(
    os.environ.get("PEATPULSE_DATA_DIR", Path(__file__).resolve().parents[3] / "data")
).resolve()
RAW = DATA / "raw"
PROCESSED = DATA / "processed"
REPORT = DATA / "report"
END_YEAR = int(os.environ.get("PEATPULSE_END_YEAR", "2024"))
FIRE_URL = (
    "https://services1.arcgis.com/LM9GyVFsughzHdbO/arcgis/rest/services/"
    "Scottish_Wildfire_and_Muirburn_Extents/FeatureServer/0/query"
)
BOUNDARY_URL = (
    "https://services-eu1.arcgis.com/2REzQtl8TdVlI8S0/ArcGIS/rest/services/"
    "Scottish_Local_Authorities/FeatureServer/0/query"
)
PEAT_URL = "https://ogc.nature.scot/geoserver/renewables/ows"
FIELD_URL = "https://ogc.nature.scot/geoserver/peatlandaction/wfs"
STAC_URL = "https://planetarycomputer.microsoft.com/api/stac/v1"
WEATHER_LOCK = Lock()
LAST_WEATHER_REQUEST = 0.0


def fetch(name, url, params=None, seed=None, root=None):
    """Cache successful downloads; record URL, query, bytes and SHA256."""
    path = (RAW if root is None else root) / name
    path.parent.mkdir(parents=True, exist_ok=True)
    sidecar = path.with_suffix(path.suffix + ".source.json")
    if path.exists() and sidecar.exists():
        return path
    source = "download"
    if seed is not None and Path(seed).exists():
        shutil.copyfile(seed, path)
        source = "same-day source download retained from earlier audit"
    else:
        last_status = None
        for attempt in range(4):
            if "archive-api.open-meteo.com" in url:
                global LAST_WEATHER_REQUEST
                with WEATHER_LOCK:
                    delay = max(0, 22 - (time.monotonic() - LAST_WEATHER_REQUEST))
                    time.sleep(delay)
                    LAST_WEATHER_REQUEST = time.monotonic()
            response = requests.get(url, params=params, timeout=(15, 150))
            last_status = response.status_code
            if response.status_code in (429, 500, 502, 503, 504):
                time.sleep(min(5 * 2**attempt, 30))
                continue
            response.raise_for_status()
            if "ExceptionReport" in response.text[:1000]:
                raise RuntimeError(response.text[:1000])
            tmp = path.with_suffix(path.suffix + ".part")
            tmp.write_bytes(response.content)
            tmp.replace(path)
            break
        else:
            raise RuntimeError(f"Download failed: {url} ({last_status})")
    sidecar.write_text(
        json.dumps(
            {
                "url": url,
                "params": params,
                "retrieved_utc": datetime.now(UTC).isoformat(),
                "cache_origin": source,
                "bytes": path.stat().st_size,
                "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            },
            indent=2,
        )
        + "\n"
    )
    return path


def json_data(path):
    return json.loads(path.read_text())


def sample_cache(name, definition="audit_peat_footprints.geojson"):
    """Separate extraction caches when the expanded sample geometry changes."""
    folder = RAW / name
    if (PROCESSED / "sample_manifest.json").exists():
        fingerprint = hashlib.sha256((PROCESSED / definition).read_bytes()).hexdigest()[
            :16
        ]
        folder = folder / fingerprint
    folder.mkdir(parents=True, exist_ok=True)
    return folder


def foundation():
    """Fetch the boundary, burn catalogue, peat map and field measurements."""
    from shapely.geometry import shape

    for folder in (RAW, PROCESSED, REPORT):
        folder.mkdir(parents=True, exist_ok=True)
    boundary = fetch(
        "highland.geojson",
        BOUNDARY_URL,
        {
            "where": "NAME='Highland'",
            "f": "geojson",
            "outFields": "NAME",
            "outSR": 27700,
        },
        seed="/tmp/peatpulse-highland-check/highland.json",
    )
    fetch(
        "dated_burns.geojson",
        FIRE_URL,
        {
            "where": "REC_DATE IS NOT NULL",
            "f": "geojson",
            "outFields": "*",
            "outSR": 27700,
            "resultRecordCount": 2000,
        },
        seed="/tmp/peatpulse-highland-check/dated_fires.json",
    )
    b = shape(json_data(boundary)["features"][0]["geometry"]).bounds
    bbox = ",".join(str(x) for x in b)
    base = {
        "service": "WFS",
        "version": "2.0.0",
        "request": "GetFeature",
        "typeNames": "renewables:carbonpeatlandmap2016",
        "CQL_FILTER": f"importance IN (1,2) AND BBOX(the_geom,{bbox},'EPSG:27700')",
        "outputFormat": "application/json",
        "srsName": "EPSG:27700",
        "propertyName": "the_geom,importance",
        "count": 2000,
    }
    first = fetch("peat/00000.geojson", PEAT_URL, {**base, "startIndex": 0})
    first_data = json_data(first)
    count = int(first_data["totalFeatures"])
    offsets = list(range(2000, count, 2000))

    def page(offset):
        path = fetch(
            f"peat/{offset:05d}.geojson", PEAT_URL, {**base, "startIndex": offset}
        )
        print(f"Peat polygons: page {offset // 2000 + 1}", flush=True)
        return path

    with ThreadPoolExecutor(max_workers=3) as pool:
        list(pool.map(page, offsets))
    print(f"Peat source polygons in Highland bounding box: {count}", flush=True)
    metadata = json_data(
        fetch("forsinard/metadata.json", "https://zenodo.org/api/records/11186744")
    )
    for item in metadata["files"]:
        path = fetch(
            "forsinard/" + item["key"],
            item["links"]["self"],
            seed="/tmp/peatpulse-audit/" + item["key"],
        )
        assert hashlib.md5(path.read_bytes()).hexdigest() == item["checksum"][4:]
    fetch("sentinel1_rtc_collection.json", STAC_URL + "/collections/sentinel-1-rtc")
    fetch(
        "cems_catalogue.json",
        "https://ewds.climate.copernicus.eu/api/catalogue/"
        "v1/collections/cems-fire-historical-v1",
    )
    print("Foundation downloads complete", flush=True)


if __name__ == "__main__":
    foundation()

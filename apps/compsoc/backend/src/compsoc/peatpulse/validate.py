"""Check downloaded-table integrity and temporal alignment before publication."""

import hashlib
import json

import numpy as np
import pandas as pd

from .fetch import DATA, PROCESSED, RAW, REPORT, json_data
from .radar import RADAR_FEATURES


def validate():
    frame = pd.read_parquet(PROCESSED / "model_inputs.parquet")
    cells = pd.read_csv(PROCESSED / "audit_cells.csv")
    n_days = len(pd.date_range("2018-01-01", "2024-12-31"))
    assert set(RADAR_FEATURES).issubset(frame.columns), "Radar join is required"
    assert len(frame) == n_days * len(cells)
    assert not frame.duplicated(["cell_id", "date"]).any()
    assert frame.fire_next_7d.isna().all(), "Unverified labels must not become zero"
    assert frame.weather_cutoff_utc.lt(frame.issue_time_utc).all()
    assert not np.isinf(
        frame.select_dtypes(include="number").to_numpy(dtype=float)
    ).any()
    assert frame.relative_humidity_pct.between(0, 100).all()
    assert frame.precip_24h_mm.ge(0).all()
    assert frame.peat_fraction.between(0.5, 1.000001).all()
    if "radar_time_utc" in frame:
        valid = frame.radar_time_utc.notna()
        assert (
            frame.loc[valid, "radar_time_utc"]
            .lt(frame.loc[valid, "issue_time_utc"])
            .all()
        )
        assert (
            frame.loc[valid, "radar_available_assumed_utc"]
            .lt(frame.loc[valid, "issue_time_utc"])
            .all()
        )
        signal = [c for c in RADAR_FEATURES if c != "radar_age_days"]
        assert frame.loc[frame.radar_stale, signal].isna().all().all()
    sources = 0
    for sidecar in RAW.rglob("*.source.json"):
        record = json_data(sidecar)
        path = sidecar.with_name(sidecar.name.removesuffix(".source.json"))
        assert hashlib.sha256(path.read_bytes()).hexdigest() == record["sha256"]
        sources += 1
    cems_summary = PROCESSED / "cems_summary.json"
    if cems_summary.exists():
        cems = pd.read_parquet(PROCESSED / "cems_daily.parquet")
        assert not cems.duplicated(["weather_id", "date"]).any()
        missing_dates = set(json_data(cems_summary)["missing_dates"])
        actual_missing = set(frame.date.unique()) - set(cems.date.unique())
        assert missing_dates == actual_missing
        assert {"2024-08-08", "2024-12-09"}.issubset(missing_dates)
        assert frame.loc[frame.date.isin(missing_dates), "cems_fwi"].isna().all()
    result = {
        "status": "passed",
        "area_days": len(frame),
        "cells": len(cells),
        "days_per_cell": n_days,
        "checksummed_source_downloads": sources,
        "checks": [
            "row counts",
            "unique cell/date",
            "unknown labels preserved",
            "weather before issuance",
            "finite values and physical ranges",
            "radar backward join and staleness",
            "download checksums",
            "CEMS missing dates preserved",
        ],
    }
    REPORT.mkdir(exist_ok=True)
    (REPORT / "validation.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2))
    print(f"Data folder: {DATA}")


if __name__ == "__main__":
    validate()

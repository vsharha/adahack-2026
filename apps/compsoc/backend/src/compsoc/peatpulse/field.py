"""Retain dated peat surveys and independent Forsinard water-level measurements."""

import json
from concurrent.futures import ThreadPoolExecutor

import pandas as pd

from .fetch import FIELD_URL, PROCESSED, RAW, fetch, json_data


def field():
    cells = pd.read_csv(PROCESSED / "audit_cells.csv")

    def download(row):
        bbox = ",".join(
            str(v)
            for v in [
                row.easting - 500,
                row.northing - 500,
                row.easting + 500,
                row.northing + 500,
            ]
        )
        params = {
            "service": "WFS",
            "version": "2.0.0",
            "request": "GetFeature",
            "typeNames": "peatlandaction:peatlandactionpoints",
            "outputFormat": "application/json",
            "srsName": "EPSG:27700",
            "CQL_FILTER": f"BBOX(the_geom,{bbox},'EPSG:27700')",
            "count": 10000,
        }
        path = fetch(f"surveys/{row.cell_id}.geojson", FIELD_URL, params)
        raw = json_data(path)
        if int(raw["totalFeatures"]) != len(raw["features"]):
            raise ValueError("Peat survey response truncated")
        return [
            {**item["properties"], "cell_id": row.cell_id} for item in raw["features"]
        ]

    with ThreadPoolExecutor(max_workers=3) as pool:
        points = [
            point for group in pool.map(download, cells.itertuples()) for point in group
        ]
    surveys = pd.DataFrame(points)
    if len(surveys):
        surveys["survey_date"] = pd.to_datetime(
            surveys["DATE_"], utc=True, errors="coerce"
        )
        surveys.to_csv(PROCESSED / "peat_surveys.csv", index=False)
    else:
        pd.DataFrame(
            columns=["cell_id", "survey_date", "DEPTH_CM", "CONDITION"]
        ).to_csv(PROCESSED / "peat_surveys.csv", index=False)
    raw = pd.read_csv(
        RAW / "forsinard/Forsinard_P1_JHI_Odysseys_compiled_2018-2023_forZenodo.csv"
    )
    metadata = raw.iloc[:5].set_index("Date")
    water = raw.iloc[5:].copy()
    water["date"] = pd.to_datetime(water.pop("Date"), dayfirst=True)
    water = (
        water.set_index("date")
        .apply(pd.to_numeric, errors="coerce")
        .replace(-9999, float("nan"))
    )
    flags = pd.read_csv(RAW / "forsinard/Forsinard_P1_WTD_QCflags.csv", skiprows=6)
    q = dict(zip(flags["name"], flags["Qcflag"], strict=True))
    series = []
    for sensor in water.columns:
        series.append(
            pd.DataFrame(
                {
                    "date": water.index,
                    "sensor_id": sensor,
                    "site": metadata.loc["site", sensor],
                    "treatment": metadata.loc["treat", sensor],
                    "easting": float(metadata.loc["X", sensor]),
                    "northing": float(metadata.loc["Y", sensor]),
                    "qc_flag": int(q[sensor]),
                    "water_table_depth_cm": -100 * water[sensor].to_numpy(),
                }
            )
        )
    long = pd.concat(series, ignore_index=True)
    long["eligible"] = long.qc_flag.isin([0, 1]) & long.water_table_depth_cm.notna()
    long.to_parquet(PROCESSED / "forsinard_water_levels.parquet", index=False)
    good = long.loc[long.eligible]
    daily = (
        good.groupby(["date", "site", "treatment"])
        .agg(
            water_table_depth_cm=("water_table_depth_cm", "median"),
            sensor_count=("sensor_id", "nunique"),
        )
        .reset_index()
    )
    daily["eligible"] = daily.sensor_count >= 2
    daily.to_csv(PROCESSED / "forsinard_group_daily.csv", index=False)
    summary = {
        "peat_survey_points": len(surveys),
        "audit_cells_with_survey": int(surveys.cell_id.nunique())
        if len(surveys)
        else 0,
        "water_level_sensors": int(long.sensor_id.nunique()),
        "water_level_nonmissing": int(long.water_table_depth_cm.notna().sum()),
        "water_level_qc01_nonmissing": len(good),
        "excluded_qc2_sensors": sorted(
            long.loc[long.qc_flag == 2, "sensor_id"].unique().tolist()
        ),
        "group_days_with_2_sensors": int(daily.eligible.sum()),
        "role": "independent supporting hydrology evidence; not wildfire labels",
    }
    (PROCESSED / "field_summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    print(json.dumps(summary, indent=2), flush=True)


if __name__ == "__main__":
    field()

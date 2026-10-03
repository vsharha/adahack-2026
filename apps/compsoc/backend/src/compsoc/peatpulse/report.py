"""Create a local, self-contained visual data report from downloaded observations."""

import base64
import hashlib
import html
import json
from datetime import UTC, datetime
from pathlib import Path
from string import Template

import matplotlib

matplotlib.use("Agg")
import matplotlib.dates as mdates
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from shapely.geometry import MultiPolygon, Polygon, shape

from .fetch import DATA, PROCESSED, RAW, REPORT, json_data
from .radar import RADAR_FEATURES
from .spatial import TO_BNG
from .weather import FEATURES

GREEN = "#236954"
ORANGE = "#cb6432"
GRAY = "#8a9290"


def figure_save(fig, name):
    fig.savefig(REPORT / f"{name}.png", dpi=160, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def dictionary(frame):
    descriptions = {
        "temperature_c": ("°C", "Noon air temperature", "retain candidate"),
        "relative_humidity_pct": ("%", "Noon relative humidity", "retain candidate"),
        "wind_kmh": ("km/h", "Noon 10m wind", "retain candidate"),
        "vpd_kpa": ("kPa", "Noon atmospheric drying demand", "retain candidate"),
        "precip_24h_mm": (
            "mm",
            "Precipitation ending at noon, preceding 24 hours",
            "retain candidate",
        ),
        "precip_7d_mm": (
            "mm",
            "Precipitation ending at noon, preceding 7 days",
            "retain candidate",
        ),
        "precip_30d_mm": (
            "mm",
            "Precipitation ending at noon, preceding 30 days",
            "retain candidate",
        ),
        "dry_spell_days": (
            "days",
            "Consecutive noon-to-noon periods below 1mm",
            "retain candidate",
        ),
        "temperature_7d_mean_c": (
            "°C",
            "Trailing 168-hour mean temperature",
            "ablation candidate",
        ),
        "vpd_7d_mean_kpa": (
            "kPa",
            "Trailing 168-hour mean drying demand",
            "ablation candidate",
        ),
        "season_sin": ("unitless", "Sine of day of year", "retain candidate"),
        "season_cos": ("unitless", "Cosine of day of year", "retain candidate"),
        "dc_reconstructed": (
            "index",
            "Longer-term weather drying memory",
            "diagnostic only; CEMS is the selected baseline",
        ),
        "dmc_reconstructed": (
            "index",
            "Medium-term weather drying memory",
            "diagnostic only; CEMS is the selected baseline",
        ),
        "ffmc_reconstructed": (
            "index",
            "Fine-fuel moisture code",
            "diagnostic only; CEMS is the selected baseline",
        ),
        "fwi_reconstructed": (
            "index",
            "Combined weather fire-danger index",
            "diagnostic only; CEMS is the selected baseline",
        ),
        "cems_dc": (
            "index",
            "CEMS longer-term fuel-drying code",
            "retain candidate; established weather baseline",
        ),
        "cems_dmc": (
            "index",
            "CEMS medium-term fuel-moisture code",
            "retain candidate; established weather baseline",
        ),
        "cems_ffmc": (
            "index",
            "CEMS fine-fuel moisture code",
            "retain candidate; established weather baseline",
        ),
        "cems_fwi": (
            "index",
            "CEMS combined fire-weather index",
            "retain candidate; established weather baseline",
        ),
        "isi_reconstructed": ("index", "Initial spread index", "diagnostic only"),
        "bui_reconstructed": ("index", "Buildup index", "diagnostic only"),
        "vv_db": (
            "dB",
            "Latest eligible peat-footprint VV median",
            "diagnostic; compare against anomaly",
        ),
        "vh_db": (
            "dB",
            "Latest eligible peat-footprint VH median",
            "diagnostic; compare against anomaly",
        ),
        "vv_seasonal_anomaly_db": (
            "dB",
            "VV minus cell/month median fitted on 2018-2021",
            "retain candidate",
        ),
        "vh_seasonal_anomaly_db": (
            "dB",
            "VH minus cell/month median fitted on 2018-2021",
            "retain candidate",
        ),
        "vv_change_db": (
            "dB",
            "VV change from previous eligible same-orbit pass",
            "retain candidate",
        ),
        "vh_change_db": (
            "dB",
            "VH change from previous eligible same-orbit pass",
            "retain candidate",
        ),
        "vv_last3_anomaly_db": (
            "dB",
            "Trailing three-pass mean VV anomaly",
            "retain candidate",
        ),
        "radar_age_days": (
            "days",
            "Issue time minus latest eligible acquisition time",
            "retain candidate; quality",
        ),
        "radar_pass_gap_days": (
            "days",
            "Time between the latest two radar passes",
            "quality and ablation",
        ),
        "peat_fraction": (
            "fraction",
            "Fraction of 1km cell covered by 2016 priority peat",
            "static land control",
        ),
    }
    rows = []
    for name, (units, meaning, decision) in descriptions.items():
        source = (
            "Copernicus CEMS / Climate Engine Earth Engine"
            if name.startswith("cems_")
            else "Sentinel-1A / Earth Engine"
            if name in RADAR_FEATURES
            else "NatureScot 2016"
            if name == "peat_fraction"
            else "xclim + ERA5; locally reconstructed"
            if "reconstructed" in name
            else "ERA5 / Open-Meteo"
            if not name.startswith("season")
            else "calendar"
        )
        missing = float(frame[name].isna().mean() * 100) if name in frame else 100.0
        rows.append(
            {
                "feature": name,
                "source": source,
                "units": units,
                "definition": meaning,
                "missing_pct": round(missing, 3),
                "decision": decision,
                "available": name in frame,
            }
        )
    rows.extend(
        [
            {
                "feature": "peat_depth_cm",
                "source": "NatureScot dated surveys",
                "units": "cm",
                "definition": "Only surveys preceding issue time can be used",
                "missing_pct": None,
                "decision": "defer: patchy coverage; as-of join not yet built",
                "available": False,
            },
            {
                "feature": "restoration_history",
                "source": "NatureScot",
                "units": "category",
                "definition": "Requires dated intervention records",
                "missing_pct": None,
                "decision": "defer: historical intervention dates not yet extracted",
                "available": False,
            },
        ]
    )
    result = pd.DataFrame(rows)
    result.to_csv(PROCESSED / "feature_dictionary.csv", index=False)
    return result


def map_plot(cells, burns):
    boundary = shape(
        json_data(RAW / "highland.geojson")["features"][0]["geometry"]
    ).simplify(150)
    fig, ax = plt.subplots(figsize=(8, 8))
    polygons = (
        list(boundary.geoms) if isinstance(boundary, MultiPolygon) else [boundary]
    )
    for polygon in polygons:
        if isinstance(polygon, Polygon):
            x, y = polygon.exterior.xy
            ax.plot(np.array(x) / 1000, np.array(y) / 1000, color=GRAY, linewidth=0.6)
    all_cells = pd.read_csv(PROCESSED / "eligible_cells.csv")
    ax.scatter(
        all_cells.easting / 1000,
        all_cells.northing / 1000,
        s=1,
        color="#dce7d9",
        label="Eligible peat cells",
    )
    peat_burns = burns.loc[burns.peat_overlap_ha > 0]
    e, n = TO_BNG.transform(
        peat_burns.longitude.to_numpy(), peat_burns.latitude.to_numpy()
    )
    ax.scatter(
        np.array(e) / 1000,
        np.array(n) / 1000,
        s=13,
        marker="x",
        color=ORANGE,
        alpha=0.65,
        label="Dated burn records (type unresolved)",
    )
    for role, label, marker in [
        ("spatial_coverage", "32 geography-selected audit cells", "o"),
        ("burn_case_descriptive_only", "12 descriptive burn-case cells", "s"),
        ("forsinard_field_context", "Forsinard context cell", "^"),
    ]:
        subset = cells.loc[cells.sample_role == role]
        ax.scatter(
            subset.easting / 1000,
            subset.northing / 1000,
            s=38,
            marker=marker,
            edgecolor="white",
            linewidth=0.6,
            color=GREEN,
            label=label,
        )
    ax.set(
        xlabel="British National Grid easting (km)",
        ylabel="Northing (km)",
        title="Highland: peat coverage, burn records and audit sample",
    )
    ax.set_aspect("equal")
    ax.legend(fontsize=8, loc="lower right")
    figure_save(fig, "study-map")


def correlations(frame):
    # Case-enriched locations are excluded; weather is counted once per grid/day.
    train = frame.loc[
        (frame.split == "train")
        & (frame.sample_role == "spatial_coverage")
        & ~frame.split_boundary_excluded
    ].copy()
    weather = train.drop_duplicates(["weather_id", "date"])
    weather_corr = weather[FEATURES].corr(method="spearman")
    weather_corr.to_csv(PROCESSED / "weather_correlations_train.csv")
    available = [c for c in RADAR_FEATURES if c in train]
    joint = train
    if available:
        joint = train.loc[train.scene_id.notna() & ~train.radar_stale].drop_duplicates(
            ["cell_id", "scene_id"]
        )
    columns = [
        c
        for c in FEATURES + available
        if c != "radar_age_days" and not c.endswith("_reconstructed")
    ]
    corr = joint[columns].corr(method="spearman", min_periods=30)
    corr.to_csv(PROCESSED / "joint_correlations_train.csv")
    pairs = []
    for i, a in enumerate(columns):
        for b in columns[i + 1 :]:
            value = corr.loc[a, b]
            pairs.append(
                {
                    "feature_a": a,
                    "feature_b": b,
                    "spearman_rho": value,
                    "paired_rows": int(joint[[a, b]].dropna().shape[0]),
                }
            )
    pairs = pd.DataFrame(pairs)
    pairs["abs_rho"] = pairs.spearman_rho.abs()
    pairs = pairs.sort_values("abs_rho", ascending=False)
    pairs.to_csv(PROCESSED / "feature_correlations_train.csv", index=False)
    pairs.loc[pairs.abs_rho >= 0.85].to_csv(
        PROCESSED / "strong_correlations_train.csv", index=False
    )
    # Within-cell/month centering separates some common seasonal/site patterns.
    centered = joint[columns] - joint.groupby(
        ["cell_id", pd.to_datetime(joint.date).dt.month]
    )[columns].transform("median")
    centered.corr(method="spearman", min_periods=30).to_csv(
        PROCESSED / "within_cell_month_correlations_train.csv"
    )
    fig, ax = plt.subplots(figsize=(12, 10))
    picture = ax.imshow(corr, vmin=-1, vmax=1, cmap="BrBG")
    labels = [
        c.replace("_reconstructed", "*")
        .replace("_seasonal_anomaly_db", " anomaly")
        .replace("_", " ")
        for c in columns
    ]
    ax.set_xticks(range(len(columns)), labels, rotation=60, ha="right", fontsize=8)
    ax.set_yticks(range(len(columns)), labels, fontsize=8)
    ax.set_title(
        f"Training data only · Spearman correlation · {len(joint):,} matched rows"
    )
    fig.colorbar(picture, ax=ax, shrink=0.7, label="Correlation (−1 to +1)")
    fig.text(
        0.1,
        -0.025,
        "Correlation flags overlapping signals; predictive value needs fire labels.",
        fontsize=9,
    )
    figure_save(fig, "correlations")
    return pairs, len(joint)


def coverage_plot(frame, features):
    coverage = frame.groupby("cell_id")[features].agg(lambda s: s.notna().mean() * 100)
    coverage.to_csv(PROCESSED / "feature_coverage_pct.csv")
    fig, ax = plt.subplots(figsize=(11, 8))
    image = ax.imshow(coverage, vmin=0, vmax=100, cmap="YlGn", aspect="auto")
    ax.set_xticks(
        range(len(features)),
        [c.replace("_", " ") for c in features],
        rotation=60,
        ha="right",
        fontsize=8,
    )
    ax.set_yticks(range(len(coverage)), coverage.index, fontsize=7)
    ax.set_title("Feature availability by audit cell · 2018–2024")
    fig.colorbar(image, ax=ax, label="Area-days with a value (%)", shrink=0.7)
    figure_save(fig, "coverage")


def timelines(frame, burns):
    # Pick a training-period recorded burn for a descriptive, non-performance example.
    examples = burns.loc[(burns.year <= 2021) & (burns.peat_overlap_ha > 0)]
    selected = None
    for _, candidate in examples.sort_values(
        "peat_overlap_ha", ascending=False
    ).iterrows():
        match = frame.loc[frame.cell_id.isin(candidate.cell_ids.split("|"))]
        if len(match):
            selected = (candidate, match.cell_id.iloc[0])
            break
    if selected is None:
        return "No overlapping descriptive case found."
    event, cell_id = selected
    date = pd.Timestamp(event.recorded_date)
    data = frame.loc[frame.cell_id == cell_id].copy()
    data["date"] = pd.to_datetime(data.date)
    data = data.loc[
        data.date.between(date - pd.Timedelta(days=90), date + pd.Timedelta(days=15))
    ]
    fig, axes = plt.subplots(3, 1, figsize=(11, 8), sharex=True)
    axes[0].bar(data.date, data.precip_24h_mm, color=GREEN, width=1)
    axes[0].set_ylabel("24-hour rain/snow\n(mm)")
    axes[1].plot(
        data.date,
        data.cems_fwi,
        color=ORANGE,
        label="Historical CEMS FWI via Climate Engine",
    )
    axes[1].set_ylabel("FWI (index)")
    axes[1].legend(loc="upper left", fontsize=8)
    if "vv_seasonal_anomaly_db" in data:
        points = data.loc[data.scene_id.notna()].drop_duplicates("scene_id")
        axes[2].plot(
            points.date,
            points.vv_seasonal_anomaly_db,
            "o-",
            color=GREEN,
            markersize=4,
            label="VV anomaly, shown when assumed available",
        )
        axes[2].plot(
            points.date,
            points.vh_seasonal_anomaly_db,
            "s-",
            color=GRAY,
            markersize=3,
            label="VH anomaly",
        )
        axes[2].legend(loc="lower left", fontsize=8)
    axes[2].set_ylabel("Radar departure\nfrom seasonal median (dB)")
    for ax in axes:
        ax.axvline(date, color=ORANGE, linestyle="--", linewidth=1)
        ax.grid(axis="y", alpha=0.15)
    axes[-1].set_xlabel(
        "Date · dashed line is the catalogue recorded date, not verified ignition"
    )
    axes[-1].xaxis.set_major_formatter(mdates.DateFormatter("%d %b"))
    axes[0].set_title(f"Descriptive example: {event['name']} · {cell_id} · {date.year}")
    figure_save(fig, "case-timeline")
    return (
        f"{event['name']}, recorded {event.recorded_date}, cell {cell_id}; "
        "not an ignition-lead validation."
    )


def hydrology_plot():
    field = pd.read_csv(PROCESSED / "forsinard_group_daily.csv", parse_dates=["date"])
    field = field.loc[
        field.eligible & (field.date.dt.year == 2021) & (field.site == "LO")
    ]
    fig, ax = plt.subplots(figsize=(11, 4))
    for treatment, color in [("CON", GREEN), ("FTW", ORANGE), ("BCFB", GRAY)]:
        group = field.loc[field.treatment == treatment]
        ax.plot(
            group.date,
            group.water_table_depth_cm,
            label=treatment,
            color=color,
            linewidth=1,
        )
    ax.set(
        ylabel="Measured water table below ground (cm)",
        xlabel="2021",
        title="Measured water levels within one Forsinard site",
    )
    ax.legend(title="Archive treatment code", ncol=3, fontsize=8)
    ax.grid(axis="y", alpha=0.15)
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%b"))
    figure_save(fig, "field-water-levels")


def report():
    REPORT.mkdir(exist_ok=True)
    plt.rcParams.update(
        {
            "font.family": "DejaVu Sans",
            "axes.spines.top": False,
            "axes.spines.right": False,
            "axes.titlepad": 14,
        }
    )
    frame = pd.read_parquet(PROCESSED / "model_inputs.parquet")
    cells = pd.read_csv(PROCESSED / "audit_cells.csv")
    burns = pd.read_csv(PROCESSED / "burn_record_audit.csv").fillna({"cell_ids": ""})
    spatial = json_data(PROCESSED / "spatial_summary.json")
    weather = json_data(PROCESSED / "weather_summary.json")
    field = json_data(PROCESSED / "field_summary.json")
    thermal = json_data(PROCESSED / "firms_summary.json")
    validation = json_data(REPORT / "validation.json")
    radar = (
        json_data(PROCESSED / "radar_summary.json")
        if (PROCESSED / "radar_summary.json").exists()
        else {}
    )
    cems = weather.get("cems", {})
    features = dictionary(frame)
    map_plot(cells, burns)
    pairs, correlation_rows = correlations(frame)
    available = [
        c
        for c in FEATURES + RADAR_FEATURES
        if c in frame and not c.endswith("_reconstructed")
    ]
    coverage_plot(frame, available)
    case = timelines(frame, burns)
    hydrology_plot()
    frame.to_csv(PROCESSED / "model_inputs.csv.gz", index=False, compression="gzip")
    source_manifest = []
    for path in RAW.rglob("*.source.json"):
        source_manifest.append(
            {
                "file": str(path.relative_to(DATA)).removesuffix(".source.json"),
                **json_data(path),
            }
        )
    (PROCESSED / "source_manifest.json").write_text(
        json.dumps(source_manifest, indent=2)
    )
    inventory = [
        {
            "file": str(path.relative_to(DATA)),
            "bytes": path.stat().st_size,
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        }
        for path in sorted(RAW.rglob("*"))
        if path.is_file()
    ]
    (PROCESSED / "raw_file_inventory.json").write_text(
        json.dumps(inventory, indent=2) + "\n"
    )
    summary = {
        "created_utc": datetime.now(UTC).isoformat(),
        "spatial": spatial,
        "weather": weather,
        "cems": cems,
        "field": field,
        "thermal": thermal,
        "validation": validation,
        "radar": radar,
        "correlation_rows_train": correlation_rows,
        "strong_correlation_pairs": int((pairs.abs_rho >= 0.85).sum()),
        "radar_fresh_area_days": int((~frame.radar_stale).sum())
        if "radar_stale" in frame
        else 0,
        "raw_download_bytes": sum(
            p.stat().st_size for p in RAW.rglob("*") if p.is_file()
        ),
        "model_comparison_run": False,
        "fire_prediction_improvement_measured": False,
        "remaining": [
            "Confirm wildfire status and onset bounds for candidate events",
            "Expand to the full evaluation population before headline scoring",
        ],
    }
    (REPORT / "summary.json").write_text(json.dumps(summary, indent=2) + "\n")

    def image(name, alt):
        data = base64.b64encode((REPORT / f"{name}.png").read_bytes()).decode()
        return f'<img alt="{html.escape(alt)}" src="data:image/png;base64,{data}">'

    top_pairs = pairs.head(10)[
        ["feature_a", "feature_b", "spearman_rho", "paired_rows"]
    ]
    preview = frame.loc[
        (frame.date == "2019-05-01") & (frame.sample_role == "spatial_coverage"),
        [
            "cell_id",
            "date",
            "temperature_c",
            "relative_humidity_pct",
            "precip_7d_mm",
            "cems_fwi",
            "vv_seasonal_anomaly_db",
            "radar_age_days",
        ],
    ].head(5)
    preview.to_csv(PROCESSED / "readable_input_examples.csv", index=False)
    preview = preview.rename(
        columns={
            "cell_id": "1km cell",
            "date": "Date",
            "temperature_c": "Air °C",
            "relative_humidity_pct": "Humidity %",
            "precip_7d_mm": "7-day rain/snow mm",
            "cems_fwi": "CEMS FWI",
            "vv_seasonal_anomaly_db": "VV anomaly dB",
            "radar_age_days": "Radar age days",
        }
    )
    fields = {
        "part0": f"{len(frame):,}",
        "part1": f"{len(cells)}",
        "part2": f"{weather['weather_locations']}",
        "part3": f"{radar.get('quality_eligible_rows', 0):,}",
        "part4": f"{field['water_level_qc01_nonmissing']:,}",
        "part5": f"{spatial['eligible_1km_cells']:,}",
        "part6": image("study-map", "Highland audit cells and candidate burns"),
        "part7": f"{spatial['highland_dated_burn_records']}",
        "part8": f"{spatial['peat_intersecting_burn_records']}",
        "part9": f"{spatial['candidate_groups_on_peat']}",
        "part10": f"{html.escape(case)}",
        "part11": image("case-timeline", "Weather and radar around a recorded burn"),
        "part12": image("correlations", "Training-only feature correlations"),
        "part13": top_pairs.to_html(index=False, float_format=lambda x: f"{x:.3f}"),
        "part14": f"{image('coverage', 'Observed feature completeness by audit cell')}",
        "part15": image("field-water-levels", "Forsinard water levels in 2021"),
        "part16": f"{features.to_html(index=False, na_rep='missing')}",
        "thermal_count": f"{thermal['highland_raster_detections']:,}",
        "cems_days": f"{2557 - len(cems['missing_dates']):,}",
        "cems_missing": html.escape(", ".join(cems["missing_dates"])),
        "input_examples": preview.to_html(
            index=False, float_format=lambda x: f"{x:.2f}", na_rep="Missing"
        ),
        "validation_status": html.escape(validation["status"]),
        "validation_checks": html.escape(", ".join(validation["checks"])),
        "validation_hashes": str(validation["checksummed_source_downloads"]),
    }
    template = Path(__file__).with_name("report_template.html").read_text()
    body = Template(template).substitute(fields)
    (REPORT / "index.html").write_text(body)
    print(json.dumps(summary, indent=2), flush=True)


if __name__ == "__main__":
    report()

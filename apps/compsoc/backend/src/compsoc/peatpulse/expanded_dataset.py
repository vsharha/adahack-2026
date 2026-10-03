"""Finalise the expanded panel with causal radar features and grouped CV folds."""

import hashlib
import json

import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedKFold

from .fetch import END_YEAR, PROCESSED
from .train import BASIC, STRONG, TARGET

RADAR = [
    "vv_db",
    "vh_db",
    "vv_past90d_anomaly_db",
    "vh_past90d_anomaly_db",
    "vv_change_db",
    "vh_change_db",
    "vv_last3_past_anomaly_db",
    "radar_age_days",
]
FEATURES = {
    "basic_weather": BASIC,
    "strong_weather": STRONG,
    "peatpulse": STRONG + RADAR,
}


class Groups:
    """Union-find keeps linked events and sampled locations in the same fold."""

    def __init__(self, keys):
        self.parent = {k: k for k in keys}

    def root(self, key):
        while self.parent[key] != key:
            self.parent[key] = self.parent[self.parent[key]]
            key = self.parent[key]
        return key

    def link(self, keys):
        valid = sorted(set(keys) & self.parent.keys())
        for key in valid[1:]:
            a, b = sorted([self.root(valid[0]), self.root(key)])
            self.parent[b] = a


def causal_radar(raw):
    """Use only preceding observations for each area's 90-day radar baseline."""
    raw = raw.loc[raw.quality_eligible].copy()
    raw["radar_time_utc"] = pd.to_datetime(raw.radar_time_utc)
    raw["pass_date"] = raw.radar_time_utc.dt.normalize()
    raw = raw.sort_values("VV_count", ascending=False).drop_duplicates(
        ["cell_id", "pass_date"]
    )
    output = []
    for _, rows in raw.groupby("cell_id", sort=True):
        rows = rows.sort_values("radar_time_utc").set_index("radar_time_utc")
        for band in ("vv", "vh"):
            signal = rows[band.upper() + "_median"]
            rows[band + "_db"] = signal
            normal = signal.rolling("90D", closed="left", min_periods=3).median()
            rows[band + "_past90d_anomaly_db"] = signal - normal
            rows[band + "_change_db"] = signal.diff()
        rows["vv_last3_past_anomaly_db"] = rows.vv_past90d_anomaly_db.rolling(3).mean()
        rows["radar_available_assumed_utc"] = rows.index + pd.Timedelta(hours=48)
        output.append(rows.reset_index())
    return pd.concat(output, ignore_index=True)


def join_causal_radar(frame, raw):
    observations = causal_radar(raw)
    columns = ["radar_time_utc", "radar_available_assumed_utc", *RADAR]
    frame = frame.drop(columns=[c for c in columns if c in frame])
    tables = []
    for cell, rows in frame.groupby("cell_id", sort=True):
        signals = observations.loc[observations.cell_id.eq(cell)]
        merged = pd.merge_asof(
            rows.sort_values("issue_time_utc"),
            signals[[c for c in columns if c != "radar_age_days"]].sort_values(
                "radar_available_assumed_utc"
            ),
            left_on="issue_time_utc",
            right_on="radar_available_assumed_utc",
            direction="backward",
            allow_exact_matches=False,
        )
        merged["radar_age_days"] = (
            merged.issue_time_utc - merged.radar_time_utc
        ).dt.total_seconds() / 86400
        stale = merged.radar_age_days.gt(18) | merged.radar_age_days.isna()
        merged.loc[stale, [c for c in RADAR if c != "radar_age_days"]] = np.nan
        tables.append(merged)
    return pd.concat(tables, ignore_index=True)


def event_and_cell_groups(pixels, manifest, burns, cells):
    event_groups = Groups(pixels.event_group.unique())
    # One dated mapped extent may span multiple 5-km discovery clusters.
    for burn in burns.itertuples():
        affected = set(str(burn.cell_ids).split("|"))
        near_date = (
            (pd.to_datetime(manifest.first_burn) - pd.Timestamp(burn.recorded_date))
            .abs()
            .dt.days.le(30)
        )
        matched = manifest.loc[
            manifest.case_cell.isin(affected) & near_date, "event_group"
        ]
        event_groups.link(matched.tolist())
    mapping = {key: event_groups.root(key) for key in event_groups.parent}
    pixels = pixels.assign(event_group=pixels.event_group.map(mapping))
    manifest = manifest.assign(event_group=manifest.event_group.map(mapping))
    cell_groups = Groups(cells.cell_id)
    for event, group in pixels.groupby("event_group"):
        linked = manifest.loc[manifest.event_group.eq(event)]
        cell_groups.link(
            [*group.cell_id, *linked.case_cell, *linked.comparison_cell.dropna()]
        )
    # Shared mapped fire extents link all affected cells, even older audit cells.
    for burn in burns.itertuples():
        cell_groups.link(str(burn.cell_ids).split("|"))
    return pixels, {key: cell_groups.root(key) for key in cell_groups.parent}, mapping


def assign_folds(frame, requested=5):
    eligible = frame.loc[frame.cv_eligible]
    group_table = eligible.groupby("cv_group")[TARGET].agg(["sum", "size"])
    has_positive = group_table["sum"].gt(0).astype(int)
    minimum_class_groups = int(has_positive.value_counts().min())
    folds = min(requested, minimum_class_groups)
    if has_positive.nunique() != 2 or folds < 2:
        raise ValueError(
            "Too few independent positive/control groups for cross-validation"
        )
    splitter = StratifiedKFold(n_splits=folds, shuffle=True, random_state=42)
    mapping = {}
    for fold, (_, validation) in enumerate(splitter.split(group_table, has_positive)):
        for group in group_table.iloc[validation].index:
            mapping[group] = fold
    return frame.cv_group.map(mapping).astype("Int64"), folds


def build():
    if not (PROCESSED / "sample_manifest.json").exists():
        raise ValueError("Use PEATPULSE_DATA_DIR to select the expanded dataset")
    original = pd.read_parquet(PROCESSED / "model_dataset.parquet")
    frame = join_causal_radar(
        original, pd.read_csv(PROCESSED / "radar_observations.csv")
    )
    pixels = pd.read_csv(
        PROCESSED / "discovered_burn_pixels.csv", parse_dates=["date", "lower", "upper"]
    )
    manifest = pd.read_csv(PROCESSED / "sampled_event_manifest.csv")
    burns = pd.read_csv(PROCESSED / "burn_record_audit.csv")
    cells = pd.read_csv(PROCESSED / "audit_cells.csv")
    pixels, groups, event_mapping = event_and_cell_groups(
        pixels, manifest, burns, cells
    )
    episodes = pd.read_csv(
        PROCESSED / "satellite_burn_episodes.csv",
        parse_dates=["first_estimated_burn", "last_estimated_burn"],
    )
    episode_group = {}
    for episode in episodes.to_dict("records"):
        matching = pixels.loc[
            pixels.cell_id.eq(episode["cell_id"])
            & pixels.date.between(
                episode["first_estimated_burn"], episode["last_estimated_burn"]
            )
        ]
        options = matching.event_group.unique()
        if len(options) == 1:
            episode_group[episode["event_id"]] = options[0]
    frame["event_group_id"] = frame.satellite_event_id.map(episode_group)
    first_possible = pixels.groupby("event_group").lower.min()
    frame["group_min_lead_hours"] = (
        frame.event_group_id.map(first_possible) - frame.issue_time_utc
    ).dt.total_seconds() / 3600
    frame["cv_group"] = frame.cell_id.map(groups)
    frame["prediction_context"] = np.where(
        frame.group_min_lead_hours.ge(24),
        "before_first_mapped_burn_in_group",
        "possible_spread_or_no_linked_burn",
    )
    complete = np.isfinite(frame[FEATURES["peatpulse"]].to_numpy(dtype=float)).all(
        axis=1
    )
    end = frame.issue_time_utc + pd.Timedelta(days=7)
    frame["cv_eligible"] = (
        frame[TARGET].notna()
        & complete
        & end.lt(pd.Timestamp(f"{END_YEAR + 1}-01-01"))
        & (
            frame[TARGET].eq(0)
            | (frame.satellite_min_lead_hours.ge(24) & frame.event_group_id.notna())
        )
    ).fillna(False)
    frame["cv_fold"], n_folds = assign_folds(frame)
    eligible = frame.loc[frame.cv_eligible].copy()
    assert not frame.duplicated(["cell_id", "date"]).any()
    assert eligible.groupby("cell_id").cv_fold.nunique().eq(1).all()
    positive = eligible.loc[eligible[TARGET].eq(1)]
    assert positive.groupby("event_group_id").cv_fold.nunique().eq(1).all()
    assert frame.weather_cutoff_utc.lt(frame.issue_time_utc).all()
    available = frame.radar_available_assumed_utc.notna()
    assert (
        frame.loc[available, "radar_available_assumed_utc"]
        .lt(frame.loc[available, "issue_time_utc"])
        .all()
    )
    assert not eligible.loc[eligible[TARGET].eq(0), "ongoing_or_recent_burn"].any()
    fold_rows = []
    for fold in range(n_folds):
        validation = eligible.loc[eligible.cv_fold.eq(fold)]
        train = eligible.loc[eligible.cv_fold.ne(fold)]
        assert not set(train.cv_group) & set(validation.cv_group)
        assert validation[TARGET].nunique() == train[TARGET].nunique() == 2
        fold_rows.append(
            {
                "fold": fold,
                "training_rows": len(train),
                "validation_rows": len(validation),
                "training_positive_rows": int(train[TARGET].sum()),
                "validation_positive_rows": int(validation[TARGET].sum()),
                "training_events": int(
                    train.loc[train[TARGET].eq(1), "event_group_id"].nunique()
                ),
                "validation_events": int(
                    validation.loc[validation[TARGET].eq(1), "event_group_id"].nunique()
                ),
            }
        )
    frame.to_parquet(PROCESSED / "cv_dataset.parquet", index=False)
    eligible.to_parquet(PROCESSED / "training_ready.parquet", index=False)
    eligible.to_csv(PROCESSED / "training_ready.csv.gz", index=False)
    pd.DataFrame(fold_rows).to_csv(PROCESSED / "cv_folds.csv", index=False)
    pd.DataFrame(
        [{"discovery_group": k, "event_group": v} for k, v in event_mapping.items()]
    ).to_csv(PROCESSED / "event_group_mapping.csv", index=False)
    examples = pd.concat(
        [
            positive.groupby("event_group_id").head(1),
            eligible.loc[eligible[TARGET].eq(0)].sample(
                min(10, int(eligible[TARGET].eq(0).sum())), random_state=42
            ),
        ]
    )
    examples[
        [
            "cell_id",
            "date",
            "latitude",
            "longitude",
            "temperature_c",
            "precip_7d_mm",
            "cems_fwi",
            "vv_past90d_anomaly_db",
            TARGET,
            "event_group_id",
            "cv_fold",
        ]
    ].to_csv(PROCESSED / "dataset_examples.csv", index=False)
    summary = {
        "area": "Scotland",
        "period": f"2018-{END_YEAR}",
        "cells": int(frame.cell_id.nunique()),
        "all_rows": len(frame),
        "training_ready_rows": len(eligible),
        "positive_rows": len(positive),
        "negative_rows": int(eligible[TARGET].eq(0).sum()),
        "positive_event_groups": int(positive.event_group_id.nunique()),
        "cv_groups": int(eligible.cv_group.nunique()),
        "folds": fold_rows,
        "features": FEATURES,
        "target": TARGET,
        "target_interpretation": (
            "Satellite-mapped burn, including possible managed fire; "
            "no mapped burn is provisional negative"
        ),
        "design": (
            "Case-enriched panel; grouped CV over all years. "
            "Does not test forecasting a later era. Includes spread examples."
        ),
        "radar_baseline": (
            "Past 90 days only, excluding the current scene; "
            "minimum 3 prior same-orbit scenes"
        ),
        "data_sha256": hashlib.sha256(
            (PROCESSED / "training_ready.parquet").read_bytes()
        ).hexdigest(),
        "validation": (
            "Unique rows, causal feature times, complete predictors, "
            "both classes per fold, no shared cell/event groups across folds"
        ),
    }
    (PROCESSED / "expanded_summary.json").write_text(json.dumps(summary, indent=2))
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    build()

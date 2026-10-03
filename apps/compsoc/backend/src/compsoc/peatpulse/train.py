"""Train and replay small local models against the provisional burn target."""

import argparse
import hashlib
import json
import os
import pickle
import platform
import time
from datetime import UTC, datetime
from pathlib import Path

import numpy as np
import pandas as pd
import sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import average_precision_score, roc_auc_score

from .fetch import DATA, PROCESSED, json_data

OUTPUT = DATA / "models" / "local_rf"
TARGET = "satellite_burn_next_7d"
BASIC = [
    "temperature_c",
    "relative_humidity_pct",
    "wind_kmh",
    "vpd_kpa",
    "precip_24h_mm",
    "precip_7d_mm",
    "precip_30d_mm",
    "temperature_7d_mean_c",
    "vpd_7d_mean_kpa",
    "dry_spell_days",
    "season_sin",
    "season_cos",
]
STRONG = BASIC + ["cems_dc", "cems_dmc", "cems_ffmc", "cems_fwi"]
RADAR = [
    "vv_db",
    "vh_db",
    "vv_seasonal_anomaly_db",
    "vh_seasonal_anomaly_db",
    "vv_change_db",
    "vh_change_db",
    "vv_last3_anomaly_db",
    "radar_age_days",
]
FEATURES = {
    "basic_weather": BASIC,
    "strong_weather": STRONG,
    "peatpulse": STRONG + RADAR,
}
METHODS = [*FEATURES, "cems_fwi_reference"]
PARAMETERS = {
    "n_estimators": 50,
    "max_depth": 3,
    "min_samples_leaf": 10,
    "max_features": 1.0,
    "class_weight": "balanced",
    "random_state": 42,
    "n_jobs": min(4, os.cpu_count() or 1),
}


def training_rows(frame):
    selected = frame.loc[
        frame.split.eq("train") & frame.complete_comparison_pair
    ].copy()
    assert selected.date.astype(str).between("2018-01-01", "2021-12-31").all()
    assert not selected.split_boundary_excluded.any()
    if set(selected[TARGET].dropna().astype(int)) != {0, 1}:
        raise ValueError("Training requires both observed target classes")
    assert selected[TARGET].notna().all()
    assert selected[FEATURES["peatpulse"]].notna().all().all()
    return selected


def fit_models(train):
    """Equalise positive episode weight; all methods share rows and settings."""
    positive = train[TARGET].eq(1)
    sizes = train.loc[positive].groupby("satellite_event_id").size()
    assert sizes.index.to_series().ne("").all()
    weight = pd.Series(1.0, index=train.index)
    weight.loc[positive] = (
        train.loc[positive, "satellite_event_id"].map(1 / sizes)
        * int(positive.sum())
        / len(sizes)
    )
    models, timings = {}, {}
    for name, columns in FEATURES.items():
        start = time.perf_counter()
        model = RandomForestClassifier(**PARAMETERS)
        model.fit(train[columns], train[TARGET].astype(int), sample_weight=weight)
        models[name] = model
        timings[name] = round(time.perf_counter() - start, 4)
        print(
            f"Trained {name}: {len(train):,} rows in {timings[name]:.2f}s", flush=True
        )
    return models, timings


def score_models(frame, models):
    """Score using the predictor allowlist; labels never determine candidacy."""
    if frame.duplicated(["cell_id", "date"]).any():
        raise ValueError("Duplicate cell/date input")
    scored = frame.copy()
    values = frame[FEATURES["peatpulse"]].to_numpy(dtype=float)
    eligible = np.isfinite(values).all(axis=1)
    scored["prediction_status"] = np.where(
        eligible, "scored_common_input_set", "missing_comparison_input"
    )
    tie = (frame.date.astype(str) + ":" + frame.cell_id).map(
        lambda key: hashlib.sha256(key.encode()).hexdigest()
    )
    for name in METHODS:
        score_column = f"{name}_score"
        scored[score_column] = np.nan
        if eligible.any():
            if name == "cems_fwi_reference":
                scored.loc[eligible, score_column] = frame.loc[eligible, "cems_fwi"]
            else:
                scored.loc[eligible, score_column] = models[name].predict_proba(
                    frame.loc[eligible, FEATURES[name]]
                )[:, 1]
        ranked = scored.loc[eligible, ["date", score_column]].assign(tie=tie[eligible])
        ranked = ranked.sort_values(
            ["date", score_column, "tie"], ascending=[True, False, True]
        )
        rank = ranked.groupby("date").cumcount() + 1
        scored[f"{name}_rank"] = rank.reindex(scored.index).astype("Int64")
        # Fixed inspection budget: one cell per available day, even if scores tie.
        scored[f"{name}_priority"] = scored[f"{name}_rank"].eq(1).fillna(False)
    return scored


def metrics(scored):
    records = []
    for split, full in scored.groupby("split", sort=True):
        evaluable = full.loc[full.complete_comparison_pair]
        y = evaluable[TARGET].astype(int)
        positive = y.eq(1)
        for name in METHODS:
            score = evaluable[f"{name}_score"]
            selected = evaluable[f"{name}_priority"]
            picked = full.loc[full[f"{name}_priority"]]
            both = y.nunique() == 2
            records.append(
                {
                    "split": split,
                    "method": name,
                    "labelled_rows": len(y),
                    "positive_rows": int(positive.sum()),
                    "positive_episodes": int(
                        evaluable.loc[positive, "satellite_event_id"].nunique()
                    ),
                    "roc_auc": float(roc_auc_score(y, score)) if both else None,
                    "average_precision": float(average_precision_score(y, score))
                    if both
                    else None,
                    "all_daily_priority_picks": len(picked),
                    "priority_positive_rows": int((selected & positive).sum()),
                    "priority_no_mapped_burn_rows": int((selected & ~positive).sum()),
                    "priority_unknown_or_excluded_rows": int(
                        (~picked.complete_comparison_pair).sum()
                    ),
                    "interpretation": (
                        "in_sample_fit_diagnostic"
                        if split == "train"
                        else "no_positive_labels_cannot_measure_fire_detection"
                    ),
                }
            )
    return pd.DataFrame(records)


def event_replay(scored):
    positive = scored.loc[
        scored.verified_wildfire_next_7d.eq(1) & scored.wildfire_min_lead_hours.ge(24)
    ]
    records = []
    for event, group in positive.groupby("verified_event_id", sort=True):
        for method in METHODS:
            available = group.loc[group[f"{method}_score"].notna()]
            hits = available.loc[available[f"{method}_priority"]]
            first = hits.sort_values("issue_time_utc").head(1)
            records.append(
                {
                    "event_id": event,
                    "method": method,
                    "split": str(group.split.iloc[0]),
                    "eligible_prefire_rows": len(available),
                    "priority_pick_before_reported_event": bool(len(hits)),
                    "first_priority_date": str(first.date.iloc[0])
                    if len(first)
                    else None,
                    "reported_event_lead_hours": float(
                        first.wildfire_min_lead_hours.iloc[0]
                    )
                    if len(first)
                    else None,
                    "best_daily_rank": int(available[f"{method}_rank"].min())
                    if len(available)
                    else None,
                    "max_score": float(available[f"{method}_score"].max())
                    if len(available)
                    else None,
                    "interpretation": (
                        "single_held_out_event_case_study"
                        if group.split.iloc[0] == "test"
                        else "training_period_case_not_independent_evaluation"
                    ),
                }
            )
    return pd.DataFrame(records)


def save_replay_plot(scored, folder):
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.dates as mdates
    import matplotlib.pyplot as plt

    events = pd.read_csv(PROCESSED / "verified_wildfire_events.csv")
    fig, axes = plt.subplots(len(events), 1, figsize=(11, 10), constrained_layout=True)
    slices = []
    for axis, event in zip(axes, events.to_dict("records"), strict=True):
        lower, upper = pd.Timestamp(event["lower"]), pd.Timestamp(event["upper"])
        rows = scored.loc[
            scored.cell_id.eq(event["cell_id"])
            & scored.issue_time_utc.between(lower - pd.Timedelta(days=30), upper)
        ].sort_values("issue_time_utc")
        slices.append(rows.assign(replay_event=event["event_id"]))
        for name, colour in zip(
            FEATURES, ["#8a8f99", "#cf812d", "#177e76"], strict=True
        ):
            axis.plot(
                rows.issue_time_utc,
                rows[f"{name}_score"],
                label=name.replace("_", " "),
                color=colour,
            )
        axis.axvspan(
            lower, upper, color="#ba4b44", alpha=0.17, label="reported event window"
        )
        axis.set_ylim(-0.03, 1.03)
        axis.set_ylabel("Model score (uncalibrated)")
        period = "held-out case" if lower.year >= 2023 else "training-period case"
        axis.set_title(f"{event['name']}: {period}", loc="left", fontsize=12)
        axis.xaxis.set_major_formatter(mdates.DateFormatter("%d %b"))
        axis.grid(alpha=0.15)
    axes[0].legend(loc="upper left", fontsize=8, ncol=2)
    fig.suptitle(
        "Local Random Forest replay · experimental satellite-burn model\n"
        "Strong weather and PeatPulse curves overlap in this run",
        fontsize=13,
    )
    fig.savefig(folder / "fire_replay.png", dpi=150)
    plt.close(fig)
    pd.concat(slices, ignore_index=True).to_csv(folder / "demo_replay.csv", index=False)


def train_local():
    start = time.perf_counter()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    path = PROCESSED / "model_dataset.parquet"
    frame = pd.read_parquet(path)
    source = json_data(PROCESSED / "label_summary.json")
    assert (
        source["input_sha256"]
        == hashlib.sha256((PROCESSED / "model_inputs.parquet").read_bytes()).hexdigest()
    )
    assert set(FEATURES["peatpulse"]) == set(
        json_data(PROCESSED / "model_feature_columns.json")
    )
    assert frame.weather_cutoff_utc.lt(frame.issue_time_utc).all()
    valid_radar = frame.radar_available_assumed_utc.notna()
    assert (
        frame.loc[valid_radar, "radar_available_assumed_utc"]
        .lt(frame.loc[valid_radar, "issue_time_utc"])
        .all()
    )
    train = training_rows(frame)
    models, timings = fit_models(train)
    predict_start = time.perf_counter()
    scored = score_models(frame, models)
    prediction_seconds = time.perf_counter() - predict_start
    for name, model in models.items():
        bundle = {
            "model": model,
            "features": FEATURES[name],
            "target": TARGET,
            "sklearn_version": sklearn.__version__,
            "calibrated": False,
        }
        model_path = OUTPUT / f"{name}.pkl"
        model_path.write_bytes(pickle.dumps(bundle, protocol=pickle.HIGHEST_PROTOCOL))
        restored = pickle.loads(model_path.read_bytes())
        check = train[FEATURES[name]].head(20)
        np.testing.assert_allclose(
            model.predict_proba(check),
            restored["model"].predict_proba(check),
            rtol=0,
            atol=1e-12,
        )
    scored.to_parquet(OUTPUT / "predictions.parquet", index=False)
    comparison = metrics(scored)
    comparison.to_csv(OUTPUT / "comparison.csv", index=False)
    replay = event_replay(scored)
    replay.to_csv(OUTPUT / "verified_event_replay.csv", index=False)
    importance = pd.DataFrame(
        [
            {"model": name, "feature": feature, "importance": float(value)}
            for name, model in models.items()
            for feature, value in zip(
                FEATURES[name], model.feature_importances_, strict=True
            )
        ]
    )
    importance.to_csv(OUTPUT / "training_feature_importance.csv", index=False)
    save_replay_plot(scored, OUTPUT)
    summary = {
        "trained_utc": datetime.now(UTC).isoformat(),
        "hardware": {
            "machine": platform.machine(),
            "os": platform.system(),
            "cpu_count": os.cpu_count(),
        },
        "compute": "local CPU; no cloud training or new downloads",
        "sklearn_version": sklearn.__version__,
        "parameters": PARAMETERS,
        "features": FEATURES,
        "target": TARGET,
        "calibrated": False,
        "training_rows": len(train),
        "training_positive_rows": int(train[TARGET].sum()),
        "training_positive_episodes": int(
            train.loc[train[TARGET].eq(1), "satellite_event_id"].nunique()
        ),
        "training_first_date": str(train.date.min()),
        "training_last_date": str(train.date.max()),
        "scored_rows": int(
            scored.prediction_status.eq("scored_common_input_set").sum()
        ),
        "missing_input_rows": int(
            scored.prediction_status.eq("missing_comparison_input").sum()
        ),
        "fit_seconds": timings,
        "predict_and_rank_seconds": round(prediction_seconds, 4),
        "total_seconds": round(time.perf_counter() - start, 4),
        "dataset_sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "code_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "model_sizes_bytes": {
            name: (OUTPUT / f"{name}.pkl").stat().st_size for name in models
        },
        "inspection_budget": (
            "one cell per day among all cells with common available inputs; "
            "ties use a fixed cell/date hash"
        ),
        "tuning": (
            "none; no held-out outcomes used to select features, "
            "hyperparameters or budget"
        ),
        "positive_weighting": (
            "equal total weight per positive cell episode; balanced class weights"
        ),
        "comparison": json.loads(str(comparison.to_json(orient="records"))),
        "verified_event_replay": json.loads(str(replay.to_json(orient="records"))),
        "limitations": [
            "Three positive satellite cell episodes; case-enriched training sample.",
            "No eligible satellite positives in validation/test; AUCs undefined.",
            "Verified wildfires have no verified negatives; separate replay only.",
            "One held-out wildfire case cannot establish generalisation.",
            "Uncalibrated scores; negatives mean no mapped satellite burn.",
            "Feature importance is an in-sample diagnostic only.",
            "Reanalysis and assumed latency support a hindcast only.",
        ],
        "validation": (
            "temporal cutoffs, input hashes, predictor allowlist, shared rows, "
            "saved-model round trip passed"
        ),
    }
    (OUTPUT / "summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    print(comparison.to_string(index=False), flush=True)
    print(replay.to_string(index=False), flush=True)
    print(f"Saved models and predictions to {OUTPUT}", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--score-only",
        type=Path,
        help="Score a feature Parquet with the saved local models",
    )
    parser.add_argument("--output", type=Path, help="Output Parquet for --score-only")
    args = parser.parse_args()
    if args.score_only:
        if args.output is None:
            parser.error("--output is required with --score-only")
        saved = {
            name: pickle.loads((OUTPUT / f"{name}.pkl").read_bytes())["model"]
            for name in FEATURES
        }
        score_models(pd.read_parquet(args.score_only), saved).to_parquet(
            args.output, index=False
        )
    else:
        train_local()

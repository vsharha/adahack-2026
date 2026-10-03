"""Train the three local comparisons using frozen grouped cross-validation."""

import hashlib
import json
import pickle
import time
from datetime import UTC, datetime

import numpy as np
import pandas as pd
import sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import average_precision_score, roc_auc_score

from .expanded_dataset import FEATURES
from .fetch import DATA, PROCESSED
from .train import PARAMETERS, TARGET

CANDIDATES = {
    "shallow": PARAMETERS,
    "deeper": {
        **PARAMETERS,
        "n_estimators": 100,
        "max_depth": 8,
        "min_samples_leaf": 5,
        "max_features": 0.8,
    },
}


def fit(frame, columns, candidate="shallow", tuning=False):
    if tuning:
        negatives = frame.loc[frame[TARGET].eq(0)]
        frame = pd.concat(
            [
                frame.loc[frame[TARGET].eq(1)],
                negatives.sample(min(50000, len(negatives)), random_state=42),
            ]
        )
    positive = frame[TARGET].eq(1)
    counts = frame.loc[positive].groupby("event_group_id").size()
    weights = pd.Series(1.0, index=frame.index)
    weights.loc[positive] = (
        frame.loc[positive, "event_group_id"].map(1 / counts)
        * len(frame.loc[positive])
        / len(counts)
    )
    model = RandomForestClassifier(**CANDIDATES[candidate])
    model.fit(frame[columns], frame[TARGET].astype(int), sample_weight=weights)
    return model


def tune(train, columns):
    """Select depth using only grouped inner folds inside the outer training set."""
    scores = []
    for candidate in CANDIDATES:
        for inner in sorted(train.cv_fold.unique())[:3]:
            inner_train = train.loc[train.cv_fold.ne(inner)]
            inner_validation = train.loc[train.cv_fold.eq(inner)]
            assert not set(inner_train.cv_group) & set(inner_validation.cv_group)
            model = fit(inner_train, columns, candidate, tuning=True)
            prediction = np.asarray(model.predict_proba(inner_validation[columns]))[
                :, 1
            ]
            scores.append(
                {
                    "candidate": candidate,
                    "inner_fold": int(inner),
                    "average_precision": float(
                        average_precision_score(
                            inner_validation[TARGET].astype(int), prediction
                        )
                    ),
                }
            )
    scores = pd.DataFrame(scores)
    best = (
        scores.groupby("candidate")
        .average_precision.mean()
        .sort_values(ascending=False)
        .index[0]
    )
    return str(best), scores


def alert_counts(validation, score):
    """One area per available day, using all input-complete held-out candidates."""
    ranked = validation.assign(score=score)
    picked = ranked.sort_values(
        ["date", "score", "tie_key"], ascending=[True, False, True]
    ).drop_duplicates("date")
    known = picked.loc[picked.cv_eligible]
    positive = validation.loc[validation.cv_eligible & validation[TARGET].eq(1)]
    hits = known.loc[known[TARGET].eq(1)]
    labelled = validation.loc[validation.cv_eligible]
    false_positive = len(known) - len(hits)
    false_negative = len(positive) - len(hits)
    correct = len(labelled) - false_positive - false_negative
    return {
        "alerts": len(picked),
        "alerts_with_usable_outcomes": len(known),
        "positive_alerts": len(hits),
        "positive_row_recall": len(hits) / len(positive),
        "events_alerted": int(hits.event_group_id.nunique()),
        "events_evaluable": int(positive.event_group_id.nunique()),
        "alert_policy_correct_rows": correct,
        "alert_policy_accuracy": correct / len(labelled),
        "always_no_burn_accuracy": 1 - len(positive) / len(labelled),
    }


def weather_matched(validation, prediction):
    """Compare burning/quiet cells with exactly the same weather grid and date."""
    known = validation.loc[validation.cv_eligible].copy()
    known["score"] = pd.Series(prediction, index=validation.index).reindex(known.index)
    positives = known.loc[known[TARGET].eq(1)]
    keys = pd.MultiIndex.from_frame(positives[["weather_id", "date"]])
    known = known.loc[
        pd.MultiIndex.from_frame(known[["weather_id", "date"]]).isin(keys)
    ]
    records = []
    for _, group in known.groupby(["weather_id", "date"]):
        quiet = group.loc[group[TARGET].eq(0), "score"].to_numpy()
        if not len(quiet):
            continue
        for row in group.loc[group[TARGET].eq(1)].to_dict("records"):
            win = np.mean((row["score"] > quiet) + 0.5 * (row["score"] == quiet))
            records.append(
                {
                    "event_group_id": row["event_group_id"],
                    "concordance": float(win),
                    "pairs": len(quiet),
                }
            )
    if not records:
        return pd.DataFrame(
            columns=["event_group_id", "concordance", "pairs", "positive_rows"]
        )
    return (
        pd.DataFrame(records)
        .groupby("event_group_id")
        .agg(
            concordance=("concordance", "mean"),
            pairs=("pairs", "sum"),
            positive_rows=("concordance", "size"),
        )
        .reset_index()
    )


def run():
    started = time.perf_counter()
    folder = DATA / "models/grouped_cv"
    folder.mkdir(parents=True, exist_ok=True)
    frame = pd.read_parquet(PROCESSED / "cv_dataset.parquet")
    eligible = frame.loc[frame.cv_eligible].copy()
    frame["tie_key"] = (frame.date.astype(str) + ":" + frame.cell_id).map(
        lambda s: hashlib.sha256(s.encode()).hexdigest()
    )
    common = np.isfinite(frame[FEATURES["peatpulse"]].to_numpy(dtype=float)).all(axis=1)
    methods = [*FEATURES, "cems_fwi_reference"]
    for method in methods:
        frame[f"{method}_oof_score"] = np.nan
    records, tuning_tables, matched_tables = [], [], []
    selected = {name: [] for name in FEATURES}
    (folder / "frozen_experiment.json").write_text(
        json.dumps(
            {
                "frozen_utc": datetime.now(UTC).isoformat(),
                "candidates": CANDIDATES,
                "selection": "Mean inner AP across up to three grouped inner folds",
                "alert_budget": "One cell per day per outer validation fold",
                "secondary_question": (
                    "Rank burning versus quiet cells sharing weather grid and date; "
                    "macro-average concordance across held-out event groups"
                ),
                "target": TARGET,
                "features": FEATURES,
            },
            indent=2,
        )
    )
    for fold in sorted(eligible.cv_fold.unique()):
        train = eligible.loc[eligible.cv_fold.ne(fold)]
        validation_index = frame.index[frame.cv_fold.eq(fold) & common]
        validation = frame.loc[validation_index]
        labelled = validation.loc[validation.cv_eligible]
        assert not set(train.cv_group) & set(validation.cv_group)
        assert not set(train.event_group_id.dropna()) & set(
            labelled.event_group_id.dropna()
        )
        for method in methods:
            start = time.perf_counter()
            if method == "cems_fwi_reference":
                prediction = validation.cems_fwi.to_numpy()
                best = "published_index"
            else:
                best, inner_scores = tune(train, FEATURES[method])
                tuning_tables.append(
                    inner_scores.assign(outer_fold=int(fold), model=method)
                )
                selected[method].append(best)
                model = fit(train, FEATURES[method], best)
                prediction = np.asarray(
                    model.predict_proba(validation[FEATURES[method]])
                )[:, 1]
            frame.loc[validation_index, f"{method}_oof_score"] = prediction
            matched_tables.append(
                weather_matched(validation, prediction).assign(
                    fold=int(fold), model=method
                )
            )
            score = frame.loc[labelled.index, f"{method}_oof_score"]
            y = labelled[TARGET].astype(int)
            records.append(
                {
                    "fold": int(fold),
                    "model": method,
                    "selected_candidate": best,
                    "training_rows": len(train),
                    "validation_rows": len(labelled),
                    "validation_positive_rows": int(y.sum()),
                    "validation_events": int(
                        labelled.loc[y.eq(1), "event_group_id"].nunique()
                    ),
                    "roc_auc": float(roc_auc_score(y, score)),
                    "average_precision": float(average_precision_score(y, score)),
                    "positive_prevalence": float(y.mean()),
                    "fit_and_score_seconds": round(time.perf_counter() - start, 3),
                    **alert_counts(validation, prediction),
                }
            )
            print(
                f"Fold {fold + 1} {method}: AP={records[-1]['average_precision']:.5f}",
                flush=True,
            )
            pd.DataFrame(records).to_csv(folder / "fold_metrics.csv", index=False)
    metrics = pd.DataFrame(records)
    metrics.to_csv(folder / "fold_metrics.csv", index=False)
    matched = pd.concat(matched_tables, ignore_index=True)
    matched.to_csv(folder / "weather_matched_event_results.csv", index=False)
    pd.concat(tuning_tables, ignore_index=True).to_csv(
        folder / "inner_tuning.csv", index=False
    )
    summary_rows = []
    for method in methods:
        rows = metrics.loc[metrics.model.eq(method)]
        score = frame.loc[eligible.index, f"{method}_oof_score"]
        assert score.notna().all()
        summary_rows.append(
            {
                "model": method,
                "mean_fold_roc_auc": float(rows.roc_auc.mean()),
                "mean_fold_average_precision": float(rows.average_precision.mean()),
                "fold_average_precision_std": float(rows.average_precision.std()),
                "pooled_oof_roc_auc": float(
                    roc_auc_score(eligible[TARGET].astype(int), score)
                ),
                "pooled_oof_average_precision": float(
                    average_precision_score(eligible[TARGET].astype(int), score)
                ),
                "alerts": int(rows.alerts.sum()),
                "positive_alerts": int(rows.positive_alerts.sum()),
                "positive_row_recall": float(
                    rows.positive_alerts.sum() / eligible[TARGET].sum()
                ),
                "events_alerted": int(rows.events_alerted.sum()),
                "events_evaluable": int(rows.events_evaluable.sum()),
                "event_recall": float(
                    rows.events_alerted.sum() / rows.events_evaluable.sum()
                ),
                "alert_policy_accuracy": float(
                    rows.alert_policy_correct_rows.sum() / len(eligible)
                ),
                "always_no_burn_accuracy": float(1 - eligible[TARGET].mean()),
                "weather_matched_concordance": float(
                    matched.loc[matched.model.eq(method), "concordance"].mean()
                ),
                "weather_matched_events": int(
                    matched.loc[matched.model.eq(method), "event_group_id"].nunique()
                ),
            }
        )
    comparison = pd.DataFrame(summary_rows)
    comparison.to_csv(folder / "comparison.csv", index=False)
    frame.to_parquet(folder / "out_of_fold_predictions.parquet", index=False)
    finalize(eligible, selected, comparison, started)


def finalize(eligible, selected, comparison, started):
    """Save final fits and a summary, including after interrupted saving."""
    folder = DATA / "models/grouped_cv"
    # Full-data models are for subsequent use; reported metrics come only from CV.
    for method, columns in FEATURES.items():
        candidate = pd.Series(selected[method]).value_counts().index[0]
        model = fit(eligible, columns, str(candidate))
        bundle = {
            "model": model,
            "features": columns,
            "target": TARGET,
            "calibrated": False,
            "sklearn_version": sklearn.__version__,
            "evaluation": "See separate grouped out-of-fold predictions",
            "selected_candidate": candidate,
        }
        path = folder / f"{method}.pkl"
        path.write_bytes(pickle.dumps(bundle, protocol=pickle.HIGHEST_PROTOCOL))
        reloaded = pickle.loads(path.read_bytes())
        sample = eligible[columns].head(100)
        # Parallel tree reductions can differ by floating-point rounding.
        np.testing.assert_allclose(
            model.predict_proba(sample),
            reloaded["model"].predict_proba(sample),
            rtol=0,
            atol=1e-12,
        )
    summary = {
        "trained_utc": datetime.now(UTC).isoformat(),
        "compute": "local CPU",
        "training_ready_rows": len(eligible),
        "positive_rows": int(eligible[TARGET].sum()),
        "event_groups": int(
            eligible.loc[eligible[TARGET].eq(1), "event_group_id"].nunique()
        ),
        "folds": int(eligible.cv_fold.nunique()),
        "candidate_parameters": CANDIDATES,
        "features": FEATURES,
        "seconds": round(time.perf_counter() - started, 2),
        "comparison": json.loads(str(comparison.to_json(orient="records"))),
        "data_sha256": hashlib.sha256(
            (PROCESSED / "training_ready.parquet").read_bytes()
        ).hexdigest(),
        "method": (
            "Grouped nested CV; two model configurations selected on inner folds. "
            "Full-data refit scores are never used for evaluation."
        ),
        "tuning_compute": (
            "All positives plus up to 50,000 quiet rows per inner fit; "
            "outer fits use all eligible training rows"
        ),
        "alert_budget": (
            "One cell per day per outer fold; candidates do not depend on future labels"
        ),
        "limits": [
            "Provisional satellite burn target can include managed burning.",
            "Correlated cells and linked events share folds.",
            "Case-enriched sample; scores are not calibrated fire probabilities.",
            "Includes cell burning during spread; not all positives predate ignition.",
            "Cross-validation across years is not a future-period operational test.",
        ],
        "verification": (
            "Disjoint train/validation groups; every eligible row scored out of fold; "
            "saved-model round trip passed"
        ),
    }
    (folder / "summary.json").write_text(json.dumps(summary, indent=2))
    print(comparison.to_string(index=False), flush=True)


if __name__ == "__main__":
    run()

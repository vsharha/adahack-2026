"""Compare model families on the existing, unchanged grouped burn benchmark."""

import hashlib
import json
import pickle
import time
import warnings
from datetime import UTC, datetime

import numpy as np
import pandas as pd
import sklearn
from sklearn.ensemble import ExtraTreesClassifier, HistGradientBoostingClassifier
from sklearn.exceptions import ConvergenceWarning
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, roc_auc_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from threadpoolctl import threadpool_limits

from .expanded_dataset import FEATURES
from .fetch import DATA, PROCESSED
from .train import TARGET
from .train_cv import CANDIDATES as FORESTS
from .train_cv import alert_counts, weather_matched
from .train_cv import fit as fit_forest

FOLDER = DATA / "models/algorithm_comparison"
BASELINE = DATA / "models/grouped_cv"
INPUTS = {"weather": FEATURES["strong_weather"], "radar": FEATURES["peatpulse"]}
CANDIDATES = {
    "logistic": {
        "regularized": {"C": 0.01},
        "flexible": {"C": 0.1},
    },
    "extra_trees": {
        "regularized": {"n_estimators": 100, "max_depth": 8},
        "flexible": {"n_estimators": 200, "max_depth": 14},
    },
    "boosting": {
        "regularized": {
            "max_iter": 120,
            "max_leaf_nodes": 7,
            "min_samples_leaf": 100,
            "l2_regularization": 10.0,
        },
        "flexible": {
            "max_iter": 200,
            "max_leaf_nodes": 15,
            "min_samples_leaf": 50,
            "l2_regularization": 5.0,
        },
    },
}


def make_model(family, candidate):
    params = CANDIDATES[family][candidate]
    shared = {"class_weight": "balanced", "random_state": 42}
    if family == "logistic":
        return Pipeline(
            [
                ("scale", StandardScaler()),
                (
                    "classifier",
                    LogisticRegression(**params, **shared, max_iter=1000),
                ),
            ]
        )
    if family == "extra_trees":
        return ExtraTreesClassifier(
            **params, **shared, min_samples_leaf=20, n_jobs=4
        ).set_params(max_features=0.8)
    return HistGradientBoostingClassifier(
        **params, **shared, learning_rate=0.05
    ).set_params(early_stopping=False)


def event_weights(frame):
    positive = frame[TARGET].eq(1)
    counts = frame.loc[positive].groupby("event_group_id").size()
    weights = pd.Series(1.0, index=frame.index)
    weights.loc[positive] = (
        frame.loc[positive, "event_group_id"].map(1 / counts)
        * len(frame.loc[positive])
        / len(counts)
    )
    return weights


def fit(frame, columns, family, candidate, tuning=False):
    if family == "random_forest":
        return fit_forest(frame, columns, candidate, tuning=tuning)
    if tuning:
        quiet = frame.loc[frame[TARGET].eq(0)]
        frame = pd.concat(
            [
                frame.loc[frame[TARGET].eq(1)],
                quiet.sample(min(50000, len(quiet)), random_state=42),
            ]
        )
    model = make_model(family, candidate)
    weights = event_weights(frame)
    kwargs = (
        {"classifier__sample_weight": weights}
        if family == "logistic"
        else {"sample_weight": weights}
    )
    with warnings.catch_warnings():
        warnings.simplefilter("error", ConvergenceWarning)
        model.fit(frame[columns], frame[TARGET].astype(int), **kwargs)
    return model


def tune(train, columns, family):
    records = []
    for candidate in CANDIDATES[family]:
        for inner in sorted(train.cv_fold.unique())[:3]:
            training = train.loc[train.cv_fold.ne(inner)]
            validation = train.loc[train.cv_fold.eq(inner)]
            assert not set(training.cv_group) & set(validation.cv_group)
            model = fit(training, columns, family, candidate, tuning=True)
            scores = np.asarray(model.predict_proba(validation[columns]))[:, 1]
            records.append(
                {
                    "candidate": candidate,
                    "inner_fold": int(inner),
                    "average_precision": float(
                        average_precision_score(validation[TARGET].astype(int), scores)
                    ),
                }
            )
    table = pd.DataFrame(records)
    ranked = (
        table.groupby("candidate").average_precision.mean().sort_values(ascending=False)
    )
    return str(ranked.index[0]), table


def evaluate(validation, score, fold, method, candidate):
    known = validation.cv_eligible.to_numpy(dtype=bool)
    y = validation.loc[known, TARGET].astype(int)
    matched = weather_matched(validation, score).assign(fold=fold, model=method)
    return (
        {
            "fold": fold,
            "model": method,
            "candidate": candidate,
            "validation_rows": int(known.sum()),
            "positive_rows": int(y.sum()),
            "roc_auc": float(roc_auc_score(y, score[known])),
            "average_precision": float(average_precision_score(y, score[known])),
            **alert_counts(validation, score),
        },
        matched,
    )


def run():
    started = time.perf_counter()
    FOLDER.mkdir(parents=True, exist_ok=True)
    baseline = json.loads((BASELINE / "summary.json").read_text())
    fingerprint = hashlib.sha256(
        (PROCESSED / "training_ready.parquet").read_bytes()
    ).hexdigest()
    assert fingerprint == baseline["data_sha256"], "Dataset changed since RF fitting"
    frame = pd.read_parquet(BASELINE / "out_of_fold_predictions.parquet")
    eligible = frame.loc[frame.cv_eligible]
    previous_inner = pd.read_csv(BASELINE / "inner_tuning.csv")
    previous_metrics = pd.read_csv(BASELINE / "fold_metrics.csv")
    methods = [f"{family}_{kind}" for family in CANDIDATES for kind in INPUTS]
    references = {
        "random_forest_weather": "strong_weather",
        "random_forest_radar": "peatpulse",
        "cems_fwi_reference": "cems_fwi_reference",
    }
    score_columns = {}
    for method in [*methods, "auto_selected"]:
        score_columns[method] = f"{method}_oof_score"
        frame[score_columns[method]] = np.nan
    for method, old_name in references.items():
        score_columns[method] = f"{old_name}_oof_score"
    experiment = {
        "frozen_utc": datetime.now(UTC).isoformat(),
        "data_sha256": fingerprint,
        "families": CANDIDATES,
        "shared_parameters": {
            "all": {"class_weight": "balanced", "random_state": 42},
            "logistic": {"scaler": "StandardScaler on training rows", "max_iter": 1000},
            "extra_trees": {"min_samples_leaf": 20, "max_features": 0.8, "n_jobs": 4},
            "boosting": {"learning_rate": 0.05, "early_stopping": False},
        },
        "random_forest_reference": FORESTS,
        "features": INPUTS,
        "selection": "Mean AP on the same three inner group folds as the RF run",
        "auto_selection": "Family, features and settings selected on inner AP only",
        "outer_folds": "Existing five folds; no changes to labels or candidates",
        "alert_budget": "One cell per available day per outer fold",
        "evaluation_scope": (
            "Additional algorithm comparison on the existing development benchmark; "
            "no new independent dataset"
        ),
    }
    (FOLDER / "frozen_experiment.json").write_text(json.dumps(experiment, indent=2))
    metrics, inner_tables, matched_tables, selectors = [], [], [], []
    for fold in sorted(eligible.cv_fold.unique()):
        train = eligible.loc[eligible.cv_fold.ne(fold)]
        # The original common-population scores identify the exact same candidates.
        indexes = frame.index[
            frame.cv_fold.eq(fold) & frame.cems_fwi_reference_oof_score.notna()
        ]
        validation = frame.loc[indexes]
        assert not set(train.cv_group) & set(validation.cv_group)
        candidates = []
        for family in CANDIDATES:
            for kind, columns in INPUTS.items():
                method = f"{family}_{kind}"
                begin = time.perf_counter()
                best, inner = tune(train, columns, family)
                inner = inner.assign(
                    outer_fold=int(fold), model=method, family=family, features=kind
                )
                inner_tables.append(inner)
                model = fit(train, columns, family, best)
                scores = np.asarray(model.predict_proba(validation[columns]))[:, 1]
                frame.loc[indexes, score_columns[method]] = scores
                record, matched = evaluate(validation, scores, int(fold), method, best)
                record["fit_and_score_seconds"] = time.perf_counter() - begin
                metrics.append(record)
                matched_tables.append(matched)
                candidates.append(
                    {
                        "method": method,
                        "family": family,
                        "features": kind,
                        "candidate": best,
                        "inner_ap": float(
                            inner.loc[inner.candidate.eq(best)].average_precision.mean()
                        ),
                    }
                )
                print(
                    f"Fold {fold + 1} {method}: "
                    f"{record['events_alerted']}/{record['events_evaluable']} groups, "
                    f"AP={record['average_precision']:.5f}",
                    flush=True,
                )
                pd.DataFrame(metrics).to_csv(FOLDER / "fold_metrics.csv", index=False)
                pd.concat(inner_tables).to_csv(FOLDER / "inner_tuning.csv", index=False)
        for method, old_name in references.items():
            scores = validation[score_columns[method]].to_numpy()
            old = previous_metrics.loc[
                previous_metrics.fold.eq(fold) & previous_metrics.model.eq(old_name)
            ].iloc[0]
            record, matched = evaluate(
                validation, scores, int(fold), method, old.selected_candidate
            )
            metrics.append(record)
            matched_tables.append(matched)
            if method == "cems_fwi_reference":
                continue
            kind = "weather" if old_name == "strong_weather" else "radar"
            inner = previous_inner.loc[
                previous_inner.outer_fold.eq(fold) & previous_inner.model.eq(old_name)
            ].assign(model=method, family="random_forest", features=kind)
            inner_tables.append(inner)
            candidates.append(
                {
                    "method": method,
                    "family": "random_forest",
                    "features": kind,
                    "candidate": old.selected_candidate,
                    "inner_ap": float(
                        inner.loc[
                            inner.candidate.eq(old.selected_candidate)
                        ].average_precision.mean()
                    ),
                }
            )
        choice = sorted(candidates, key=lambda x: (-x["inner_ap"], x["method"]))[0]
        selectors.append({"fold": int(fold), **choice})
        scores = frame.loc[indexes, score_columns[choice["method"]]].to_numpy()
        frame.loc[indexes, score_columns["auto_selected"]] = scores
        record, matched = evaluate(
            validation, scores, int(fold), "auto_selected", choice["method"]
        )
        metrics.append(record)
        matched_tables.append(matched)
    metrics = pd.DataFrame(metrics)
    inner = pd.concat(inner_tables, ignore_index=True)
    matched = pd.concat(matched_tables, ignore_index=True)
    metrics.to_csv(FOLDER / "fold_metrics.csv", index=False)
    inner.to_csv(FOLDER / "inner_tuning.csv", index=False)
    matched.to_csv(FOLDER / "weather_matched_event_results.csv", index=False)
    pd.DataFrame(selectors).to_csv(FOLDER / "fold_model_selection.csv", index=False)
    results = []
    for method, column in score_columns.items():
        values = metrics.loc[metrics.model.eq(method)]
        scores = frame.loc[eligible.index, column]
        assert scores.notna().all()
        results.append(
            {
                "model": method,
                "events_alerted": int(values.events_alerted.sum()),
                "events_evaluable": int(values.events_evaluable.sum()),
                "positive_alerts": int(values.positive_alerts.sum()),
                "alerts": int(values.alerts.sum()),
                "unknown_outcome_alerts": int(
                    values.alerts.sum() - values.alerts_with_usable_outcomes.sum()
                ),
                "accuracy": float(
                    values.alert_policy_correct_rows.sum() / len(eligible)
                ),
                "mean_fold_roc_auc": float(values.roc_auc.mean()),
                "mean_fold_average_precision": float(values.average_precision.mean()),
                "fold_ap_std": float(values.average_precision.std()),
                "pooled_average_precision": float(
                    average_precision_score(eligible[TARGET].astype(int), scores)
                ),
                "weather_matched_concordance": float(
                    matched.loc[matched.model.eq(method)].concordance.mean()
                ),
            }
        )
    comparison = pd.DataFrame(results)
    assert comparison.alerts.nunique() == 1
    comparison.to_csv(FOLDER / "comparison.csv", index=False)
    keep = [
        "cell_id",
        "date",
        "latitude",
        "longitude",
        "weather_id",
        "cv_group",
        "cv_fold",
        "cv_eligible",
        "event_group_id",
        "tie_key",
        TARGET,
        "satellite_min_lead_hours",
        "group_min_lead_hours",
        *score_columns.values(),
    ]
    frame[list(dict.fromkeys(keep))].to_parquet(
        FOLDER / "out_of_fold_predictions.parquet", index=False
    )
    # Final deployment choice also uses inner scores, never outer test performance.
    ranked = (
        inner.groupby(["family", "features", "candidate"])
        .average_precision.mean()
        .sort_values(ascending=False)
    )
    family, kind, candidate = ranked.index[0]
    final = fit(eligible, INPUTS[kind], family, candidate)
    bundle = {
        "model": final,
        "features": INPUTS[kind],
        "family": family,
        "candidate": candidate,
        "target": TARGET,
        "calibrated": False,
        "sklearn_version": sklearn.__version__,
        "selection": "Highest mean inner-fold AP across the fixed search",
    }
    path = FOLDER / "selected_model.pkl"
    path.write_bytes(pickle.dumps(bundle, protocol=pickle.HIGHEST_PROTOCOL))
    restored = pickle.loads(path.read_bytes())
    sample = eligible[INPUTS[kind]].head(100)
    np.testing.assert_allclose(
        final.predict_proba(sample),
        restored["model"].predict_proba(sample),
        rtol=0,
        atol=1e-12,
    )
    summary = {
        "completed_utc": datetime.now(UTC).isoformat(),
        "seconds": time.perf_counter() - started,
        "compute": "Local CPU; four threads",
        "data_sha256": fingerprint,
        "rows": len(eligible),
        "positive_rows": int(eligible[TARGET].sum()),
        "always_no_burn_accuracy": float(1 - eligible[TARGET].mean()),
        "selected_model": {"family": family, "features": kind, "candidate": candidate},
        "comparison": json.loads(str(comparison.to_json(orient="records"))),
        "verification": (
            "Disjoint groups, identical candidates/budgets, saved-model reload"
        ),
        "scope": experiment["evaluation_scope"],
    }
    (FOLDER / "summary.json").write_text(json.dumps(summary, indent=2))
    print(comparison.to_string(index=False), flush=True)


if __name__ == "__main__":
    with threadpool_limits(limits=4):
        run()

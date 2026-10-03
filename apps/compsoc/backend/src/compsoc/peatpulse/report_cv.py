"""Summarise held-out comparisons and uncertainty at the fire-group level."""

import json
import pickle

import matplotlib
import numpy as np
import pandas as pd

matplotlib.use("Agg")
import matplotlib.pyplot as plt

from .expanded_dataset import FEATURES
from .fetch import DATA, PROCESSED
from .train import TARGET

NAMES = {
    "cems_fwi_reference": "Copernicus FWI",
    "basic_weather": "Weather model",
    "strong_weather": "Weather + FWI model",
    "peatpulse": "PeatPulse + radar",
}


def interval(values, groups):
    """Paired cluster bootstrap, preserving dependence between linked events."""
    table = pd.DataFrame({"delta": values, "group": groups}).dropna()
    units = table.groupby("group").delta.agg(["sum", "size"])
    if len(units) < 2:
        return {"delta": None, "lower": None, "upper": None, "groups": len(units)}
    rng = np.random.default_rng(42)
    selections = rng.integers(0, len(units), size=(10000, len(units)))
    sums = units["sum"].to_numpy()[selections].sum(axis=1)
    sizes = units["size"].to_numpy()[selections].sum(axis=1)
    lower, upper = np.quantile(sums / sizes, [0.025, 0.975])
    return {
        "delta": float(table.delta.mean()),
        "lower": float(lower),
        "upper": float(upper),
        "groups": len(units),
        "events": len(table),
    }


def run():
    folder = DATA / "models/grouped_cv"
    frame = pd.read_parquet(folder / "out_of_fold_predictions.parquet")
    summary = json.loads((folder / "summary.json").read_text())
    positive = frame.loc[frame.cv_eligible & frame[TARGET].eq(1)]
    event_groups = positive.groupby("event_group_id").cv_group.first()
    events = event_groups.to_frame()
    alert_rows = []
    for method in NAMES:
        score = f"{method}_oof_score"
        candidates = frame.loc[frame[score].notna()]
        alerts = candidates.sort_values(
            ["cv_fold", "date", score, "tie_key"], ascending=[True, True, False, True]
        ).drop_duplicates(["cv_fold", "date"])
        hits = alerts.loc[alerts.cv_eligible & alerts[TARGET].eq(1)]
        events[method] = events.index.isin(hits.event_group_id).astype(int)
        alert_rows.append(
            {
                "model": method,
                "alerts": len(alerts),
                "known_outcome_alerts": int(alerts.cv_eligible.sum()),
                "unknown_outcome_alerts": int((~alerts.cv_eligible).sum()),
                "positive_alerts": len(hits),
                "positive_alerts_before_first_group_burn": int(
                    hits.group_min_lead_hours.ge(24).sum()
                ),
                "median_conservative_cell_lead_hours": float(
                    hits.satellite_min_lead_hours.median()
                ),
            }
        )
    events.to_csv(folder / "event_alert_results.csv")
    pd.DataFrame(alert_rows).to_csv(folder / "alert_outcomes.csv", index=False)
    matched = pd.read_csv(folder / "weather_matched_event_results.csv")
    paired = matched.pivot(
        index="event_group_id", columns="model", values="concordance"
    )
    uncertainty = {}
    for control in ("cems_fwi_reference", "strong_weather"):
        uncertainty[f"event_recall_vs_{control}"] = interval(
            events.peatpulse - events[control], events.cv_group
        )
        uncertainty[f"weather_matched_vs_{control}"] = interval(
            paired.peatpulse - paired[control], event_groups.reindex(paired.index)
        )
    uncertainty["strong_weather_event_recall_vs_cems_fwi_reference"] = interval(
        events.strong_weather - events.cems_fwi_reference, events.cv_group
    )
    (folder / "uncertainty.json").write_text(json.dumps(uncertainty, indent=2))
    importance_rows = []
    for method in FEATURES:
        bundle = pickle.loads((folder / f"{method}.pkl").read_bytes())
        importance_rows.extend(
            {"model": method, "feature": feature, "split_importance": float(value)}
            for feature, value in zip(
                bundle["features"], bundle["model"].feature_importances_, strict=True
            )
        )
    pd.DataFrame(importance_rows).to_csv(folder / "feature_importance.csv", index=False)
    comparison = (
        pd.read_csv(folder / "comparison.csv").set_index("model").loc[list(NAMES)]
    )
    colours = ["#999D9A", "#9AB9AC", "#5F937C", "#146A47"]
    plt.rcParams.update(
        {"font.size": 11, "axes.spines.top": False, "axes.spines.right": False}
    )
    fig, axes = plt.subplots(1, 2, figsize=(12.5, 6.5))
    for ax, column, title in zip(
        axes,
        ["event_recall", "weather_matched_concordance"],
        ["Mapped burn groups alerted", "Which patch burns under the same weather?"],
        strict=True,
    ):
        values = comparison[column].to_numpy() * 100
        bars = ax.barh(list(NAMES.values()), values, color=colours, height=0.6)
        ax.invert_yaxis()
        ax.set_xlim(0, 115)
        ax.set_xticks([0, 25, 50, 75, 100], ["0%", "25%", "50%", "75%", "100%"])
        ax.set_title(title, loc="left", pad=18, fontsize=12, weight="bold")
        for bar, value, row in zip(bars, values, comparison.itertuples(), strict=True):
            label = (
                f"{row.events_alerted}/{row.events_evaluable}"
                if column == "event_recall"
                else f"{value:.1f}%"
            )
            ax.text(value + 2, bar.get_y() + bar.get_height() / 2, label, va="center")
        if column == "weather_matched_concordance":
            ax.axvline(50, color="#555555", linestyle=":", linewidth=1)
            ax.set_xlabel("Event-averaged pair ranking; a tie scores 50%")
        else:
            ax.set_xlabel("One cell alerted per day per held-out fold")
    fig.suptitle(
        "PeatPulse | held-out Scottish peatland comparison",
        x=0.03,
        ha="left",
        fontsize=19,
        weight="bold",
    )
    fig.text(
        0.03,
        0.89,
        f"{summary['training_ready_rows']:,} usable cell-days · "
        f"{summary['positive_rows']:,} positive rows · "
        f"{summary['event_groups']} mapped burn groups · "
        f"{summary['folds']}-fold grouped validation",
        fontsize=11,
    )
    fig.text(
        0.03,
        0.035,
        "Retrospective, case-enriched sample, 2018–2025. "
        "Satellite burns can include managed fires.\n"
        "Scores are not calibrated fire probabilities; "
        "related cells stay in the same fold.",
        fontsize=10,
        color="#555555",
    )
    fig.tight_layout(rect=(0.015, 0.12, 0.99, 0.83), w_pad=3)
    fig.savefig(folder / "comparison.png", dpi=170, facecolor="white")
    plt.close(fig)
    dataset = json.loads((PROCESSED / "expanded_summary.json").read_text())
    print(
        json.dumps(
            {"dataset": dataset, "uncertainty": uncertainty, "alerts": alert_rows},
            indent=2,
        )
    )


if __name__ == "__main__":
    run()

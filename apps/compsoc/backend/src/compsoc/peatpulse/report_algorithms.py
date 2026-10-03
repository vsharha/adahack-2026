"""Create the algorithm leaderboard, event evidence and presentation chart."""

import json

import matplotlib
import numpy as np
import pandas as pd

matplotlib.use("Agg")
import matplotlib.pyplot as plt

from .compare_algorithms import FOLDER
from .train import TARGET

NAMES = {
    "cems_fwi_reference": "Copernicus FWI",
    "random_forest_weather": "Random Forest: weather + FWI",
    "random_forest_radar": "Random Forest: + radar",
    "logistic_weather": "Logistic regression: weather + FWI",
    "logistic_radar": "Logistic regression: + radar",
    "extra_trees_weather": "Extra Trees: weather + FWI",
    "extra_trees_radar": "Extra Trees: + radar",
    "boosting_weather": "Gradient boosting: weather + FWI",
    "boosting_radar": "Gradient boosting: + radar",
    "auto_selected": "Selected using inner folds",
}


def run():
    comparison = pd.read_csv(FOLDER / "comparison.csv").set_index("model")
    frame = pd.read_parquet(FOLDER / "out_of_fold_predictions.parquet")
    aliases = {
        "random_forest_weather": "strong_weather",
        "random_forest_radar": "peatpulse",
    }
    positives = frame.loc[frame.cv_eligible & frame[TARGET].eq(1)]
    events = positives.groupby("event_group_id").cv_group.first().to_frame()
    alert_rows = []
    for method in NAMES:
        column = f"{aliases.get(method, method)}_oof_score"
        available = frame.loc[frame[column].notna()]
        alerts = available.sort_values(
            ["cv_fold", "date", column, "tie_key"], ascending=[True, True, False, True]
        ).drop_duplicates(["cv_fold", "date"])
        known = alerts.loc[alerts.cv_eligible]
        hits = known.loc[known[TARGET].eq(1)]
        events[method] = events.index.isin(hits.event_group_id).astype(int)
        assert int(events[method].sum()) == int(
            comparison.loc[method, "events_alerted"]
        )
        alert_rows.append(
            {
                "model": method,
                "alerts": len(alerts),
                "known_outcome_alerts": len(known),
                "unknown_outcome_alerts": len(alerts) - len(known),
                "positive_alerts": len(hits),
                "positive_alerts_before_first_group_burn": int(
                    hits.group_min_lead_hours.ge(24).sum()
                ),
                "median_conservative_cell_lead_hours": float(
                    hits.satellite_min_lead_hours.median()
                ),
            }
        )
    events.to_csv(FOLDER / "event_alert_results.csv")
    pd.DataFrame(alert_rows).to_csv(FOLDER / "alert_outcomes.csv", index=False)
    standalone = comparison.drop(index=["cems_fwi_reference", "auto_selected"])
    max_caught = int(standalone.events_alerted.max())
    leaders = standalone.index[standalone.events_alerted.eq(max_caught)].tolist()
    best_ap = str(standalone.mean_fold_average_precision.idxmax())
    findings = {
        "primary_metric": "Mapped burn groups alerted at the unchanged daily budget",
        "standalone_leaders": leaders,
        "leader_groups_caught": max_caught,
        "best_mean_fold_average_precision": best_ap,
        "auto_selected_groups_caught": int(
            comparison.loc["auto_selected", "events_alerted"]
        ),
        "radar_effect_by_family": {
            family: {
                "weather_groups": int(
                    comparison.loc[f"{family}_weather", "events_alerted"]
                ),
                "radar_groups": int(
                    comparison.loc[f"{family}_radar", "events_alerted"]
                ),
            }
            for family in ("random_forest", "logistic", "extra_trees", "boosting")
        },
        "interpretation": (
            "Leaderboard describes performance on the reused development benchmark. "
            "The auto-selected row chooses family/features/settings on inner folds. "
            "Neither establishes performance on a new population."
        ),
    }
    (FOLDER / "findings.json").write_text(json.dumps(findings, indent=2))
    ordered = comparison.loc[list(NAMES)]
    colours = [
        "#236849"
        if key in leaders
        else "#7C67A5"
        if key == "auto_selected"
        else "#9BA9A2"
        for key in ordered.index
    ]
    plt.rcParams.update(
        {"font.size": 11, "axes.spines.top": False, "axes.spines.right": False}
    )
    fig, ax = plt.subplots(figsize=(11.5, 7.3))
    ax.barh(list(NAMES.values()), ordered.events_alerted, color=colours, height=0.66)
    ax.invert_yaxis()
    ax.set_xlim(0, 25)
    ax.set_xticks(np.arange(0, 26, 5))
    ax.set_xlabel("Mapped burn groups caught, out of 25")
    for index, count in enumerate(ordered.events_alerted):
        ax.text(count + 0.3, index, f"{count}/25", va="center")
    fig.suptitle(
        "PeatPulse | algorithm comparison",
        x=0.025,
        ha="left",
        weight="bold",
        fontsize=20,
    )
    fig.text(
        0.025,
        0.91,
        "Same 535,473 usable rows · same five grouped folds · same daily alert budget",
        fontsize=11,
    )
    fig.text(
        0.025,
        0.025,
        "Scotland, 2018–2025. "
        "Outcome: satellite-mapped burning in the next seven days.\n"
        "Each cell stays in one fold. Historical development comparison; "
        "burns may include managed fire.",
        fontsize=10,
        color="#555555",
    )
    fig.tight_layout(rect=(0.01, 0.1, 0.98, 0.88))
    fig.savefig(FOLDER / "leaderboard.png", dpi=170, facecolor="white")
    plt.close(fig)
    print(json.dumps(findings, indent=2))


if __name__ == "__main__":
    run()

"""Attach quality-aware burn outcomes without inventing wildfire negatives."""

import hashlib
import json
from datetime import UTC, datetime
from pathlib import Path

import numpy as np
import pandas as pd
from shapely.geometry import Point, shape

from .fetch import END_YEAR, PROCESSED, RAW, REPORT, json_data

DAY = pd.Timedelta(days=1)
HORIZON = pd.Timedelta(days=7)
RECENT_BURN_DAYS = 30


def valid_quality(qa):
    """Require land, valid observations, and no special unmapped condition."""
    return qa >= 0 and bool(qa & 1) and bool(qa & 2) and (qa >> 5 & 7) == 0


def burn_interval(month, day_of_year, uncertainty):
    """Resolve boundary-year dates, then apply an explicit uncertainty buffer."""
    month = pd.Timestamp(month)
    possibilities = []
    for year in (month.year - 1, month.year, month.year + 1):
        date = pd.Timestamp(year=int(year), month=1, day=1) + (day_of_year - 1) * DAY
        if date.year == year:
            possibilities.append(date)
    date = min(possibilities, key=lambda d: abs(d - (month + 14 * DAY)))
    return date, date - uncertainty * DAY, date + (uncertainty + 1) * DAY


def interval_masks(issues, lower, upper):
    """Whole date interval must fit in the 168 hours after the issue time."""
    ends = issues + HORIZON
    contained = (issues < lower) & (ends >= upper)
    overlaps = (issues < upper) & (ends > lower)
    recent = (issues >= lower) & (issues < upper + RECENT_BURN_DAYS * DAY)
    return contained, overlaps, recent


def coverage_by_day(pixels, dates):
    """Fraction of native peat pixel centres with usable monthly mapping."""
    expected = pixels.pixel_id.nunique()
    counts = np.zeros(len(dates), dtype=int)
    if expected == 0:
        return pd.Series(np.nan, index=dates), 0
    for row in pixels.itertuples():
        if not valid_quality(int(row.QA)):
            continue
        # EE masks the BurnDate band at non-detections, even with QA=3.
        # Coverage comes from QA and mapping dates, never from unmask(0).
        month = pd.Timestamp(row.product_month)
        month_end = month + pd.offsets.MonthBegin(1)
        # Ambiguous wrapped mapping intervals remain unknown.
        if row.FirstDay < 1 or row.LastDay < row.FirstDay:
            continue
        days = (
            (dates >= month)
            & (dates < month_end)
            & (dates.dayofyear >= row.FirstDay)
            & (dates.dayofyear <= row.LastDay)
        )
        counts[days] += 1
    assert (counts <= expected).all()
    return pd.Series(counts / expected, index=dates), expected


def satellite_episodes(pixels):
    """Cluster overlapping uncertainty intervals within a cell, not daily rows."""
    records = []
    for row in pixels.loc[pixels.BurnDate.between(1, 366)].itertuples():
        if not valid_quality(int(row.QA)) or row.Uncertainty < 0:
            continue
        date, lower, upper = burn_interval(
            row.product_month, row.BurnDate, row.Uncertainty
        )
        records.append(
            {
                "cell_id": row.cell_id,
                "pixel_id": row.pixel_id,
                "date": date,
                "lower": lower,
                "upper": upper,
            }
        )
    events = []
    if not records:
        return pd.DataFrame(columns=["cell_id", "event_id", "lower", "upper"])
    frame = pd.DataFrame(records).drop_duplicates(["cell_id", "pixel_id", "date"])
    for cell, group in frame.groupby("cell_id", sort=True):
        current = None
        for row in group.sort_values("lower").to_dict("records"):
            if current is None or row["lower"] > current["upper"] + 7 * DAY:
                current = {
                    "cell_id": cell,
                    "event_id": f"modis_{cell}_{row['date'].date()}",
                    "lower": row["lower"],
                    "upper": row["upper"],
                    "first_estimated_burn": row["date"],
                    "last_estimated_burn": row["date"],
                    "burned_pixels": 1,
                }
                events.append(current)
            else:
                current["upper"] = max(current["upper"], row["upper"])
                current["first_estimated_burn"] = min(
                    current["first_estimated_burn"], row["date"]
                )
                current["last_estimated_burn"] = max(
                    current["last_estimated_burn"], row["date"]
                )
                current["burned_pixels"] += 1
    return pd.DataFrame(events)


def reviewed_events(burns, cell_ids):
    reviews = json_data(Path(__file__).with_name("wildfire_reviews.json"))
    events = []
    for review in reviews:
        selected = burns.loc[burns.record_id.isin(review["record_ids"])]
        assert len(selected) == len(review["record_ids"])
        matched = set("|".join(selected.cell_ids).split("|")) & cell_ids
        assert matched, review["event_id"]
        for cell in sorted(matched):
            # Reported Scottish calendar days are converted to UTC.
            lower = pd.Timestamp(review["date_lower"], tz="Europe/London")
            upper = pd.Timestamp(review["date_upper"], tz="Europe/London") + DAY
            events.append(
                {
                    **review,
                    "record_ids": "|".join(map(str, review["record_ids"])),
                    "cell_id": cell,
                    "lower": lower.tz_convert("UTC").tz_localize(None),
                    "upper": upper.tz_convert("UTC").tz_localize(None),
                }
            )
    return pd.DataFrame(events)


def label_cell(inputs, pixels, episodes, burns, reviews, firms, footprint):
    issues = pd.to_datetime(inputs.issue_time_utc).reset_index(drop=True)
    calendar = pd.date_range("2017-12-01", f"{END_YEAR + 1}-01-31")
    daily, expected = coverage_by_day(pixels, calendar)
    # A 13:00-to-13:00 horizon touches parts of eight calendar days.
    coverage = np.vstack(
        [
            daily.reindex(issues.dt.normalize() + offset * DAY).to_numpy()
            for offset in range(8)
        ]
    )
    minimum = np.min(coverage, axis=0)
    out = inputs[["cell_id", "date"]].reset_index(drop=True).copy()
    out["modis_native_peat_pixels"] = expected
    out["modis_min_coverage_next_7d"] = minimum
    out["satellite_burn_next_7d"] = pd.array([pd.NA] * len(out), dtype="Int8")
    out["satellite_label_status"] = "insufficient_observation_coverage"
    good = minimum == 1
    out.loc[good, "satellite_burn_next_7d"] = 0
    out.loc[good, "satellite_label_status"] = "no_mapped_burn_with_coverage"
    out["satellite_event_id"] = ""
    out["satellite_min_lead_hours"] = np.nan
    out["verified_wildfire_next_7d"] = pd.array([pd.NA] * len(out), dtype="Int8")
    out["wildfire_label_status"] = "unknown_no_complete_incident_registry"
    out["verified_event_id"] = ""
    out["wildfire_date_basis"] = ""
    out["wildfire_min_lead_hours"] = np.nan
    recent_burn = np.zeros(len(out), dtype=bool)

    for event in episodes.itertuples():
        positive, overlaps, recent = interval_masks(issues, event.lower, event.upper)
        out.loc[overlaps, "satellite_burn_next_7d"] = pd.NA
        out.loc[overlaps, "satellite_label_status"] = "burn_date_uncertainty"
        out.loc[overlaps, "satellite_event_id"] = event.event_id
        out.loc[positive, "satellite_burn_next_7d"] = 1
        out.loc[positive, "satellite_label_status"] = (
            "satellite_burn_interval_in_window"
        )
        out.loc[positive, "satellite_min_lead_hours"] = (
            event.lower - issues.loc[positive]
        ).dt.total_seconds() / 3600
        recent_burn |= recent.to_numpy()

    # Catalogue dates are not ignition dates. Veto contradictory negatives only.
    catalogue_veto = np.zeros(len(out), dtype=bool)
    for burn in burns.itertuples():
        date = pd.Timestamp(burn.recorded_date)
        lower, upper = date - 30 * DAY, date + 31 * DAY
        if "spring" in str(burn.name).lower():
            lower = pd.Timestamp(year=int(date.year), month=1, day=1)
            upper = pd.Timestamp(year=int(date.year), month=7, day=1)
        catalogue_veto |= ((issues < upper) & (issues + HORIZON > lower)).to_numpy()
    out["catalogue_date_veto"] = catalogue_veto

    thermal_veto = np.zeros(len(out), dtype=bool)
    near = firms.loc[
        [
            footprint.distance(Point(row.easting, row.northing)) <= 1000
            for row in firms.itertuples()
        ]
    ]
    for date in pd.to_datetime(near.date).drop_duplicates():
        _, overlaps, recent = interval_masks(issues, date, date + DAY)
        thermal_veto |= overlaps.to_numpy()
        recent_burn |= recent.to_numpy()
    out["firms_nearby_window"] = thermal_veto

    for event in reviews.itertuples():
        positive, overlaps, recent = interval_masks(issues, event.lower, event.upper)
        out.loc[positive, "verified_wildfire_next_7d"] = 1
        out.loc[positive, "wildfire_label_status"] = "verified_event_in_reported_window"
        out.loc[overlaps, "verified_event_id"] = event.event_id
        out.loc[overlaps, "wildfire_date_basis"] = event.date_basis
        out.loc[positive, "wildfire_min_lead_hours"] = (
            event.lower - issues.loc[positive]
        ).dt.total_seconds() / 3600
        recent_burn |= recent.to_numpy()

    veto_zero = (catalogue_veto | thermal_veto) & out.satellite_burn_next_7d.eq(0)
    out.loc[veto_zero, "satellite_burn_next_7d"] = pd.NA
    out.loc[veto_zero, "satellite_label_status"] = "other_burn_evidence_needs_review"
    out["ongoing_or_recent_burn"] = recent_burn
    out.loc[recent_burn, "satellite_burn_next_7d"] = pd.NA
    out.loc[recent_burn, "satellite_label_status"] = "ongoing_or_recent_burn"
    out.loc[recent_burn, "verified_wildfire_next_7d"] = pd.NA
    out.loc[recent_burn, "wildfire_label_status"] = "ongoing_or_recent_burn"
    if expected == 0:
        out["satellite_label_status"] = "no_native_modis_pixel_centre_in_peat"
    return out


def counts(frame):
    return {
        "rows": len(frame),
        "satellite_positive": int(frame.satellite_burn_next_7d.eq(1).sum()),
        "satellite_negative": int(frame.satellite_burn_next_7d.eq(0).sum()),
        "satellite_unknown": int(frame.satellite_burn_next_7d.isna().sum()),
        "verified_wildfire_positive": int(frame.verified_wildfire_next_7d.eq(1).sum()),
        "verified_wildfire_unknown": int(frame.verified_wildfire_next_7d.isna().sum()),
        "exploratory_pairs": int(frame.exploratory_pair_eligible.sum()),
        "exploratory_positive": int(
            (frame.exploratory_pair_eligible & frame.satellite_burn_next_7d.eq(1)).sum()
        ),
    }


def build():
    inputs = pd.read_parquet(PROCESSED / "model_inputs.parquet")
    cells = pd.read_csv(PROCESSED / "audit_cells.csv")
    pixels = pd.read_parquet(PROCESSED / "burned_area_pixels.parquet")
    burns = pd.read_csv(PROCESSED / "burn_record_audit.csv")
    firms = pd.read_csv(PROCESSED / "firms_highland_raster_detections.csv")
    footprints = {
        f["properties"]["cell_id"]: shape(f["geometry"])
        for f in json_data(PROCESSED / "audit_peat_footprints.geojson")["features"]
    }
    episodes = satellite_episodes(pixels)
    reviews = reviewed_events(burns, set(cells.cell_id))
    frames = []
    for cell, group in inputs.groupby("cell_id", sort=True):
        relevant_burns = burns.loc[
            burns.cell_ids.fillna("")
            .str.split("|")
            .apply(lambda ids, cell=cell: cell in ids)
        ]
        frames.append(
            label_cell(
                group,
                pixels.loc[pixels.cell_id.eq(cell)],
                episodes.loc[episodes.cell_id.eq(cell)],
                relevant_burns,
                reviews.loc[reviews.cell_id.eq(cell)],
                firms,
                footprints[cell],
            )
        )
    labels = pd.concat(frames, ignore_index=True)
    dataset = inputs.drop(columns=["fire_next_7d", "label_status"]).merge(
        labels, on=["cell_id", "date"], how="left", validate="one_to_one"
    )
    dataset["exploratory_pair_eligible"] = (
        dataset.satellite_burn_next_7d.notna()
        & ~dataset.split_boundary_excluded
        & (
            dataset.satellite_burn_next_7d.eq(0)
            | dataset.satellite_min_lead_hours.ge(24)
        )
    ).fillna(False)
    dataset["geographic_evaluation_eligible"] = (
        dataset.exploratory_pair_eligible & dataset.sample_role.eq("spatial_coverage")
    )
    feature_columns = [
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
        "cems_dc",
        "cems_dmc",
        "cems_ffmc",
        "cems_fwi",
        "vv_db",
        "vh_db",
        "vv_seasonal_anomaly_db",
        "vh_seasonal_anomaly_db",
        "vv_change_db",
        "vh_change_db",
        "vv_last3_anomaly_db",
        "radar_age_days",
    ]
    dataset["all_comparison_inputs_present"] = (
        dataset[feature_columns].notna().all(axis=1)
    )
    dataset["complete_comparison_pair"] = (
        dataset.exploratory_pair_eligible & dataset.all_comparison_inputs_present
    )
    assert len(dataset) == len(inputs) == len(labels)
    assert not dataset.duplicated(["cell_id", "date"]).any()
    assert dataset.verified_wildfire_next_7d.dropna().eq(1).all()
    negative = dataset.satellite_burn_next_7d.eq(0)
    assert dataset.loc[negative, "modis_min_coverage_next_7d"].eq(1).all()
    assert not dataset.loc[negative, "catalogue_date_veto"].any()
    assert not dataset.loc[negative, "firms_nearby_window"].any()
    assert (
        dataset.loc[dataset.ongoing_or_recent_burn, "satellite_burn_next_7d"]
        .isna()
        .all()
    )
    assert (
        dataset.loc[dataset.satellite_burn_next_7d.eq(1), "satellite_event_id"]
        .ne("")
        .all()
    )
    for record in json_data(PROCESSED / "burned_area_summary.json")["raw_files"]:
        assert (
            hashlib.sha256((RAW / record["file"]).read_bytes()).hexdigest()
            == record["sha256"]
        )
    labels.to_parquet(PROCESSED / "labels_daily.parquet", index=False)
    labels.to_csv(PROCESSED / "labels_daily.csv.gz", index=False)
    dataset.to_parquet(PROCESSED / "model_dataset.parquet", index=False)
    dataset.to_csv(PROCESSED / "model_dataset.csv.gz", index=False)
    dataset.loc[dataset.exploratory_pair_eligible].to_parquet(
        PROCESSED / "exploratory_training_pairs.parquet", index=False
    )
    cell_counts = pd.DataFrame(
        [
            {"cell_id": cell, **counts(group)}
            for cell, group in dataset.groupby("cell_id", sort=True)
        ]
    )
    cells.merge(cell_counts, on="cell_id", validate="one_to_one").to_csv(
        PROCESSED / "cell_outcome_summary.csv", index=False
    )
    episodes.to_csv(PROCESSED / "satellite_burn_episodes.csv", index=False)
    reviews.to_csv(PROCESSED / "verified_wildfire_events.csv", index=False)
    record_reviews = burns.loc[
        burns.cell_ids.fillna("")
        .str.split("|")
        .apply(lambda ids: bool(set(ids) & set(cells.cell_id)))
    ].copy()
    record_reviews["review_status"] = "unresolved_type_or_event_timing"
    record_reviews["review_source"] = ""
    record_reviews["review_note"] = "Catalogue alone cannot verify wildfire or ignition"
    for review in json_data(Path(__file__).with_name("wildfire_reviews.json")):
        matched = record_reviews.record_id.isin(review["record_ids"])
        record_reviews.loc[matched, "review_status"] = "wildfire_type_confirmed"
        record_reviews.loc[matched, "review_source"] = review["source_url"]
        record_reviews.loc[matched, "review_note"] = review["date_basis"]
    skye = record_reviews.record_id.isin([35946, 35962, 35992])
    record_reviews.loc[skye, "review_status"] = "image_interval_mixed_fire_types"
    record_reviews.loc[skye, "review_source"] = (
        "https://data.jncc.gov.uk/data/c7d28386-f917-4de9-9293-da2d93bdab27/"
        "JNCC-Report-682-FINAL-WEB.pdf"
    )
    record_reviews.loc[skye, "review_note"] = (
        "JNCC 682 reports pre/post imagery 2018-02-25 and 2018-03-17 for "
        "Skye mapping. Recorded date matches pre-fire image, not known ignition."
    )
    record_reviews.to_csv(PROCESSED / "burn_record_reviews.csv", index=False)
    examples = pd.concat(
        [
            dataset.loc[dataset.verified_wildfire_next_7d.eq(1)]
            .groupby("verified_event_id")
            .head(1),
            dataset.loc[dataset.satellite_burn_next_7d.eq(1)]
            .groupby("satellite_event_id")
            .head(1),
            dataset.loc[dataset.satellite_burn_next_7d.eq(0)].head(2),
            dataset.loc[dataset.satellite_burn_next_7d.isna()].head(2),
        ]
    ).drop_duplicates(["cell_id", "date"])
    examples.to_csv(PROCESSED / "labelled_examples.csv", index=False)
    examples[
        [
            "cell_id",
            "date",
            "latitude",
            "longitude",
            "temperature_c",
            "precip_7d_mm",
            "cems_fwi",
            "vv_seasonal_anomaly_db",
            "satellite_burn_next_7d",
            "satellite_label_status",
            "verified_wildfire_next_7d",
            "verified_event_id",
        ]
    ].to_csv(PROCESSED / "labelled_examples_readable.csv", index=False)
    summary = {
        "generated_utc": datetime.now(UTC).isoformat(),
        "area": "Scotland"
        if (PROCESSED / "sample_manifest.json").exists()
        else "Highland council area, Scotland",
        "cell_size_m": 1000,
        "cells": len(cells),
        "period": f"2018-01-01 through {END_YEAR}-12-31",
        **counts(dataset),
        "by_split": {str(k): counts(g) for k, g in dataset.groupby("split")},
        "by_role": {str(k): counts(g) for k, g in dataset.groupby("sample_role")},
        "cells_with_modis_pixel_centres": int(pixels.cell_id.nunique()),
        "satellite_burn_pixel_records": int(pixels.BurnDate.gt(0).sum()),
        "satellite_cell_episodes": len(episodes),
        "verified_wildfire_events": int(reviews.event_id.nunique()),
        "complete_comparison_pairs": int(dataset.complete_comparison_pair.sum()),
        "complete_comparison_positive": int(
            (
                dataset.complete_comparison_pair & dataset.satellite_burn_next_7d.eq(1)
            ).sum()
        ),
        "status_counts": dataset.satellite_label_status.value_counts().to_dict(),
        "predictor_allowlist": feature_columns,
        "validation": (
            "passed: unique joins, coverage negatives, unknown wildfire negatives, "
            "recent-burn exclusion, event references, raw-file hashes"
        ),
        "input_sha256": hashlib.sha256(
            (PROCESSED / "model_inputs.parquet").read_bytes()
        ).hexdigest(),
        "evaluation_ready": False,
        "reason": (
            "Case-enriched feasibility sample. Inspect positive event counts by "
            "split. No complete registry supports verified wildfire negatives."
        ),
    }
    (PROCESSED / "label_summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    (PROCESSED / "model_feature_columns.json").write_text(
        json.dumps(feature_columns, indent=2) + "\n"
    )
    REPORT.mkdir(exist_ok=True)
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    build()

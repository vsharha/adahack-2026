"""Protect unknown labels, date uncertainty, and pre-event warning windows."""

import unittest

import pandas as pd
from shapely.geometry import box

from compsoc.peatpulse.labels import (
    burn_interval,
    coverage_by_day,
    interval_masks,
    label_cell,
    satellite_episodes,
)


class LabelTests(unittest.TestCase):
    def pixels(self, qa=3):
        return pd.DataFrame(
            [
                {
                    "cell_id": "A",
                    "pixel_id": "one",
                    "product_month": "2018-01-01",
                    "BurnDate": -9999,
                    "Uncertainty": -9999,
                    "QA": qa,
                    "FirstDay": 1,
                    "LastDay": 31,
                }
            ]
        )

    def label(self, pixels, episodes=None):
        date = pd.Timestamp("2018-01-05")
        inputs = pd.DataFrame(
            [
                {
                    "cell_id": "A",
                    "date": str(date.date()),
                    "issue_time_utc": date + pd.Timedelta(hours=13),
                }
            ]
        )
        return label_cell(
            inputs,
            pixels,
            pd.DataFrame() if episodes is None else episodes,
            pd.DataFrame(),
            pd.DataFrame(),
            pd.DataFrame(columns=["date", "easting", "northing"]),
            box(0, 0, 1000, 1000),
        ).iloc[0]

    def test_missing_observations_are_unknown(self):
        self.assertTrue(pd.isna(self.label(self.pixels(1)).satellite_burn_next_7d))
        self.assertTrue(pd.isna(self.label(self.pixels(35)).satellite_burn_next_7d))

    def test_coverage_negative_is_only_a_satellite_proxy(self):
        row = self.label(self.pixels())
        self.assertEqual(row.satellite_burn_next_7d, 0)
        self.assertTrue(pd.isna(row.verified_wildfire_next_7d))

    def test_partial_spatial_coverage_cannot_create_negative(self):
        second = self.pixels(1).assign(pixel_id="two")
        row = self.label(pd.concat([self.pixels(), second], ignore_index=True))
        self.assertEqual(row.modis_min_coverage_next_7d, 0.5)
        self.assertTrue(pd.isna(row.satellite_burn_next_7d))

    def test_shortened_period_and_missing_next_month(self):
        pixels = self.pixels().assign(QA=7, FirstDay=4, LastDay=10)
        days = pd.date_range("2018-01-01", "2018-02-02")
        coverage, _ = coverage_by_day(pixels, days)
        self.assertEqual(coverage.loc["2018-01-03"], 0)
        self.assertEqual(coverage.loc["2018-01-04"], 1)
        self.assertEqual(coverage.loc["2018-01-11"], 0)
        self.assertEqual(coverage.loc["2018-02-01"], 0)

    def test_uncertainty_crossing_window_is_unknown(self):
        episodes = pd.DataFrame(
            [
                {
                    "event_id": "event",
                    "lower": pd.Timestamp("2018-01-11"),
                    "upper": pd.Timestamp("2018-01-14"),
                }
            ]
        )
        row = self.label(self.pixels(), episodes)
        self.assertTrue(pd.isna(row.satellite_burn_next_7d))
        self.assertEqual(row.satellite_label_status, "burn_date_uncertainty")

    def test_future_burn_is_positive_but_recent_burn_excluded(self):
        episodes = pd.DataFrame(
            [
                {
                    "event_id": "event",
                    "lower": pd.Timestamp("2018-01-08"),
                    "upper": pd.Timestamp("2018-01-10"),
                }
            ]
        )
        row = self.label(self.pixels(), episodes)
        self.assertEqual(row.satellite_burn_next_7d, 1)
        self.assertTrue(pd.isna(row.verified_wildfire_next_7d))
        episodes["lower"] = pd.Timestamp("2018-01-04")
        row = self.label(self.pixels(), episodes)
        self.assertTrue(pd.isna(row.satellite_burn_next_7d))
        self.assertTrue(row.ongoing_or_recent_burn)

    def test_year_boundary_and_partial_day(self):
        date, lower, upper = burn_interval("2019-01-01", 365, 1)
        self.assertEqual(date, pd.Timestamp("2018-12-31"))
        issues = pd.Series(pd.to_datetime(["2018-12-25T13:00", "2018-12-26T13:00"]))
        positive, _, _ = interval_masks(issues, lower, upper)
        self.assertEqual(positive.tolist(), [False, True])

    def test_multiple_pixels_share_an_episode(self):
        pixels = pd.concat(
            [
                self.pixels().assign(BurnDate=10, Uncertainty=1),
                self.pixels().assign(pixel_id="two", BurnDate=11, Uncertainty=1),
            ],
            ignore_index=True,
        )
        episodes = satellite_episodes(pixels)
        self.assertEqual(len(episodes), 1)
        self.assertEqual(episodes.burned_pixels.iloc[0], 2)


if __name__ == "__main__":
    unittest.main()

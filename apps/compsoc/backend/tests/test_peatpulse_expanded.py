import unittest

import numpy as np
import pandas as pd

from compsoc.peatpulse.expanded_dataset import (
    Groups,
    assign_folds,
    causal_radar,
    event_and_cell_groups,
)
from compsoc.peatpulse.train import TARGET
from compsoc.peatpulse.train_cv import weather_matched


class ExpandedDatasetTests(unittest.TestCase):
    def test_future_radar_values_cannot_change_earlier_features(self):
        dates = pd.date_range("2019-01-01", periods=10, freq="12D")
        data = pd.DataFrame(
            {
                "cell_id": "a",
                "quality_eligible": True,
                "radar_time_utc": dates,
                "VV_count": 500,
                "VV_median": np.arange(10.0),
                "VH_median": np.arange(10.0) - 10,
            }
        )
        original = causal_radar(data)
        data.loc[data.index[-1], ["VV_median", "VH_median"]] = 999
        changed = causal_radar(data)
        pd.testing.assert_frame_equal(original.iloc[:-1], changed.iloc[:-1])
        self.assertTrue(original.vv_past90d_anomaly_db.iloc[:3].isna().all())
        self.assertEqual(original.vv_past90d_anomaly_db.iloc[3], 2.0)

    def test_whole_groups_stay_together_and_every_fold_has_positives(self):
        frame = pd.DataFrame(
            [
                {
                    "cv_group": f"g{g}",
                    TARGET: int(g < 10 and day == 0),
                    "cv_eligible": True,
                }
                for g in range(20)
                for day in range(5)
            ]
        )
        frame["fold"], count = assign_folds(frame)
        self.assertEqual(count, 5)
        self.assertTrue(frame.groupby("cv_group").fold.nunique().eq(1).all())
        self.assertTrue(np.all(np.asarray(frame.groupby("fold")[TARGET].sum()) == 2))

    def test_shared_extent_merges_discovery_clusters_and_comparisons(self):
        pixels = pd.DataFrame({"event_group": ["e1", "e2"], "cell_id": ["a", "b"]})
        manifest = pd.DataFrame(
            {
                "event_group": ["e1", "e2"],
                "case_cell": ["a", "b"],
                "comparison_cell": ["c", "d"],
                "first_burn": ["2025-04-03"] * 2,
            }
        )
        burns = pd.DataFrame({"cell_ids": ["a|b"], "recorded_date": ["2025-04-04"]})
        cells = pd.DataFrame({"cell_id": list("abcde")})
        _, groups, mapping = event_and_cell_groups(pixels, manifest, burns, cells)
        self.assertEqual(mapping["e1"], mapping["e2"])
        self.assertEqual(len({groups[k] for k in "abcd"}), 1)
        self.assertNotEqual(groups["e"], groups["a"])

    def test_group_links_are_transitive(self):
        groups = Groups(["a", "b", "c"])
        groups.link(["a", "b"])
        groups.link(["b", "c"])
        self.assertEqual(groups.root("a"), groups.root("c"))

    def test_weather_matched_counts_ties_and_excludes_unmatched_cells(self):
        frame = pd.DataFrame(
            {
                "cv_eligible": [True] * 5,
                TARGET: [1, 0, 0, 1, 0],
                "weather_id": ["a", "a", "a", "b", "c"],
                "date": ["2025-04-01"] * 5,
                "event_group_id": ["fire", None, None, "unmatched", None],
            }
        )
        baseline = weather_matched(frame, np.array([2, 2, 2, 5, 7]))
        self.assertEqual(len(baseline), 1)
        self.assertEqual(baseline.iloc[0].concordance, 0.5)
        self.assertEqual(baseline.iloc[0].pairs, 2)
        radar = weather_matched(frame, np.array([0.8, 0.8, 0.1, 0.7, 0.9]))
        self.assertEqual(radar.iloc[0].concordance, 0.75)


if __name__ == "__main__":
    unittest.main()

"""Protect chronological training, predictor isolation, and equal alert budgets."""

import unittest

import numpy as np
import pandas as pd

from compsoc.peatpulse.train import (
    FEATURES,
    METHODS,
    TARGET,
    fit_models,
    metrics,
    score_models,
    training_rows,
)


class TrainingTests(unittest.TestCase):
    def data(self):
        count = 80
        frame = pd.DataFrame(
            {
                column: np.arange(count, dtype=float) / (i + 1)
                for i, column in enumerate(FEATURES["peatpulse"])
            }
        )
        frame["cell_id"] = [f"cell_{i % 4}" for i in range(count)]
        frame["date"] = [
            str(d.date()) for d in pd.date_range("2019-01-01", periods=20).repeat(4)
        ]
        frame["split"] = "train"
        frame["split_boundary_excluded"] = False
        frame["complete_comparison_pair"] = True
        frame[TARGET] = pd.array([0] * 70 + [1] * 10, dtype="Int8")
        frame["satellite_event_id"] = ""
        frame.loc[70:74, "satellite_event_id"] = "a"
        frame.loc[75:, "satellite_event_id"] = "b"
        return frame

    def test_training_selection_excludes_future_and_unknown(self):
        frame = self.data()
        frame.loc[0, ["split", "date"]] = ["test", "2023-01-01"]
        frame.loc[1, "complete_comparison_pair"] = False
        selected = training_rows(frame)
        self.assertEqual(len(selected), 78)
        self.assertNotIn(0, selected.index)
        self.assertNotIn(1, selected.index)

    def test_single_class_training_rejected(self):
        with self.assertRaisesRegex(ValueError, "both observed target classes"):
            training_rows(self.data().assign(**{TARGET: 0}))

    def test_scoring_ignores_outcomes_and_preserves_equal_budget(self):
        frame = self.data()
        models, _ = fit_models(training_rows(frame))
        original = score_models(frame, models)
        changed = frame.copy()
        changed[TARGET] = 1 - changed[TARGET]
        changed["satellite_event_id"] = "future_label"
        changed["complete_comparison_pair"] = False
        poisoned = score_models(changed, models)
        for name in METHODS:
            np.testing.assert_allclose(
                original[f"{name}_score"],
                poisoned[f"{name}_score"],
                rtol=0,
                atol=1e-12,
            )
            daily_counts = original.groupby("date")[f"{name}_priority"].sum()
            self.assertTrue(np.all(np.asarray(daily_counts) == 1))
        missing = frame.copy()
        missing.loc[0, "vv_db"] = np.nan
        scored = score_models(missing, models)
        for name in METHODS:
            self.assertTrue(pd.isna(scored.loc[0, f"{name}_score"]))

    def test_no_positive_test_labels_has_no_auc(self):
        frame = self.data()
        models, _ = fit_models(training_rows(frame))
        test = frame.assign(split="test", **{TARGET: 0})
        result = metrics(score_models(test, models))
        self.assertTrue(result.roc_auc.isna().all())
        self.assertTrue(result.average_precision.isna().all())


if __name__ == "__main__":
    unittest.main()

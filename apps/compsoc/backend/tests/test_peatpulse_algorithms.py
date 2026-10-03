import unittest

import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline

from compsoc.peatpulse.compare_algorithms import event_weights, fit, make_model
from compsoc.peatpulse.train import TARGET


class AlgorithmComparisonTests(unittest.TestCase):
    def frame(self):
        return pd.DataFrame(
            {
                "signal": [1.0, 2.0, 4.0, 6.0, 8.0, 9.0],
                TARGET: [1, 1, 1, 0, 0, 0],
                "event_group_id": ["a", "a", "b", None, None, None],
            }
        )

    def test_positive_events_receive_equal_total_weight(self):
        frame = self.frame()
        weights = event_weights(frame)
        self.assertAlmostEqual(weights.iloc[:2].sum(), weights.iloc[2])
        np.testing.assert_array_equal(weights.iloc[3:], np.ones(3))

    def test_logistic_scaler_uses_only_supplied_training_rows(self):
        frame = self.frame()
        model = fit(frame, ["signal"], "logistic", "regularized")
        assert isinstance(model, Pipeline)
        self.assertAlmostEqual(model.named_steps["scale"].mean_[0], 5.0)
        model.predict_proba(pd.DataFrame({"signal": [10000.0]}))
        self.assertAlmostEqual(model.named_steps["scale"].mean_[0], 5.0)

    def test_boosting_does_not_create_an_internal_random_validation_split(self):
        model = make_model("boosting", "regularized")
        self.assertIs(model.get_params()["early_stopping"], False)


if __name__ == "__main__":
    unittest.main()

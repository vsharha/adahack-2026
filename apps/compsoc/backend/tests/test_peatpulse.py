"""Check prediction-time cutoffs and distinguish missing labels from negatives."""

import unittest

import numpy as np
import pandas as pd

from compsoc.peatpulse.weather import daily_features


class WeatherTimingTests(unittest.TestCase):
    def hourly(self):
        index = pd.date_range("2017-01-01", "2018-02-01", freq="h")
        return pd.DataFrame(
            {
                "temperature_2m": 10.0,
                "relative_humidity_2m": 65.0,
                "wind_speed_10m": 12.0,
                "vapour_pressure_deficit": 0.5,
                "precipitation": 0.25,
            },
            index=index,
        )

    def test_future_weather_cannot_change_earlier_features(self):
        original = self.hourly()
        changed = original.copy()
        future = changed.index >= pd.Timestamp("2018-01-15T13:00")
        changed.loc[future, "temperature_2m"] = 25.0
        changed.loc[future, "precipitation"] = 0.0
        baseline = daily_features(original, 58.5)
        poisoned = daily_features(changed, 58.5)
        mask = baseline.issue_time_utc <= pd.Timestamp("2018-01-15T13:00")
        pd.testing.assert_frame_equal(baseline.loc[mask], poisoned.loc[mask])

    def test_precipitation_windows_and_issue_time(self):
        data = daily_features(self.hourly(), 58.5)
        self.assertTrue(np.allclose(data.precip_24h_mm, 6))
        self.assertTrue(np.allclose(data.precip_7d_mm, 42))
        self.assertTrue(np.allclose(data.precip_30d_mm, 180))
        self.assertTrue((data.dry_spell_days == 0).all())
        self.assertTrue((data.issue_time_utc.dt.hour == 13).all())
        self.assertTrue((data.weather_cutoff_utc < data.issue_time_utc).all())

    def test_missing_hour_is_rejected(self):
        with self.assertRaisesRegex(AssertionError, "Missing hourly"):
            daily_features(self.hourly().drop(pd.Timestamp("2017-06-01T10:00")), 58.5)


if __name__ == "__main__":
    unittest.main()

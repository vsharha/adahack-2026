# PeatPulse — four answers

## 1. What datasets will we use?

- **Weather:** [Open-Meteo](https://open-meteo.com/en/docs/historical-weather-api) and [Copernicus](https://ewds.climate.copernicus.eu/datasets/cems-fire-historical-v1?tab=overview) — rain, temperature, wind and drought.
- **Peat drying:** [Sentinel-1 satellite radar](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S1_GRD).
- **Peat locations and condition:** [NatureScot maps](https://gis-downloads.nature.scot/).
- **Past fires:** [NatureScot burn records](https://services1.arcgis.com/LM9GyVFsughzHdbO/arcgis/rest/services/Scottish_Wildfire_and_Muirburn_Extents/FeatureServer/0) and [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/download/).

Fire records need checking for dates, duplicates and managed burns. Radar provides wetness-related signals; it does not measure peat temperature.

## 2. What will our model be?

**A small Random Forest classifier** — around 50 decision trees that learn patterns from past data.

| Version      | Inputs                                                            |
| ------------ | ----------------------------------------------------------------- |
| Weather only | Rain, temperature, humidity, wind and drought history             |
| PeatPulse    | The same weather plus satellite drying signals and peat condition |

**Output:** a risk score for a fire in an area within the next seven days.

Train on older years and test on unseen later years. Measure whether extra peat data helps flag more actual fires for the same number of warnings. Also report false alarms and warning time. No improvement has been measured yet.

## 3. What existing government solution is our baseline?

**The Fire Weather Index (FWI), used by the European Commission's EFFIS system.** It turns weather and accumulated drying into a fire-danger score. [Official explanation](https://forest-fire.emergency.copernicus.eu/about-effis/technical-background/fire-danger-forecast).

Our main comparison is **FWI versus PeatPulse using FWI/weather plus peat observations**. The weather-only Random Forest is an additional comparison.

Copernicus provides historical reconstructed FWI records. Scotland's actual public warnings are **Wildfire Danger Assessments**, issued by the Scottish Fire and Rescue Service with the Scottish Wildfire Forum. Comparing directly against those warnings requires their historical archive. [SFRS](https://www.firescotland.gov.uk/outdoors/wildfires/wildfire-danger-assessments/).

## 4. How do we split the work?

**You own the model. Your teammate owns the evidence and demo.**

| You — predictions                   | Teammate — validation and presentation                 |
| ----------------------------------- | ------------------------------------------------------ |
| Get weather/FWI and Sentinel-1 data | Get historical fire records and check their dates/type |
| Build peat-drying features          | Match fires to locations and dates                     |
| Train PeatPulse                     | Build the comparison map and timeline                  |
| Export FWI and PeatPulse scores     | Show correct warnings, false alarms and warning time   |

**Shared table:** location · date · FWI score · PeatPulse score · did a fire follow?

Agree together on the study area, seven-day window, training/test years and equal warning budget. Keep test fire outcomes out of model tuning.

**Demo:** pick a historical date → show both predictions → reveal actual fires → display the full comparison.

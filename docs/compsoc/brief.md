# CompSoc challenge

The brief and judging criteria, verbatim. Sources: `reference/compsoc.pdf`, `reference/compsoc-getting-started.pdf` and `reference/slideshow.pdf` (the opening slides), all handed out on 3 October 2026. Text was extracted from the PDFs, including their spelling.

## Brief

> **CompSoc Challenge - AdaHack 2026**
>
> **Goal**
>
> Use open source imaging and sensor data to identify environmental disasters and anomalies. Your solution should focus on finding events that are under-reported or easy-to-miss.
>
> **What to Deliver**
>
> Your submission should include:
>
> - an explanation of what anomoly or event you're detecting;
> - an overview of what data sources were used;
> - the methods, predictions, and models used (we love to hear technical specifics!);
> - what results and outcomes you were able to achieve;
> - a quick demo showcasing the solution.
>
> Your application could be a command line tool, a website, a graphical dashboard, or anything in between.
>
> **Judging Criterion (bonus points)**
>
> We're especially interested in seeing solutions which:
>
> - leverage small-compute solutions that avoid the use of large models, especially those which apply classical methods such as statistics, clustering, and signal processing;
> - make efficient use of pre-existing (non-language) models in novel ways;
> - can be run on a regular Laptop or even Raspberry Pi;
> - have verifiable results against pre-existing baseline metrics.
>
> **Examples**
>
> For some examples of what we're looking for, you could:
>
> - use NOAA satellite imaging to identify deforestation;
> - use BGS data to identify unreported small-scale earthquakes in remote regions;
> - use the GUVI dataset to identify and predict auroral anomalies after geomagnetic storms.
>
> These are just examples! We'd love to see what other data sources y'all can come up with.

## Opening slide

> **Challenge 7 - CompSoc**
>
> Challenge: Use open source imaging and sensor data to identify environmental disasters and anomalies as they occur. Bonus points for small-compute solutions that avoid the use of large models or make efficient use of pre-existing (non-language) models in novel ways.
>
> Prize: Raspberry Pi per team member

The slide adds "as they occur", which the PDF brief does not have.

## Suggested data sources

From `reference/compsoc-getting-started.pdf`. None has been tested for this project.

- Satellite and imagery: [Copernicus Data Space STAC API](https://stac.dataspace.copernicus.eu/v1) (Sentinel-1/2/3/5P), [Microsoft Planetary Computer STAC](https://planetarycomputer.microsoft.com/api/stac/v1) (Landsat, Sentinel, MODIS; no login for many collections), [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/api/) (active fire and thermal anomaly detections).
- Earth, water and air sensors: [BGS Sensor Data API](https://sensors.bgs.ac.uk/), [USGS Earthquake Catalog API](https://earthquake.usgs.gov/fdsnws/event/1/), [EMSC seismic event feed](https://www.seismicportal.eu/fdsn-wsevent.html), [Environment Agency Flood Monitoring API](https://environment.data.gov.uk/flood-monitoring/doc/reference) (river levels, UK), [OpenAQ](https://openaq.org/), [Open-Meteo](https://open-meteo.com/) (no API key), [Copernicus Climate Data Store](https://cds.climate.copernicus.eu/) (ERA5 reanalysis).
- Space weather: [NOAA SWPC](https://services.swpc.noaa.gov/) (solar wind, Kp index, aurora forecasts), [INTERMAGNET](https://imag-data.bgs.ac.uk/GIN_V1/GINForms2) (magnetometer data).
- Weather and general: [US National Weather Service API](https://api.weather.gov/), [NASA Open Datasets](https://data.nasa.gov/), [NASA Open APIs](https://api.nasa.gov/), [OpenStreetMap API](https://www.openstreetmap.org/about/api/).

The slides also give event-wide judging criteria, recorded in [`../event/judging.md`](../event/judging.md).

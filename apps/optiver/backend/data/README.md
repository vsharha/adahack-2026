# Offline challenge dataset

`credits.csv` contains the complete CREDITS sheet: 4,355 projects, 16 columns. Included for an offline hackathon demo; approximately 940 KiB. Empty risk ratings are preserved.

Source: [AdaHack 2026 x Optiver workbook](https://docs.google.com/spreadsheets/d/1d3YKqXgVyYUkYA9aYVlmE6ryc5MrrasY/edit), retrieved 2026-10-03 via the XLSX export endpoint. Converted with openpyxl and the Python standard-library CSV writer, with no row filtering or price/rating changes.

CSV SHA-256: `de00ad3a0d0d9f7f5b31ddead836584ed89e3d90eb7c5013b0285fda8dacf6f4`.

Original XLSX SHA-256: `44beb48fb6f1954112035d31ef931a53d234338c60e8d4d94d5bd79b122229bf`.

The organiser's README identifies prices and ratings as synthetic. Underlying registry project data: Pamela Quartson, Barbara K Haya, Tyler Bernard, Aline Abayo, Xinyun Rong, Ivy S So, Micah Elias (2026), Voluntary Registry Offsets Database v2026-06, Berkeley Carbon Trading Project, University of California, Berkeley. [Source and CC BY 4.0 attribution terms](https://gspp.berkeley.edu/berkeley-carbon-trading-project/offsets-database). The synthetic challenge additions are provided for the event; check organiser terms before redistributing them outside it.

The source README rules and inspection details are recorded in `docs/optiver/dataset-research.md` at repository root. This snapshot is not current market pricing or a real inventory offer.

# Carbon portfolio report

PASS under tested models

Target: 100,000 tCO2e. Budget: $1,000,000.00. Required modelled reliability: 95.0%.

Synthetic prices and ratings. Correlation strengths are assumptions, not organiser-supplied estimates. No real-world delivery guarantee.

| Portfolio | Cost | Projects | Nominal tonnes | Within budget |
| --- | ---: | ---: | ---: | --- |
| Cheapest nominal | $94,276.70 | 2 | 100,000 | True |
| Cheapest expected | $115,294.12 | 1 | 117,647 | True |
| Diversified candidate | $181,658.56 | 13 | 166,671 | True |

| Portfolio | Shared variance | Target hit rate | 95% interval | 5th percentile tonnes | Mean shortfall |
| --- | ---: | ---: | --- | ---: | ---: |
| Cheapest nominal | 0 | 68.29% | 67.37%–69.19% | 25,534 | 18,410 |
| Cheapest nominal | 0.3 | 68.75% | 67.83%–69.65% | 25,534 | 18,332 |
| Cheapest nominal | 0.6 | 69.06% | 68.15%–69.96% | 25,534 | 18,592 |
| Cheapest expected | 0 | 85.06% | 84.35%–85.75% | 0 | 14,940 |
| Cheapest expected | 0.3 | 84.84% | 84.12%–85.53% | 0 | 15,160 |
| Cheapest expected | 0.6 | 84.61% | 83.89%–85.30% | 0 | 15,390 |
| Diversified candidate | 0 | 99.27% | 99.08%–99.42% | 116,670 | 77 |
| Diversified candidate | 0.3 | 98.31% | 98.04%–98.54% | 110,970 | 182 |
| Diversified candidate | 0.6 | 96.99% | 96.64%–97.31% | 105,330 | 426 |

Pass requires the lower end of each individual 95% Wilson interval to reach the requested reliability, plus capacity and budget checks. Intervals are not a simultaneous confidence guarantee across models.

Search: 6 feasible allocation templates, 2,000 training scenarios per model; 10,000 fresh evaluation scenarios per model. Training seed 20261003; evaluation seed 20261004.

This is a bounded heuristic, not a global cost optimum. A failed search does not prove that no feasible portfolio exists.

## Selected portfolio holdings

| Project | ID | Country | Tonnes | Price/t | Cost | Fail% | Buffer |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| Vishnuprayag Hydro-electric Project (VHEP) by Jaiprakash Power Ventures Ltd.(JPVL) | VCS173 | India | 16,667 | $0.98 | $16,333.66 | 15.0% | No |
| Srepok 1 Solar Power Project | VCS1974 | Viet Nam | 16,667 | $0.93 | $15,500.31 | 20.0% | No |
| Ningxia Angli Lingwu Photovoltaic Grid Connected Power Plant Project | VCS1143 | China | 16,667 | $1.04 | $17,333.68 | 15.0% | No |
| 2x50 MW Orange Suvaan Solar Photovoltaic Power Project in Maharashtra India | GS5928 | India | 16,667 | $1.05 | $17,500.35 | 15.0% | No |
| Inner Mongolia Sunjiaying 50.25MW Wind Power Project | VCS395 | China | 16,667 | $1.10 | $18,333.70 | 12.0% | No |
| Canakkale WPP | GS906 | Türkiye | 16,667 | $1.19 | $19,833.73 | 12.0% | Yes |
| Xundian Jinfeng 12.6MW Hydropower Project | VCS1032 | China | 16,667 | $1.20 | $20,000.40 | 7.0% | No |
| Monjolinho Energética S/A Hydropower Plant Project (Alzir dos Santos Antunes) | ACR0177 | Brazil | 16,295 | $1.08 | $17,598.60 | 20.0% | No |
| InfraVest Changbin and Taichung bundled Wind Farms Project - Taiwan (300190) | GS472 | Taiwan | 11,339 | $1.35 | $15,307.65 | 12.0% | Yes |
| CGN Hami Phase I 20MWp Grid-connected PV Power Plant Project | VCS1248 | China | 8,334 | $1.05 | $8,750.70 | 15.0% | No |
| GUNAYSE  HPP | GS636 | Türkiye | 5,700 | $1.13 | $6,441.00 | 12.0% | No |
| Energy from renewables | VCS296 | India | 5,328 | $1.00 | $5,328.00 | 15.0% | No |
| 2 x 3.5 MW Ullunkal Hydro Power Project in Kerala, India. | VCS869 | India | 3,006 | $1.13 | $3,396.78 | 15.0% | No |

## Largest exposures by purchased tonnes

- country: China (35.0%)
- developer: Jaiprakash Power Ventures Limited (10.0%)
- registry: VCS (60.0%)
- project_type: Solar - Centralized (35.0%)

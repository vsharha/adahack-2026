# Offline presentation verification

Verified on 2026-10-03 using the complete supplied dataset and the existing Python CLI. Fresh runs at 90%, 95% and 99% reliability were each exported into a separate folder outside Git and passed `python -m optiver.audit` against the source CSV. Markdown, JSON and selected holdings are bundled for presentation without internet access or live optimisation.

| Requested reliability | Candidate cost USD | Projects | Worst modelled target hit rate | Lowest individual 95% Wilson bound | Passes |
| --------------------- | -----------------: | -------: | -----------------------------: | ---------------------------------: | ------ |
| 90%                   |         161,727.02 |        8 |                         93.19% |                             92.68% | Yes    |
| 95%                   |         181,658.56 |       13 |                         96.99% |                             96.64% | Yes    |
| 99%                   |         282,130.45 |       15 |                         99.90% |                             99.82% | Yes    |

All runs use the same USD 1m ceiling, 100,000-tonne target, source snapshot, seed 20261003, 2,000 training scenarios and 10,000 fresh evaluation scenarios per assumed shared latent variance setting (0, 0.3, 0.6). These figures are modelled results using synthetic prices/ratings, not guaranteed delivery or proven global minimum costs.

Implementation commit: `d89c733` (`Polish Optiver reports and add sensitivity analysis`). Reverification and audit commit: `Verify Optiver presentation bundle and demo audit` (the commit introducing this document).

## Reproduce

For each reliability level, run the following from repository root with a new output folder and the chosen level:

```bash
uv --directory apps/optiver/backend run python -m optiver --reliability 0.95 --output /tmp/optiver-present-95
uv --directory apps/optiver/backend run python -m optiver.audit /tmp/optiver-present-95
```

The main report is the 95% run. The other two runs explain the cost-of-reliability trade-off. Keep each run's JSON and CSV together. Generated output is not committed, following the repository's rule against build output.

## Organiser questions

No organiser responses have been supplied. Still confirm the target-success scoring rule, the joint failure generator and whether quantities must be whole tonnes. Record actual responses in `product.md` when received; do not turn our engineering assumptions into organiser rules.

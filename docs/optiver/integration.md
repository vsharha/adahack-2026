# Optiver demo integration

The frontend and reporting work can proceed independently. Keep `report.json` and `portfolio.csv` from the same run together. Do not manually edit displayed metrics into consistency.

## Audit a saved run

From repository root:

```bash
uv --directory apps/optiver/backend run python -m optiver.audit /absolute/path/to/run
```

Audit the frontend's saved data:

```bash
uv --directory apps/optiver/backend run python -m optiver.audit ../frontend/data
```

Exit 0 means the saved files reconcile. Exit 1 gives a specific mismatch. Audit is read-only and makes no changes to Qwen's data or Pi's reports.

It verifies the source CSV checksum, scenario coverage, finite quantities, confidence interval bounds, reliability and budget flags, per-project source metadata and recovery rules, purchase capacities, total cost, nominal and expected tonnes, and exposure shares. It rejects stale holdings paired with a no-candidate report. A report can consistently describe a failed candidate; audit success does not mean the portfolio meets its reliability target. It checks export consistency, not whether the simulations are scientifically calibrated.

## Before presenting

1. Generate the chosen run with the backend CLI. Keep the existing known-good frontend data until the new run completes.
2. Audit the new run, then copy JSON and CSV together into the frontend's data location.
3. Audit that frontend location again.
4. Run the frontend build and check it in the browser. Confirm every scenario selector updates the success rate, confidence interval and lower-tail metrics together.
5. Confirm the saved-run label, assumed shared-risk settings and model limitations are visible. Check the low-budget/no-candidate state instead of displaying a green success badge unconditionally.
6. Check CSV downloads against the same selected holdings. Use the backend Markdown report as an offline fallback.

No live API is required for the saved-run frontend. Add controls that recompute portfolios only after a real backend connection exists.

## Verification

On 2026-10-03, the frontend's saved JSON/CSV passed the audit against all 4,355 source projects. Fourteen backend tests passed, including a real CLI export and rejection of altered cost, wrong checksum, missing scenario, false pass flag, mismatched holdings and stale holdings after failure. Commit: `Audit Optiver demo exports against source data` (the commit introducing this document). Re-run the audit whenever reports or data change.

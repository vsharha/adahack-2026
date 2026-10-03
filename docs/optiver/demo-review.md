# Optiver demo readiness review

Checked 2026-10-03. Production build passed using `pnpm build` inside `apps/optiver/frontend/`. A temporary production preview on port 3002 returned HTTP 200. Browser scenario selection at shared variance 0.6 updated the hero and risk table to 97.0% success and 105.3K fifth-percentile tonnes. Browser console returned no errors or warnings. The JSON/CSV in `frontend/src/data` passed the source-data audit. This check does not establish complete mobile or failure-state coverage.

## Fix before presenting

| Gap                                            | Evidence                                                                                                                                                                                                                   | Required outcome                                                                                                                                        |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root launch commands do not select Optiver     | `pnpm --filter optiver exec pwd` returns no matching project. Root workspace includes only `apps/*`, while the frontend is nested one level deeper. Root checks also miss frontend TypeScript.                             | Register the frontend in the workspace with shared-file approval; ensure launch, build and check commands select it. Use a separate port from Postcode. |
| Data refresh does not update the displayed run | `start.sh` copies to `frontend/data`, while JSON is imported from `frontend/src/data` and holdings are embedded in `src/lib/data.ts`.                                                                                      | Use one source for report and holdings; audit that source after refresh. Refresh must update the displayed numbers and holdings together.               |
| Download links fail                            | Production HTTP checks for `/data/report.json` and `/data/portfolio.csv` both return 404. No public data files or corresponding routes exist.                                                                              | Serve downloads from the same run as the visible page and verify their contents.                                                                        |
| Risk wording and precision                     | Fifth-percentile delivery is described as guaranteed. Mean shortfall is described as an average only over failures, but backend averages over all scenarios. Confidence intervals round to identical whole-percent bounds. | Describe modelled percentile delivery without guarantees; label shortfall across all scenarios; show enough interval precision to see the bounds.       |
| Developer chart changes the denominator        | `exposureData` takes only six groups. Top six developers account for about 60% of purchased tonnes, but pie labels normalise those six to 100%.                                                                            | Include an Other slice or all groups so the chart retains the full-portfolio denominator.                                                               |
| Holdings search/sort are advertised but absent | Browser has no search input or sort controls; holdings render in embedded CSV order, not cost order.                                                                                                                       | Implement the advertised controls or remove the claim and describe the actual ordering.                                                                 |
| Missing-candidate robustness is unverified     | Page directly accesses `Diversified candidate` and its evaluations. Backend can legitimately return no candidate.                                                                                                          | Provide an honest no-candidate state if reports can be refreshed to failed runs.                                                                        |

The workspace/command and port changes require approval under the root instructions. The original dev server on 3000 was unresponsive during checking; use a verified restart after the launch configuration is corrected. A production preview worked on 3002.

## Documentation cleanup

`apps/optiver/AGENTS.md` still describes the frontend as empty. Frontend README is the scaffold template and includes disallowed package-manager examples. Frontend pins TypeScript 5 rather than the repository's stated TypeScript 6 policy. Align commands, scope and dependency policy with the completed app; have the frontend owner handle config changes under the repository approval rules.

## Submission preparation

- Confirm organiser scoring: target-success definition, joint failure generator and allowable quantities. Do not describe unconfirmed model assumptions as rules.
- Rehearse a short demo: cheapest baseline, diversified comparison, shared-risk selector, then the cost-of-reliability results.
- Keep the audited offline presentation bundle ready and verify the actual submission fields/required materials with organisers.

No new API, live budget sliders, new optimisation method or additional animation is required for the saved-run submission scope. Fix the launch, data and presentation defects first.

Review commit: `Record remaining Optiver demo gaps` (the commit introducing this review).

## P1 follow-up, 2026-10-03

The P1 implementation fixes the risk definitions and confidence precision, retains the full developer pie denominator with an Other slice, and guards missing candidates. Downloads are now served from public data, including the new cost curve. Summary, cost curve and country map are verified with the scenario selector and map interactions. Optiver type checking/build pass; 16 backend tests pass. The workspace registration, refresh wiring and advertised holdings controls still need separate work. The map is explicitly country-level because project coordinates are absent from the dataset.

Follow-up commit: `e49651f` (UI, snapshots and tests); CLI implementation also included in `1d7288f`.

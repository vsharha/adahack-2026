# Optiver: product

A Python command-line tool and Next.js web app for the Optiver challenge: construct a low-cost carbon-credit portfolio, compare it with simple baselines and report how it performs under project failures and shared risks. The initial audience is the team and judges reviewing the challenge submission.

## Decisions

- Start Optiver as a third independent project, with a Python backend managed by uv and an empty frontend folder, matching CompSoc's structure, so Python work can start before choosing a UI; 2026-10-03.
- Brainstorm and document the product direction before building features, so implementation follows an agreed plan; 2026-10-03.
- Build the proposed Python portfolio builder using the inspected challenge dataset, cheap baselines and resilience comparisons, following the user's instruction to build after reviewing the dataset research; 2026-10-03.
- Include full portfolio holdings in Markdown reports (project name, ID, country, tonnes, price, cost, failure%, buffer) for judge transparency; 2026-10-03.
- Add sensitivity analysis comparing 90%, 95%, 99% reliability levels to show cost-reliability trade-off; 2026-10-03.
- Create judge-facing summary in `docs/optiver/pitch/judges/` with plain-language explanation and key trade-offs; 2026-10-03.
- Build a single-page Next.js 16 frontend with Tailwind CSS v4 and shadcn/ui, using saved demo data from `src/data/` rather than a live API, to deliver a polished judge demo within hackathon timeline; 2026-10-03.
- Focus the frontend on the cost-vs-reliability question, with portfolio comparison chart, correlation scenario selector, diversification breakdown, risk metrics with tooltips, and holdings table; 2026-10-03.
- Add project quality scores using vintage recency (30%), removal preference (40%), and completion status (30%) to signal portfolio durability; 2026-10-03.
- Flag concentration risks >40% for any country/developer/registry/type to highlight diversification gaps; 2026-10-03.
- Run stress tests for budget cuts, target increases, and single-developer failure scenarios to demonstrate portfolio resilience; 2026-10-03.
- Generate clean one-pager Markdown exports for judges with executive summary and key metrics; 2026-10-03.

- Add the five P1 judge-demo features: an 80/85/90/95/99% CLI cost curve, a reliability-versus-cost chart, a geographic portfolio map, an executive summary with three concentration risks, and connected shared-risk scenario selection; the user explicitly requested this scope to improve judge appeal; 2026-10-03.

- Add the requested comparison CSV, per-project quality fields in JSON/CSV, and a configurable batch reliability runner to make backend results easier to inspect and compare; 2026-10-03.
- Add judge-facing frontend polish from the requested list: motion, a downloadable one-pager PDF, project-type verification, a usage guide and holdings exploration; 2026-10-03.

## Implementation assumptions

These are configurable engineering defaults, not confirmed organiser rules: a 100,000-tonne target, 95% reliability, whole-project binary failures with the supplied buffer recovery, and several assumed correlation strengths. The USD 1m budget, rating probabilities and recovery/reversal rules come from the workbook. Report modelled outcomes and uncertainty, not guarantees or real-world carbon impact.

## Demo scope

Offline dataset snapshot, validated inputs, bounded portfolio search, independent evaluation scenarios, baseline comparison, concentration and stress reporting, CSV/JSON/Markdown outputs, and a Next.js web app displaying the results. The web app uses static demo data copied from a fresh backend run; no live API is implemented. The search is a heuristic, not a proof of global optimality.

## Open organiser questions

Reviewed for judges at 18:00 on 2026-10-03.

- Does achieving the target mean realised delivery, expected delivery or a required probability?
- How are correlated failures generated and scored?
- Are fractional quantities allowed, and how does cost ranking interact with general judging criteria?

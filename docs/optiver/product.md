# Optiver: product

A Python command-line tool for the Optiver challenge: construct a low-cost carbon-credit portfolio, compare it with simple baselines and report how it performs under project failures and shared risks. The initial audience is the team and judges reviewing the challenge submission.

## Decisions

- Start Optiver as a third independent project, with a Python backend managed by uv and an empty frontend folder, matching CompSoc's structure, so Python work can start before choosing a UI; 2026-10-03.
- Brainstorm and document the product direction before building features, so implementation follows an agreed plan; 2026-10-03.
- Build the proposed Python portfolio builder using the inspected challenge dataset, cheap baselines and resilience comparisons, following the user's instruction to build after reviewing the dataset research; 2026-10-03.

## Implementation assumptions

These are configurable engineering defaults, not confirmed organiser rules: a 100,000-tonne target, 95% reliability, whole-project binary failures with the supplied buffer recovery, and several assumed correlation strengths. The USD 1m budget, rating probabilities and recovery/reversal rules come from the workbook. Report modelled outcomes and uncertainty, not guarantees or real-world carbon impact.

## Demo scope

Offline dataset snapshot, validated inputs, bounded portfolio search, independent evaluation scenarios, baseline comparison, concentration and stress reporting, and CSV/JSON/Markdown outputs. No frontend or external API is required. The search is a heuristic, not a proof of global optimality.

## Open organiser questions

- Does achieving the target mean realised delivery, expected delivery or a required probability?
- How are correlated failures generated and scored?
- Are fractional quantities allowed, and how does cost ranking interact with general judging criteria?

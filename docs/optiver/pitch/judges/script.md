# Optiver: three-minute judge pitch

The figures below are from the saved challenge run. Speak to the screen rather than reading every line.

## 0:00–0:30 — The problem

"The brief asks us to deliver 100,000 tonnes of carbon credits within a budget and survive unexpected failures. Buying only the cheapest credits costs about $94,000, but in our simulation that portfolio misses the target about one time in three."

Show the hero's target and budget. The $1 million ceiling comes from the supplied workbook; the 95% reliability threshold is our demo choice.

## 0:30–1:15 — The trade-off

Scroll to **The cost of being wrong**. "We compare the cheapest nominal portfolio, the cheapest expected-delivery portfolio, and our diversified candidate. Our candidate buys 166,671 nominal tonnes across 13 projects for $181,659. It costs about $87,000 more than the cheapest portfolio, while its modelled target-hit rate is 97–99% across our tested settings."

Do not describe nominal tonnes as delivered tonnes. The portfolios are fixed in the saved run.

## 1:15–2:00 — Surviving shared failures

Use **Stress the shared risks** and select ρ=0.6. "This switches between saved simulations that assume different amounts of shared risk. The diversified candidate still hits the target in 96.99% of 10,000 scenarios at this strongest setting. The cheaper portfolio hits it in 69.06%."

Point to the concentration list: "Diversification helps, but we still have 60% of purchased tonnes in one registry. We show that exposure rather than hiding it."

## 2:00–2:35 — How it works

"We use 4,355 supplied projects with synthetic prices and failure ratings. A Python search tries six allocation templates, then evaluates the chosen portfolio on fresh scenarios. Failures can be shared through country, developer, registry and project type. The dashboard shows the saved results and lets you inspect the holdings."

Show the map or search one holding by ID. Avoid trying to cover every chart.

## 2:35–3:00 — Limits and close

"The risk settings and 95% requirement are our assumptions. This is a bounded search, so we cannot claim the cheapest possible portfolio. No credits were purchased or retired; these are modelled challenge outcomes, not measured climate impact. The value is making the cost of resilience visible."

Close by naming what each teammate contributed, using the team's actual contributions. Invite one question.

## If a judge asks

- **Why 95%?** It is a team-chosen reliability requirement; the brief does not set one.
- **Is 97% guaranteed?** No. It is the simulated hit rate under the strongest of three assumed shared-risk settings; real failure rates could differ.
- **Is this the cheapest feasible allocation?** We tested six templates and chose the cheapest candidate found. We did not solve for a global optimum.
- **What does ρ mean?** Total shared latent variance in our model, not a measured correlation between failures.
- **What reduces emissions?** This tool helps assess the reliability of carbon-credit delivery. It does not measure or directly reduce operational emissions.

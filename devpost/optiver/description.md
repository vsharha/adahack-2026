# Carbon Portfolio Lab

How much more should we spend to make a carbon-credit target resilient to project failures?

## The problem

The Optiver challenge asks us to build a carbon-credit portfolio that delivers 100,000 tonnes of CO₂ equivalent (tCO₂e) within a budget and survives the unexpected. Buying only the cheapest credits can leave the target exposed if projects fail, especially when related projects fail together.

## What we built

Carbon Portfolio Lab compares three ways to buy credits: the lowest upfront cost, the lowest cost per expected delivered tonne, and a portfolio spread across more projects. A Python tool reads 4,355 projects from the supplied challenge dataset, searches several allocation strategies, and simulates project failures. A Next.js dashboard shows the saved results, the cost of higher reliability, country and project-type exposure, and every selected holding. Visitors can change the shared-risk assumption and see how the same portfolio performs when failures become more connected.

Our selected portfolio buys 166,671 nominal tonnes across 13 projects in six countries for $181,658.56. It reaches the 100,000-tonne target in 96.99% to 99.27% of 10,000 fresh simulations per tested shared-risk setting. For comparison, the cheapest nominal portfolio costs $94,276.70 but reaches the target in only 69.06% of simulations at the strongest shared-risk setting. The dashboard also makes remaining weaknesses visible: 60% of purchased tonnes are in one registry.

## How we built it

The backend ranks projects by cost per expected retained tonne and tries six diversification templates. It selects a candidate using 2,000 simulated outcomes, then evaluates it on 10,000 new outcomes for each of three shared-risk settings. The model uses the supplied project failure ratings and tests shared risks by country, developer, registry, and project type. The frontend presents the exported results with a strategy comparison, cost-versus-reliability chart, map, holdings table, stress checks, and a downloadable summary.

## What the results mean

The challenge dataset combines carbon-credit project records with synthetic prices and failure ratings. We chose a 95% reliability goal for the demo; the brief does not prescribe one. Shared-risk strengths are modelling assumptions, and our limited search does not prove that this is the cheapest possible portfolio. These are simulated delivery results, not guarantees or evidence of real-world emissions reduction. No credits were bought or retired.

## What's next

Before using this approach for a real purchase, we would need validated project-risk data, an independently tested failure model, and a broader optimisation search.

## Repository

This repository contains three independent AdaHack projects. The code for Carbon Portfolio Lab is in [`apps/optiver/`](https://github.com/vsharha/adahack-2026/tree/main/apps/optiver), with project notes in [`docs/optiver/`](https://github.com/vsharha/adahack-2026/tree/main/docs/optiver).

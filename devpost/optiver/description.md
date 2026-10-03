# Carbon Portfolio Lab

Carbon Portfolio Lab shows the cost of making a carbon-credit portfolio more reliable. It compares cheap purchases with a portfolio spread across more projects, then tests what happens when projects fail.

## Inspiration

The Optiver challenge asks us to deliver 100,000 tonnes of CO₂ equivalent within a budget and survive unexpected failures. We wanted to answer a practical question: if the cheapest credits might fail, how much more should we spend to improve our chance of reaching the target?

## What it does

The dashboard compares three portfolios: the lowest upfront cost, the lowest cost for average delivery, and our spread-out portfolio. Visitors can change the shared-risk setting, explore the selected projects, and see where credits are still concentrated.

Our portfolio buys 166,671 nominal tonnes across 13 projects in six countries for $181,659. It reaches the 100,000-tonne target in about 97–99% of our simulations, depending on the risk setting. The cheapest portfolio costs $94,277 but reaches the target in only 69% of simulations at the highest shared-risk setting.

## How we built it

We used the challenge dataset of 4,355 carbon-credit projects with synthetic prices and failure ratings. A Python tool searches for portfolios and tests them against simulated project failures. We evaluate the selected portfolio on fresh simulations under three shared-risk settings.

We built the dashboard with Next.js. It displays the saved results through comparisons, charts, a map, stress checks and a searchable list of projects.

## Challenges we ran into

The brief does not specify exactly how projects might fail together or what success probability to require. We chose a 95% success goal for our demo and clearly labelled our risk assumptions. We also had to keep the dashboard and its downloadable results consistent with the same backend run.

## Accomplishments that we're proud of

We made the cost and reliability trade-off visible. At the highest shared-risk setting, our $181,659 portfolio reaches the target in 96.99% of simulations, compared with 69.06% for the $94,277 cheapest portfolio.

We also show the portfolio's weaknesses rather than hiding them. For example, 60% of purchased tonnes are in one registry, and the dashboard shows what could happen if that group failed.

## What we learned

Buying 100,000 tonnes on paper is different from reliably delivering 100,000 tonnes. Spreading purchases across projects can help, but shared risks still matter. A simulation result is useful only when its assumptions and limits are clear.

## What's next for Carbon Portfolio Lab

We would test the approach with validated real-world project-risk data and improve the portfolio search. The current prices and failure ratings are synthetic challenge data. No credits were bought or retired, and our simulated success rates are not guarantees or measured emissions reductions.

## Repository

This repository contains three independent AdaHack projects. Carbon Portfolio Lab is in [`apps/optiver/`](https://github.com/vsharha/adahack-2026/tree/main/apps/optiver).

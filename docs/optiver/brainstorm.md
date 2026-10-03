# Optiver brainstorming

Proposals for discussion, 2026-10-03. No product direction has been approved and no features are being built. This initial brainstorm predates dataset inspection; [`dataset-research.md`](dataset-research.md) supersedes its data assumptions and recommendation.

## Challenge and unknowns

The supplied brief asks for a carbon-credit portfolio that delivers "100,000 of CO2 e" within a budget and survives unexpected events. It supplies synthetic prices and failure probabilities alongside Berkeley registry data. Confirm the target units, budget, purchasable quantities, credit availability and interpretation of failure before implementing a model.

The challenge spreadsheet could not be opened through web retrieval during this brainstorm; its schema remains unverified. Berkeley's public database describes projects, credit issuances and retirements across registries. It is background context, not a substitute for the organiser's synthetic dataset: <https://gspp.berkeley.edu/berkeley-carbon-trading-project/offsets-database> (consulted 2026-10-03).

## Candidate concepts

| Concept                      | What the user does                                                                     | Strength                                                               | Main risk                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Carbon portfolio stress test | Compares cheap and diversified portfolios under the same budget and failure scenarios  | Clear link to the brief, measurable results and an understandable demo | Must distinguish supplied failure probabilities from invented shared shocks                         |
| Reliability budget explorer  | Explores how much budget is needed for different chances of meeting the target         | Makes the cost of reliability visible                                  | Needs a credible search method and a clear infeasible result when the budget cannot meet the target |
| Beat the portfolio builder   | A judge chooses projects, then compares their portfolio with a baseline and our method | Participatory presentation                                             | Interaction takes time to build; presentation polish could crowd out evaluation                     |

Recommendation for discussion: start with the stress test. Add a reliability-versus-budget chart if the core works. Keep the interactive game as an optional presentation idea.

## Proposed Python-only first version

Intended user: someone selecting carbon credits who wants to understand the risk of missing their delivery target. This is a hackathon decision-support prototype using synthetic inputs.

1. Validate the supplied dataset and document each field's units and meaning.
2. Build a cheapest-first baseline, respecting the budget and available quantities.
3. Build a second candidate using project concentration limits and, if fields permit, diversification across countries or project types. Call it a heuristic unless it actually solves a stated optimisation problem.
4. Compare candidates on the same held-out failure scenarios. Keep scenario seeds used for selecting a portfolio separate from seeds used to evaluate it.
5. Report cost, nominal credited quantity, estimated target-hit rate and shortfall when the target is missed. Report infeasibility explicitly rather than inventing a successful portfolio.
6. Produce a reproducible command-line report and static charts. A frontend remains undecided.

Start by modelling each project as delivering or failing according to the supplied probability, only if that matches the data definition. Buying more credits from one project must not turn one project failure into independent credit failures. Treat independence between projects as an explicit baseline assumption.

Then add clearly labelled hypothetical shared shocks, such as a regional disruption affecting several projects, if the dataset provides a defensible grouping. Do not present these shocks as estimated real-world probabilities. Stress every portfolio with the same shocks, and show cases where diversification does not help as well as those where it does.

Use terms such as "modelled credit delivery" rather than claiming verified real-world emissions reductions. The proposed evaluation produces no measured results until implemented and run.

## Proposed demo

"Two portfolios, one budget. Which still reaches the target when things go wrong?"

Show the baseline and proposed method, apply the same shock, then show the distribution across many simulated scenarios. Explain the extra cost or lost nominal quantity associated with reducing shortfall risk. Present actual outcomes, even if the baseline wins in a particular scenario.

## Collaboration with human teammates

The user confirmed that collaboration means human hackathon teammates. Names, availability and communication channel are still to be supplied. No teammate has been contacted or assigned work.

Suggested short discussion:

- First 3 minutes: agree what the challenge target and synthetic probabilities mean.
- Next 5 minutes: choose the intended user and compare the three concepts.
- Next 5 minutes: ask someone to find a scenario where the preferred method fails.
- Last 2 minutes: agree the smallest demo, owners and evidence needed.

Suggested roles, subject to availability:

- User: owns Optiver, dataset validation and the first Python implementation.
- Postcode teammate: optional short review of the problem framing and final demo; continues owning Postcode.
- Another available teammate: independently checks simulation assumptions and edge cases, or prepares the explanation and charts. Agree which role before assigning it.

If implementation is split, agree a small input/output contract first: project ID, unit price, available quantity and project failure probability in; selected quantities, total cost and scenario delivery totals out. Add country and project type only if present. Assign separate files to avoid editing the same module simultaneously.

Draft for the user to share, not sent:

> I'm starting the Optiver carbon portfolio challenge in Python. My proposed demo compares a cheap portfolio with a diversified one under the same budget and failure scenarios. Could we spend 10–15 minutes checking the assumptions and choosing the smallest convincing demo? I especially want someone to challenge how we model projects failing together. You can keep working on Postcode; a short review would help.

## Before implementation

- Inspect the organiser's dataset and resolve target units, budget and failure semantics.
- Agree the concept, intended user, evaluation and demo scope with the user.
- Record accepted choices in `product.md`; keep rejected or unaccepted suggestions out of its Decisions section.
- Confirm actual human contributors and responsibilities.

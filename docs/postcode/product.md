# Postcode Lottery: product

The brief is in [`brief.md`](brief.md). Nothing below is built yet; [`status.md`](status.md) records what is.

## What it is

A neighbourhood app for keeping a postcode area green together. A neighbour enters their postcode and sees what is happening locally: green space nearby, the air-quality forecast, domestic electricity use, and Postcode Trust grants made to recipients nearby. Goals suggested from that data are taken on at three levels:

- **Postcode-wide goals**, for everyone in the area.
- **Interest-group goals**, for neighbours who chose the same interest when joining.
- **Household goals**, for one household.

A postcode or group goal starts as a suggestion and goes ahead only when enough members pledge to it ("I'll do it if five neighbours do"). Households report actions they have completed, and neighbours can react to them. Each completed action earns its household points. A drawing of the locality shows every house getting greener as its household contributes, and the whole locality greening as goals unlock. The more of the street joins, the more goals reach their threshold, which is the brief's stretch goal.

## Who it is for

Neighbours who share a postcode. The poster names two player groups, and the demo uses one of each:

- a household, matching the poster's fastest-growing group of young families and professionals;
- a neighbour who joins through shared interests, such as heritage and green spaces, matching the poster's biggest active group, "later in life and motivated by local community and historical preservation charities".

## Interest groups

Chosen by each user when joining; a user can join several.

- Gardening and growing
- Walking and cycling
- Wildlife and tidy-ups
- Energy at home
- Heritage and green spaces
- Repair and reuse
- Food and composting
- Families and kids

## What sets it apart

Not yet checked against existing projects. Candidates to check include conditional pledge platforms such as mySociety's PledgeBank and neighbourhood apps such as Nextdoor. The intended difference is goals suggested from the area's own environmental data, pledged conditionally, and shown as a locality that greens with participation.

## Decisions

- Goals exist at three levels, postcode-wide, interest group and household, so people can act alone, with like-minded neighbours or with the whole area. 3 October 2026.
- Postcode and group goals use a conditional pledge threshold, and households pick their own goals from suggestions or write their own; acting together is the brief's ask, and a threshold removes the reason not to act alone. 3 October 2026.
- Users choose interests when joining, from eight premade groups (listed above), and are placed in the matching groups; groups form around what neighbours already care about. 3 October 2026.
- Houses in the locality visual are anonymous, not tied to real addresses; the exact visual is still to be designed. 3 October 2026.
- Each completed action gives its household points, which colour its house; the locality greens by total points, with goals as milestones; this shows progress continuously rather than only when goals complete. 3 October 2026.
- Households self-report completed actions, with an optional photo, and neighbours can react; trust-based reporting keeps friction low, and no data source could verify the actions. 3 October 2026.
- Goal suggestions are LLM-generated from the local data, including nearby grants. In production they would run on a locally hosted model or a sustainable provider; for the demo they are pre-generated and shipped as data, so the demo needs no live model call or API key. 3 October 2026.
- No database: premade users and their activity are seeded data, state lives in the browser, and a "View as" switcher changes the current user during the demo; this avoids backend work in the time available. 3 October 2026.
- The demo is built around EH8, Edinburgh, where the electricity and grant data were tested on 2 October 2026. The carbon-intensity panel is left out, because South Scotland's tested forecast was flat at zero. 3 October 2026.
- The postcode page shows green space nearby, the air-quality forecast, electricity per meter and "Funded near you" grant cards. Grants also feed the goal suggestions. Recipient postcodes are labelled as recipient addresses, not where money was spent. 3 October 2026.
- EH8 data ships as a small JSON snapshot (electricity rows, grants, green space); Open-Meteo is called live with a saved response as fallback; the 80 MB electricity CSV is never shipped. The demo then works offline. 3 October 2026.
- The locality visual is built in 2D (SVG) first and upgraded to three.js once the core loop works, with 2D kept as fallback. 3 October 2026.
- The frontend uses Tailwind CSS v4 and shadcn/ui, the repository's styling stack for any framework that supports them; it gives ready-made components and keeps the design consistent. 3 October 2026.
- If time runs short, cut the 3D visual first, then neighbour reactions. The three goal levels, pledges, points, data panels and the 2D visual are kept. 3 October 2026.

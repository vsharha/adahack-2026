# Postcode Lottery: status

The record of what is built for the Postcode Lottery project. Pitch claims come from here, so every line must be true of the current code.

## Features

Each feature has a build state: works, mocked, planned or cut.

- A working feature records the verified flow, the result, the date, the commit, and a test or recording link when there is one.
- A mocked feature says which parts are mocked and how to reproduce the demo.
- A cut feature keeps its line with the reason, so it is not proposed again.

| Feature                                                                                                                                       | State  | Verification or reason                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Demo seed data: 12 anonymous households, 14 users, the 8 interest groups, goals, pledges and completed actions (`apps/postcode/data/seed.ts`) | Mocked | All seeded. The goals and household suggestions are hand-written placeholders until the pre-generated suggestions from the EH8 data replace them. The EH8 area snapshot is not built yet; its shape is `AreaSnapshot` in `apps/postcode/lib/types.ts`.                                                                                   |
| Conditional pledges on postcode and group goals                                                                                               | Works  | Checked on the dev server in Chrome on 3 October 2026, commit 5f8d84a. As Priya, pledged to the school-run goal at 4 of 5: it showed "Going ahead: 5 neighbours pledged" and a second street tree appeared. Withdrawing is offered before the threshold.                                                                                 |
| Marking a goal as done, and household points                                                                                                  | Works  | Checked on the dev server in Chrome on 3 October 2026, commit 5f8d84a. Priya marked the school-run goal done: the street total went from 46 to 61 points and House 1 gained window boxes on every floor and ivy. Each household can mark a goal done once.                                                                               |
| 2D street drawing that greens with points                                                                                                     | Works  | Checked on the dev server in Chrome on 3 October 2026, commit 5f8d84a. 12 anonymous tenement fronts; each house gains window boxes, ivy and a front tree at 1, 15, 25 and 40 points; each shared goal going ahead plants a street tree, and the verge greens with the street total. Scrolls sideways at phone width (checked at 390 px). |
| "View as" switcher                                                                                                                            | Works  | Checked on the dev server in Chrome on 3 October 2026, commit 5f8d84a. Switching to Margaret moved the "You" marker to House 7 and showed the heritage group's goal.                                                                                                                                                                     |
| Neighbour reactions on completed actions                                                                                                      | Works  | Checked on the dev server in Chrome on 3 October 2026, commit 5f8d84a. As Margaret, reacted 💚 to Priya's action and the count showed 1. Users cannot react to their own actions. Photos are not built.                                                                                                                                  |
| Adopting household goal suggestions                                                                                                           | Works  | Checked on the dev server in Chrome on 3 October 2026, commit 5f8d84a. As Priya, "Add to our goals" on the line-drying suggestion added it as a household goal with "Mark as done", and removed it from the suggestions. Writing a goal of one's own is not built.                                                                       |
| Demo state in the browser                                                                                                                     | Works  | Checked on the dev server in Chrome on 3 October 2026, commit 5f8d84a. A pledge survived a page reload; "Reset demo" restored the seed (46 points, Priya).                                                                                                                                                                               |

## Impact evidence

Each figure records its basis: a measured result with the method, or an estimate with its inputs, sources, calculation and limits. External facts include their source and retrieval date.

| Claim | Basis |
| ----- | ----- |

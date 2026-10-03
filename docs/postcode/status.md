# Postcode Lottery: status

The record of what is built for the Postcode Lottery project. Pitch claims come from here, so every line must be true of the current code.

## Features

Each feature has a build state: works, mocked, planned or cut.

- A working feature records the verified flow, the result, the date, the commit, and a test or recording link when there is one.
- A mocked feature says which parts are mocked and how to reproduce the demo.
- A cut feature keeps its line with the reason, so it is not proposed again.

| Feature                                                                                                                                       | State  | Verification or reason                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Demo seed data: 12 anonymous households, 14 users, the 8 interest groups, goals, pledges and completed actions (`apps/postcode/data/seed.ts`) | Mocked | All seeded. The goals and household suggestions are hand-written placeholders until the pre-generated suggestions from the EH8 data replace them. The EH8 area snapshot is not built yet; its shape is `AreaSnapshot` in `apps/postcode/lib/types.ts`. |

## Impact evidence

Each figure records its basis: a measured result with the method, or an estimate with its inputs, sources, calculation and limits. External facts include their source and retrieval date.

| Claim | Basis |
| ----- | ----- |

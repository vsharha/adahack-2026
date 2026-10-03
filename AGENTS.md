# AdaHack 2026

## Event

- **Event:** AdaHack 2026, a 12-hour hackathon run by Edinburgh Hoppers. Theme: sustainability.
- **Date:** Saturday 3 October 2026. Coding begins at 09:45.
- **Deadline:** submissions close at 18:15.
- **Challenge:** not yet announced. It is published at the 09:15 opening and recorded verbatim in `docs/brief/challenge.md`.
- **Judging:** prizes per challenge. The format and criteria are not yet known; record them in `docs/brief/challenge.md` once announced.

## Repository

A pnpm monorepo. The Next.js app is in `apps/web`. Run the commands below from the repository root.

- `pnpm dev` starts the dev server.
- `pnpm build` builds the app and type-checks it.

## Docs

- `docs/brief/description.md`: the event page, verbatim.
- `docs/brief/challenge.md`: the chosen challenge brief and judging criteria, verbatim.
- `docs/reference/product.md`: what the product is, who it is for, and what sets it apart.
- `docs/reference/status.md`: what is built, mocked, planned or cut.
- `docs/pitch/`: internal pitch notes. `docs/pitch/judges/` holds only what judges see.

Update `docs/reference/status.md` whenever a feature is built, mocked or cut, or its verification or impact evidence changes. Record how a working feature was verified: the flow, the result, the date and the commit. Changes to code or demo data mean re-checking the claims they affect. A cut feature keeps its line with the reason.

## Dev server

- Before starting the dev server, check whether one is already running for this project (for example `ps aux | grep "[n]ext dev"`, or probe port 3000) and reuse it.
- When a change needs a fresh process (config, dependencies, env), stop the running dev server and start a new one. Never leave several instances running.

## Committing

- Pull before committing.
- Commit after each working change, as the user, never as the agent.
- Subject line only, short, describing what was done. Match the style of previous commits.
- Before committing code changes, run `pnpm build` and fix any failure.
- Run `git status` before describing the repository's state. Teammates push to the same branch, so earlier output goes stale.

## Secrets

- Never print or disclose secret values. To check configuration, verify whether a key exists without revealing its value.
- Never open `.env` files. Only `.env.example` may be read.

## Code quality

- Avoid type, lint and framework suppression directives. If one is unavoidable, explain why.
- Comments describe the code as it stands. Add one only for non-obvious rationale, constraints or gotchas.

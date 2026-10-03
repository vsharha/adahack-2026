# Postcode Lottery project

This folder is the Postcode Lottery project: a Next.js app. Its docs are in `docs/postcode/`, and the brief is `docs/postcode/brief.md`.

- Work in `apps/postcode/` and `docs/postcode/`. Another pair owns `apps/compsoc/` and `docs/compsoc/`; change their files only when the user asks.
- Changes to shared files (root `package.json`, `pnpm-workspace.yaml`, `eslint.config.mjs`, `.gitignore`, `AGENTS.md`, `docs/event/`) need the user's approval first. Adding a dependency to this app with `pnpm --filter postcode add` is not such a change, though it updates the shared `pnpm-lock.yaml`.
- From the repository root: `pnpm dev:postcode` starts the dev server on port 3000, and `pnpm build:postcode` builds the app.
- Update `docs/postcode/status.md`, and the decisions in `docs/postcode/product.md`, as described in the root `AGENTS.md`.

# Postcode Lottery project

This folder is the Postcode Lottery project: a Next.js app. Its docs are in `docs/postcode/`, and the brief is `docs/postcode/brief.md`.

- Work in `apps/postcode/` and `docs/postcode/`. Another pair owns `apps/compsoc/` and `docs/compsoc/`; change their files only when the user asks.
- Changes to shared files (root `package.json`, `pnpm-workspace.yaml`, `eslint.config.mjs`, `.gitignore`, `AGENTS.md`, `docs/event/`) need the user's approval first. Adding a dependency to this app with `pnpm --filter postcode add` is not such a change, though it updates the shared `pnpm-lock.yaml`.
- From the repository root: `pnpm dev:postcode` starts the dev server on port 3000, and `pnpm build:postcode` builds the app.
- Update `docs/postcode/status.md`, and the decisions in `docs/postcode/product.md`, as described in the root `AGENTS.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

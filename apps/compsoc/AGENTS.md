# CompSoc project

This folder is the CompSoc project: a Python backend in `backend/` and a JavaScript frontend in `frontend/`. Its docs are in `docs/compsoc/`, and the brief is `docs/compsoc/brief.md`.

- Work in `apps/compsoc/` and `docs/compsoc/`. Another pair owns `apps/postcode/` and `docs/postcode/`; change their files only when the user asks.
- Changes to shared files (root `package.json`, `pnpm-workspace.yaml`, `eslint.config.mjs`, `.gitignore`, the root `AGENTS.md`, `docs/event/`) need the user's approval first.
- Update `docs/compsoc/status.md`, and the decisions in `docs/compsoc/product.md`, as described in the root `AGENTS.md`.

## Backend

A Python package managed with [uv](https://docs.astral.sh/uv/). It holds no code yet.

- `backend/src/compsoc/`: the package.
- `backend/tests/`: tests, once there are any.
- Python 3.12, pinned in `backend/.python-version`; `pyproject.toml` allows 3.12 or newer. uv installs it if missing.

Run these inside `apps/compsoc/backend/`:

- `uv sync` creates `.venv/` and installs the locked dependencies.
- `uv add <package>` adds a dependency; `uv add --dev <package>` adds a development tool. Commit `pyproject.toml` and `uv.lock` together.
- `uv run <command>` runs a command in the project environment, for example `uv run python script.py`.

From the repository root, `pnpm check:compsoc` runs Ruff linting, the Ruff format check and Pyright, and `pnpm fix:compsoc` applies Ruff fixes and formatting. The root `pnpm verify` and `pnpm fix` include them.

## Frontend

`frontend/` is empty. The framework, and how the frontend gets results from the backend, are not chosen yet. Ask the user before scaffolding it. Setting it up needs these shared changes, with the user's approval:

- `pnpm-workspace.yaml` matches only `apps/*`, so add `apps/compsoc/frontend` for pnpm to see the frontend's `package.json`.
- Add `dev:compsoc` and `build:compsoc` scripts to the root `package.json`, and make sure `pnpm verify` type-checks and lints the frontend. The root ESLint config is Next.js-specific; a frontend on another framework needs its own lint setup.
- Record the frontend's commands here.

## Data

Keep downloaded data out of Git unless the demo needs it offline, and then only small snapshots, as the root `AGENTS.md` says.

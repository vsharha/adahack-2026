# CompSoc project

This folder is the CompSoc project: a Python backend in `backend/` and a JavaScript frontend in `frontend/`. Its docs are in `docs/compsoc/`, and the brief is `docs/compsoc/brief.md`.

- Work in `apps/compsoc/` and `docs/compsoc/`. Another pair owns `apps/postcode/` and `docs/postcode/`; change their files only when the user asks.
- Changes to shared files (root `package.json`, `pnpm-workspace.yaml`, `eslint.config.mjs`, `.gitignore`, the root `AGENTS.md`, `docs/event/`) need the user's approval first.
- Update `docs/compsoc/status.md`, and the decisions in `docs/compsoc/product.md`, as described in the root `AGENTS.md`.

## Backend

A Python package managed with [uv](https://docs.astral.sh/uv/). It contains the PeatPulse data pipeline, model and tests.

- `backend/src/compsoc/`: the package.
- `backend/tests/`: tests, once there are any.
- Python 3.12, pinned in `backend/.python-version`; `pyproject.toml` allows 3.12 or newer. uv installs it if missing.

Run these inside `apps/compsoc/backend/`:

- `uv sync` creates `.venv/` and installs the locked dependencies.
- `uv add <package>` adds a dependency; `uv add --dev <package>` adds a development tool. Commit `pyproject.toml` and `uv.lock` together.
- `uv run <command>` runs a command in the project environment, for example `uv run python script.py`.

From the repository root, `pnpm check:compsoc` runs Ruff linting, the Ruff format check and Pyright, and `pnpm verify:compsoc` adds ESLint and Prettier on this project's folders, and `pnpm fix:compsoc` applies its Ruff, ESLint and Prettier fixes. The root `pnpm verify` and `pnpm fix` include them.

## Frontend

`frontend/` contains the standalone PeatPulse website. It uses semantic HTML and local CSS. The landing page has two choices: “Read the story” opens a work-in-progress page; “Read the report” opens the technical report. Keep this website separate from `map-preview/`.

Run from the repository root:

```sh
uv --directory apps/compsoc/backend run python -m http.server 4317 --bind 127.0.0.1 --directory ../frontend
pnpm exec prettier --check apps/compsoc/frontend
```

Open <http://127.0.0.1:4317>. There is no framework build step or frontend dependency install for this slice. Use the frontend-design skill and verify changes in a live browser. The cover is an illustration; do not present it as scientific imagery. Source and generation details are in `frontend/assets/cover-source.md`.

Any future framework integration that changes root workspace, scripts or ESLint config still requires the user's approval. Record the selected framework and updated commands here when that integration is approved.

## Data

Keep downloaded data out of Git unless the demo needs it offline, and then only small snapshots, as the root `AGENTS.md` says.

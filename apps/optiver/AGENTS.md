# Optiver project

This folder is the Optiver project: a Python backend in `backend/` and an empty `frontend/` reserved for later. Its docs are in `docs/optiver/`, and the brief is `docs/optiver/brief.md`.

- Work in `apps/optiver/` and `docs/optiver/`. Postcode Lottery and CompSoc are independent projects; change their files only when the user asks.
- Shared-file changes need approval as described in the root `AGENTS.md`.
- Update `docs/optiver/status.md` and the decisions in `docs/optiver/product.md` as described in the root `AGENTS.md`.
- Brainstorm and record the product direction in the docs with the user before building product features.

## Backend

A Python package managed with uv. Python 3.12 is pinned in `backend/.python-version`; `pyproject.toml` allows 3.12 or newer. The package implements the offline portfolio CLI; see `backend/README.md` for usage and modelling assumptions.

- `backend/src/optiver/`: the package.
- `backend/tests/`: tests, once there are any.

Run these inside `apps/optiver/backend/`:

- `uv sync` creates `.venv/` and installs the locked dependencies.
- `uv add <package>` adds a dependency; `uv add --dev <package>` adds a development tool. Commit `pyproject.toml` and `uv.lock` together.
- `uv run <command>` runs a command in the project environment.

From the repository root, `pnpm check:optiver` runs Ruff linting, the Ruff format check and Pyright, and `pnpm verify:optiver` adds ESLint and Prettier on this project's folders, and `pnpm fix:optiver` applies its Ruff, ESLint and Prettier fixes. The root `pnpm verify` and `pnpm fix` include them.

Run `uv --directory apps/optiver/backend run python -m optiver` from the repository root. Run tests with `uv --directory apps/optiver/backend run python -m unittest discover -s tests -v`. There is no HTTP server or API.

## Frontend

`frontend/` is empty except for `.gitkeep`. The framework and connection to the backend are undecided. Ask the user before scaffolding it. A future JavaScript frontend needs approval to add `apps/optiver/frontend` to `pnpm-workspace.yaml`, add root commands and configure suitable linting and type checks.

## Data

The challenge workbook has been downloaded temporarily and inspected for research; see `docs/optiver/dataset-research.md`. The CREDITS sheet is committed as `backend/data/credits.csv` for the offline demo, with provenance in `backend/data/README.md`. The supplied brief links to the challenge dataset. Keep large downloads out of Git; commit only small snapshots needed for an offline demo.

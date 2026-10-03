# CompSoc project

This folder is the CompSoc project: a Python package managed with [uv](https://docs.astral.sh/uv/). Its docs are in `docs/compsoc/`, and the brief is `docs/compsoc/brief.md`.

- Work only in `apps/compsoc/` and `docs/compsoc/`. Another pair owns `apps/postcode/` and `docs/postcode/`; never change their files.
- Changes to shared files (root `package.json`, `pnpm-workspace.yaml`, `eslint.config.mjs`, `.gitignore`, the root `AGENTS.md`, `docs/event/`) need the user's approval first.
- Update `docs/compsoc/status.md` as described in the root `AGENTS.md`.

## Layout

- `src/compsoc/`: the package. It holds no code yet.
- `tests/`: tests, once there are any.
- Python 3.12, pinned in `.python-version`; `pyproject.toml` allows 3.12 or newer. uv installs it if missing.

## Commands

Run these inside `apps/compsoc/`:

- `uv sync` creates `.venv/` and installs the locked dependencies.
- `uv add <package>` adds a dependency; `uv add --dev <package>` adds a development tool. Commit `pyproject.toml` and `uv.lock` together.
- `uv run <command>` runs a command in the project environment, for example `uv run python script.py`.

From the repository root, `pnpm check:compsoc` runs Ruff linting, the Ruff format check and Pyright, and `pnpm fix:compsoc` applies Ruff fixes and formatting. The root `pnpm verify` and `pnpm fix` include them.

## Data

Keep downloaded data out of Git unless the demo needs it offline, and then only small snapshots, as the root `AGENTS.md` says.

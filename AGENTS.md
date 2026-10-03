# AdaHack 2026

## Event

- **Event:** AdaHack 2026, a 12-hour hackathon run by Edinburgh Hoppers. Theme: sustainability.
- **Date:** Saturday 3 October 2026. Coding begins at 09:45.
- **Deadline:** submissions close at 18:15.
- **Challenges:** the repository contains Postcode Lottery, CompSoc and Optiver. One teammate works on Postcode Lottery; the user works on Optiver. Their briefs are recorded verbatim in `docs/postcode/brief.md`, `docs/compsoc/brief.md` and `docs/optiver/brief.md`. All announced briefs are PDFs in `reference/`.
- **Judging:** prizes per challenge. The criteria are in `docs/event/judging.md`.

## Projects

The repository holds three independent projects. Postcode Lottery is owned by the teammate, and Optiver by the user; CompSoc remains a separate project.

| Project          | Code             | Docs             |
| ---------------- | ---------------- | ---------------- |
| Postcode Lottery | `apps/postcode/` | `docs/postcode/` |
| CompSoc          | `apps/compsoc/`  | `docs/compsoc/`  |
| Optiver          | `apps/optiver/`  | `docs/optiver/`  |

- Before changing anything, establish which project the user is working on. If they started the session inside a project folder, it is that one; otherwise infer it from the request, and ask if it is unclear.
- Stay on that project. Change other projects' files only when the user asks; otherwise, such as when a check fails there, tell the user instead.
- Shared files need the user's approval before changing: root `package.json`, `pnpm-workspace.yaml`, `eslint.config.mjs`, `.gitignore`, `.prettierignore`, the `AGENTS.md` and `CLAUDE.md` files outside the project, `docs/event/` and `reference/`. The shared `pnpm-lock.yaml` is the exception: it changes whenever a project adds a dependency.
- Each project folder has its own `AGENTS.md` with its commands. Read it before working there.

## Repository

A pnpm monorepo holding the Postcode Lottery Next.js app and the CompSoc and Optiver projects, whose backends are Python. Run the commands below from the repository root.

- `pnpm dev:postcode` starts the Postcode Lottery dev server on port 3000.
- `pnpm build:postcode` builds the Postcode Lottery app.
- `pnpm fix` applies ESLint fixes and Prettier formatting, then Ruff fixes and formatting to the CompSoc and Optiver backends.
- `pnpm verify` type-checks the Postcode Lottery app, runs Ruff and Pyright on the CompSoc and Optiver backends, then checks linting and formatting. ESLint warnings fail it.

Both commands need [uv](https://docs.astral.sh/uv/) installed, because they cover both Python backends. Project-specific commands are in `apps/compsoc/AGENTS.md` and `apps/optiver/AGENTS.md`. Optiver starts with Python only and an empty frontend; brainstorm and record its product direction before building features.

## Tooling and design

- Use uv for all Python: running, dependencies and environments. Never use pip, venv or Poetry directly.
- Use pnpm for all JavaScript. Never use npm, npx, Yarn or Bun; run one-off tools with `pnpm dlx`.
- Style a frontend with Tailwind CSS v4 and shadcn/ui when its framework supports them. Add shadcn components with its CLI, run inside the app's folder, so they are copied into the app rather than installed as a package.
- Use the `frontend-design` skill for all frontend work. Load it before building or changing UI.
- Keep the design consistent. Reuse the app's existing components, colours, spacing and type before adding new ones.
- Check frontend changes on the live dev server with Playwright or a browser before reporting them done: look at the page, use the changed flow, and read the console for errors.
- Agent skills live in `.agents/skills/`, one folder each; `.claude/skills` is a symlink to it, so Claude Code sees the same skills. Add or edit skills only in `.agents/skills/`.

## Docs

- `docs/event/description.md`: the event page, verbatim.
- `docs/event/judging.md`: the event's judging criteria, verbatim.

Each project's docs folder, `docs/postcode/`, `docs/compsoc/` or `docs/optiver/`, holds:

- `brief.md`: the challenge brief and any challenge-specific criteria, verbatim.
- `product.md`: what the product is, who it is for, what sets it apart, and the decisions behind it.
- `status.md`: what is built, mocked, planned or cut.
- `pitch/`: internal pitch notes. `pitch/judges/` holds only what judges see.

Update the project's `status.md` whenever a feature is built, mocked or cut, or its verification or impact evidence changes. Record how a working feature was verified: the flow, the result, the date and the commit. Changes to code or demo data mean re-checking the claims they affect. A cut feature keeps its line with the reason.

When the user makes or changes a decision about the product or how it is built, record it in the project's `product.md` under "Decisions" without being asked. Decisions include the user it serves, a data source, a method or model, the stack, how parts connect, and the demo scope. Write one line each: the decision, the reason, and the date. When a decision changes, update its line in place so the section always describes the current plan. Record only what the user decided or confirmed, including decisions they report from teammates; a suggestion they have not accepted is not a decision.

## Dev server

- Before starting a dev server, check whether one is already running for the same project (for example `ps aux | grep "[n]ext dev"`, or probe its port) and reuse it. Leave the other project's dev server alone.
- When a change needs a fresh process (config, dependencies, env), stop the running dev server and start a new one. Never leave several instances running.

## Committing and pushing

- Before starting each task, run `git pull --rebase --autostash`, so files you read reflect teammates' latest pushes.
- Commit automatically after each working change, without asking first. Commit as the user, never as the agent.
- Subject line only, short, describing what was done. Match the style of previous commits.
- Before committing, run `pnpm fix`, then `pnpm verify`, and fix any failure. Skip both when they have already run since the last change to files other than documentation.
- Stage only the files you changed, by path. Never `git add -A` or `git add .`.
- Push once per task, when handing the finished task back to the user, without asking first. Run `git pull --rebase --autostash` so history stays linear without merge commits, then `pnpm verify` so the task's commits are checked on top of teammates' work, then `git push`. If the pull brought in changes to `pnpm-lock.yaml`, `apps/compsoc/backend/uv.lock`, `apps/optiver/backend/uv.lock`, `package.json` or `pyproject.toml` files, or root config, run `pnpm install` and sync both Python projects with `uv sync --directory apps/compsoc/backend` and `uv sync --directory apps/optiver/backend` before `pnpm verify`.
- Push straight after any commit that changes `pnpm-lock.yaml`, `uv.lock`, a `package.json` or a `pyproject.toml`, following the same steps, because these files conflict easily between teammates.
- If the push is rejected because the remote moved, pull and push again. If the pull stops on a conflict, resolve it as described under "Protecting shared work", or stop and ask.
- Run `git status` before describing the repository's state. Teammates push to the same branch, so earlier output goes stale.

## Protecting shared work

- Never force push. Never rewrite pushed commits with `git commit --amend`, `rebase` or `reset`.
- Resolve pull conflicts by keeping the intent of both sides. Never take one side wholesale (`--ours` or `--theirs`) on files you didn't write. If the right resolution is unclear, stop and ask.
- Ask before `git reset --hard`, `git checkout -- <path>`, `git restore`, `git clean` or `git stash drop`.
- Don't commit build output, screenshots, or downloaded data over a few MB. Commit data only when the demo needs it offline.
- Never pass `--no-verify`, disable a lint rule, or delete failing code to get past a check.

## Dependencies and config

- Add dependencies to the Postcode Lottery app with `pnpm --filter postcode add`, and commit `pnpm-lock.yaml` in the same commit. Add them to the CompSoc or Optiver backend with `uv add` run inside `apps/compsoc/backend/` or `apps/optiver/backend/`, respectively, and commit `pyproject.toml` and `uv.lock` together. Never delete a lockfile to resolve a conflict: run `pnpm install` or `uv lock` and commit the result.
- Ask before upgrading a major version or changing `eslint.config.mjs`, any `tsconfig.json` or `pnpm-workspace.yaml`. TypeScript is pinned to 6.0 and ESLint to 9 because `eslint-config-next` 16 supports nothing newer.

## Secrets

- Never print or disclose secret values. To check configuration, verify whether a key exists without revealing its value.
- Never open `.env` files. Only `.env.example` may be read.

## Code quality

- Avoid type, lint and framework suppression directives. If one is unavoidable, explain why.
- Comments describe the code as it stands. Add one only for non-obvious rationale, constraints or gotchas.

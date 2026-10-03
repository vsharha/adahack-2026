# Optiver dashboard

Next.js dashboard for the [Optiver carbon portfolio demo](../README.md). It displays a saved Python CLI run from `src/data/` and serves matching downloads from `public/data/`. It has no live backend connection.

From the repository root:

```bash
pnpm --dir apps/optiver/frontend install
pnpm --dir apps/optiver/frontend dev
```

Open <http://localhost:3000>. To generate a fresh, audited dataset and PDF before starting the server, run `bash apps/optiver/start.sh` instead. To update only the saved assets, run `bash apps/optiver/refresh-demo.sh` and restart the dev server if it is already running.

## Checks

```bash
pnpm --dir apps/optiver/frontend check
pnpm --dir apps/optiver/frontend build
pnpm verify:optiver
```

The dashboard can switch between three shared-risk assumptions and filter holdings without changing the underlying portfolio. Downloads are snapshots from the latest data refresh, including a PDF summary at the representative ρ = 0.3 setting.

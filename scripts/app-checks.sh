#!/usr/bin/env bash
# Verifies or fixes one app: ESLint and Prettier on apps/<app> and docs/<app>,
# the type check of any pnpm workspace package under apps/<app>, and Ruff and
# Pyright when the app has a Python backend. Used by `pnpm verify:<app>`,
# `pnpm fix:<app>` and the pre-push hook.
set -euo pipefail

usage="usage: scripts/app-checks.sh verify|fix <app>"
mode="${1:?$usage}"
app="${2:?$usage}"
cd "$(dirname "$0")/.."
[ -d "apps/$app" ] || { echo "No app at apps/$app" >&2; exit 2; }

paths=("apps/$app" "docs/$app")
prettier_flags=(--ignore-path .gitignore --ignore-path .prettierignore --no-error-on-unmatched-pattern)
backend="apps/$app/backend"
has_python=false
[ -f "$backend/pyproject.toml" ] && has_python=true

case "$mode" in
  verify)
    pnpm --filter "./apps/$app/**" --if-present run check
    if $has_python; then
      uv --directory "$backend" run ruff check
      uv --directory "$backend" run ruff format --check
      uv --directory "$backend" run pyright
    fi
    pnpm exec eslint --cache --max-warnings 0 --no-error-on-unmatched-pattern "${paths[@]}"
    pnpm exec prettier --check "${prettier_flags[@]}" "${paths[@]}"
    ;;
  fix)
    if $has_python; then
      uv --directory "$backend" run ruff check --fix
      uv --directory "$backend" run ruff format
    fi
    pnpm exec eslint --cache --fix --no-error-on-unmatched-pattern "${paths[@]}"
    pnpm exec prettier --write "${prettier_flags[@]}" "${paths[@]}"
    ;;
  *)
    echo "$usage" >&2
    exit 2
    ;;
esac

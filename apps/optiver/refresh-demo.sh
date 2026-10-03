#!/usr/bin/env bash
# Regenerate and audit every saved asset before updating the dashboard bundle.
set -euo pipefail
OPTIVER_APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPTIVER_REPORT_DIR="$(mktemp -d /tmp/optiver-refresh.XXXXXX)/report"
uv --directory "$OPTIVER_APP_DIR/backend" run python -m optiver \
  --frontier --csv-summary --one-pager --output "$OPTIVER_REPORT_DIR"
uv --directory "$OPTIVER_APP_DIR/backend" run python -m optiver.audit "$OPTIVER_REPORT_DIR"
uv --directory "$OPTIVER_APP_DIR/backend" run --with reportlab python \
  scripts/render_one_pager.py "$OPTIVER_REPORT_DIR/one-pager.md" \
  "$OPTIVER_REPORT_DIR/optiver-executive-summary.pdf"
for OPTIVER_DATA_DIR in "$OPTIVER_APP_DIR/frontend/src/data" "$OPTIVER_APP_DIR/frontend/data" "$OPTIVER_APP_DIR/frontend/public/data"; do
  mkdir -p "$OPTIVER_DATA_DIR"
  for OPTIVER_ASSET in report.json portfolio.csv comparison.csv one-pager.md frontier.json; do
    cp "$OPTIVER_REPORT_DIR/$OPTIVER_ASSET" "$OPTIVER_DATA_DIR/$OPTIVER_ASSET"
  done
done
cp "$OPTIVER_REPORT_DIR/optiver-executive-summary.pdf" "$OPTIVER_APP_DIR/frontend/public/data/"
echo "Updated saved demo from $OPTIVER_REPORT_DIR"

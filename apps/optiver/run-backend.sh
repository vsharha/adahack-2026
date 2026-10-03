#!/bin/bash
# Quick backend test - generate report and show in terminal

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"

echo "📊 Optiver Backend - Quick Run"
echo "=============================="
echo ""

uv --directory "$BACKEND_DIR" run python -m optiver --sensitivity

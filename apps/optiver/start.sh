#!/bin/bash
# Optiver quick start - launches backend report + frontend dashboard

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
DATA_DIR="$FRONTEND_DIR/data"

echo "🚀 Optiver Quick Start"
echo "====================="
echo ""

# Step 1: Generate fresh report from backend
echo "📊 Generating portfolio report..."
REPORT_DIR="/tmp/optiver-$(date +%Y%m%d-%H%M%S)"
uv --directory "$BACKEND_DIR" run python -m optiver --output "$REPORT_DIR" --sensitivity

# Step 2: Copy to frontend data folder
echo "📁 Copying report to frontend..."
mkdir -p "$DATA_DIR"
cp "$REPORT_DIR/report.json" "$DATA_DIR/"
cp "$REPORT_DIR/portfolio.csv" "$DATA_DIR/" 2>/dev/null || true

echo "✅ Report generated: $DATA_DIR/report.json"
echo ""

# Step 3: Start frontend dev server
echo "🌐 Starting frontend dev server..."
echo "   Open http://localhost:3000 in your browser"
echo ""
echo "Press Ctrl+C to stop"
echo ""

cd "$FRONTEND_DIR"
pnpm dev

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

# Check dependencies
echo "🔍 Checking dependencies..."
if ! command -v uv &> /dev/null; then
    echo "❌ uv not found. Install from https://docs.astral.sh/uv/"
    exit 1
fi
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm not found. Install with: npm install -g pnpm"
    exit 1
fi
echo "✅ Dependencies OK"
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
cp "$REPORT_DIR/report.md" "$DATA_DIR/" 2>/dev/null || true
echo "✅ Report generated: $DATA_DIR/report.json"
echo ""

# Step 3: Install frontend deps if needed
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd "$FRONTEND_DIR" && pnpm install
    echo ""
fi

# Step 4: Start frontend dev server
echo "🌐 Starting frontend dev server..."
echo ""
echo "   ┌─────────────────────────────────────┐"
echo "   │  📍 Open: http://localhost:3000     │"
echo "   │  📊 Data: $DATA_DIR/report.json     │"
echo "   │  💡 Tip: Press Ctrl+C to stop       │"
echo "   └─────────────────────────────────────┘"
echo ""

cd "$FRONTEND_DIR"
pnpm dev

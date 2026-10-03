#!/bin/bash
# Optiver quick start - launches backend report + frontend dashboard

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
DATA_DIR="$FRONTEND_DIR/src/data"

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
    echo "❌ pnpm not found. Install from https://pnpm.io/installation"
    exit 1
fi
echo "✅ Dependencies OK"
echo ""

# Refresh the single displayed report, downloads and PDF together.
bash "$SCRIPT_DIR/refresh-demo.sh"

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

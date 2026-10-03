#!/bin/bash
# Quick backend test - generate report and show in terminal

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"

echo "📊 Optiver Backend - Quick Run"
echo "=============================="
echo ""
echo "Running portfolio optimizer with default settings:"
echo "  • Target: 100,000 tCO₂e"
echo "  • Budget: $1,000,000"
echo "  • Reliability: 95%"
echo "  • Scenarios: 10,000 evaluation"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

uv --directory "$BACKEND_DIR" run python -m optiver --sensitivity

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Run complete!"
echo ""
echo "💡 Tips:"
echo "   • Add --output /tmp/report to export files"
echo "   • Run --help for all options"
echo "   • Open frontend at http://localhost:3000"

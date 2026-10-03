# Optiver Demo Checklist

**AdaHack 2026 • Optiver Challenge**

---

## ✅ Pre-Demo Setup (5 minutes)

```bash
# 1. Pull latest code
cd /home/bugra2426/Downloads/adahack-2026
git pull --rebase --autostash

# 2. Start the app
./apps/optiver/start.sh

# 3. Verify it's running
# Open http://localhost:3000 in Chrome

# 4. Test dark mode toggle
# Click theme button → select Dark → verify it changes

# 5. Test search in holdings table
# Type "China" → verify filtering works
```

---

## 🎯 Demo Flow (3 minutes)

### Opening (30 sec)
- [ ] Show homepage hero
- [ ] Point to key stats: Target 100K, Budget $1M, Reliability 95%
- [ ] Say: "What if I told you the cheapest portfolio fails 32% of the time?"

### Portfolio Comparison (45 sec)
- [ ] Scroll to comparison chart
- [ ] Point to 3 bars: nominal ($94K), expected ($115K), diversified ($182K)
- [ ] Say: "Spending 2× more buys 30 percentage points higher reliability"

### Interactive Demo (45 sec)
- [ ] Click correlation toggle: ρ=0 → ρ=0.3 → ρ=0.6
- [ ] Watch success rates update: 99.3% → 98.3% → 97.0%
- [ ] Say: "This slider changes correlation assumptions in real time"

### Holdings Table (30 sec)
- [ ] Scroll to holdings table
- [ ] Type "China" in search box
- [ ] Show 5 filtered results
- [ ] Click "Reset filters"
- [ ] Say: "Search, filter, and sort all 13 projects"

### Map & Risk (30 sec)
- [ ] Click Map tab (or scroll to map)
- [ ] Point to project locations
- [ ] Click a country button (e.g., Brazil)
- [ ] Say: "Geographic diversification reduces correlated failure risk"

### Close (30 sec)
- [ ] Scroll back to top
- [ ] Click "Download PDF" button
- [ ] Say: "All code is in this repo. Run `./apps/optiver/start.sh` to reproduce"
- [ ] "Thank you — happy to take questions!"

---

## 📋 Backup Plan (If Live Demo Fails)

```bash
# If app won't start:
# 1. Show pre-recorded Loom video (if available)
# 2. Show screenshots in README
# 3. Show CLI output:
./apps/optiver/run-backend.sh

# 4. Show report files:
cat /tmp/optiver-backup-20261003/report.md
cat /tmp/optiver-backup-20261003/portfolio.csv
```

---

## 🎤 Pitch Script Location

`docs/optiver/pitch/judges/script.md`

- Full 3-minute script with timing
- Key soundbites highlighted
- Q&A backup answers

---

## 📊 Key Numbers to Memorize

| Metric | Value |
|--------|-------|
| Target | 100,000 tCO₂e |
| Budget | $1,000,000 |
| Cheapest nominal cost | $94,277 |
| Cheapest nominal success | 68% |
| Diversified cost | $181,659 |
| Diversified success (ρ=0.6) | 97% |
| Number of projects | 13 |
| Largest exposure | VCS 60% |

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3000 in use | Kill process: `pkill -f "next dev"` |
| Data not loading | Run `./apps/optiver/start.sh` to regenerate |
| Dark mode not working | Hard refresh: Ctrl+Shift+R |
| Charts not rendering | Check browser console for errors |
| Search not filtering | Clear search box and try again |

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `apps/optiver/start.sh` | Quick launch script |
| `apps/optiver/run-backend.sh` | CLI-only test |
| `docs/optiver/pitch/judges/summary.md` | 1-page judge summary |
| `docs/optiver/pitch/judges/script.md` | 3-minute pitch script |
| `/tmp/optiver-backup-20261003/` | Backup export files |

---

## ✅ Post-Demo

- [ ] Thank judges
- [ ] Note any questions asked
- [ ] Update `status.md` if features requested
- [ ] Celebrate! 🎉

---

**Good luck! You've built something great.** 🚀

*Last updated: 2026-10-03*

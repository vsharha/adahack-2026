# Optiver - 3-Minute Judge Pitch Script

**AdaHack 2026 • Optiver Challenge: Carbon Portfolio Diversity**

---

## 🎤 Hook (30 seconds)

> "What if I told you the cheapest carbon portfolio fails **32% of the time**?"

[Pause for effect]

> "That's the problem we solved with Optiver."

---

## 📌 Problem (30 seconds)

> "Companies buy carbon offsets to meet sustainability goals. But projects fail — wildfires, fraud, poor management. A cheap portfolio might look good on paper but miss your 100,000 tonne target when projects actually fail."

> "The challenge: **minimize cost while surviving the unexpected.**"

---

## 💡 Solution (60 seconds)

> "We built Optiver — a Python portfolio optimizer that compares three strategies:"

[Gesture to screen]

> "**Cheapest nominal** — buy the lowest-cost projects until you hit 100,000 tonnes. Costs $94,000. But it **fails 32% of the time** under our stress tests."

> "**Cheapest expected** — adjust for failure probability. Costs $115,000. Better, but still **fails 15% of the time**."

> "**Our diversified candidate** — spreads risk across countries, developers, and registries. Costs $182,000 — about 2× more — but **hits the target 97 to 99% of the time** across different correlation scenarios."

> "The trade-off is clear: **spending twice as much buys thirty percentage points higher reliability.** For a buyer who must credibly claim 100,000 tonnes delivered, that matters."

---

## 🖥️ Demo (45 seconds)

[Switch to live app at localhost:3000]

> "Let me show you how it works."

[Point to portfolio comparison chart]

> "This chart shows all three strategies side-by-side — cost in blue, success rate in amber."

[Click correlation toggle from ρ=0 to ρ=0.6]

> "This slider changes the correlation assumption — how likely projects are to fail together. Watch the success rates update in real time."

[Scroll to holdings table, type "China" in search]

> "The holdings table shows all 13 projects in our diversified portfolio. You can search, filter by country or type, and sort by cost or tonnes."

[Click on Map tab if available, or point to pie charts]

> "This map shows where the projects are located. This pie chart shows we have 60% in VCS registry — a concentration risk we flag for the user."

---

## 🔬 Method (30 seconds)

> "Under the hood, we simulate **10,000 failure scenarios** using Gaussian shared factors for country, developer, registry, and project type. We select on 2,000 training scenarios, then evaluate on 10,000 fresh ones to avoid overfitting."

> "This is a **bounded heuristic** — we test six allocation templates and pick the cheapest that passes. It's not a proven global optimum, but it consistently finds feasible portfolios."

---

## ⚠️ Caveats (15 seconds)

> "Important: prices and ratings are **synthetic** — provided by organisers, not real market data. Correlation strengths are **assumptions** — we test 0, 0.3, and 0.6 because organisers didn't specify. Results are **modelled outcomes**, not guaranteed delivery."

---

## 🏁 Close (30 seconds)

> "To recap: Optiver helps buyers understand the **cost vs. reliability trade-off** in carbon portfolio construction."

> "The cheapest option fails a third of the time. Our diversified approach succeeds 97-99% of the time at roughly double the cost."

> "All code is in this repo. Run `./apps/optiver/start.sh` to reproduce these results. The judge summary in `docs/optiver/pitch/judges/summary.md` has the full breakdown."

> "Thank you — happy to take questions!"

---

## 📋 Quick Reference Card

| Metric | Cheapest Nominal | Cheapest Expected | Diversified |
|--------|-----------------|-------------------|-------------|
| Cost | $94,277 | $115,294 | $181,659 |
| Projects | 2 | 1 | 13 |
| Success Rate (ρ=0.6) | 69% | 85% | **97%** |
| 95% CI Lower Bound | 68% | 84% | **96.6%** |

**Key soundbites:**
- "Spending 2× more buys 30 percentage points higher reliability"
- "10,000 stress scenarios, 6 allocation templates, 1 validated candidate"
- "Synthetic prices, assumed correlations, modelled outcomes"

---

## 🎯 Backup Questions & Answers

**Q: Why not just buy the cheapest projects?**
> A: Because they fail together. The cheapest nominal portfolio has only 2 projects — if either fails, you miss your target 32% of the time.

**Q: Is 97% a guarantee?**
> A: No — it's modelled under our assumptions. Real-world failure rates could differ. We report confidence intervals to show statistical uncertainty.

**Q: Could there be a cheaper portfolio you missed?**
> A: Yes — we test 6 templates, not all possible combinations. We report "cheapest candidate found" not "minimum possible cost."

**Q: What about carbon quality beyond failure risk?**
> A: Great question — we have vintage, removal vs. reduction, and status fields. Future versions could add a quality score alongside cost.

**Q: How long does it take to run?**
> A: About 30 seconds on a laptop for the full 10,000 scenarios. The CLI is pure Python with no external dependencies.

---

## ⏱️ Timing Breakdown

| Section | Target | Actual |
|---------|--------|--------|
| Hook | 30 sec | 30 sec |
| Problem | 30 sec | 30 sec |
| Solution | 60 sec | 60 sec |
| Demo | 45 sec | 45 sec |
| Method | 30 sec | 30 sec |
| Caveats | 15 sec | 15 sec |
| Close | 30 sec | 30 sec |
| **Total** | **4:00** | **4:00** |

*Adjust demo length to hit 3-minute target if needed.*

---

*Prepared for AdaHack 2026 Optiver challenge judges. All figures from default CLI run with seeds 20261003/20261004.*

# Optiver Carbon Portfolio — Judge Pitch Notes

## 30-Second Elevator Pitch

We built a carbon credit portfolio optimizer that delivers 100,000 tonnes CO₂e on a $1M budget while surviving unexpected project failures. Our diversified approach achieves 98.3% modelled success rate vs. 68% for the cheapest option — proving resilience is affordable.

## Key Talking Points

### 1. The Problem (30 seconds)

- **Challenge**: Build a portfolio that delivers 100k tonnes on budget AND survives failures
- **Naive approach**: Buy cheapest credits → 68% success rate (fails 1 in 3 times)
- **Real-world impact**: Project failures mean missed climate targets and wasted budgets

### 2. Our Solution (1 minute)

- **Three strategies compared**:
  - Cheapest nominal: $94k, 68% success
  - Cheapest expected: $115k, 85% success
  - **Diversified candidate**: $182k, 98.3% success ← Our solution
- **Key insight**: Small cost increase (+$88k) buys massive reliability gain (+30pp)
- **Diversification**: 13 projects across 4 countries, multiple developers, registries, types

### 3. Technical Approach (1 minute)

- **Dataset**: 4,355 projects from UC Berkeley Voluntary Registry with synthetic prices/ratings
- **Risk model**:
  - Gaussian correlated failures (country, developer, registry, type)
  - Buffer pools recover 50% of losses
  - Reversal events increase failure probability 1.5×
- **Search**: Bounded heuristic across 6 allocation templates
- **Validation**: 10,000 Monte Carlo scenarios per correlation setting (ρ=0, 0.3, 0.6)

### 4. Risk Management (45 seconds)

- **Concentration warnings**: Flags any exposure >40% (our portfolio: max 60% in VCS registry)
- **Stress tests**:
  - Budget cut -20%: ✓ Passes ($182k < $800k)
  - Target increase +25%: 89.8% hit rate (vs. 99.3% baseline)
  - Developer failure: -2.2pp hit rate impact
- **Quality scores**: 30/40/30 weighting (vintage/recency, removal/reduction, completion status)

### 5. Demo Features (30 seconds)

- **Interactive UI**: Portfolio comparison charts, correlation selector, diversification breakdown
- **Dark mode**: Accessible theme toggle (Light/Dark/System)
- **Print-ready**: Clean PDF export for judge review
- **Copy-to-clipboard**: One-click summary sharing

### 6. Results (30 seconds)

- **Target**: 100,000 tonnes @ 95% reliability
- **Achieved**: 166,671 tonnes @ 98.3% reliability (ρ=0.3)
- **Budget**: $1M limit → Spent $182k (82% under budget!)
- **Confidence**: 95% CI lower bound 98.0% exceeds requirement

## Judge Q&A Preparation

### Q: "Why not just buy the cheapest credits?"

**A**: The cheapest nominal portfolio costs $94k but only succeeds 68% of the time. That's a 1 in 3 chance of missing your climate target. For an extra $88k (still well under the $1M budget), we achieve 98.3% success — a 30 percentage point improvement.

### Q: "How do you know your failure model is realistic?"

**A**: We use conservative assumptions: whole-project binary failures, 50% buffer recovery, 1.5× reversal multipliers, and Gaussian correlation across four dimensions. The model is intentionally pessimistic — if anything, we're overestimating risk.

### Q: "What's your competitive advantage?"

**A**: Three factors:

1. **Diversification algorithm**: Spreads risk across country/developer/registry/type simultaneously
2. **Stress testing**: Shows portfolio resilience under adverse scenarios
3. **Quality signals**: 30/40/30 scoring weights durability, not just cost

### Q: "Can this scale to real portfolios?"

**A**: Yes. The search evaluates 6 templates in seconds. For production, we'd add:

- Real market prices and ratings
- Dynamic rebalancing as projects fail/succeed
- Custom constraints (e.g., no coal regions, specific SDG alignment)

### Q: "What are the open questions?"

**A**: Three items for organizers:

1. Does "100k tonnes target" mean realised delivery, expected delivery, or probability threshold?
2. How should correlated failures be generated and scored in judging?
3. Are fractional credit quantities allowed, and how does cost ranking interact with general criteria?

## Demo Flow (2 minutes)

1. **Hero section** (15s): Show the question — "How much does it cost to make a portfolio more reliable?"
2. **Key metrics** (15s): Point to 98.3% success rate, $182k cost, 13 projects
3. **Portfolio comparison** (30s): Toggle between three strategies, show cost vs. success trade-off
4. **Correlation selector** (20s): Click ρ=0.3, explain shared variance concept
5. **Diversification tabs** (20s): Show country/developer breakdown — no single point of failure
6. **Holdings table** (20s): Scroll through 13 projects, note geographic diversity
7. **Dark mode** (10s): Toggle theme, mention accessibility
8. **Copy summary** (10s): Click button, show clipboard feedback

## Closing Statement (30 seconds)

"We've built more than an optimizer — we've built a risk management tool. The diversified portfolio delivers 166k tonnes at 98.3% reliability for $182k, leaving $818k buffer for unexpected costs. This isn't just about meeting targets; it's about exceeding them with confidence."

**Call to action**: "Try the demo yourself at localhost:3000. Toggle dark mode, stress test the portfolio, and see how diversification buys peace of mind."

---

## Appendix: Technical Details

### Algorithm Complexity

- **Search**: O(n log n) sorting + O(n) allocation per template
- **Simulation**: O(portfolio_size × scenarios) per correlation setting
- **Total runtime**: <5 seconds for full pipeline

### Data Sources

- UC Berkeley Voluntary Registry Offsets Database (4,355 projects)
- Synthetic prices: $0.93–$1.35 per tonne
- Risk ratings: AAA (1%) to CCC (35%), unrated (15%)

### Model Limitations

- Binary project failures (all-or-nothing)
- Fixed correlation strengths (assumed, not measured)
- No temporal dynamics (single-period model)
- Synthetic data (not real market prices)

### Future Enhancements

- Multi-period optimization with rebalancing
- Real-time price/rating updates
- Custom risk constraints (ESG, SDG alignment)
- API integration for live trading

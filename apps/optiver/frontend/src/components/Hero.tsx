import { PortfolioData, ReportData } from "@/types/report";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/utils";
import { CarbonCoin } from "./CarbonCoin";

export function Hero({
  report,
  portfolio,
  correlation,
  copied,
  onCopy,
}: {
  report: ReportData;
  portfolio: PortfolioData;
  correlation: string;
  copied: boolean;
  onCopy: () => void;
}) {
  const evaluation = portfolio.evaluations[correlation];
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-panel">
        <p className="hero-kicker">Optiver challenge · AdaHack 2026</p>
        <h1 id="hero-title" className="hero-title">
          Cheap carbon credits can fail together.
        </h1>

        <div className="hero-stage">
          <CarbonCoin className="hero-coin" />

          <div className="hero-card hero-card-mandate" data-hero-card="mandate">
            <p className="hero-card-label">Our goal</p>
            <p className="hero-card-value">
              Deliver {formatNumber(report.target)} tCO₂e
            </p>
          </div>

          <div className="hero-card hero-card-constraints">
            <p className="hero-card-label">Rules we used</p>
            <dl className="hero-card-lines">
              <div>
                <dt>budget</dt>
                <dd>max {formatCurrency(report.budget)}</dd>
              </div>
              <div>
                <dt>success goal</dt>
                <dd>at least {formatPercentage(report.reliability)}</dd>
              </div>
              <div>
                <dt>tests</dt>
                <dd>{formatNumber(report.evaluation_scenarios)} each</dd>
              </div>
            </dl>
          </div>

          <div className="hero-receipt">
            <span className="hero-receipt-badge" aria-hidden="true">
              {portfolio.projects}
            </span>
            <div className="hero-receipt-row">
              <div>
                <p className="hero-receipt-name">Our spread-out portfolio</p>
                <p className="hero-receipt-meta">
                  {portfolio.projects} projects ·{" "}
                  {formatNumber(portfolio.nominal_tonnes)} tonnes bought
                </p>
                <p className="hero-receipt-meta">
                  {evaluation ? formatPercentage(evaluation.success_rate) : "—"}{" "}
                  of simulated tests reached the goal
                </p>
              </div>
              <p className="hero-receipt-amount">
                {formatCurrency(portfolio.cost_usd)}
              </p>
            </div>
          </div>
        </div>

        <p className="hero-lede">
          We compare the cheapest ways to buy credits with a portfolio spread
          across more projects. See what the extra cost buys when projects fail.
        </p>
        <div className="hero-actions">
          <a href="#comparison" className="hero-cta">
            Explore the comparison
          </a>
          <a
            href="/data/optiver-executive-summary.pdf"
            download
            className="hero-link"
          >
            Download summary
          </a>
          <button
            type="button"
            onClick={onCopy}
            className="hero-link"
            aria-label="Copy summary to clipboard"
          >
            {copied ? "Copied" : "Copy summary"}
          </button>
        </div>
      </div>
    </section>
  );
}

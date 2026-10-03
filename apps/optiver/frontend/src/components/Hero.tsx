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
          The cheapest tonne is rarely the safest.
        </h1>

        <div className="hero-stage">
          <CarbonCoin className="hero-coin" />

          <div className="hero-card hero-card-mandate" data-hero-card="mandate">
            <p className="hero-card-label">Mandate</p>
            <p className="hero-card-value">
              Deliver {formatNumber(report.target)} tCO₂e
            </p>
          </div>

          <div className="hero-card hero-card-constraints">
            <p className="hero-card-label">Constraints</p>
            <dl className="hero-card-lines">
              <div>
                <dt>budget</dt>
                <dd>max {formatCurrency(report.budget)}</dd>
              </div>
              <div>
                <dt>reliability</dt>
                <dd>min {formatPercentage(report.reliability)}</dd>
              </div>
              <div>
                <dt>scenarios</dt>
                <dd>{formatNumber(report.evaluation_scenarios)} per ρ</dd>
              </div>
              <div>
                <dt>shared ρ</dt>
                <dd>{report.shared_latent_variances.join(" · ")}</dd>
              </div>
              <div>
                <dt>seed</dt>
                <dd>{report.seed}</dd>
              </div>
            </dl>
          </div>

          <div className="hero-receipt">
            <span className="hero-receipt-badge" aria-hidden="true">
              {portfolio.projects}
            </span>
            <div className="hero-receipt-row">
              <div>
                <p className="hero-receipt-name">Diversified candidate</p>
                <p className="hero-receipt-meta">
                  {portfolio.projects} credits ·{" "}
                  {formatNumber(portfolio.nominal_tonnes)} t
                </p>
                <p className="hero-receipt-meta">
                  {evaluation ? formatPercentage(evaluation.success_rate) : "—"}{" "}
                  hit rate · ρ={correlation}
                </p>
              </div>
              <p className="hero-receipt-amount">
                {formatCurrency(portfolio.cost_usd)}
              </p>
            </div>
          </div>
        </div>

        <p className="hero-lede">
          A decision desk for carbon credit portfolios. Compare acquisition cost
          with modelled delivery risk, then stress the assumptions behind the
          result.
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

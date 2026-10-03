"use client";

import { ReportData } from "@/types/report";
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatTonnes,
} from "@/lib/utils";
import { ScenarioToggle } from "./ScenarioToggle";

export function Summary({
  report,
  correlation,
  onCorrelationChange,
}: {
  report: ReportData;
  correlation: string;
  onCorrelationChange: (value: string) => void;
}) {
  const portfolio = report.portfolios["Diversified candidate"];
  const evaluation = portfolio?.evaluations[correlation];
  const risks = portfolio
    ? ([
        ["Registry concentration", portfolio.exposures_by_tonnes.registry],
        ["Country concentration", portfolio.exposures_by_tonnes.country],
        [
          "Project-type concentration",
          portfolio.exposures_by_tonnes.project_type,
        ],
      ] as const)
    : [];
  return (
    <section
      aria-labelledby="summary-title"
      className="summary-board border border-border bg-card overflow-hidden"
    >
      <div className="border-b border-border p-6 md:p-8">
        <div>
          <p className="eyebrow">Our result</p>
          <h2 id="summary-title" className="section-title">
            Build in room for failure.
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {portfolio
              ? `${portfolio.projects} projects · ${formatNumber(portfolio.nominal_tonnes)} tonnes bought · ${formatCurrency(report.budget)} spending limit · ${portfolio.meets_modelled_requirement ? "met our chosen success rate at every risk level" : "missed our chosen success rate at a risk level"}`
              : "This saved run found no portfolio that met our goal."}
          </p>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border border-b border-border">
        <div className="p-6">
          <p className="text-sm text-muted-foreground">
            Tonnes we need to deliver
          </p>
          <p className="font-heading text-4xl md:text-5xl mt-2 tabular-nums">
            {formatTonnes(report.target)}
            <span className="text-sm font-sans ml-2">tCO₂e</span>
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Our chosen success goal: {formatPercentage(report.reliability)}
          </p>
        </div>
        <div className="p-6">
          <p className="text-sm text-muted-foreground">
            Cost to buy these credits
          </p>
          <p className="font-heading text-4xl md:text-5xl mt-2 tabular-nums">
            {portfolio ? formatCurrency(portfolio.cost_usd) : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Budget: {formatCurrency(report.budget)}
          </p>
        </div>
        <div className="p-6" aria-live="polite">
          <p className="text-sm text-muted-foreground">
            Tests that reached the goal
          </p>
          <p
            key={correlation}
            className="scenario-value font-heading text-4xl md:text-5xl text-accent mt-2 tabular-nums"
          >
            {evaluation ? formatPercentage(evaluation.success_rate) : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {evaluation
              ? `Estimated range from test sampling: ${(evaluation.ci_low * 100).toFixed(2)}–${(evaluation.ci_high * 100).toFixed(2)}%`
              : "No evaluation available"}
          </p>
        </div>
      </div>
      <div className="p-6 md:p-8 grid lg:grid-cols-2 gap-8">
        <ScenarioToggle
          values={report.shared_latent_variances}
          selected={correlation}
          onChange={onCorrelationChange}
        />
        <div>
          <h3 className="eyebrow mb-3">Where too many credits share a risk</h3>
          <ul className="space-y-2">
            {risks.map(([label, values]) => {
              const [name, share] = Object.entries(values).sort(
                (a, b) => b[1] - a[1],
              )[0] ?? ["None", 0];
              return (
                <li
                  key={label}
                  className="flex justify-between items-start gap-3 text-sm"
                >
                  <div>
                    <span className="text-muted-foreground text-xs block">
                      {label}
                    </span>
                    {name}
                  </div>
                  <span className="font-semibold tabular-nums">
                    {formatPercentage(share)}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-muted-foreground mt-3">
            These percentages show where the credits are concentrated. They do
            not show how likely failure is.
          </p>
        </div>
      </div>
    </section>
  );
}

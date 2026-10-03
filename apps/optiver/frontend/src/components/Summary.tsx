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
      className="rounded-xl border border-primary/20 bg-card shadow-sm overflow-hidden"
    >
      <div className="border-b border-primary/15 p-6 md:p-8 flex flex-wrap justify-between items-start gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            The investment case
          </p>
          <h2 id="summary-title" className="font-heading text-3xl font-bold">
            More room for failure. A better chance of delivery.
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {portfolio
              ? `${portfolio.projects} projects · ${formatNumber(portfolio.nominal_tonnes)} purchased tonnes · ${formatCurrency(report.budget)} budget cap`
              : "No validated candidate in this saved run."}
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {portfolio?.meets_modelled_requirement
            ? "Passes all tested models"
            : "Requirement not validated"}
        </span>
      </div>
      <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border border-b border-border">
        <div className="p-6">
          <p className="text-sm text-muted-foreground">Delivery target</p>
          <p className="font-heading text-4xl mt-2">
            {formatTonnes(report.target)}
            <span className="text-sm font-sans ml-2">tCO₂e</span>
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Required reliability: {formatPercentage(report.reliability)}
          </p>
        </div>
        <div className="p-6">
          <p className="text-sm text-muted-foreground">Portfolio cost</p>
          <p className="font-heading text-4xl mt-2">
            {portfolio ? formatCurrency(portfolio.cost_usd) : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Budget: {formatCurrency(report.budget)}
          </p>
        </div>
        <div className="p-6" aria-live="polite">
          <p className="text-sm text-muted-foreground">
            Modelled target hit rate
          </p>
          <p
            key={correlation}
            className="scenario-value font-heading text-4xl text-primary mt-2"
          >
            {evaluation ? formatPercentage(evaluation.success_rate) : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {evaluation
              ? `95% interval: ${(evaluation.ci_low * 100).toFixed(2)}–${(evaluation.ci_high * 100).toFixed(2)}% · ρ=${correlation}`
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
          <h3 className="text-sm font-semibold mb-3">
            Top 3 concentration risks
          </h3>
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
            Shares of purchased tonnes; these are exposures, not failure
            probabilities.
          </p>
        </div>
      </div>
    </section>
  );
}

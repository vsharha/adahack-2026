"use client";

import { useState } from "react";
import type { HoldingRow, PortfolioExposures } from "@/types/report";
import { formatNumber, formatPercentage } from "@/lib/utils";

const groups = [
  { key: "registry", label: "Registry" },
  { key: "country", label: "Country" },
  { key: "project_type", label: "Project type" },
  { key: "developer", label: "Developer" },
] as const;

type GroupKey = (typeof groups)[number]["key"];

export function ShockCheck({
  holdings,
  exposures,
  target,
}: {
  holdings: HoldingRow[];
  exposures: PortfolioExposures;
  target: number;
}) {
  const scenarios = groups.map(({ key, label }) => {
    const [name, share] = Object.entries(exposures[key]).sort(
      (a, b) => b[1] - a[1],
    )[0];
    return { key, label, name, share };
  });
  const [selectedKey, setSelectedKey] = useState<GroupKey>("registry");
  const selected =
    scenarios.find((scenario) => scenario.key === selectedKey) ?? scenarios[0];
  const nominal = holdings.reduce((sum, holding) => sum + holding.tonnes, 0);
  const affected = holdings.filter(
    (holding) => holding[selected.key] === selected.name,
  );
  const loss = affected.reduce(
    (sum, holding) => sum + holding.tonnes * holding.loss_fraction,
    0,
  );
  const remaining = nominal - loss;
  const margin = remaining - target;
  const meetsTarget = margin >= 0;

  return (
    <div className="shock-board">
      <div
        className="shock-choices"
        role="group"
        aria-label="Choose a shared failure"
      >
        {scenarios.map((scenario) => (
          <button
            className="shock-choice"
            data-selected={scenario.key === selectedKey}
            key={scenario.key}
            type="button"
            aria-pressed={scenario.key === selectedKey}
            onClick={() => setSelectedKey(scenario.key)}
          >
            <span className="shock-choice-type">{scenario.label}</span>
            <span className="shock-choice-name">{scenario.name}</span>
            <span className="shock-choice-share">
              {formatPercentage(scenario.share)} of purchased tonnes
            </span>
          </button>
        ))}
      </div>
      <div className="shock-result" aria-live="polite">
        <p className="shock-result-label">
          After a full {selected.label.toLowerCase()} failure
        </p>
        <div className="shock-result-head">
          <strong>{formatNumber(Math.round(remaining))} tCO₂e</strong>
          <span
            className={
              meetsTarget ? "shock-verdict-pass" : "shock-verdict-fail"
            }
          >
            {meetsTarget ? "Target met" : "Target missed"}
          </span>
        </div>
        <div className="shock-rail" aria-hidden="true">
          <span
            className={
              meetsTarget ? "shock-remaining-pass" : "shock-remaining-fail"
            }
            style={{ width: `${(remaining / nominal) * 100}%` }}
          />
          <i style={{ left: `${(target / nominal) * 100}%` }} />
        </div>
        <p className="shock-rail-caption">
          <span>0</span>
          <span>Target: {formatNumber(target)}</span>
          <span>{formatNumber(nominal)} nominal</span>
        </p>
        <dl className="shock-facts">
          <div>
            <dt>Lost after buffers</dt>
            <dd>{formatNumber(Math.round(loss))} t</dd>
          </div>
          <div>
            <dt>Projects affected</dt>
            <dd>{affected.length}</dd>
          </div>
          <div>
            <dt>{meetsTarget ? "Above target" : "Below target"}</dt>
            <dd>{formatNumber(Math.round(Math.abs(margin)))} t</dd>
          </div>
        </dl>
        <p className="shock-caveat">
          Hypothetical simultaneous failure of every project in this group, with
          supplied buffer recovery. This is a severity check, not an estimated
          probability; the saved portfolio and simulations stay fixed.
        </p>
      </div>
    </div>
  );
}

"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import frontier from "@/data/frontier.json";
import { FrontierData, ReportData } from "@/types/report";
import {
  formatCurrency,
  formatCurrencyPrecise,
  formatPercentage,
} from "@/lib/utils";

const data: FrontierData = frontier;

export function Frontier({
  correlation,
  report,
}: {
  correlation: string;
  report: ReportData;
}) {
  if (
    data.data_sha256 !== report.data_sha256 ||
    data.target !== report.target ||
    data.budget !== report.budget ||
    data.seed !== report.seed ||
    data.training_scenarios !== report.training_scenarios ||
    data.evaluation_scenarios !== report.evaluation_scenarios ||
    JSON.stringify(data.shared_latent_variances) !==
      JSON.stringify(report.shared_latent_variances)
  )
    return (
      <p className="rounded-lg border p-6">
        Cost curve unavailable: regenerate the frontier against the current
        dataset and model settings.
      </p>
    );
  const points = data.points.map((p) => ({
    ...p,
    reliability: p.required_reliability * 100,
    validatedCost: p.validated ? p.cost_usd : null,
  }));
  return (
    <section aria-labelledby="frontier-title" className="space-y-6">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div className="max-w-[46rem]">
          <p className="eyebrow">Cost curve</p>
          <h2 id="frontier-title" className="section-title">
            What does another point of reliability cost?
          </h2>
          <p className="section-lede">
            Five allocations, the same delivery target. Higher reliability
            usually requires more reserve credits.
          </p>
        </div>
        <a
          className="font-mono text-sm underline underline-offset-4 hover:text-accent"
          href="/data/frontier.json"
          download
        >
          Download cost curve
        </a>
      </div>
      <div className="rounded-lg border bg-card p-4 md:p-8 space-y-6">
        <div
          className="h-72 w-full"
          aria-label="Reliability requirement versus portfolio cost. Exact values follow in the table."
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={points}
              margin={{ top: 15, right: 20, left: 10, bottom: 25 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="reliability"
                type="number"
                domain={[80, 99]}
                ticks={[80, 85, 90, 95, 99]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 12 }}
                label={{
                  value: "Required modelled reliability",
                  position: "insideBottom",
                  offset: -18,
                  fontSize: 12,
                }}
              />
              <YAxis
                tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                tick={{ fontSize: 12 }}
                width={65}
                domain={[0, "auto"]}
              />
              <Tooltip
                formatter={(value) => [
                  formatCurrency(Number(value)),
                  "Portfolio cost",
                ]}
                labelFormatter={(value) => `${value}% required reliability`}
                contentStyle={{ borderRadius: 8, borderColor: "var(--border)" }}
              />
              <Line
                type="linear"
                dataKey="validatedCost"
                name="Portfolio cost"
                stroke="var(--primary)"
                strokeWidth={3}
                dot={{
                  r: 5,
                  fill: "var(--primary)",
                  stroke: "var(--background)",
                  strokeWidth: 2,
                }}
                activeDot={{ r: 7 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular-nums">
            <caption className="text-left text-xs text-muted-foreground mb-3">
              Held-out results at ρ={correlation}. A validated point must pass
              every tested scenario.
            </caption>
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-3 pr-4 font-medium">Required</th>
                <th className="pr-4 font-medium">Cost</th>
                <th className="pr-4 font-medium">Projects</th>
                <th className="pr-4 font-medium">Target hit rate</th>
                <th className="pr-4 font-medium">95% lower bound</th>
                <th className="font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {data.points.map((p) => {
                const result = p.evaluations[correlation];
                return (
                  <tr
                    key={p.required_reliability}
                    className={
                      p.required_reliability === 0.95
                        ? "border-b bg-primary/5"
                        : "border-b"
                    }
                  >
                    <th scope="row" className="py-3 pr-4 text-left font-medium">
                      {formatPercentage(p.required_reliability)}
                    </th>
                    <td className="pr-4 whitespace-nowrap">
                      {p.cost_usd === null
                        ? "—"
                        : formatCurrencyPrecise(p.cost_usd)}
                    </td>
                    <td className="pr-4">{p.projects}</td>
                    <td className="pr-4">
                      {result ? formatPercentage(result.success_rate) : "—"}
                    </td>
                    <td className="pr-4">
                      {result ? `${(result.ci_low * 100).toFixed(2)}%` : "—"}
                    </td>
                    <td
                      className={
                        p.validated ? "text-accent" : "text-destructive"
                      }
                    >
                      {p.status}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          {data.evaluation_scenarios.toLocaleString()} fresh scenarios per
          model, per allocation. This is the cost curve of a bounded heuristic,
          not proof of a globally optimal efficient frontier. Failed or missing
          candidates are omitted from the line.
        </p>
      </div>
    </section>
  );
}

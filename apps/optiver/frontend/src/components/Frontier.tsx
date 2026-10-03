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
        This cost chart does not match the saved results. Regenerate the demo
        data to see it.
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
          <p className="eyebrow">Cost of confidence</p>
          <h2 id="frontier-title" className="section-title">
            How much does a better chance cost?
          </h2>
          <p className="section-lede">
            Each point shows the cheapest portfolio our search found for a
            different success goal. A higher goal usually means buying more
            credits in case some fail.
          </p>
        </div>
        <a
          className="font-mono text-sm underline underline-offset-4 hover:text-accent"
          href="/data/frontier.json"
          download
        >
          Download chart data
        </a>
      </div>
      <div className="rounded-lg border bg-card p-4 md:p-8 space-y-6">
        <div
          className="h-72 w-full"
          aria-label="Chosen success goal versus portfolio cost. Exact values follow in the table."
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
                  value: "Chosen success goal",
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
                labelFormatter={(value) => `${value}% chosen success goal`}
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
              Results from new tests at the selected shared-risk level. A
              portfolio must meet its goal at every risk level to count as a
              pass.
            </caption>
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-3 pr-4 font-medium">Success goal</th>
                <th className="pr-4 font-medium">Cost</th>
                <th className="pr-4 font-medium">Projects</th>
                <th className="pr-4 font-medium">Tests that reached 100,000</th>
                <th className="pr-4 font-medium">Conservative estimate</th>
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
                      {p.validated
                        ? "Met success rate at all risk levels"
                        : p.cost_usd === null
                          ? "No portfolio found"
                          : "Missed success rate at a risk level"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          We ran {data.evaluation_scenarios.toLocaleString()} new tests for each
          portfolio at each risk level. Our search tried a limited set of
          options, so a cheaper solution may exist. Points that missed their
          goal are left off the line. The conservative estimate allows for
          uncertainty from testing a sample of possible outcomes.
        </p>
      </div>
    </section>
  );
}

"use client";

import { getReportData, getHoldings } from "@/lib/data";
import {
  formatCurrency,
  formatPercentage,
  formatTonnes,
  formatConfidenceInterval,
} from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Info, Download } from "lucide-react";
import { useState } from "react";
import { Summary } from "@/components/Summary";
import { HelpModal } from "@/components/HelpModal";
import { HoldingsTable } from "@/components/HoldingsTable";
import { Frontier } from "@/components/Frontier";
import { Map } from "@/components/Map";
import { Hero } from "@/components/Hero";
import { ThemeToggle } from "@/components/theme-toggle";
import { ShockCheck } from "@/components/ShockCheck";

const reportData = getReportData();
const holdings = getHoldings();

const portfolioOrder = [
  "Cheapest nominal",
  "Cheapest expected",
  "Diversified candidate",
];

const countryColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--muted-foreground)",
];

const sections = [
  ["comparison", "Comparison"],
  ["cost-curve", "Cost curve"],
  ["exposure", "Exposure"],
  ["shock", "Shock check"],
  ["holdings", "Holdings"],
  ["method", "Method"],
] as const;

const chartTooltip = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  fontFamily: "var(--font-mono-face)",
  fontSize: 12,
};

function SectionHead({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="section-head">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="section-title">{title}</h2>
      {children && <p className="section-lede">{children}</p>}
    </div>
  );
}

export default function Home() {
  const [selectedCorrelation, setSelectedCorrelation] = useState<string>(
    reportData.shared_latent_variances[0].toString(),
  );

  const [copied, setCopied] = useState(false);

  const header = (
    <header className="site-nav">
      <div className="site-nav-inner">
        <a href="#top" className="wordmark">
          Carbon/risk
        </a>
        <nav aria-label="Sections" className="site-nav-links">
          {sections.map(([id, label]) => (
            <a key={id} href={`#${id}`}>
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <HelpModal />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );

  if (!reportData.portfolios["Diversified candidate"]) {
    return (
      <main id="top" className="min-h-screen bg-background">
        {header}
        <div className="page-wrap page-section space-y-8">
          <h1 className="section-title">Carbon portfolio results</h1>
          <Summary
            report={reportData}
            correlation={selectedCorrelation}
            onCorrelationChange={setSelectedCorrelation}
          />
          <p>
            No candidate passed this search. Review the budget, target and
            search settings before generating another report.
          </p>
        </div>
      </main>
    );
  }

  const portfolios = portfolioOrder.map((name) => ({
    name,
    data: reportData.portfolios[name as keyof typeof reportData.portfolios],
  }));

  const comparisonData = portfolios.map((p) => ({
    name: p.name,
    cost: p.data.cost_usd,
    successRate:
      p.data.evaluations[selectedCorrelation as keyof typeof p.data.evaluations]
        .success_rate,
    nominalTonnes: p.data.nominal_tonnes,
  }));

  const diversifiedPortfolio = reportData.portfolios["Diversified candidate"];
  const diversifiedEval =
    diversifiedPortfolio.evaluations[
      selectedCorrelation as keyof typeof diversifiedPortfolio.evaluations
    ];

  const exposureData = Object.entries(
    diversifiedPortfolio.exposures_by_tonnes,
  ).map(([category, values]) => {
    const sorted = Object.entries(values as Record<string, number>).sort(
      (a, b) => b[1] - a[1],
    );
    const data = sorted
      .slice(0, 6)
      .map(([name, value]) => ({ name, value: value * 100 }));
    if (sorted.length > 6)
      data.push({
        name: "Other",
        value: sorted.slice(6).reduce((sum, [, value]) => sum + value * 100, 0),
      });
    return { category, data };
  });

  const copySummary = async () => {
    const text = `Optiver Portfolio: ${formatCurrency(diversifiedPortfolio.cost_usd)} for ${formatTonnes(diversifiedPortfolio.nominal_tonnes)} at ${formatPercentage(diversifiedEval.success_rate)} success rate (ρ=${selectedCorrelation})`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main id="top" className="min-h-screen bg-background">
      {header}

      <Hero
        report={reportData}
        portfolio={diversifiedPortfolio}
        correlation={selectedCorrelation}
        copied={copied}
        onCopy={copySummary}
      />

      <section className="page-section" aria-label="Recommendation">
        <div className="page-wrap">
          <Summary
            report={reportData}
            correlation={selectedCorrelation}
            onCorrelationChange={setSelectedCorrelation}
          />
        </div>
      </section>

      <section id="comparison" className="page-section">
        <div className="page-wrap">
          <SectionHead eyebrow="Comparison" title="The cost of being wrong">
            Three strategies, one goal: deliver 100,000 tonnes. The cheapest
            nominal portfolio minimizes upfront cost. The cheapest expected
            adjusts for failure probability. The diversified candidate spreads
            risk across countries, developers, and registries.
          </SectionHead>

          <div className="comparison-board">
            <div className="comparison-head">
              <span>Strategy</span>
              <span>Acquisition cost</span>
              <span>Target hit rate · ρ={selectedCorrelation}</span>
            </div>
            {comparisonData.map((entry, index) => (
              <div
                key={entry.name}
                className={`comparison-row ${index === 2 ? "comparison-row-featured" : ""}`}
              >
                <div className="comparison-name">
                  <span className="font-mono text-xs text-muted-foreground">
                    0{index + 1}
                  </span>
                  <div>
                    <strong>{entry.name}</strong>
                    <small>
                      {portfolios[index].data.projects}{" "}
                      {portfolios[index].data.projects === 1
                        ? "project"
                        : "projects"}{" "}
                      · {formatTonnes(entry.nominalTonnes)} tonnes
                    </small>
                  </div>
                </div>
                <div className="comparison-measure">
                  <strong>{formatCurrency(entry.cost)}</strong>
                  <span className="measure-track">
                    <span
                      style={{
                        width: `${(entry.cost / Math.max(...comparisonData.map((item) => item.cost))) * 100}%`,
                      }}
                    />
                  </span>
                </div>
                <div className="comparison-measure">
                  <strong key={selectedCorrelation}>
                    {formatPercentage(entry.successRate)}
                  </strong>
                  <span className="measure-track">
                    <span style={{ width: `${entry.successRate * 100}%` }} />
                  </span>
                </div>
              </div>
            ))}
            <p className="comparison-note">
              Rates are simulated outcomes under the selected shared-risk
              setting. The three allocations remain fixed when the setting
              changes.
            </p>
          </div>
        </div>
      </section>

      <section id="cost-curve" className="page-section">
        <div className="page-wrap">
          <Frontier correlation={selectedCorrelation} report={reportData} />
        </div>
      </section>

      <section id="exposure" className="page-section">
        <div className="page-wrap">
          <Map holdings={holdings} />
        </div>
      </section>

      <section id="concentration" className="page-section">
        <div className="page-wrap">
          <SectionHead
            eyebrow="Concentration"
            title="Diversification breakdown"
          >
            The diversified candidate spreads purchased tonnes across multiple
            dimensions to reduce correlated failure risk. Concentration remains:
            the largest registry accounts for 60% of purchased tonnes.
          </SectionHead>

          <Tabs defaultValue="country" className="w-full">
            <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-4">
              <TabsTrigger value="country">Country</TabsTrigger>
              <TabsTrigger value="developer">Developer</TabsTrigger>
              <TabsTrigger value="registry">Registry</TabsTrigger>
              <TabsTrigger value="project_type">Project type</TabsTrigger>
            </TabsList>

            {exposureData.map((exp) => (
              <TabsContent
                key={exp.category}
                value={exp.category}
                className="mt-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="capitalize">
                      {exp.category.replaceAll("_", " ")}
                    </CardTitle>
                    <p className="font-mono text-xs text-muted-foreground mt-1">
                      Top {exp.data.length} by purchased tonnes
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={exp.data}
                          layout="vertical"
                          margin={{ top: 5, right: 64, left: 8, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border)"
                            horizontal={false}
                          />
                          <XAxis
                            type="number"
                            domain={[0, "dataMax"]}
                            tickFormatter={(value) =>
                              `${Number(value).toFixed(0)}%`
                            }
                            tick={{ fontSize: 11 }}
                            stroke="var(--muted-foreground)"
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={120}
                            tick={{ fontSize: 11 }}
                            stroke="var(--muted-foreground)"
                          />
                          <RechartsTooltip
                            formatter={(value) => [
                              `${(value as number).toFixed(1)}%`,
                              "Share",
                            ]}
                            contentStyle={chartTooltip}
                            cursor={{ fill: "var(--muted)" }}
                          />
                          <Bar
                            dataKey="value"
                            radius={[0, 2, 2, 0]}
                            label={{
                              position: "right",
                              fill: "var(--foreground)",
                              fontSize: 12,
                              formatter: (value) =>
                                `${Number(value).toFixed(1)}%`,
                            }}
                          >
                            {exp.data.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  countryColors[index % countryColors.length]
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      <section id="shock" className="page-section">
        <div className="page-wrap">
          <SectionHead
            eyebrow="Failure drill"
            title="What if a shared risk breaks?"
          >
            Choose the largest exposure in each category. The check removes the
            affected credits from this saved portfolio and applies their buffer
            recovery, so you can see whether the 100,000-tonne target still
            holds.
          </SectionHead>
          <ShockCheck
            holdings={holdings}
            exposures={diversifiedPortfolio.exposures_by_tonnes}
            target={reportData.target}
          />
        </div>
      </section>

      <section id="risk" className="page-section">
        <div className="page-wrap">
          <SectionHead eyebrow="Risk metrics" title="Risk analysis">
            Modelled performance under 10,000 stress scenarios per correlation
            setting. Technical terms explained below.
          </SectionHead>

          <Card>
            <CardHeader>
              <CardTitle>Diversified candidate risk metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1">
                          Value at ρ={selectedCorrelation}
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Shared latent variance setting</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                    <TableHead>Definition</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Success rate</TableCell>
                    <TableCell className="tabular-nums">
                      {formatPercentage(diversifiedEval.success_rate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      Fraction of scenarios delivering ≥100,000 tonnes
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1">
                          95% confidence interval
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Wilson score interval for binomial proportion</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatConfidenceInterval(
                        diversifiedEval.ci_low,
                        diversifiedEval.ci_high,
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      Statistical uncertainty range for success rate
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1">
                          5th percentile delivery
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Delivery in the worst 5% of scenarios (Value at
                            Risk)
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatTonnes(diversifiedEval.p05_tonnes)} tonnes
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      5th percentile of modelled delivery
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1">
                          Mean shortfall
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Mean delivery deficit across all scenarios,
                            including zero deficit when the target is reached
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatTonnes(diversifiedEval.mean_shortfall)} tonnes
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      Average shortfall across all scenarios
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="holdings" className="page-section">
        <div className="page-wrap">
          <SectionHead eyebrow="Holdings" title="Portfolio holdings">
            Search, filter and sort the individual credits in the diversified
            candidate. The map and portfolio totals always show the full
            allocation.
          </SectionHead>
          <HoldingsTable holdings={holdings} />
        </div>
      </section>

      <section id="method" className="page-section">
        <div className="page-wrap">
          <SectionHead eyebrow="Method" title="Method and limitations" />

          <Card className="max-w-4xl">
            <CardHeader>
              <CardTitle>About this demo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <div>
                <h3 className="font-semibold mb-2">Data source</h3>
                <p className="text-muted-foreground">
                  This demo uses the UC Berkeley Voluntary Registry Offsets
                  Database with synthetic prices and failure probabilities
                  provided for the Optiver challenge. Prices and risk ratings
                  are not real market data.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Failure model</h3>
                <p className="text-muted-foreground">
                  Projects fail as a whole unit. Buffer pools recover 50% of
                  lost tonnes. Reversal events increase failure probability by
                  1.5×. Correlated failures use Gaussian shared factors for
                  country, developer, registry, and project type, preserving
                  marginal probabilities from risk ratings.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Evaluation</h3>
                <p className="text-muted-foreground">
                  The diversified candidate is selected using 2,000 training
                  scenarios and evaluated on 10,000 fresh scenarios per
                  correlation setting. This is a bounded heuristic search, not a
                  proof of global optimality. Success rates are modelled
                  outcomes, not guaranteed delivery.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">No real-world claims</h3>
                <p className="text-muted-foreground">
                  This is an offline simulation for the AdaHack 2026 Optiver
                  challenge. No actual carbon credits are purchased or retired.
                  Cost and reliability figures are reproducible outputs from the
                  assumed model, not environmental impact evidence.
                </p>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2 pt-4 border-t font-mono text-sm">
                <a
                  href="/data/optiver-executive-summary.pdf"
                  download
                  className="inline-flex items-center gap-2 underline underline-offset-4 hover:text-accent"
                >
                  <Download className="w-4 h-4" />
                  PDF summary
                </a>
                <a
                  href="/data/report.json"
                  download
                  className="inline-flex items-center gap-2 underline underline-offset-4 hover:text-accent"
                >
                  <Download className="w-4 h-4" />
                  report.json
                </a>
                <a
                  href="/data/portfolio.csv"
                  download
                  className="inline-flex items-center gap-2 underline underline-offset-4 hover:text-accent"
                >
                  <Download className="w-4 h-4" />
                  portfolio.csv
                </a>
              </div>
            </CardContent>
          </Card>

          <footer className="mt-16 pt-6 border-t font-mono text-xs text-muted-foreground flex flex-wrap justify-between gap-2">
            <p>Built for AdaHack 2026 · Optiver challenge · saved demo run</p>
            <p>
              Simulation seeds: training {reportData.seed}, evaluation{" "}
              {reportData.seed + 1}
            </p>
          </footer>
        </div>
      </section>
    </main>
  );
}

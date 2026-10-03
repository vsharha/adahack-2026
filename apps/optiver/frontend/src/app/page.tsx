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
const portfolioLabels: Record<string, string> = {
  "Cheapest nominal": "Lowest upfront cost",
  "Cheapest expected": "Lowest cost for average delivery",
  "Diversified candidate": "Our spread-out portfolio",
};

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
  ["cost-curve", "Cost and success"],
  ["exposure", "Map"],
  ["shock", "Failure check"],
  ["holdings", "Projects"],
  ["method", "How it works"],
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
          Carbon<span className="wordmark-slash">/</span>risk
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
            We could not find a portfolio that met the spending limit and our
            success goal. Change the settings and run the analysis again.
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
    name: portfolioLabels[p.name],
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
    const text = `Our carbon credit portfolio costs ${formatCurrency(diversifiedPortfolio.cost_usd)} and buys ${formatTonnes(diversifiedPortfolio.nominal_tonnes)}. It reached the 100,000-tonne goal in ${formatPercentage(diversifiedEval.success_rate)} of simulated tests at the selected shared-risk level.`;
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

      <section className="page-section" aria-label="Our result">
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
          <SectionHead
            eyebrow="Compare the options"
            title="Why buy more than the cheapest option?"
          >
            All three options aim to deliver 100,000 tonnes. The cheapest buys
            only enough credits to reach that number if nothing fails. The
            second accounts for average losses. Our option buys extra credits
            from more projects so one failure does less damage.
          </SectionHead>

          <div className="comparison-board">
            <div className="comparison-head">
              <span>Strategy</span>
              <span>Cost to buy</span>
              <span>Tests that reached the goal</span>
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
                      · {formatTonnes(entry.nominalTonnes)} tonnes bought
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
              These percentages come from simulated failures at the selected
              shared-risk level. Changing the level does not change what each
              option buys or costs.
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
            eyebrow="Shared risks"
            title="Where we still rely on the same groups"
          >
            Our portfolio uses several countries, companies, registries and
            project types. But 60% of the tonnes still come from one registry.
            If many projects in that group fail together, we could miss the
            goal.
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
            eyebrow="Worst-case check"
            title="What if every project in one group fails?"
          >
            Pick a group to see how many tonnes would remain if all its projects
            failed at once. Some losses are covered by buffer pools. This shows
            the size of the damage, not how likely it is.
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
          <SectionHead
            eyebrow="Test results"
            title="How often did we reach the goal?"
          >
            We simulated 10,000 possible outcomes for each shared-risk level.
            The figures below describe those tests, not real-world guarantees.
          </SectionHead>

          <Card>
            <CardHeader>
              <CardTitle>Results for our portfolio</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1">
                          Value for this risk level
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            How strongly our simulation makes projects fail
                            together
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                    <TableHead>Definition</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      Reached the goal
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatPercentage(diversifiedEval.success_rate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      Share of tests delivering at least 100,000 tonnes
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1">
                          Likely range for the test result
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            A statistical range for the simulated success rate
                          </p>
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
                      Range caused by testing a sample of possible outcomes
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1">
                          Low-end delivery
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            95% of simulated outcomes delivered at least this
                            many tonnes
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatTonnes(diversifiedEval.p05_tonnes)} tonnes
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      Only 5% of tests delivered less than this
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1">
                          Average missed tonnes
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Average gap below the goal across all tests; a
                            successful test has a gap of zero
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatTonnes(diversifiedEval.mean_shortfall)} tonnes
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      Average gap below the goal across all tests
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
          <SectionHead eyebrow="Projects" title="What we would buy">
            Search and filter the projects in our portfolio. The map and totals
            still show every project, even when you filter this table.
          </SectionHead>
          <HoldingsTable holdings={holdings} />
        </div>
      </section>

      <section id="method" className="page-section">
        <div className="page-wrap">
          <SectionHead
            eyebrow="Behind the numbers"
            title="How we tested this"
          />

          <Card className="max-w-4xl">
            <CardHeader>
              <CardTitle>What these results mean</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <div>
                <h3 className="font-semibold mb-2">Data source</h3>
                <p className="text-muted-foreground">
                  We used the challenge dataset, which combines carbon-credit
                  projects from UC Berkeley with made-up prices and failure
                  ratings. The prices are not real market prices.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Failure model</h3>
                <p className="text-muted-foreground">
                  We assume an entire project can fail. A buffer pool returns
                  half its lost tonnes; a past reversal increases its failure
                  chance by 50%. Projects can fail together when they share a
                  country, developer, registry or type. We chose how strong that
                  shared risk is because the challenge does not say.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Evaluation</h3>
                <p className="text-muted-foreground">
                  We tried a small set of portfolio rules using 2,000 simulated
                  outcomes, then checked the chosen portfolio on 10,000 new
                  outcomes at each risk level. We cannot claim it is the
                  cheapest possible portfolio. The percentages describe our
                  simulation, not guaranteed delivery.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">No real-world claims</h3>
                <p className="text-muted-foreground">
                  This is an offline challenge demo. We have not bought or
                  retired any credits, and we have not measured an emissions
                  reduction. The results show what happened under our assumed
                  risks.
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

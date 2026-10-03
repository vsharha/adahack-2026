"use client";

import { getReportData, getHoldings } from "@/lib/data";
import {
  formatCurrency,
  formatCurrencyPrecise,
  formatNumber,
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
import { Badge } from "@/components/ui/badge";
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
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Leaf,
  TrendingUp,
  Shield,
  Info,
  Download,
  FileText,
  Copy,
  Check,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";
import { Summary } from "@/components/Summary";
import { HelpModal } from "@/components/HelpModal";
import { HoldingsTable } from "@/components/HoldingsTable";
import { Frontier } from "@/components/Frontier";
import { Map } from "@/components/Map";
import { ThemeToggle } from "@/components/theme-toggle";

const reportData = getReportData();
const holdings = getHoldings();

const portfolioOrder = [
  "Cheapest nominal",
  "Cheapest expected",
  "Diversified candidate",
];

const chartColors = {
  "Cheapest nominal": "oklch(55% 0.15 200)",
  "Cheapest expected": "oklch(70% 0.15 55)",
  "Diversified candidate": "oklch(35% 0.08 165)",
};

const countryColors = [
  "oklch(35% 0.08 165)",
  "oklch(55% 0.15 200)",
  "oklch(70% 0.15 55)",
  "oklch(50% 0.2 145)",
  "oklch(45% 0.1 280)",
  "oklch(60% 0.15 25)",
];

export default function Home() {
  const [selectedCorrelation, setSelectedCorrelation] = useState<string>(
    reportData.shared_latent_variances[0].toString(),
  );

  const [copied, setCopied] = useState(false);

  if (!reportData.portfolios["Diversified candidate"]) {
    return (
      <main className="container mx-auto p-6 space-y-8">
        <h1 className="text-3xl font-heading">Carbon portfolio results</h1>
        <Summary
          report={reportData}
          correlation={selectedCorrelation}
          onCorrelationChange={setSelectedCorrelation}
        />
        <p>
          No candidate passed this search. Review the budget, target and search
          settings before generating another report.
        </p>
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

  const getStatusBadge = (meetsRequirement: boolean) => {
    if (meetsRequirement) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300">
          PASS
        </Badge>
      );
    }
    return (
      <Badge
        variant="secondary"
        className="bg-amber-100 text-amber-800 border-amber-300"
      >
        Does not meet requirement
      </Badge>
    );
  };

  const copySummary = async () => {
    const text = `Optiver Portfolio: ${formatCurrency(diversifiedPortfolio.cost_usd)} for ${formatTonnes(diversifiedPortfolio.nominal_tonnes)} at ${formatPercentage(diversifiedEval.success_rate)} success rate (ρ=${selectedCorrelation})`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header with Theme Toggle */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Leaf className="w-6 h-6 text-primary" />
            <h1 className="text-lg font-heading font-semibold">
              Optiver Carbon Portfolio
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <HelpModal />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="animate-fade-in border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Leaf className="w-8 h-8 text-primary" />
                <Badge variant="outline" className="text-sm">
                  AdaHack 2026
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/data/optiver-executive-summary.pdf"
                  download
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  aria-label="Download PDF executive summary"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </a>
                <button
                  onClick={copySummary}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Copy summary to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy summary</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-foreground tracking-tight">
              How much does it cost to make a carbon portfolio more reliable?
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
              Compare three portfolio strategies: the cheapest options on paper,
              those adjusted for failure risk, and a diversified approach that
              survives the unexpected. See the trade-off between acquisition
              cost and modelled reliability under stress scenarios.
            </p>
            <div className="flex flex-wrap gap-3 pt-4">
              <Badge
                variant="outline"
                className="text-sm px-4 py-2 bg-primary/10 border-primary/30"
              >
                Target: {formatTonnes(reportData.target)} CO₂e
              </Badge>
              <Badge
                variant="outline"
                className="text-sm px-4 py-2 bg-primary/10 border-primary/30"
              >
                Budget: {formatCurrency(reportData.budget)}
              </Badge>
              <Badge
                variant="outline"
                className="text-sm px-4 py-2 bg-primary/10 border-primary/30"
              >
                Required reliability: {formatPercentage(reportData.reliability)}
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Key Results */}
      <section className="animate-fade-in-delay-1 container mx-auto px-4 py-8 -mt-8">
        <div className="max-w-6xl mx-auto">
          <Summary
            report={reportData}
            correlation={selectedCorrelation}
            onCorrelationChange={setSelectedCorrelation}
          />
        </div>
      </section>

      {/* Portfolio Comparison */}
      <section className="animate-fade-in-delay-2 container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-heading font-bold mb-3">
              Portfolio Comparison
            </h2>
            <p className="text-muted-foreground max-w-3xl">
              Three strategies, one goal: deliver 100,000 tonnes. The cheapest
              nominal portfolio minimizes upfront cost. The cheapest expected
              adjusts for failure probability. The diversified candidate spreads
              risk across countries, developers, and registries.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Cost vs. Modelled Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={comparisonData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis
                      dataKey="name"
                      angle={-15}
                      textAnchor="end"
                      interval={0}
                      tick={{ fontSize: 12 }}
                      height={60}
                    />
                    <YAxis
                      yAxisId="left"
                      label={{
                        value: "Cost (USD)",
                        angle: -90,
                        position: "insideLeft",
                        style: { fontSize: 12 },
                      }}
                      tickFormatter={(value) =>
                        `$${(value / 1000).toFixed(0)}K`
                      }
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      label={{
                        value: "Success Rate (%)",
                        angle: 90,
                        position: "insideRight",
                        style: { fontSize: 12 },
                      }}
                      tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                      domain={[0, 1]}
                    />
                    <RechartsTooltip
                      formatter={(value, name) => {
                        if (name === "cost") {
                          return [formatCurrency(value as number), "Cost"];
                        }
                        return [
                          formatPercentage(value as number),
                          "Success Rate",
                        ];
                      }}
                    />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="cost"
                      name="Cost"
                      radius={[4, 4, 0, 0]}
                    >
                      {comparisonData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            chartColors[entry.name as keyof typeof chartColors]
                          }
                        />
                      ))}
                    </Bar>
                    <Bar
                      yAxisId="right"
                      dataKey="successRate"
                      name="Success Rate"
                      radius={[4, 4, 0, 0]}
                    >
                      {comparisonData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            chartColors[entry.name as keyof typeof chartColors]
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 grid md:grid-cols-3 gap-4">
                {portfolios.map((p) => (
                  <div
                    key={p.name}
                    className="p-4 rounded-lg border bg-secondary/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm">{p.name}</h3>
                      {getStatusBadge(p.data.meets_modelled_requirement)}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cost:</span>
                        <span className="font-medium">
                          {formatCurrency(p.data.cost_usd)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Success rate:
                        </span>
                        <span className="font-medium">
                          {formatPercentage(
                            p.data.evaluations[
                              selectedCorrelation as keyof typeof p.data.evaluations
                            ].success_rate,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Projects:</span>
                        <span className="font-medium">{p.data.projects}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <Frontier correlation={selectedCorrelation} report={reportData} />
        </div>
      </section>
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <Map holdings={holdings} />
        </div>
      </section>

      {/* Diversification Breakdown */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-heading font-bold mb-3">
              Diversification Breakdown
            </h2>
            <p className="text-muted-foreground max-w-3xl">
              The diversified candidate spreads purchased tonnes across multiple
              dimensions to reduce correlated failure risk. Concentration
              remains: the largest registry accounts for 60% of purchased
              tonnes.
            </p>
          </div>

          <Tabs defaultValue="country" className="w-full">
            <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-4">
              <TabsTrigger value="country">Country</TabsTrigger>
              <TabsTrigger value="developer">Developer</TabsTrigger>
              <TabsTrigger value="registry">Registry</TabsTrigger>
              <TabsTrigger value="project_type">Project Type</TabsTrigger>
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
                    <p className="text-sm text-muted-foreground mt-2">
                      Top {exp.data.length} by purchased tonnes
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={exp.data}
                          layout="vertical"
                          margin={{ top: 5, right: 120, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis
                            type="number"
                            domain={[0, "dataMax"]}
                            tickFormatter={(value) => `${value}%`}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={120}
                            tick={{ fontSize: 11 }}
                          />
                          <RechartsTooltip
                            formatter={(value) => [
                              `${(value as number).toFixed(1)}%`,
                              "Share",
                            ]}
                            contentStyle={{
                              borderRadius: "8px",
                              border: "none",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                            }}
                          />
                          <Bar
                            dataKey="value"
                            radius={[0, 4, 4, 0]}
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

      {/* Risk Results */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-heading font-bold mb-3">
              Risk Analysis
            </h2>
            <p className="text-muted-foreground max-w-3xl">
              Modelled performance under 10,000 stress scenarios per correlation
              setting. Technical terms explained below.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Diversified Candidate Risk Metrics
              </CardTitle>
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
                    <TableCell className="font-medium">Success Rate</TableCell>
                    <TableCell>
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
                          95% Confidence Interval
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Wilson score interval for binomial proportion</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
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
                          5th Percentile Delivery
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
                    <TableCell>
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
                          Mean Shortfall
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
                    <TableCell>
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

      {/* Holdings Table */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-heading font-bold mb-3">
              Portfolio Holdings
            </h2>
            <p className="text-muted-foreground max-w-3xl">
              Search, filter and sort the individual credits in the diversified
              candidate. The map and portfolio totals always show the full
              allocation.
            </p>
          </div>

          <HoldingsTable holdings={holdings} />
        </div>
      </section>

      {/* Method and Limitations */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-heading font-bold mb-3">
              Method and Limitations
            </h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                About This Demo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <div>
                <h3 className="font-semibold mb-2">Data Source</h3>
                <p className="text-muted-foreground">
                  This demo uses the UC Berkeley Voluntary Registry Offsets
                  Database with synthetic prices and failure probabilities
                  provided for the Optiver challenge. Prices and risk ratings
                  are not real market data.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Failure Model</h3>
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
                <h3 className="font-semibold mb-2">No Real-World Claims</h3>
                <p className="text-muted-foreground">
                  This is an offline simulation for the AdaHack 2026 Optiver
                  challenge. No actual carbon credits are purchased or retired.
                  Cost and reliability figures are reproducible outputs from the
                  assumed model, not environmental impact evidence.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-4 border-t">
                <a
                  href="/data/optiver-executive-summary.pdf"
                  download
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <Download className="w-4 h-4" />
                  Download PDF summary
                </a>
                <a
                  href="/data/report.json"
                  download
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <Download className="w-4 h-4" />
                  Download report.json
                </a>
                <a
                  href="/data/portfolio.csv"
                  download
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <Download className="w-4 h-4" />
                  Download portfolio.csv
                </a>
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-xs text-muted-foreground pt-8">
            <p>
              Built for AdaHack 2026 • Optiver Challenge •{" "}
              <span className="text-primary">Saved demo run</span>
            </p>
            <p className="mt-1">
              Simulation seeds: training {reportData.seed}, evaluation{" "}
              {reportData.seed + 1}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

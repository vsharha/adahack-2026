"use client";

import { useState } from "react";
import world from "@/data/world-map.json";
import { HoldingRow } from "@/types/report";
import { cn, formatNumber, formatPercentage } from "@/lib/utils";
import { Globe } from "lucide-react";

const aliases: Record<string, string> = {
  "Viet Nam": "Vietnam",
  Türkiye: "Turkey",
};

export function Map({ holdings }: { holdings: HoldingRow[] }) {
  const countries = Array.from(new Set(holdings.map((h) => h.country)))
    .map((country) => {
      const projects = holdings.filter((h) => h.country === country);
      return {
        country,
        projects,
        tonnes: projects.reduce((sum, h) => sum + h.tonnes, 0),
        location: world.find((c) => c.name === (aliases[country] ?? country)),
      };
    })
    .sort((a, b) => b.tonnes - a.tonnes);
  const [selected, setSelected] = useState(countries[0]?.country ?? "");
  const total = countries.reduce((sum, c) => sum + c.tonnes, 0);
  const max = Math.max(...countries.map((c) => c.tonnes), 1);
  const active = countries.find((c) => c.country === selected);
  return (
    <section aria-labelledby="map-title" className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-5 h-5 text-primary" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              Global Exposure
            </p>
          </div>
          <h2 id="map-title" className="text-3xl font-heading font-bold">
            Global exposure, visible at a glance.
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl">
            Circle area represents purchased tonnes. Select a country to inspect
            its projects.
          </p>
        </div>
        <div className="hidden lg:block text-right">
          <p className="text-xs text-muted-foreground mb-1">Total Portfolio</p>
          <p className="text-2xl font-heading font-bold text-primary">
            {formatNumber(total)}
            <span className="text-xs font-sans ml-1">tonnes</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            across {countries.length} countries
          </p>
        </div>
      </div>
      <div className="rounded-xl border bg-card overflow-hidden grid lg:grid-cols-[1fr_350px] shadow-lg">
        <div className="bg-gradient-to-br from-secondary/20 to-secondary/10 p-3 md:p-6">
          <svg
            viewBox="0 0 720 320"
            className="w-full h-auto"
            role="group"
            aria-label="World map of portfolio countries"
          >
            {world.map((c) => (
              <path
                key={c.name}
                d={c.path}
                className={cn(
                  "transition-all duration-300",
                  c.name === (aliases[selected] ?? selected)
                    ? "fill-primary/25 stroke-primary/40"
                    : "fill-muted stroke-background/50",
                )}
                strokeWidth="0.5"
              />
            ))}
            {countries.map(
              (c) =>
                c.location && (
                  <g key={c.country} className="cursor-pointer">
                    <circle
                      cx={c.location.x}
                      cy={c.location.y}
                      r={26 * Math.sqrt(c.tonnes / max) + 8}
                      className={cn(
                        "fill-primary/10 transition-all duration-300",
                        selected === c.country
                          ? "opacity-100"
                          : "opacity-40 hover:opacity-60",
                      )}
                    />
                    <circle
                      cx={c.location.x}
                      cy={c.location.y}
                      r={26 * Math.sqrt(c.tonnes / max)}
                      className={cn(
                        "stroke-primary transition-all duration-300 focus:outline-none focus:stroke-amber-600 focus:stroke-[3]",
                        selected === c.country
                          ? "fill-primary stroke-[2]"
                          : "fill-primary/70 hover:fill-primary stroke-[1.5]",
                      )}
                      strokeWidth={selected === c.country ? 2 : 1.5}
                      role="button"
                      tabIndex={0}
                      aria-pressed={selected === c.country}
                      aria-label={`Show ${c.country}: ${formatNumber(c.tonnes)} tonnes`}
                      onClick={() => setSelected(c.country)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelected(c.country);
                        }
                      }}
                    >
                      <title>
                        {`${c.country}: ${formatNumber(c.tonnes)} tonnes (${formatPercentage(c.tonnes / total)})`}
                      </title>
                    </circle>
                  </g>
                ),
            )}
          </svg>
          <div className="flex flex-wrap gap-2 mt-4">
            {countries.map((c) => (
              <button
                key={c.country}
                type="button"
                onClick={() => setSelected(c.country)}
                aria-pressed={selected === c.country}
                className={cn(
                  "text-xs rounded-full border px-3 py-1.5 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-primary",
                  selected === c.country
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-card border-border hover:bg-secondary hover:border-primary/50",
                )}
              >
                {c.country}
                <span className="ml-1.5 opacity-70">
                  ({formatPercentage(c.tonnes / total)})
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
            Country-level locations; the dataset has no project coordinates.
            Public-domain outline:{" "}
            <a
              href="https://www.naturalearthdata.com/about/terms-of-use/"
              className="underline hover:text-primary transition-colors"
            >
              Natural Earth
            </a>
            .
          </p>
          {countries.some((c) => !c.location) && (
            <p className="text-xs text-amber-700 mt-2 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
              ⚠️ Countries without a map match remain available in the selector.
            </p>
          )}
        </div>
        <div
          className="border-t lg:border-t-0 lg:border-l p-6 bg-gradient-to-b from-background to-secondary/10"
          aria-live="polite"
        >
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">
              Country Exposure
            </p>
            <h3 className="font-heading text-2xl font-bold text-foreground">
              {active?.country ?? "No holdings"}
            </h3>
          </div>
          <div className="mb-4">
            <p className="text-4xl font-heading font-bold text-primary">
              {formatNumber(active?.tonnes ?? 0)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {formatPercentage(total ? (active?.tonnes ?? 0) / total : 0)} of
              the portfolio
            </p>
          </div>
          <div className="mb-5 p-3 bg-primary/5 rounded-lg border border-primary/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Projects</span>
              <span className="font-semibold">
                {active?.projects.length ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-muted-foreground">Avg per project</span>
              <span className="font-semibold">
                {active && active.projects.length > 0
                  ? formatNumber(active.tonnes / active.projects.length)
                  : 0}
              </span>
            </div>
          </div>
          <div className="space-y-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Projects in {active?.country}
            </p>
            <ul className="space-y-0 divide-y divide-border">
              {active?.projects.map((h, idx) => (
                <li
                  key={h.credit_id}
                  className={cn(
                    "text-sm py-3 first:pt-0 last:pb-0 transition-all duration-200 hover:bg-secondary/30 -mx-2 px-2 rounded",
                    idx === 0 ? "animate-fade-in" : "animate-fade-in-delay-1",
                  )}
                >
                  <p className="font-medium leading-snug">{h.project_name}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      {h.registry}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatNumber(h.tonnes)} tonnes
                    </span>
                  </div>
                  {h.project_type && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {h.project_type}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

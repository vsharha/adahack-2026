"use client";

import { useState } from "react";
import world from "@/data/world-map.json";
import { HoldingRow } from "@/types/report";
import { cn, formatNumber, formatPercentage } from "@/lib/utils";

const aliases: Record<string, string> = {
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
    <section aria-labelledby="map-title" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[46rem]">
          <p className="eyebrow">Exposure</p>
          <h2 id="map-title" className="section-title">
            Where the tonnes come from
          </h2>
          <p className="section-lede">
            Circle area represents purchased tonnes. Select a country to inspect
            its projects.
          </p>
        </div>
        <div className="font-mono text-right">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Portfolio
          </p>
          <p className="text-2xl tabular-nums mt-1">{formatNumber(total)} t</p>
          <p className="text-xs text-muted-foreground mt-1">
            across {countries.length} countries
          </p>
        </div>
      </div>
      <div className="rounded-lg border bg-card overflow-hidden grid lg:grid-cols-[1fr_340px]">
        <div className="bg-secondary p-3 md:p-6">
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
                  "transition-colors duration-200",
                  c.name === (aliases[selected] ?? selected)
                    ? "fill-accent/30 stroke-accent"
                    : "fill-muted stroke-secondary",
                )}
                strokeWidth="0.5"
              />
            ))}
            {countries.map(
              (c) =>
                c.location && (
                  <circle
                    key={c.country}
                    cx={c.location.x}
                    cy={c.location.y}
                    r={26 * Math.sqrt(c.tonnes / max)}
                    className={cn(
                      "cursor-pointer stroke-primary transition-colors duration-200 focus:outline-none focus-visible:stroke-accent focus-visible:stroke-[3]",
                      selected === c.country
                        ? "fill-primary"
                        : "fill-primary/25 hover:fill-primary/50",
                    )}
                    strokeWidth={1.25}
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
                  "min-h-9 rounded-full border px-3.5 text-xs font-medium transition-colors",
                  selected === c.country
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border hover:border-foreground/40",
                )}
              >
                {c.country}
                <span className="ml-1.5 opacity-70">
                  {formatPercentage(c.tonnes / total)}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
            Country-level locations; the dataset has no project coordinates.
            Public-domain outline:{" "}
            <a
              href="https://www.naturalearthdata.com/about/terms-of-use/"
              className="underline hover:text-accent"
            >
              Natural Earth
            </a>
            .
          </p>
          {countries.some((c) => !c.location) && (
            <p className="text-xs text-destructive mt-2">
              Countries without a map match remain available in the selector.
            </p>
          )}
        </div>
        <div
          className="border-t lg:border-t-0 lg:border-l p-6"
          aria-live="polite"
        >
          <p className="eyebrow">Country exposure</p>
          <h3 className="font-heading text-2xl mt-2">
            {active?.country ?? "No holdings"}
          </h3>
          <p className="font-heading text-4xl tabular-nums mt-4">
            {formatNumber(active?.tonnes ?? 0)}
            <span className="font-mono text-sm font-normal text-muted-foreground ml-2">
              t
            </span>
          </p>
          <dl className="font-mono text-sm mt-4 border-y divide-y">
            <div className="flex justify-between py-2">
              <dt className="text-muted-foreground">Share</dt>
              <dd className="tabular-nums">
                {formatPercentage(total ? (active?.tonnes ?? 0) / total : 0)}
              </dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-muted-foreground">Projects</dt>
              <dd className="tabular-nums">{active?.projects.length ?? 0}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-muted-foreground">Avg per project</dt>
              <dd className="tabular-nums">
                {active && active.projects.length > 0
                  ? formatNumber(
                      Math.round(active.tonnes / active.projects.length),
                    )
                  : 0}
              </dd>
            </div>
          </dl>
          <ul className="mt-4 divide-y">
            {active?.projects.map((h) => (
              <li key={h.credit_id} className="py-3 text-sm">
                <p className="font-medium leading-snug">{h.project_name}</p>
                <p className="font-mono text-xs text-muted-foreground mt-1">
                  {h.credit_id} · {h.registry} · {formatNumber(h.tonnes)} t
                </p>
                {h.project_type && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {h.project_type}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

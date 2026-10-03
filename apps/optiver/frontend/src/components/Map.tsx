"use client";

import { useState } from "react";
import world from "@/data/world-map.json";
import { HoldingRow } from "@/types/report";
import { cn, formatNumber, formatPercentage } from "@/lib/utils";

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
    <section aria-labelledby="map-title" className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">
          Where the portfolio lives
        </p>
        <h2 id="map-title" className="text-3xl font-heading font-bold">
          Global exposure, visible at a glance.
        </h2>
        <p className="text-muted-foreground mt-3">
          Circle area represents purchased tonnes. Select a country to inspect
          its projects.
        </p>
      </div>
      <div className="rounded-xl border bg-card overflow-hidden grid lg:grid-cols-[1fr_300px]">
        <div className="bg-secondary/30 p-3 md:p-6">
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
                className={
                  c.name === (aliases[selected] ?? selected)
                    ? "fill-primary/25 stroke-primary/30"
                    : "fill-muted stroke-background"
                }
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
                      "cursor-pointer stroke-primary focus:outline-none focus:stroke-amber-600 focus:stroke-[3]",
                      selected === c.country
                        ? "fill-primary/75"
                        : "fill-primary/30 hover:fill-primary/60",
                    )}
                    strokeWidth={selected === c.country ? 2 : 1}
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
                      {`${c.country}: ${formatNumber(c.tonnes)} tonnes`}
                    </title>
                  </circle>
                ),
            )}
          </svg>
          <div className="flex flex-wrap gap-2">
            {countries.map((c) => (
              <button
                key={c.country}
                type="button"
                onClick={() => setSelected(c.country)}
                aria-pressed={selected === c.country}
                className={cn(
                  "text-xs rounded-full border px-3 py-2 focus-visible:outline-2 focus-visible:outline-primary",
                  selected === c.country
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border hover:bg-secondary",
                )}
              >
                {c.country}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Country-level locations; the dataset has no project coordinates.
            Public-domain outline:{" "}
            <a
              href="https://www.naturalearthdata.com/about/terms-of-use/"
              className="underline"
            >
              Natural Earth
            </a>
            .
          </p>
          {countries.some((c) => !c.location) && (
            <p className="text-xs text-amber-700 mt-2">
              Countries without a map match remain available in the country
              selector.
            </p>
          )}
        </div>
        <div
          className="border-t lg:border-t-0 lg:border-l p-6"
          aria-live="polite"
        >
          <p className="text-xs text-muted-foreground mb-1">Country exposure</p>
          <h3 className="font-heading text-2xl font-bold">
            {active?.country ?? "No holdings"}
          </h3>
          <p className="text-3xl font-heading text-primary mt-4">
            {formatNumber(active?.tonnes ?? 0)}
            <span className="text-xs font-sans ml-2">tonnes</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {formatPercentage(total ? (active?.tonnes ?? 0) / total : 0)} of the
            portfolio · {active?.projects.length ?? 0}{" "}
            {active?.projects.length === 1 ? "project" : "projects"}
          </p>
          <ul className="mt-5 space-y-3">
            {active?.projects.map((h) => (
              <li key={h.credit_id} className="text-sm border-t pt-3">
                <p>{h.project_name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatNumber(h.tonnes)} tonnes · {h.registry}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

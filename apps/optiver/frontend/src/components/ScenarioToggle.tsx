"use client";

import { cn } from "@/lib/utils";

export function ScenarioToggle({
  values,
  selected,
  onChange,
}: {
  values: number[];
  selected: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="eyebrow">What if projects fail together?</legend>
      <div className="flex flex-wrap gap-2">
        {values.map((rho) => (
          <button
            key={rho}
            type="button"
            aria-pressed={selected === String(rho)}
            onClick={() => onChange(String(rho))}
            className={cn(
              "min-h-11 rounded-full border px-5 py-2 text-sm font-medium transition-colors",
              selected === String(rho)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:border-foreground/40",
            )}
          >
            {rho === 0
              ? "No shared risk"
              : rho < 0.5
                ? "Some shared risk"
                : "High shared risk"}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground max-w-2xl">
        This changes how often projects fail together in our simulation. It is
        an assumption, not a measured rate. The credits bought and their cost
        stay the same.
      </p>
    </fieldset>
  );
}

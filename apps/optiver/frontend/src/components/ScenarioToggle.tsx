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
      <legend className="eyebrow">Stress the shared risks</legend>
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
            ρ = {rho}
            <span className="ml-2 text-xs opacity-80">
              {rho === 0 ? "Independent" : rho < 0.5 ? "Moderate" : "Strong"}
            </span>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground max-w-2xl">
        ρ is assumed shared latent variance, not measured failure correlation.
        Changing it updates modelled hit rates across this page; allocations and
        costs stay fixed.
      </p>
    </fieldset>
  );
}

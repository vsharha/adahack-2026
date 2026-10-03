"use client";

import { useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HelpModal() {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <Button
        variant="secondary"
        onClick={() => dialog.current?.showModal()}
        aria-haspopup="dialog"
        className="h-9 rounded-full px-4 text-sm font-medium"
      >
        How to read
      </Button>
      <dialog
        ref={dialog}
        aria-labelledby="help-title"
        aria-describedby="help-intro"
        className="m-auto w-[calc(100%-2rem)] max-w-lg max-h-[85vh] overflow-y-auto rounded-lg border border-border bg-card text-foreground p-6 shadow-[0_24px_64px_-24px_rgb(14_26_12/0.45)] backdrop:bg-black/40"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="help-title" className="font-heading text-2xl">
            Read the portfolio in five steps
          </h2>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close guide"
            onClick={() => dialog.current?.close()}
          >
            <X />
          </Button>
        </div>
        <p id="help-intro" className="text-sm text-muted-foreground mt-3">
          A saved simulation run for the Optiver challenge. Start with the
          delivery target, then explore what changes under shared risks.
        </p>
        <ol className="list-decimal pl-5 my-6 space-y-4 text-sm">
          <li>
            <strong>Read the investment case.</strong> Compare the target, cost
            and modelled hit rate. The confidence interval shows simulation
            sampling uncertainty.
          </li>
          <li>
            <strong>Change the risk scenario.</strong> Select ρ=0, 0.3 or 0.6.
            Larger settings mean more shared risk. Hit rates change; purchased
            credits and costs stay fixed.
          </li>
          <li>
            <strong>Compare strategies and the cost curve.</strong> See what
            extra reliability costs, and why the cheapest baseline can miss
            delivery.
          </li>
          <li>
            <strong>Explore the map and holdings.</strong> Select a country,
            then search or filter individual projects. Map points represent
            countries, not exact project locations.
          </li>
          <li>
            <strong>Take the results with you.</strong> Download the PDF
            executive summary or the JSON/CSV data for the full saved run.
          </li>
        </ol>
        <p className="text-xs text-muted-foreground border-t pt-4">
          Synthetic prices and assumed failure models. These are modelled
          outcomes, not guaranteed carbon delivery. This page does not run a new
          optimisation.
        </p>
        <Button className="mt-5 w-full" onClick={() => dialog.current?.close()}>
          Start exploring
        </Button>
      </dialog>
    </>
  );
}

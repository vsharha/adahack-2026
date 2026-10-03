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
            Understand the results in five steps
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
          This page shows saved results from the Optiver challenge. Start with
          the 100,000-tonne goal, then see what happens when projects fail.
        </p>
        <ol className="list-decimal pl-5 my-6 space-y-4 text-sm">
          <li>
            <strong>Start with our result.</strong> See how much the credits
            cost and how often they reached the goal in our tests.
          </li>
          <li>
            <strong>Change the shared-risk level.</strong> Higher levels mean
            projects are more likely to fail together in our simulation. The
            credits bought and their cost stay the same.
          </li>
          <li>
            <strong>Compare the three options.</strong> See why the cheapest
            option misses the goal more often, and what a better chance costs.
          </li>
          <li>
            <strong>Explore the projects.</strong> Select a country on the map,
            then search or filter projects. Map circles mark countries, not
            exact project sites.
          </li>
          <li>
            <strong>Keep a copy.</strong> Download the one-page PDF summary or
            the full saved data.
          </li>
        </ol>
        <p className="text-xs text-muted-foreground border-t pt-4">
          Prices are made up for the challenge, and the failure model includes
          our assumptions. These results are not a promise that credits will be
          delivered. Changing this page does not buy new credits.
        </p>
        <Button className="mt-5 w-full" onClick={() => dialog.current?.close()}>
          Start exploring
        </Button>
      </dialog>
    </>
  );
}

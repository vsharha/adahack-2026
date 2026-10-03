"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { dispatch, getDemoState, useMe } from "@/lib/demo-store";
import { hasPledged } from "@/lib/progress";
import type { Goal, User } from "@/lib/types";

interface Invitation {
  goal: Goal;
  missing: number;
  pledgers: User[];
}

export function StreetGoalInvitation({
  invitation,
  paused,
}: {
  invitation?: Invitation;
  paused: boolean;
}) {
  const me = useMe();
  const [accepted, setAccepted] = useState<Invitation | null>(null);
  const shown = accepted ?? invitation;

  useEffect(() => {
    if (!accepted || paused) return;
    const timer = window.setTimeout(() => setAccepted(null), 1700);
    return () => window.clearTimeout(timer);
  }, [accepted, paused]);

  if (!shown) return null;

  function pledge() {
    if (!shown || accepted) return;
    dispatch({ type: "pledge", goalId: shown.goal.id });
    if (hasPledged(getDemoState(), shown.goal.id, me.id)) setAccepted(shown);
  }

  return (
    <section className="relative isolate mx-5 overflow-hidden rounded-2xl bg-moss text-on-moss">
      <div className="p-5" inert={accepted !== null}>
        <p className="text-sm text-on-moss/80">
          {shown.missing === 1
            ? "1 more neighbour needed"
            : `${shown.missing} more neighbours needed`}
        </p>
        <h2 className="mt-1 text-xl leading-snug font-bold">
          {shown.goal.title}
        </h2>
        <div className="mt-3 flex items-center">
          {shown.pledgers.map((user) => (
            <Avatar
              key={user.id}
              user={user}
              className="-mr-2 size-8 text-sm ring-2 ring-background"
            />
          ))}
          <p className="ml-4 text-sm text-on-moss/90">
            {shown.pledgers.length > 0 &&
              `${shown.pledgers.map((user) => user.name).join(", ")} pledged`}
          </p>
        </div>
        <Button
          className="mt-4 w-full bg-on-moss text-moss hover:bg-on-moss/90"
          onClick={pledge}
          disabled={accepted !== null}
        >
          I&apos;ll do it too
        </Button>
      </div>
      {accepted && !paused && (
        <div
          role="status"
          aria-label={`Accepted: ${accepted.goal.title}. You pledged to join.`}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[inherit] bg-moss/70 backdrop-blur-md motion-safe:animate-[street-pledge-accepted_1700ms_ease-out_both]"
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget) setAccepted(null);
          }}
        >
          <span className="grid size-14 place-items-center rounded-full bg-on-moss text-moss">
            <Check className="size-8" strokeWidth={3} aria-hidden />
          </span>
          <p className="text-xl font-bold">Accepted</p>
          <p className="text-sm">You pledged to join</p>
        </div>
      )}
    </section>
  );
}

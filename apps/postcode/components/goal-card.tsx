"use client";

import { Check } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { ActivityParticipation } from "@/components/activity-participation";
import { Button } from "@/components/ui/button";
import { dispatch, findUser, useDemoState, useMe } from "@/lib/demo-store";
import {
  hasHouseholdCompleted,
  hasPledged,
  householdsCompleted,
  isUnlocked,
} from "@/lib/progress";
import type { Goal } from "@/lib/types";
import { cn } from "@/lib/utils";

function PledgeMeter({ goal }: { goal: Goal & { threshold: number } }) {
  const state = useDemoState();
  const pledgers = state.pledges
    .filter((p) => p.goalId === goal.id)
    .map((p) => findUser(state, p.userId));
  const slots = Math.max(goal.threshold, pledgers.length);

  return (
    <ol className="flex flex-wrap gap-1.5" aria-hidden>
      {Array.from({ length: slots }, (_, i) => {
        const pledger = pledgers[i];
        return (
          <li key={i} title={pledger?.name}>
            {pledger ? (
              <Avatar
                user={pledger}
                className={cn(
                  "size-8 text-sm",
                  pledger.id === state.currentUserId &&
                    "ring-2 ring-moss ring-offset-2 ring-offset-card",
                )}
              />
            ) : (
              <span className="block size-8 rounded-full border-2 border-dashed border-muted-foreground/40" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function GoalCard({ goal, scope }: { goal: Goal; scope: string }) {
  const state = useDemoState();
  const user = useMe();
  const unlocked = isUnlocked(state, goal);
  const pledged = hasPledged(state, goal.id, user.id);
  const done = hasHouseholdCompleted(state, goal.id, user.householdId);
  const doneCount = householdsCompleted(state, goal.id);
  const pledges = state.pledges.filter((p) => p.goalId === goal.id).length;
  const canMarkDone = unlocked && (goal.level === "household" || pledged);

  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-xl border bg-card p-5 transition-colors duration-500",
        unlocked && goal.level !== "household" && "border-moss/50",
      )}
    >
      <header className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-muted-foreground">{scope}</p>
        <p className="shrink-0 tabular-nums text-sm text-moss-ink">
          +{goal.points} contribution
        </p>
      </header>

      <div className="space-y-1.5">
        <h3 className="text-lg leading-snug font-bold">{goal.title}</h3>
        <p>{goal.description}</p>
        <p className="text-sm text-muted-foreground">Why here: {goal.basis}</p>
        <p className="text-xs text-muted-foreground">
          {goal.activity
            ? "Contribution awarded after organiser confirmation"
            : "Self-reported · no reward points"}
        </p>
      </div>

      {goal.level !== "household" && (
        <div className="space-y-2">
          <PledgeMeter goal={goal} />
          <p className="text-sm" aria-live="polite">
            {unlocked ? (
              <span className="font-bold text-moss-ink">
                Going ahead: {pledges} neighbours pledged
              </span>
            ) : (
              <>
                <span className="tabular-nums">
                  {pledges} of {goal.threshold}
                </span>{" "}
                neighbours have pledged. It goes ahead at {goal.threshold}.
              </>
            )}
          </p>
        </div>
      )}

      <footer className="mt-auto flex flex-wrap items-center gap-3">
        {goal.activity ? (
          !pledged ? (
            <Button
              onClick={() => dispatch({ type: "pledge", goalId: goal.id })}
            >
              {unlocked ? "Join in" : "Pledge"}
            </Button>
          ) : (
            <p className="text-sm text-moss-ink">You pledged to join</p>
          )
        ) : done ? (
          <p className="flex items-center gap-1.5 font-bold text-moss-ink">
            <Check className="size-4" /> Your household has done this
          </p>
        ) : canMarkDone ? (
          <Button
            onClick={() => dispatch({ type: "mark-done", goalId: goal.id })}
          >
            Mark as done
          </Button>
        ) : pledged ? (
          <Button
            variant="outline"
            onClick={() =>
              dispatch({ type: "withdraw-pledge", goalId: goal.id })
            }
          >
            Withdraw pledge
          </Button>
        ) : (
          <Button onClick={() => dispatch({ type: "pledge", goalId: goal.id })}>
            {unlocked ? "Join in" : "Pledge"}
          </Button>
        )}
        {doneCount > 0 && goal.level !== "household" && (
          <p className="text-sm text-muted-foreground">
            {doneCount} {doneCount === 1 ? "household has" : "households have"}{" "}
            done it
          </p>
        )}
      </footer>
      {goal.activity && unlocked && <ActivityParticipation goal={goal} />}
    </article>
  );
}

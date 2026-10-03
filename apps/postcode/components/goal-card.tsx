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
import { useNotificationTarget } from "@/lib/use-notification-target";

const activityDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Europe/London",
});

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

export function GoalCard({
  goal,
  scope,
  focused = false,
}: {
  goal: Goal;
  scope: string;
  focused?: boolean;
}) {
  const itemId = `goal-${goal.id}`;
  useNotificationTarget(itemId, focused);
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
      id={itemId}
      tabIndex={focused ? -1 : undefined}
      data-notification-target={focused ? "true" : undefined}
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-4 transition-colors duration-500",
        focused && "scroll-mt-[calc(var(--status-bar)+1rem)] outline-none",
      )}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-muted-foreground">{scope}</p>
        <p className="tabular-nums text-xs text-muted-foreground">
          +{goal.points} contribution
          {goal.activity && ` · up to ${goal.activity.rewardPoints} rewards`}
        </p>
      </header>

      <div className="space-y-1.5">
        <h3 className="text-lg leading-snug font-bold">{goal.title}</h3>
        {goal.activity && (
          <>
            <p className="text-sm">
              <time dateTime={goal.activity.scheduledAt}>
                {activityDate.format(new Date(goal.activity.scheduledAt))}
              </time>
              {goal.activity.durationMinutes &&
                ` · ${goal.activity.durationMinutes} minutes`}
            </p>
            <p className="text-xs text-muted-foreground">
              Demo activity · one organiser confirms attendance
            </p>
          </>
        )}
        {!goal.activity && (
          <p className="text-xs text-muted-foreground">
            Self-reported · no reward points
          </p>
        )}
      </div>

      {goal.level !== "household" && (
        <div className="space-y-2">
          <PledgeMeter goal={goal} />
          <p className="text-sm" aria-live="polite">
            {unlocked ? (
              <span className="flex items-center gap-1.5 font-bold">
                <Check className="size-4" aria-hidden /> Going ahead · {pledges}{" "}
                neighbours
              </span>
            ) : (
              <>
                <span className="tabular-nums">
                  {pledges} of {goal.threshold}
                </span>{" "}
                pledged · {goal.threshold - pledges} more needed
              </>
            )}
          </p>
        </div>
      )}

      {(!goal.activity || !pledged) && (
        <footer className="mt-auto flex flex-wrap items-center gap-3">
          {goal.activity ? (
            !pledged ? (
              <Button
                onClick={() => dispatch({ type: "pledge", goalId: goal.id })}
              >
                {unlocked ? "Join in" : "Pledge"}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                You pledged to join
              </p>
            )
          ) : done ? (
            <p className="flex items-center gap-1.5 font-bold">
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
            <Button
              onClick={() => dispatch({ type: "pledge", goalId: goal.id })}
            >
              {unlocked ? "Join in" : "Pledge"}
            </Button>
          )}
          {doneCount > 0 && goal.level !== "household" && (
            <p className="text-sm text-muted-foreground">
              {doneCount}{" "}
              {doneCount === 1 ? "household has" : "households have"} done it
            </p>
          )}
        </footer>
      )}
      {goal.activity && <ActivityParticipation goal={goal} />}
    </article>
  );
}

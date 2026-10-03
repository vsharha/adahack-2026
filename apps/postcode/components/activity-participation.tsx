"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { dispatch, findUser, useDemoState, useMe } from "@/lib/demo-store";
import type { Goal } from "@/lib/types";
import { isUnlocked } from "@/lib/progress";
import { notificationHref } from "@/lib/notification-target";
import { cn } from "@/lib/utils";

export function ActivityParticipation({ goal }: { goal: Goal }) {
  const state = useDemoState();
  const me = useMe();
  const activity = goal.activity;
  if (!activity) return null;
  const claim = state.actions.findLast(
    (action) =>
      action.activityId === activity.id &&
      action.householdId === me.householdId,
  );
  const pledged = state.pledges.some(
    (pledge) =>
      pledge.goalId === goal.id &&
      findUser(state, pledge.userId)?.householdId === me.householdId,
  );
  const organiser = activity.organiserIds.includes(me.id);
  const ready = isUnlocked(state, goal);
  const scheduled = new Date().toISOString() >= activity.scheduledAt;
  const awarded =
    state.rewardEarnings.find((earning) => earning.actionId === claim?.id)
      ?.points ?? 0;
  const stage =
    claim?.status === "confirmed" ? 2 : claim?.status === "pending" ? 1 : 0;
  if (!pledged && !organiser) return null;

  return (
    <section
      className="space-y-3 border-t pt-3"
      aria-label="Activity participation"
    >
      {pledged && (
        <ol className="grid grid-cols-3 gap-2" aria-label="Activity progress">
          {["Pledged", "Reported", "Confirmed"].map((step, index) => (
            <li
              key={step}
              aria-current={index === stage ? "step" : undefined}
              className={cn(
                "flex items-center justify-center gap-1 text-xs",
                index <= stage
                  ? "font-bold text-moss-ink"
                  : "text-muted-foreground",
              )}
            >
              {index < stage || stage === 2 ? (
                <Check className="size-3 shrink-0" aria-hidden />
              ) : null}
              {step}
            </li>
          ))}
        </ol>
      )}
      {claim?.status === "pending" ? (
        <>
          <p className="text-sm text-muted-foreground" role="status">
            Waiting for one organiser to confirm.
          </p>
          <Link
            href={notificationHref({ tab: "activity", actionId: claim.id })}
            className={buttonVariants({ variant: "outline" })}
          >
            View report
          </Link>
        </>
      ) : claim?.status === "confirmed" ? (
        <>
          <p className="text-sm text-moss-ink" role="status">
            {findUser(state, claim.confirmedBy ?? null)?.name} confirmed · +
            {claim.contributionPoints} contribution · +{awarded} rewards
          </p>
          <Link href="/rewards" className={buttonVariants()}>
            View rewards
          </Link>
        </>
      ) : pledged ? (
        <>
          {claim?.status === "declined" && (
            <p className="text-sm" role="status">
              Declined: {claim.declineReason}
            </p>
          )}
          {ready && (
            <Button
              disabled={!scheduled}
              onClick={() =>
                dispatch({ type: "report-attendance", goalId: goal.id })
              }
            >
              {claim?.status === "declined"
                ? "Report attendance again"
                : "Report attendance"}
            </Button>
          )}
          {ready && !scheduled && (
            <p className="text-xs text-muted-foreground">
              Report after the activity starts.
            </p>
          )}
        </>
      ) : (
        <Link
          href="/activity"
          className={buttonVariants({ variant: "outline" })}
        >
          Review attendance
        </Link>
      )}
    </section>
  );
}

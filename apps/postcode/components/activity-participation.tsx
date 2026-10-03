"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { dispatch, findUser, useDemoState, useMe } from "@/lib/demo-store";
import type { Goal } from "@/lib/types";
import { rewardAward } from "@/lib/rewards";
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
  const canMarkHeld =
    isUnlocked(state, goal) && new Date().toISOString() >= activity.scheduledAt;
  const available = rewardAward(
    state,
    me.householdId,
    activity.rewardPoints,
    new Date().toISOString(),
  );
  const awarded =
    state.rewardEarnings.find((earning) => earning.actionId === claim?.id)
      ?.points ?? 0;
  const names = activity.organiserIds
    .map((id) => findUser(state, id)?.name)
    .filter(Boolean)
    .join(" and ");
  const confirmingNames = activity.organiserIds
    .map((id) => findUser(state, id))
    .filter((user) => user && user.householdId !== me.householdId)
    .map((user) => user?.name)
    .join(" or ");
  const stage =
    claim?.status === "confirmed"
      ? 4
      : claim?.status === "pending"
        ? 3
        : activity.heldAt
          ? 2
          : isUnlocked(state, goal)
            ? 1
            : 0;
  const steps = [
    pledged ? "Pledged" : "Pledges",
    "Going ahead",
    "Held",
    "Reported",
    "Confirmed",
  ];
  return (
    <section
      className="space-y-3 border-t pt-3"
      aria-label="Activity participation"
    >
      <ol className="grid grid-cols-5 gap-1" aria-label="Activity progress">
        {steps.map((step, index) => (
          <li
            key={step}
            aria-current={index === stage ? "step" : undefined}
            className={cn(
              "flex flex-col items-center gap-1 text-center text-[0.6rem] leading-tight",
              index <= stage
                ? "font-bold text-moss-ink"
                : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "grid size-6 place-items-center rounded-full border",
                index <= stage && "border-moss bg-moss/15",
              )}
              aria-hidden
            >
              {index < stage || stage === 4 ? (
                <Check className="size-3.5" />
              ) : (
                index + 1
              )}
            </span>
            {step}
          </li>
        ))}
      </ol>
      {!activity.heldAt ? (
        <>
          <p className="text-sm text-muted-foreground">
            {isUnlocked(state, goal)
              ? `${names} will mark the activity as held before you report attendance.`
              : "Waiting for enough neighbours to pledge."}
          </p>
          {organiser && (
            <Button
              variant="outline"
              disabled={!canMarkHeld}
              onClick={() =>
                dispatch({ type: "mark-activity-held", goalId: goal.id })
              }
            >
              Mark activity as held
            </Button>
          )}
        </>
      ) : claim?.status === "pending" ? (
        <>
          <p className="text-sm font-bold text-moss-ink" role="status">
            Awaiting confirmation · no points awarded yet
          </p>
          <p className="text-sm text-muted-foreground">
            {confirmingNames || "An organiser outside your household"} can
            confirm your attendance.
          </p>
          <Link
            href={notificationHref({ tab: "activity", actionId: claim.id })}
            className={buttonVariants({ variant: "outline" })}
          >
            View attendance report
          </Link>
        </>
      ) : claim?.status === "confirmed" ? (
        <>
          <p className="text-sm font-bold text-moss-ink" role="status">
            Attendance confirmed by{" "}
            {findUser(state, claim.confirmedBy ?? null)?.name} · +
            {claim.contributionPoints} contribution · +{awarded} rewards
          </p>
          <Link href="/rewards" className={buttonVariants()}>
            View rewards
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Activity held.{" "}
            {pledged
              ? "Report your household’s attendance for organiser confirmation."
              : organiser
                ? "Households can now report attendance."
                : "Join this activity to report attendance."}
          </p>
          {claim?.status === "declined" && (
            <p className="text-sm" role="status">
              Claim declined: {claim.declineReason}. If this was a mistake,
              report again.
            </p>
          )}
          {pledged ? (
            <>
              <p className="text-xs text-muted-foreground">
                If confirmed now: +{goal.points} contribution and +{available}{" "}
                rewards. Your remaining monthly allowance is checked when
                confirmed.
              </p>
              <Button
                onClick={() =>
                  dispatch({ type: "report-attendance", goalId: goal.id })
                }
              >
                {claim?.status === "declined"
                  ? "Report attendance again"
                  : "Report attendance"}
              </Button>
            </>
          ) : (
            organiser && (
              <Link
                href="/activity"
                className={buttonVariants({ variant: "outline" })}
              >
                Review attendance
              </Link>
            )
          )}
        </>
      )}
    </section>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { dispatch, findUser, useDemoState, useMe } from "@/lib/demo-store";
import type { Goal } from "@/lib/types";
import { rewardAward } from "@/lib/rewards";

const date = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Europe/London",
});

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
  return (
    <section
      className="space-y-3 border-t pt-3"
      aria-label="Activity participation"
    >
      <p className="text-sm">
        <time dateTime={activity.scheduledAt}>
          {date.format(new Date(activity.scheduledAt))}
        </time>
        <span className="block text-muted-foreground">
          Organised by {names}
        </span>
      </p>
      {!activity.heldAt ? (
        <>
          <p className="text-sm text-muted-foreground">
            The organiser marks this activity as held before households can
            report attendance.
          </p>
          {organiser && (
            <Button
              variant="outline"
              onClick={() =>
                dispatch({ type: "mark-activity-held", goalId: goal.id })
              }
            >
              Mark activity as held
            </Button>
          )}
        </>
      ) : claim?.status === "pending" ? (
        <p className="text-sm font-bold text-moss-ink" role="status">
          Awaiting confirmation · no points awarded yet
        </p>
      ) : claim?.status === "confirmed" ? (
        <p className="text-sm font-bold text-moss-ink" role="status">
          Attendance confirmed by{" "}
          {findUser(state, claim.confirmedBy ?? null)?.name} · +
          {claim.contributionPoints} contribution · +{awarded} rewards
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Activity held. Report your household’s attendance; an organiser from
            another household confirms it.
          </p>
          {claim?.status === "declined" && (
            <p className="text-sm" role="status">
              Claim declined: {claim.declineReason}. If this was a mistake,
              report again.
            </p>
          )}
          {pledged ? (
            <>
              <p className="text-sm text-muted-foreground">
                If confirmed now: +{goal.points} contribution and +{available}{" "}
                reward points.{" "}
                {available < activity.rewardPoints &&
                  "Your monthly reward allowance limits this award."}{" "}
                The allowance is checked when confirmed.
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
            <p className="text-sm text-muted-foreground">
              Join this activity to report attendance.
            </p>
          )}
        </>
      )}
      <p className="text-xs text-muted-foreground">
        Confirmations are managed on the Activity tab. Reactions are
        encouragement.
      </p>
    </section>
  );
}

"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ActivityFeed } from "@/components/activity-feed";
import { markActivitySeen } from "@/lib/activity-seen";
import { useDemoState, useMe } from "@/lib/demo-store";

export function ActivityScreen() {
  const params = useSearchParams();
  const state = useDemoState();
  const me = useMe();
  const count = state.actions.length;
  const organiser = state.goals.some((goal) =>
    goal.activity?.organiserIds.includes(me.id),
  );
  const pending = state.actions.filter((claim) => {
    const activity = state.goals.find(
      (goal) => goal.id === claim.goalId,
    )?.activity;
    return (
      claim.status === "pending" &&
      activity &&
      claim.activityId === activity.id &&
      activity.organiserIds.includes(me.id) &&
      claim.householdId !== me.householdId
    );
  });
  const pendingIds = new Set(pending.map((claim) => claim.id));

  useEffect(() => {
    markActivitySeen(count);
  }, [count]);

  return (
    <div className="px-5 pt-4 pb-6">
      <h1 className="mb-4 text-2xl font-bold">Street activity</h1>
      {organiser && (
        <section className="mb-6 space-y-3" aria-labelledby="attendance-queue">
          <h2 id="attendance-queue" className="text-lg font-bold">
            Needs your confirmation{" "}
            <span className="text-moss-ink">{pending.length}</span>
          </h2>
          {pending.length ? (
            <ActivityFeed
              items={pending}
              focusedActionId={params.get("report") ?? undefined}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              No attendance waiting for your confirmation.
            </p>
          )}
        </section>
      )}
      {organiser && <h2 className="mb-3 text-lg font-bold">Recent activity</h2>}
      <ActivityFeed
        items={state.actions.filter((claim) => !pendingIds.has(claim.id))}
        focusedActionId={params.get("report") ?? undefined}
      />
    </div>
  );
}

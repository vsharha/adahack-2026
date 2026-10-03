"use client";

import { useRouter } from "next/navigation";
import { ActivityFeed } from "@/components/activity-feed";
import { StreetGoalInvitation } from "@/components/app/street-goal-invitation";
import { Avatar } from "@/components/avatar";
import { LocalContext } from "@/components/local-context";
import { StreetView } from "@/components/street-view";
import { Button } from "@/components/ui/button";
import { streetPostcode } from "@/data/seed";
import { findUser, useDemoState, useMe } from "@/lib/demo-store";
import {
  goalsForUser,
  hasPledged,
  isUnlocked,
  pledgeCount,
  sharedGoalsGoingAhead,
  totalPoints,
} from "@/lib/progress";

function greeting(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** The shared goal visible to the user that is closest to going ahead without them. */
function useGoalThatNeedsYou() {
  const state = useDemoState();
  const me = useMe();
  return goalsForUser(state, me)
    .flatMap((goal) =>
      goal.level === "household" ||
      isUnlocked(state, goal) ||
      hasPledged(state, goal.id, me.id)
        ? []
        : [{ goal, missing: goal.threshold - pledgeCount(state, goal.id) }],
    )
    .sort((a, b) => a.missing - b.missing)[0];
}

/** `active` is false while the screen is kept alive behind another tab. */
export function StreetScreen({
  active = true,
  celebrating = false,
}: {
  active?: boolean;
  celebrating?: boolean;
}) {
  const router = useRouter();
  const state = useDemoState();
  const me = useMe();
  const needsYou = useGoalThatNeedsYou();
  const neighbours = state.users.length - 1;
  const total = totalPoints(state);
  const goingAhead = sharedGoalsGoingAhead(state).length;
  const pledgers = needsYou
    ? state.pledges
        .filter((p) => p.goalId === needsYou.goal.id)
        .map((p) => findUser(state, p.userId))
        .filter((u) => u !== undefined)
    : [];

  return (
    <div className="space-y-4 pb-6">
      <header className="flex items-center justify-between px-5 pt-3">
        <div>
          <p className="text-xs text-muted-foreground">
            {greeting(new Date())}
          </p>
          <h1 className="text-xl font-bold">{me.name}</h1>
        </div>
        <button
          type="button"
          onClick={() => router.push("/you")}
          aria-label="Your profile"
          className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Avatar user={me} />
        </button>
      </header>

      <section>
        <div className="flex items-baseline justify-between px-5">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            {streetPostcode}
          </h2>
          <p className="text-sm text-muted-foreground">
            {neighbours} neighbours on the app
          </p>
        </div>
        <div className="mt-1">
          <StreetView
            youHouseholdId={me.householdId}
            showNeighbours
            active={active}
            compact
          />
        </div>
      </section>

      <StreetGoalInvitation
        key={me.id}
        invitation={needsYou ? { ...needsYou, pledgers } : undefined}
        paused={!active || celebrating}
      />

      <section>
        <dl className="mx-5 grid grid-cols-2 divide-x rounded-xl border bg-card text-center">
          <div className="flex flex-col gap-1 p-3">
            <dt className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Street contribution
            </dt>
            <dd className="tabular-nums text-xl font-bold">{total}</dd>
          </div>
          <div className="flex flex-col gap-1 p-3">
            <dt className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Goals going ahead
            </dt>
            <dd className="tabular-nums text-xl font-bold">{goingAhead}</dd>
          </div>
        </dl>
        <p className="mt-2 px-5 text-xs text-muted-foreground">
          Illustrated progress: contribution colours houses; unlocked goals add
          trees. No measured savings or real planting.
        </p>
      </section>

      <LocalContext />

      <section className="px-5">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-bold">Completed reports</h2>
          <Button
            variant="link"
            className="px-0"
            onClick={() => router.push("/activity")}
          >
            See all
          </Button>
        </div>
        <ActivityFeed limit={2} completedOnly />
      </section>
    </div>
  );
}

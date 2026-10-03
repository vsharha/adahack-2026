"use client";

import { useRouter } from "next/navigation";
import { ActivityFeed } from "@/components/activity-feed";
import { Avatar } from "@/components/avatar";
import { StreetDrawing } from "@/components/street-drawing";
import { Button } from "@/components/ui/button";
import { dispatch, findUser, useDemoState, useMe } from "@/lib/demo-store";
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

export function StreetScreen() {
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
    <div className="space-y-6 pb-6">
      <header className="flex items-center justify-between px-5 pt-4">
        <div>
          <p className="text-muted-foreground">{greeting(new Date())},</p>
          <h1 className="text-2xl font-bold">{me.name}</h1>
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
          <h2 className="font-sign text-4xl font-semibold text-foreground">
            EH8
          </h2>
          <p className="text-sm text-muted-foreground">
            {neighbours} neighbours on the app
          </p>
        </div>
        <div className="mt-2">
          <StreetDrawing youHouseholdId={me.householdId} />
        </div>
        <dl className="mx-5 mt-3 grid grid-cols-2 divide-x rounded-xl border bg-card text-center">
          <div className="flex flex-col gap-1 p-3">
            <dt className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Street points
            </dt>
            <dd className="font-mono text-xl font-bold">{total}</dd>
          </div>
          <div className="flex flex-col gap-1 p-3">
            <dt className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Goals going ahead
            </dt>
            <dd className="font-mono text-xl font-bold">{goingAhead}</dd>
          </div>
        </dl>
      </section>

      {needsYou && (
        <section className="mx-5 rounded-2xl bg-moss p-5 text-on-moss">
          <p className="font-mono text-sm text-on-moss/80">
            {needsYou.missing === 1
              ? "1 more neighbour needed"
              : `${needsYou.missing} more neighbours needed`}
          </p>
          <h2 className="mt-1 text-xl leading-snug font-bold">
            {needsYou.goal.title}
          </h2>
          <div className="mt-3 flex items-center">
            {pledgers.map((u) => (
              <Avatar
                key={u.id}
                user={u}
                className="-mr-2 size-8 text-sm ring-2 ring-moss"
              />
            ))}
            <p className="ml-4 text-sm text-on-moss/90">
              {pledgers.length > 0 &&
                `${pledgers.map((u) => u.name).join(", ")} pledged`}
            </p>
          </div>
          <Button
            className="mt-4 w-full bg-on-moss text-moss hover:bg-on-moss/90"
            onClick={() =>
              dispatch({ type: "pledge", goalId: needsYou.goal.id })
            }
          >
            I&apos;ll do it too
          </Button>
        </section>
      )}

      <section className="px-5">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-bold">Done on the street</h2>
          <Button
            variant="link"
            className="px-0"
            onClick={() => router.push("/activity")}
          >
            See all
          </Button>
        </div>
        <ActivityFeed limit={2} />
      </section>
    </div>
  );
}

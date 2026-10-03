"use client";

import { ActivityFeed } from "@/components/activity-feed";
import { GoalCard } from "@/components/goal-card";
import { StreetDrawing } from "@/components/street-drawing";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  householdSuggestions,
  households,
  interestGroups,
  users,
} from "@/data/seed";
import { dispatch, useCurrentUser, useDemoState } from "@/lib/demo-store";
import {
  goalsForUser,
  householdPoints,
  sharedGoalsGoingAhead,
  totalPoints,
} from "@/lib/progress";
import type { Goal } from "@/lib/types";

const userItems = users.map((u) => ({
  value: u.id,
  label: `${u.name}, ${households.find((h) => h.id === u.householdId)?.label}`,
}));

function scopeLabel(goal: Goal): string {
  switch (goal.level) {
    case "postcode":
      return "Everyone in EH8";
    case "group":
      return `${interestGroups.find((g) => g.id === goal.groupId)?.name} group`;
    case "household":
      return "Your household";
  }
}

function GoalSection({
  title,
  intro,
  goals,
  empty,
  children,
}: {
  title: string;
  intro: string;
  goals: Goal[];
  empty?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-muted-foreground">{intro}</p>
      </div>
      {goals.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} scope={scopeLabel(goal)} />
          ))}
        </div>
      ) : (
        empty && (
          <p className="rounded-xl border border-dashed p-5 text-muted-foreground">
            {empty}
          </p>
        )
      )}
      {children}
    </section>
  );
}

export function StreetApp() {
  const state = useDemoState();
  const user = useCurrentUser();
  const goals = goalsForUser(state, user);
  const total = totalPoints(state);
  const shared = state.goals.filter((g) => g.level !== "household");
  const goingAhead = sharedGoalsGoingAhead(state).length;
  const contributing = households.filter(
    (h) => householdPoints(state, h.id) > 0,
  ).length;
  const adopted = new Set(
    goals.filter((g) => g.level === "household").map((g) => g.title),
  );
  const suggestions = householdSuggestions.filter((s) => !adopted.has(s.title));
  const myGroups = interestGroups.filter((g) => user.interests.includes(g.id));

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3 py-5">
        <p className="font-bold">Greener by postcode</p>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Viewing as</span>
          <Select
            items={userItems}
            value={user.id}
            onValueChange={(userId) =>
              userId && dispatch({ type: "switch-user", userId })
            }
          >
            <SelectTrigger className="min-w-44 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {userItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </header>

      <section className="pt-6">
        <h1 className="font-heading text-5xl font-semibold tracking-wide text-slate sm:text-7xl">
          EH8
        </h1>
        <p className="mt-1 text-lg text-muted-foreground">
          Edinburgh. Every house on the street greens as its household acts.
        </p>
        <div className="-mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <StreetDrawing />
        </div>
        <p className="mt-3 font-mono text-sm">
          {total} points from {contributing} of {households.length} households ·{" "}
          {goingAhead} of {shared.length} shared goals going ahead
        </p>
      </section>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-12">
          <GoalSection
            title="The whole postcode"
            intro="A shared goal goes ahead once enough neighbours pledge to it. Each street tree is one that did."
            goals={goals.filter((g) => g.level === "postcode")}
          />
          <GoalSection
            title="Your groups"
            intro={
              myGroups.length > 0
                ? `You're in ${myGroups.map((g) => g.name.toLowerCase()).join(", ")}.`
                : "Join a group to see its goals."
            }
            goals={goals.filter((g) => g.level === "group")}
            empty="None of your groups has a goal yet. New suggestions for them will appear here."
          />
          <GoalSection
            title="Your household"
            intro="Goals just for your home. No pledges needed."
            goals={goals.filter((g) => g.level === "household")}
          >
            {suggestions.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold">Suggested for EH8 homes</h3>
                <ul className="divide-y rounded-xl border bg-card">
                  {suggestions.map((s) => (
                    <li
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-3 p-4"
                    >
                      <div>
                        <p className="font-bold">{s.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {s.description}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() =>
                          dispatch({
                            type: "adopt-suggestion",
                            suggestionId: s.id,
                          })
                        }
                      >
                        Add to our goals
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </GoalSection>
        </div>

        <aside className="space-y-4">
          <h2 className="text-xl font-bold">Done on the street</h2>
          <ActivityFeed />
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => dispatch({ type: "reset" })}
          >
            Reset demo
          </Button>
        </aside>
      </div>
    </div>
  );
}

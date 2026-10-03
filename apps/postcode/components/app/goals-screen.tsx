"use client";

import { GoalCard } from "@/components/goal-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { householdSuggestions, interestGroups } from "@/data/seed";
import { dispatch, useDemoState, useMe } from "@/lib/demo-store";
import { goalsForUser } from "@/lib/progress";
import type { Goal } from "@/lib/types";

function scopeLabel(goal: Goal): string {
  switch (goal.level) {
    case "postcode":
      return "Everyone in EH8";
    case "group":
      return `${interestGroups.find((g) => g.id === goal.groupId)?.name}`;
    case "household":
      return "Your household";
  }
}

function GoalList({ goals, empty }: { goals: Goal[]; empty: string }) {
  if (goals.length === 0)
    return (
      <p className="rounded-xl border border-dashed p-5 text-muted-foreground">
        {empty}
      </p>
    );
  return (
    <div className="space-y-4">
      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} scope={scopeLabel(goal)} />
      ))}
    </div>
  );
}

export function GoalsScreen() {
  const state = useDemoState();
  const me = useMe();
  const goals = goalsForUser(state, me);
  const adopted = new Set(
    goals.filter((g) => g.level === "household").map((g) => g.title),
  );
  const suggestions = householdSuggestions.filter((s) => !adopted.has(s.title));

  return (
    <div className="px-5 pt-4 pb-6">
      <h1 className="text-2xl font-bold">Goals</h1>
      <Tabs defaultValue="postcode" className="mt-4">
        <TabsList className="w-full">
          <TabsTrigger value="postcode">Street</TabsTrigger>
          <TabsTrigger value="group">Groups</TabsTrigger>
          <TabsTrigger value="household">Home</TabsTrigger>
        </TabsList>

        <TabsContent value="postcode" className="mt-4 space-y-4">
          <p className="text-muted-foreground">
            A goal goes ahead once enough neighbours pledge to it.
          </p>
          <GoalList
            goals={goals.filter((g) => g.level === "postcode")}
            empty="No street goals yet."
          />
        </TabsContent>

        <TabsContent value="group" className="mt-4 space-y-4">
          <p className="text-muted-foreground">
            For neighbours who share your interests.
          </p>
          <GoalList
            goals={goals.filter((g) => g.level === "group")}
            empty="None of your groups has a goal yet. New suggestions for them will appear here."
          />
        </TabsContent>

        <TabsContent value="household" className="mt-4 space-y-4">
          <p className="text-muted-foreground">
            Just for your home. No pledges needed.
          </p>
          <GoalList
            goals={goals.filter((g) => g.level === "household")}
            empty="Your household has no goals yet. Pick one below."
          />
          {suggestions.length > 0 && (
            <div className="space-y-2 pt-2">
              <h2 className="font-bold">Suggested for EH8 homes</h2>
              <ul className="divide-y rounded-xl border bg-card">
                {suggestions.map((s) => (
                  <li key={s.id} className="space-y-2 p-4">
                    <p className="font-bold">{s.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {s.description}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
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
        </TabsContent>
      </Tabs>
    </div>
  );
}

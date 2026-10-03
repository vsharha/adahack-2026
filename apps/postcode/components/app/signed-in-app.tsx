"use client";

import { useEffect, useRef, useState } from "react";
import { Celebration } from "@/components/app/celebration";
import { GoalsScreen } from "@/components/app/goals-screen";
import { StreetScreen } from "@/components/app/street-screen";
import { TabBar, type Tab } from "@/components/app/tab-bar";
import { YouScreen } from "@/components/app/you-screen";
import { ActivityFeed } from "@/components/activity-feed";
import { subscribeToEvents, useDemoState } from "@/lib/demo-store";
import { useNeighbourSimulator } from "@/lib/neighbour-simulator";

export function SignedInApp() {
  const state = useDemoState();
  const [tab, setTab] = useState<Tab>("street");
  const [celebrating, setCelebrating] = useState<string | null>(null);
  const [seenActions, setSeenActions] = useState(state.actions.length);
  const scroller = useRef<HTMLElement>(null);

  useNeighbourSimulator(celebrating === null);

  useEffect(
    () =>
      subscribeToEvents((event) => {
        if (event.type === "goal-unlocked") setCelebrating(event.goalId);
      }),
    [],
  );

  function navigate(next: Tab) {
    setTab(next);
    if (next === "activity") setSeenActions(state.actions.length);
    scroller.current?.scrollTo({ top: 0 });
  }

  const unseen =
    tab === "activity" ? 0 : Math.max(0, state.actions.length - seenActions);

  return (
    <div className="flex h-full flex-col">
      <main ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
        {tab === "street" && <StreetScreen onNavigate={navigate} />}
        {tab === "goals" && <GoalsScreen />}
        {tab === "activity" && (
          <div className="px-5 pt-4 pb-6">
            <h1 className="mb-4 text-2xl font-bold">Done on the street</h1>
            <ActivityFeed />
          </div>
        )}
        {tab === "you" && <YouScreen />}
      </main>
      <TabBar active={tab} onChange={navigate} badges={{ activity: unseen }} />
      {celebrating && (
        <Celebration
          goalId={celebrating}
          onClose={() => setCelebrating(null)}
        />
      )}
    </div>
  );
}

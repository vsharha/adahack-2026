"use client";

import { useRef, useState } from "react";
import { GoalsScreen } from "@/components/app/goals-screen";
import { StreetScreen } from "@/components/app/street-screen";
import { TabBar, type Tab } from "@/components/app/tab-bar";
import { YouScreen } from "@/components/app/you-screen";
import { ActivityFeed } from "@/components/activity-feed";

export function SignedInApp() {
  const [tab, setTab] = useState<Tab>("street");
  const scroller = useRef<HTMLElement>(null);

  function navigate(next: Tab) {
    setTab(next);
    scroller.current?.scrollTo({ top: 0 });
  }

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
      <TabBar active={tab} onChange={navigate} />
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ActivityFeed } from "@/components/activity-feed";
import { markActivitySeen } from "@/lib/activity-seen";
import { useDemoState } from "@/lib/demo-store";

export function ActivityScreen() {
  const params = useSearchParams();
  const count = useDemoState().actions.length;

  useEffect(() => {
    markActivitySeen(count);
  }, [count]);

  return (
    <div className="px-5 pt-4 pb-6">
      <h1 className="mb-4 text-2xl font-bold">Street activity</h1>
      <ActivityFeed focusedActionId={params.get("report") ?? undefined} />
    </div>
  );
}

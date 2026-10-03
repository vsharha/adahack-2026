"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Celebration } from "@/components/app/celebration";
import { TabBar } from "@/components/app/tab-bar";
import { useActivitySeen, markActivitySeen } from "@/lib/activity-seen";
import {
  getDemoState,
  subscribeToEvents,
  useDemoState,
} from "@/lib/demo-store";
import { useNeighbourSimulator } from "@/lib/neighbour-simulator";

/** Wraps the tab routes: tab bar, celebrations and scripted neighbours. */
export function SignedInShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const state = useDemoState();
  const seen = useActivitySeen();
  const [celebrating, setCelebrating] = useState<string | null>(null);
  const scroller = useRef<HTMLElement>(null);
  const signedIn = state.currentUserId !== null;

  useNeighbourSimulator(signedIn && celebrating === null);

  useEffect(() => {
    if (!signedIn) router.replace("/");
  }, [signedIn, router]);

  useEffect(() => {
    // Everything done before signing in counts as seen.
    markActivitySeen(getDemoState().actions.length);
  }, [state.currentUserId]);

  useEffect(
    () =>
      subscribeToEvents((event) => {
        if (event.type === "goal-unlocked") setCelebrating(event.goalId);
      }),
    [],
  );

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [pathname]);

  if (!signedIn) return null;

  const unseen =
    pathname === "/activity" ? 0 : Math.max(0, state.actions.length - seen);

  return (
    <div className="flex h-full flex-col">
      <main
        ref={scroller}
        className="app-scroll min-h-0 flex-1 overflow-y-auto pt-(--status-bar)"
      >
        {children}
      </main>
      <TabBar badges={{ activity: unseen }} />
      {celebrating && (
        <Celebration
          goalId={celebrating}
          onClose={() => setCelebrating(null)}
        />
      )}
    </div>
  );
}

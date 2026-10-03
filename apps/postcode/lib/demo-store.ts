"use client";

import { useSyncExternalStore } from "react";
import { reduceDemoState, type DemoAction } from "@/lib/demo-reducer";
import { initialState } from "@/data/seed";
import { findUser } from "@/lib/households";
import { sharedGoalsGoingAhead } from "@/lib/progress";
import type { DemoState, User } from "@/lib/types";

export type { DemoAction } from "@/lib/demo-reducer";
export type DemoEvent =
  | { type: "goal-unlocked"; goalId: string }
  | { type: "action-completed"; actionId: string; userId: string };

const storageKey = "postcode-demo-state-v3";
export { isPremade, nextHousehold, findUser } from "@/lib/households";

let state: DemoState | undefined;
const listeners = new Set<() => void>();
const eventListeners = new Set<(event: DemoEvent) => void>();

function addDemoActivity(saved: DemoState): DemoState {
  const goal = initialState.goals.find((item) => item.id === "g-litter-pick");
  if (!goal || saved.goals.some((item) => item.id === goal.id)) return saved;
  return {
    ...saved,
    goals: [goal, ...saved.goals],
    pledges: [
      ...saved.pledges,
      ...initialState.pledges.filter((pledge) => pledge.goalId === goal.id),
    ],
  };
}

function load(): DemoState {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) return addDemoActivity(JSON.parse(saved) as DemoState);
    const previous = localStorage.getItem("postcode-demo-state-v2");
    if (previous) {
      const old = JSON.parse(previous) as DemoState;
      const points = new Map(old.goals.map((goal) => [goal.id, goal.points]));
      return addDemoActivity({
        ...old,
        actions: old.actions.map((action) => ({
          ...action,
          status: "self-reported",
          contributionPoints: points.get(action.goalId) ?? 0,
        })),
        rewardEarnings: [],
        redemptions: [],
      });
    }
  } catch {
    // Storage can be unavailable (private windows); the seed still works.
  }
  return initialState;
}

function getSnapshot(): DemoState {
  state ??= load();
  return state;
}

/** The current state outside React, for timers and event handlers. */
export const getDemoState = getSnapshot;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function subscribeToEvents(listener: (event: DemoEvent) => void) {
  eventListeners.add(listener);
  return () => {
    eventListeners.delete(listener);
  };
}

export function dispatch(action: DemoAction) {
  const before = getSnapshot();
  state = reduceDemoState(before, action);
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // The demo keeps working in memory without storage.
  }
  listeners.forEach((l) => l());

  const emit = (event: DemoEvent) => eventListeners.forEach((l) => l(event));
  const knownActions = new Set(before.actions.map((a) => a.id));
  for (const a of state.actions) {
    if (
      (!knownActions.has(a.id) && a.status === "self-reported") ||
      (a.status === "confirmed" &&
        before.actions.find((old) => old.id === a.id)?.status !== "confirmed")
    )
      emit({ type: "action-completed", actionId: a.id, userId: a.userId });
  }
  const wasAhead = new Set(sharedGoalsGoingAhead(before).map((g) => g.id));
  for (const goal of sharedGoalsGoingAhead(state)) {
    if (!wasAhead.has(goal.id))
      emit({ type: "goal-unlocked", goalId: goal.id });
  }
}

export function useDemoState(): DemoState {
  return useSyncExternalStore(subscribe, getSnapshot, () => initialState);
}

const noopSubscribe = () => () => {};

/** False during the server render and hydration, when storage is unreadable. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/** The signed-in user; only call it below the signed-in app shell. */
export function useMe(): User {
  const state = useDemoState();
  const me = findUser(state, state.currentUserId);
  if (!me) throw new Error("No signed-in user");
  return me;
}

"use client";

import { useSyncExternalStore } from "react";
import { householdSuggestions, initialState, premadeUsers } from "@/data/seed";
import {
  hasHouseholdCompleted,
  isUnlocked,
  sharedGoalsGoingAhead,
} from "@/lib/progress";
import type { DemoState, InterestId, User } from "@/lib/types";

export type DemoAction =
  | { type: "sign-in"; userId: string }
  | { type: "sign-out" }
  | {
      type: "add-user";
      name: string;
      householdId: string;
      interests: InterestId[];
    }
  | { type: "delete-user"; userId: string }
  /** `userId` defaults to the signed-in user; scripted neighbours pass their own. */
  | { type: "pledge"; goalId: string; userId?: string }
  | { type: "withdraw-pledge"; goalId: string }
  | { type: "mark-done"; goalId: string; userId?: string }
  | {
      type: "toggle-reaction";
      actionId: string;
      emoji: string;
      userId?: string;
    }
  | { type: "adopt-suggestion"; suggestionId: string }
  | { type: "reset" };

export type DemoEvent =
  | { type: "goal-unlocked"; goalId: string }
  | { type: "action-completed"; actionId: string; userId: string };

const storageKey = "postcode-demo-state-v2";
const premadeIds = new Set(premadeUsers.map((u) => u.id));

export function isPremade(userId: string): boolean {
  return premadeIds.has(userId);
}

export function findUser(state: DemoState, userId: string | null) {
  return state.users.find((u) => u.id === userId);
}

function reduce(state: DemoState, action: DemoAction): DemoState {
  const me = findUser(state, state.currentUserId);
  switch (action.type) {
    case "sign-in":
      return findUser(state, action.userId)
        ? { ...state, currentUserId: action.userId }
        : state;
    case "sign-out":
      return { ...state, currentUserId: null };
    case "add-user": {
      const user: User = {
        id: `u-${Date.now()}`,
        name: action.name.trim(),
        householdId: action.householdId,
        interests: action.interests,
      };
      return {
        ...state,
        users: [...state.users, user],
        currentUserId: user.id,
      };
    }
    case "delete-user":
      if (isPremade(action.userId)) return state;
      return {
        ...state,
        users: state.users.filter((u) => u.id !== action.userId),
        currentUserId:
          state.currentUserId === action.userId ? null : state.currentUserId,
        pledges: state.pledges.filter((p) => p.userId !== action.userId),
        actions: state.actions
          .filter((a) => a.userId !== action.userId)
          .map((a) => ({
            ...a,
            reactions: a.reactions.filter((r) => r.userId !== action.userId),
          })),
      };
    case "reset":
      return initialState;
  }

  const userId =
    ("userId" in action ? action.userId : undefined) ?? me?.id ?? null;
  const user = findUser(state, userId);
  if (!user) return state;

  switch (action.type) {
    case "pledge":
      if (
        state.pledges.some(
          (p) => p.goalId === action.goalId && p.userId === user.id,
        )
      )
        return state;
      return {
        ...state,
        pledges: [...state.pledges, { goalId: action.goalId, userId: user.id }],
      };
    case "withdraw-pledge":
      return {
        ...state,
        pledges: state.pledges.filter(
          (p) => !(p.goalId === action.goalId && p.userId === user.id),
        ),
      };
    case "mark-done": {
      const goal = state.goals.find((g) => g.id === action.goalId);
      if (
        !goal ||
        !isUnlocked(state, goal) ||
        hasHouseholdCompleted(state, goal.id, user.householdId)
      )
        return state;
      return {
        ...state,
        actions: [
          ...state.actions,
          {
            id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            goalId: goal.id,
            userId: user.id,
            householdId: user.householdId,
            completedAt: new Date().toISOString(),
            reactions: [],
          },
        ],
      };
    }
    case "toggle-reaction":
      return {
        ...state,
        actions: state.actions.map((a) => {
          if (a.id !== action.actionId) return a;
          const mine = a.reactions.some(
            (r) => r.userId === user.id && r.emoji === action.emoji,
          );
          return {
            ...a,
            reactions: mine
              ? a.reactions.filter(
                  (r) => !(r.userId === user.id && r.emoji === action.emoji),
                )
              : [...a.reactions, { userId: user.id, emoji: action.emoji }],
          };
        }),
      };
    case "adopt-suggestion": {
      const suggestion = householdSuggestions.find(
        (s) => s.id === action.suggestionId,
      );
      if (!suggestion) return state;
      const id = `g-${user.householdId}-${suggestion.id}`;
      if (state.goals.some((g) => g.id === id)) return state;
      return {
        ...state,
        goals: [
          ...state.goals,
          {
            id,
            level: "household",
            householdId: user.householdId,
            title: suggestion.title,
            description: suggestion.description,
            basis: suggestion.basis,
            points: suggestion.points,
            origin: "suggested",
          },
        ],
      };
    }
  }
}

let state: DemoState | undefined;
const listeners = new Set<() => void>();
const eventListeners = new Set<(event: DemoEvent) => void>();

function load(): DemoState {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) return JSON.parse(saved) as DemoState;
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
  state = reduce(before, action);
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // The demo keeps working in memory without storage.
  }
  listeners.forEach((l) => l());

  const emit = (event: DemoEvent) => eventListeners.forEach((l) => l(event));
  const knownActions = new Set(before.actions.map((a) => a.id));
  for (const a of state.actions) {
    if (!knownActions.has(a.id))
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

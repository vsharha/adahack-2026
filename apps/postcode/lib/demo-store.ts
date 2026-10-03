"use client";

import { useSyncExternalStore } from "react";
import { householdSuggestions, initialState, users } from "@/data/seed";
import { hasHouseholdCompleted, isUnlocked } from "@/lib/progress";
import type { DemoState } from "@/lib/types";

export type DemoAction =
  | { type: "switch-user"; userId: string }
  | { type: "pledge"; goalId: string }
  | { type: "withdraw-pledge"; goalId: string }
  | { type: "mark-done"; goalId: string }
  | { type: "toggle-reaction"; actionId: string; emoji: string }
  | { type: "adopt-suggestion"; suggestionId: string }
  | { type: "reset" };

const storageKey = "postcode-demo-state-v1";

function currentUser(state: DemoState) {
  const user = users.find((u) => u.id === state.currentUserId);
  if (!user) throw new Error(`Unknown user ${state.currentUserId}`);
  return user;
}

function reduce(state: DemoState, action: DemoAction): DemoState {
  const user = currentUser(state);
  switch (action.type) {
    case "switch-user":
      return { ...state, currentUserId: action.userId };
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
            id: `a-${Date.now()}`,
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
    case "reset":
      return initialState;
  }
}

let state: DemoState | undefined;
const listeners = new Set<() => void>();

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

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function dispatch(action: DemoAction) {
  state = reduce(getSnapshot(), action);
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // The demo keeps working in memory without storage.
  }
  listeners.forEach((l) => l());
}

export function useDemoState(): DemoState {
  return useSyncExternalStore(subscribe, getSnapshot, () => initialState);
}

export function useCurrentUser() {
  return currentUser(useDemoState());
}

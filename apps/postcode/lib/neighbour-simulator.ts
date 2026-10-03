"use client";

import { useEffect } from "react";
import {
  dispatch,
  findUser,
  getDemoState,
  isPremade,
  subscribeToEvents,
} from "@/lib/demo-store";
import { notify } from "@/lib/notifications";
import { hasHouseholdCompleted, isUnlocked, pledgeCount } from "@/lib/progress";
import type { DemoState, Goal, User } from "@/lib/types";

/** Scripted events per signed-in session, so a long demo doesn't run away. */
const maxEvents = 6;
const firstEventMs = 8000;
const reactionDelayMs = 3500;

function pick<T>(items: T[]): T | undefined {
  return items[Math.floor(Math.random() * items.length)];
}

function between(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function neighbours(state: DemoState): User[] {
  return state.users.filter(
    (u) => isPremade(u.id) && u.id !== state.currentUserId,
  );
}

function canSee(user: User, goal: Goal) {
  return (
    goal.level === "postcode" ||
    (goal.level === "group" && user.interests.includes(goal.groupId))
  );
}

/**
 * Brings a goal closer but never to its threshold: the pledge that makes a
 * goal go ahead is left to the person using the app.
 */
function scriptedPledge(state: DemoState): boolean {
  const viewer = findUser(state, state.currentUserId);
  if (!viewer) return false;
  const options = neighbours(state).flatMap((user) =>
    state.goals.flatMap((goal) =>
      goal.level !== "household" &&
      canSee(user, goal) &&
      canSee(viewer, goal) &&
      !state.pledges.some(
        (p) => p.goalId === goal.id && p.userId === user.id,
      ) &&
      pledgeCount(state, goal.id) + 1 < goal.threshold
        ? [
            {
              user,
              goal,
              missing: goal.threshold - pledgeCount(state, goal.id) - 1,
            },
          ]
        : [],
    ),
  );
  const choice = pick(options);
  if (!choice) return false;
  dispatch({ type: "pledge", goalId: choice.goal.id, userId: choice.user.id });
  notify({
    fromUserId: choice.user.id,
    title: `${choice.user.name} pledged`,
    body: `${choice.goal.title} · ${choice.missing} more needed`,
    target: { tab: "goals", goalId: choice.goal.id },
  });
  return true;
}

function scriptedCompletion(state: DemoState): boolean {
  const options = state.pledges.flatMap((p) => {
    const user = neighbours(state).find((u) => u.id === p.userId);
    const goal = state.goals.find((g) => g.id === p.goalId);
    return user &&
      goal &&
      !goal.activity &&
      isUnlocked(state, goal) &&
      !hasHouseholdCompleted(state, goal.id, user.householdId)
      ? [{ user, goal }]
      : [];
  });
  const choice = pick(options);
  if (!choice) return false;
  dispatch({
    type: "mark-done",
    goalId: choice.goal.id,
    userId: choice.user.id,
  });
  const action = getDemoState().actions.find(
    (item) => item.goalId === choice.goal.id && item.userId === choice.user.id,
  );
  notify({
    fromUserId: choice.user.id,
    title: `${choice.user.name} did it`,
    body: choice.goal.title,
    target: action ? { tab: "activity", actionId: action.id } : undefined,
  });
  return true;
}

/**
 * Makes the premade neighbours act on their own while someone uses the app:
 * they pledge, complete goals and react to the user's completed goals.
 */
export function useNeighbourSimulator(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (ms: number, run: () => void) =>
      timers.push(setTimeout(run, ms));
    let events = 0;

    const unsubscribe = subscribeToEvents((event) => {
      if (event.type !== "action-completed") return;
      const state = getDemoState();
      if (event.userId !== state.currentUserId) return;
      const reactor = pick(neighbours(state));
      if (!reactor) return;
      later(reactionDelayMs, () => {
        const now = getDemoState();
        const action = now.actions.find((a) => a.id === event.actionId);
        const goal = now.goals.find((g) => g.id === action?.goalId);
        if (
          !action ||
          !goal ||
          action.reactions.some((r) => r.userId === reactor.id)
        )
          return;
        const emoji = pick(["🌱", "👏", "💚"]) ?? "🌱";
        dispatch({
          type: "toggle-reaction",
          actionId: action.id,
          emoji,
          userId: reactor.id,
        });
        notify({
          fromUserId: reactor.id,
          title: `${findUser(now, reactor.id)?.name} reacted ${emoji}`,
          body: `to you doing “${goal.title.toLowerCase()}”`,
          target: { tab: "activity", actionId: action.id },
        });
      });
    });

    const tick = () => {
      if (events >= maxEvents) return;
      const state = getDemoState();
      const acted =
        Math.random() < 0.4
          ? scriptedCompletion(state) || scriptedPledge(state)
          : scriptedPledge(state) || scriptedCompletion(state);
      if (acted) events++;
      later(between(15000, 25000), tick);
    };
    later(firstEventMs, tick);

    return () => {
      timers.forEach(clearTimeout);
      unsubscribe();
    };
  }, [enabled]);
}

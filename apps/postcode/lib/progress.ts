import type { DemoState, Goal, User } from "@/lib/types";

export function pledgeCount(state: DemoState, goalId: string): number {
  return state.pledges.filter((p) => p.goalId === goalId).length;
}

export function hasPledged(
  state: DemoState,
  goalId: string,
  userId: string,
): boolean {
  return state.pledges.some((p) => p.goalId === goalId && p.userId === userId);
}

/** Household goals need no pledges; the others go ahead at their threshold. */
export function isUnlocked(state: DemoState, goal: Goal): boolean {
  return (
    goal.level === "household" || pledgeCount(state, goal.id) >= goal.threshold
  );
}

/** The goals a user sees: the whole postcode's, their groups' and their household's. */
export function goalsForUser(state: DemoState, user: User): Goal[] {
  return state.goals.filter((goal) => {
    switch (goal.level) {
      case "postcode":
        return true;
      case "group":
        return user.interests.includes(goal.groupId);
      case "household":
        return goal.householdId === user.householdId;
    }
  });
}

export function householdPoints(state: DemoState, householdId: string): number {
  const pointsByGoal = new Map(state.goals.map((g) => [g.id, g.points]));
  return state.actions
    .filter((a) => a.householdId === householdId)
    .reduce((sum, a) => sum + (pointsByGoal.get(a.goalId) ?? 0), 0);
}

export function totalPoints(state: DemoState): number {
  const pointsByGoal = new Map(state.goals.map((g) => [g.id, g.points]));
  return state.actions.reduce(
    (sum, a) => sum + (pointsByGoal.get(a.goalId) ?? 0),
    0,
  );
}

export function hasHouseholdCompleted(
  state: DemoState,
  goalId: string,
  householdId: string,
): boolean {
  return state.actions.some(
    (a) => a.goalId === goalId && a.householdId === householdId,
  );
}

export function householdsCompleted(state: DemoState, goalId: string): number {
  return new Set(
    state.actions.filter((a) => a.goalId === goalId).map((a) => a.householdId),
  ).size;
}

/** Postcode and group goals that have reached their pledge threshold. */
export function sharedGoalsGoingAhead(state: DemoState): Goal[] {
  return state.goals.filter(
    (g) => g.level !== "household" && isUnlocked(state, g),
  );
}

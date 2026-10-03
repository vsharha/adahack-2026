import { households, premadeUsers } from "@/data/seed";
import type { DemoState } from "@/lib/types";

const premadeIds = new Set(premadeUsers.map((u) => u.id));

export function isPremade(userId: string): boolean {
  return premadeIds.has(userId);
}

/**
 * The house a new user moves into: the first one nobody lives in, or once the
 * street is full, the household with the fewest members.
 */
export function nextHousehold(state: DemoState): string {
  const members = (id: string) =>
    state.users.filter((u) => u.householdId === id).length;
  const free = households.find((h) => members(h.id) === 0);
  if (free) return free.id;
  return [...households].sort((a, b) => members(a.id) - members(b.id))[0].id;
}

export function findUser(state: DemoState, userId: string | null) {
  return state.users.find((u) => u.id === userId);
}

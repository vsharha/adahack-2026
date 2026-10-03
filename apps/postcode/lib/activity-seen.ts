"use client";

import { useSyncExternalStore } from "react";

/** How many completed actions the signed-in user has seen on the Activity tab. */
let seen = 0;
const listeners = new Set<() => void>();

export function markActivitySeen(count: number) {
  if (count === seen) return;
  seen = count;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useActivitySeen(): number {
  return useSyncExternalStore(
    subscribe,
    () => seen,
    () => 0,
  );
}

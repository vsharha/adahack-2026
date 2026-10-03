"use client";

import { useSyncExternalStore } from "react";

export interface Notification {
  id: number;
  /** Shown as the notification's avatar; omitted for messages from the app. */
  fromUserId?: string;
  title: string;
  body: string;
}

let current: Notification | null = null;
let nextId = 1;
let hideTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

/** Shows a banner at the top of the phone screen; a newer one replaces it. */
export function notify(notification: Omit<Notification, "id">) {
  current = { ...notification, id: nextId++ };
  clearTimeout(hideTimer);
  hideTimer = setTimeout(dismissNotification, 5000);
  emit();
}

export function dismissNotification() {
  current = null;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useNotification(): Notification | null {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
}

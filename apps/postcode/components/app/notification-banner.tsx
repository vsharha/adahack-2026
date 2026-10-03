"use client";

import { Sprout } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { findUser, useDemoState } from "@/lib/demo-store";
import { dismissNotification, useNotification } from "@/lib/notifications";

export function NotificationBanner() {
  const notification = useNotification();
  const state = useDemoState();
  if (!notification) return null;
  const from = notification.fromUserId
    ? findUser(state, notification.fromUserId)
    : undefined;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-2 z-50 px-2">
      <button
        key={notification.id}
        type="button"
        onClick={dismissNotification}
        aria-live="polite"
        className="notification-in pointer-events-auto flex w-full items-center gap-3 rounded-2xl bg-card/95 p-3 text-left shadow-lg ring-1 ring-foreground/10 backdrop-blur outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {from ? (
          <Avatar user={from} />
        ) : (
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-moss text-primary-foreground">
            <Sprout className="size-5" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">{notification.title}</span>
          <span className="block text-sm text-muted-foreground">
            {notification.body}
          </span>
        </span>
        <span className="self-start font-mono text-xs text-muted-foreground">
          now
        </span>
      </button>
    </div>
  );
}

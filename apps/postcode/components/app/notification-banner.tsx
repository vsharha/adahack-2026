"use client";

import { Sprout } from "lucide-react";
import { Avatar } from "@/components/avatar";
import {
  Toast,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  useToastManager,
} from "@/components/ui/toast";
import { findUser, useDemoState } from "@/lib/demo-store";
import { notificationToastManager } from "@/lib/notifications";

function NotificationList() {
  const { toasts } = useToastManager<{ fromUserId?: string }>();
  const state = useDemoState();

  return toasts.map((notification) => {
    const from = notification.data?.fromUserId
      ? findUser(state, notification.data.fromUserId)
      : undefined;

    return (
      <Toast
        key={notification.id}
        toast={notification}
        swipeDirection="up"
        className="notification-toast border-0 bg-card/95 text-foreground ring-1 ring-foreground/10 backdrop-blur"
      >
        <ToastContent className="p-3">
          {from ? (
            <Avatar user={from} />
          ) : (
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-moss text-on-moss">
              <Sprout className="size-5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <ToastTitle className="font-bold" />
            <ToastDescription />
          </div>
          <ToastClose
            aria-label="Dismiss notification"
            className="self-start"
          />
        </ToastContent>
      </Toast>
    );
  });
}

export function NotificationBanner() {
  return (
    <ToastProvider
      toastManager={notificationToastManager}
      timeout={5000}
      limit={1}
    >
      <ToastViewport
        className="notification-viewport"
        aria-label="Notifications"
      >
        <NotificationList />
      </ToastViewport>
    </ToastProvider>
  );
}

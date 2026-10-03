"use client";

import { Sprout } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/avatar";
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  useToastManager,
} from "@/components/ui/toast";
import { findUser, useDemoState } from "@/lib/demo-store";
import {
  notificationToastManager,
  type Notification,
} from "@/lib/notifications";
import {
  notificationHref,
  notificationItemId,
  revealNotificationItem,
} from "@/lib/notification-target";

function NotificationList() {
  const { toasts } =
    useToastManager<Pick<Notification, "fromUserId" | "target">>();
  const state = useDemoState();
  const router = useRouter();

  return toasts.map((notification) => {
    const from = notification.data?.fromUserId
      ? findUser(state, notification.data.fromUserId)
      : undefined;
    const target = notification.data?.target;
    const message = (
      <>
        {from ? (
          <Avatar user={from} />
        ) : (
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-moss text-on-moss">
            <Sprout className="size-5" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <ToastTitle render={<span />} className="block font-bold" />
          <ToastDescription render={<span />} className="block" />
        </span>
      </>
    );

    return (
      <Toast
        key={notification.id}
        toast={notification}
        swipeDirection="up"
        className="notification-toast border-0 bg-card/95 text-foreground ring-1 ring-foreground/10 backdrop-blur"
      >
        <ToastContent className="p-3">
          {target ? (
            <ToastAction
              render={<button type="button" />}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left outline-none hover:text-moss-ink focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label={`${notification.title}. ${notification.description}. Open ${target.tab === "goals" ? "goal" : "report"}`}
              onClick={() => {
                notificationToastManager.close(notification.id);
                if (!state.currentUserId) return;
                const href = notificationHref(target);
                if (
                  window.location.pathname + window.location.search ===
                  href
                ) {
                  revealNotificationItem(notificationItemId(target));
                } else {
                  router.push(href, { scroll: false });
                }
              }}
            >
              {message}
            </ToastAction>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {message}
            </div>
          )}
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

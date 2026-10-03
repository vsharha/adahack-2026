"use client";

import { createToastManager } from "@/components/ui/toast";

export interface Notification {
  /** Shown as the notification's avatar; omitted for messages from the app. */
  fromUserId?: string;
  title: string;
  body: string;
}

export const notificationToastManager = createToastManager();

/** Shows a banner at the top of the phone screen; a newer one replaces it. */
export function notify(notification: Notification) {
  notificationToastManager.add({
    id: "street-notification",
    title: notification.title,
    description: notification.body,
    data: { fromUserId: notification.fromUserId },
  });
}

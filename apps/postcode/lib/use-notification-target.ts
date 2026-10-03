"use client";

import { useEffect } from "react";
import { revealNotificationItem } from "@/lib/notification-target";

export function useNotificationTarget(id: string, focused: boolean) {
  useEffect(() => {
    if (!focused) return;
    const frame = requestAnimationFrame(() => revealNotificationItem(id));
    return () => cancelAnimationFrame(frame);
  }, [id, focused]);
}

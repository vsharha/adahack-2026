"use client";

import { Sprout } from "lucide-react";
import { NotificationBanner } from "@/components/app/notification-banner";
import { PhoneFrame } from "@/components/app/phone-frame";
import { useSystemThemeSync } from "@/lib/appearance";
import { useHydrated } from "@/lib/demo-store";

function Splash() {
  return (
    <div
      data-status-surface="moss"
      className="flex h-full flex-col items-center justify-center gap-3 bg-moss text-on-moss"
    >
      <Sprout className="size-12" />
      <p className="font-heading text-lg font-bold tracking-tight">
        Greener by postcode
      </p>
    </div>
  );
}

/** The phone around every app screen; shows a splash until saved state is read. */
export function PhoneShell({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  useSystemThemeSync();
  return (
    <PhoneFrame>
      {hydrated ? children : <Splash />}
      <NotificationBanner />
    </PhoneFrame>
  );
}

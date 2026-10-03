"use client";

import { Sprout } from "lucide-react";
import { NotificationBanner } from "@/components/app/notification-banner";
import { PhoneFrame } from "@/components/app/phone-frame";
import { useHydrated } from "@/lib/demo-store";

function Splash() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-moss text-on-moss">
      <Sprout className="size-12" />
      <p className="font-sign text-lg font-semibold tracking-[0.2em]">
        GREENER BY POSTCODE
      </p>
    </div>
  );
}

/** The phone around every app screen; shows a splash until saved state is read. */
export function PhoneShell({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  return (
    <PhoneFrame>
      {hydrated ? children : <Splash />}
      <NotificationBanner />
    </PhoneFrame>
  );
}

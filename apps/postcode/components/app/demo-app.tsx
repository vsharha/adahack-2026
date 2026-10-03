"use client";

import { Sprout } from "lucide-react";
import { useState } from "react";
import { AccountPicker } from "@/components/app/account-picker";
import { NotificationBanner } from "@/components/app/notification-banner";
import { Onboarding } from "@/components/app/onboarding";
import { PhoneFrame } from "@/components/app/phone-frame";
import { SignedInApp } from "@/components/app/signed-in-app";
import { useDemoState, useHydrated } from "@/lib/demo-store";
import { notify } from "@/lib/notifications";

function Splash() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-moss text-primary-foreground">
      <Sprout className="size-12" />
      <p className="font-sign text-lg font-semibold tracking-[0.2em]">
        GREENER BY POSTCODE
      </p>
    </div>
  );
}

export function DemoApp() {
  const hydrated = useHydrated();
  const state = useDemoState();
  const [joining, setJoining] = useState(false);

  let screen: React.ReactNode;
  if (!hydrated) screen = <Splash />;
  else if (state.currentUserId)
    screen = <SignedInApp key={state.currentUserId} />;
  else if (joining)
    screen = (
      <Onboarding
        onCancel={() => setJoining(false)}
        onFinish={(name) => {
          setJoining(false);
          notify({
            title: `Welcome to the street, ${name}`,
            body: "Your neighbours can see you've joined.",
          });
        }}
      />
    );
  else screen = <AccountPicker onJoin={() => setJoining(true)} />;

  return (
    <PhoneFrame>
      {screen}
      <NotificationBanner />
    </PhoneFrame>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AccountPicker } from "@/components/app/account-picker";
import { Onboarding } from "@/components/app/onboarding";
import { useDemoState } from "@/lib/demo-store";
import { notify } from "@/lib/notifications";

/** The signed-out screens: the account picker, and onboarding to join. */
export function Welcome() {
  const router = useRouter();
  const signedIn = useDemoState().currentUserId !== null;
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (signedIn) router.replace("/street");
  }, [signedIn, router]);

  if (signedIn) return null;
  if (joining)
    return (
      <Onboarding
        onCancel={() => setJoining(false)}
        onFinish={(name) =>
          notify({
            title: `Welcome to the street, ${name}`,
            body: "Your neighbours can see you've joined.",
          })
        }
      />
    );
  return <AccountPicker onJoin={() => setJoining(true)} />;
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  dispatch,
  isPremade,
  useDemoState,
  useHydrated,
} from "@/lib/demo-store";

/** Restores the demo seed between judges, after the presenter confirms. */
export default function ResetPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const state = useDemoState();
  const added = state.users.filter((u) => !isPremade(u.id)).length;

  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border bg-card p-6">
        <h1 className="text-2xl font-bold">Reset the demo?</h1>
        <p className="text-muted-foreground">
          This restores the five premade neighbours and their goals. Every
          pledge, report, confirmation, reward earning, voucher and reaction
          made in the demo is removed
          {hydrated && added > 0
            ? `, along with ${added} added ${added === 1 ? "account" : "accounts"}`
            : ""}
          .
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <Button
            variant="destructive"
            size="lg"
            onClick={() => {
              dispatch({ type: "reset" });
              router.replace("/");
            }}
          >
            Reset demo
          </Button>
          <Link
            href="/"
            className={buttonVariants({ variant: "ghost", size: "lg" })}
          >
            Cancel
          </Link>
        </div>
      </div>
    </main>
  );
}

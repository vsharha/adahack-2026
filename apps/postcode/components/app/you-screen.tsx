"use client";

import { useState } from "react";
import { DeleteAccountDialog } from "@/components/app/delete-account-dialog";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { households, interestGroups } from "@/data/seed";
import { dispatch, isPremade, useDemoState, useMe } from "@/lib/demo-store";
import {
  type Appearance,
  setAppearance,
  useAppearance,
} from "@/lib/appearance";
import { householdPoints } from "@/lib/progress";
import { cn } from "@/lib/utils";

const appearances: { value: Appearance; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

function AppearancePicker() {
  const appearance = useAppearance();
  return (
    <section className="space-y-2">
      <h2 id="appearance" className="font-bold">
        Appearance
      </h2>
      <div
        role="radiogroup"
        aria-labelledby="appearance"
        className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1"
      >
        {appearances.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={appearance === value}
            onClick={() => setAppearance(value)}
            className={cn(
              "rounded-lg py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              appearance === value
                ? "bg-card font-bold shadow-sm"
                : "text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}

export function YouScreen() {
  const state = useDemoState();
  const me = useMe();
  const [deleting, setDeleting] = useState(false);
  const house = households.find((h) => h.id === me.householdId);
  const housemates = state.users.filter(
    (u) => u.householdId === me.householdId && u.id !== me.id,
  );
  const pledges = state.pledges.filter((p) => p.userId === me.id).length;
  const done = state.actions.filter((a) => a.userId === me.id).length;

  return (
    <div className="space-y-6 px-5 pt-8 pb-6">
      <header className="flex flex-col items-center text-center">
        <Avatar user={me} className="size-20 text-3xl" />
        <h1 className="mt-3 text-2xl font-bold">{me.name}</h1>
        <p className="text-muted-foreground">
          {house?.label}, EH8
          {housemates.length > 0 &&
            ` · with ${housemates.map((u) => u.name).join(" and ")}`}
        </p>
      </header>

      <dl className="grid grid-cols-3 divide-x rounded-xl border bg-card text-center">
        <div className="flex flex-col gap-1 p-3">
          <dt className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Household points
          </dt>
          <dd className="font-mono text-xl font-bold">
            {householdPoints(state, me.householdId)}
          </dd>
        </div>
        <div className="flex flex-col gap-1 p-3">
          <dt className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Pledges
          </dt>
          <dd className="font-mono text-xl font-bold">{pledges}</dd>
        </div>
        <div className="flex flex-col gap-1 p-3">
          <dt className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Goals done
          </dt>
          <dd className="font-mono text-xl font-bold">{done}</dd>
        </div>
      </dl>

      <section className="space-y-2">
        <h2 className="font-bold">Your interests</h2>
        <ul className="flex flex-wrap gap-2">
          {interestGroups
            .filter((g) => me.interests.includes(g.id))
            .map((g) => (
              <li
                key={g.id}
                className="rounded-full border border-moss/40 bg-moss/10 px-3 py-1 text-sm"
              >
                {g.name}
              </li>
            ))}
        </ul>
      </section>

      <AppearancePicker />

      <section className="space-y-2 border-t pt-6">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => dispatch({ type: "sign-out" })}
        >
          Switch account
        </Button>
        {!isPremade(me.id) && (
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => setDeleting(true)}
          >
            Delete account
          </Button>
        )}
      </section>

      <DeleteAccountDialog
        user={me}
        open={deleting}
        onOpenChange={setDeleting}
      />
    </div>
  );
}

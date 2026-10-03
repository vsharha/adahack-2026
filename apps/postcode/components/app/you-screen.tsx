"use client";

import { useState } from "react";
import { DeleteAccountDialog } from "@/components/app/delete-account-dialog";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { households, interestGroups } from "@/data/seed";
import { dispatch, isPremade, useDemoState, useMe } from "@/lib/demo-store";
import { householdPoints } from "@/lib/progress";

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

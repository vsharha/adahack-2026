"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { DeleteAccountDialog } from "@/components/app/delete-account-dialog";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { households } from "@/data/seed";
import { dispatch, isPremade, useDemoState } from "@/lib/demo-store";
import type { User } from "@/lib/types";

export function AccountPicker({ onJoin }: { onJoin: () => void }) {
  const state = useDemoState();
  const [manageMode, setManageMode] = useState(false);
  const [deleting, setDeleting] = useState<User | null>(null);
  const hasAdded = state.users.some((u) => !isPremade(u.id));
  // Leaves manage mode by itself once the last added account is deleted.
  const managing = manageMode && hasAdded;

  return (
    <div className="flex h-full flex-col px-6 pt-[calc(var(--status-bar)+3.5rem)] pb-8">
      <p className="font-sign text-sm font-semibold tracking-[0.2em] text-moss">
        GREENER BY POSTCODE
      </p>
      <h1 className="mt-3 text-3xl leading-tight font-bold">
        Who&apos;s using the app?
      </h1>

      <ul className="mt-10 grid grid-cols-3 gap-x-3 gap-y-6">
        {state.users.map((user) => {
          const removable = managing && !isPremade(user.id);
          return (
            <li key={user.id} className="relative">
              <button
                type="button"
                disabled={managing && !removable}
                onClick={() =>
                  removable
                    ? setDeleting(user)
                    : dispatch({ type: "sign-in", userId: user.id })
                }
                className="group flex w-full flex-col items-center gap-2 rounded-xl p-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40"
              >
                <Avatar
                  user={user}
                  className="size-18 text-2xl transition-transform group-hover:scale-105 group-active:scale-95"
                />
                <span className="text-center leading-tight">
                  <span className="block font-bold">{user.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {households.find((h) => h.id === user.householdId)?.label}
                  </span>
                </span>
              </button>
              {removable && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-0 right-2 grid size-7 place-items-center rounded-full bg-destructive text-primary-foreground"
                >
                  <X className="size-4" />
                </span>
              )}
            </li>
          );
        })}
        {!managing && (
          <li>
            <button
              type="button"
              onClick={onJoin}
              className="group flex w-full flex-col items-center gap-2 rounded-xl p-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="grid size-18 place-items-center rounded-full border-2 border-dashed border-moss text-moss transition-transform group-hover:scale-105 group-active:scale-95">
                <Plus className="size-7" />
              </span>
              <span className="text-center leading-tight font-bold">
                Join your street
              </span>
            </button>
          </li>
        )}
      </ul>

      {hasAdded && (
        <Button
          variant="ghost"
          className="mt-auto self-center"
          onClick={() => setManageMode(!managing)}
        >
          {managing ? "Done" : "Manage accounts"}
        </Button>
      )}

      {deleting && (
        <DeleteAccountDialog
          user={deleting}
          open
          onOpenChange={(open) => {
            if (!open) setDeleting(null);
          }}
        />
      )}
    </div>
  );
}

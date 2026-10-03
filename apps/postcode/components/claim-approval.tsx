"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { dispatch, useDemoState, useMe } from "@/lib/demo-store";
import type { CompletedAction } from "@/lib/types";

export function ClaimApproval({ claim }: { claim: CompletedAction }) {
  const state = useDemoState();
  const me = useMe();
  const [reason, setReason] = useState("");
  const goal = state.goals.find((goal) => goal.id === claim.goalId);
  if (
    claim.status !== "pending" ||
    !goal?.activity?.organiserIds.includes(me.id)
  )
    return null;
  if (claim.householdId === me.householdId)
    return (
      <p className="text-sm text-muted-foreground">
        Another organiser outside your household must confirm this claim.
      </p>
    );
  return (
    <div className="space-y-2 rounded-lg border bg-card p-3">
      <p className="text-sm font-bold">
        As an organiser, confirm attendance you observed.
      </p>
      <Button
        size="sm"
        onClick={() =>
          dispatch({ type: "confirm-attendance", actionId: claim.id })
        }
      >
        Confirm attendance
      </Button>
      <label className="block text-sm" htmlFor={`decline-${claim.id}`}>
        Reason if declining
      </label>
      <input
        id={`decline-${claim.id}`}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        maxLength={240}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <Button
        size="sm"
        variant="outline"
        disabled={!reason.trim()}
        onClick={() =>
          dispatch({ type: "decline-attendance", actionId: claim.id, reason })
        }
      >
        Decline claim
      </Button>
    </div>
  );
}

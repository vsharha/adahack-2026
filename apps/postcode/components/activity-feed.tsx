"use client";

import { SmilePlus } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { ClaimApproval } from "@/components/claim-approval";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { households } from "@/data/seed";
import { dispatch, findUser, useDemoState } from "@/lib/demo-store";
import type { CompletedAction } from "@/lib/types";
import { cn } from "@/lib/utils";

const reactionEmojis = ["🌱", "👏", "💚"];

function Reactions({
  action,
  isOwn,
}: {
  action: CompletedAction;
  isOwn: boolean;
}) {
  const state = useDemoState();
  const [picking, setPicking] = useState(false);
  const used = reactionEmojis.filter((emoji) =>
    action.reactions.some((r) => r.emoji === emoji),
  );
  const mine = action.reactions.find((r) => r.userId === state.currentUserId);
  const names = action.reactions
    .map((r) => findUser(state, r.userId)?.name)
    .filter(Boolean)
    .join(", ");

  return (
    <>
      {used.length > 0 && (
        <span
          className="flex items-center gap-1 text-sm text-muted-foreground"
          title={names}
          aria-label={`${action.reactions.length} reactions from ${names}`}
        >
          <span aria-hidden className="flex -space-x-1">
            {used.map((emoji) => (
              <span
                key={emoji}
                className="grid size-6 place-items-center rounded-full bg-card text-xs ring-2 ring-background"
              >
                {emoji}
              </span>
            ))}
          </span>
          <span className="tabular-nums text-xs">
            {action.reactions.length}
          </span>
        </span>
      )}
      {!isOwn && (
        <Popover open={picking} onOpenChange={setPicking}>
          <PopoverTrigger
            className={cn(
              "ml-auto flex items-center gap-1 rounded-full px-2 py-1 text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-muted",
              mine ? "font-bold text-moss-ink" : "text-muted-foreground",
            )}
          >
            {mine ? (
              <span aria-hidden>{mine.emoji}</span>
            ) : (
              <SmilePlus className="size-4" />
            )}
            {mine ? "Reacted" : "React"}
          </PopoverTrigger>
          <PopoverContent
            align="end"
            aria-label="Choose a reaction"
            className="w-auto flex-row gap-0.5 rounded-full p-1"
          >
            {reactionEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                aria-pressed={mine?.emoji === emoji}
                aria-label={`React with ${emoji}`}
                onClick={() => {
                  dispatch({
                    type: "toggle-reaction",
                    actionId: action.id,
                    emoji,
                  });
                  setPicking(false);
                }}
                className={cn(
                  "grid size-9 place-items-center rounded-full text-lg outline-none transition-transform hover:scale-110 focus-visible:ring-3 focus-visible:ring-ring/50",
                  mine?.emoji === emoji && "bg-moss/20",
                )}
              >
                {emoji}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      )}
    </>
  );
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

export function ActivityFeed({
  limit,
  completedOnly = false,
}: {
  limit?: number;
  completedOnly?: boolean;
}) {
  const state = useDemoState();
  const actions = [...state.actions]
    .filter(
      (action) =>
        !completedOnly ||
        action.status === "self-reported" ||
        action.status === "confirmed",
    )
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, limit);

  if (actions.length === 0) {
    return (
      <p className="text-muted-foreground">
        Nothing done yet. Mark a goal as done and it shows up here.
      </p>
    );
  }

  return (
    <ol className="space-y-4">
      {actions.map((action) => {
        const user = findUser(state, action.userId);
        const house = households.find((h) => h.id === action.householdId);
        const goal = state.goals.find((g) => g.id === action.goalId);
        const isOwn = action.userId === state.currentUserId;
        return (
          <li
            key={action.id}
            className="flex gap-3 border-b pb-4 last:border-0 last:pb-0"
          >
            {user && <Avatar user={user} />}
            <div className="min-w-0 flex-1 space-y-2">
              <p>
                <span className="font-bold">{user?.name}</span>{" "}
                <span className="text-muted-foreground">({house?.label})</span>{" "}
                {action.status === "self-reported"
                  ? "reported completing"
                  : "reported attending"}{" "}
                <span className="font-bold">{goal?.title.toLowerCase()}</span>
              </p>
              {action.note && <p className="text-sm">“{action.note}”</p>}
              <p className="text-xs text-muted-foreground" role="status">
                {action.status === "self-reported" &&
                  `Self-reported · +${action.contributionPoints} contribution`}
                {action.status === "pending" &&
                  "Awaiting confirmation · no points awarded yet"}
                {action.status === "confirmed" &&
                  `Organiser-confirmed by ${findUser(state, action.confirmedBy ?? null)?.name} · +${action.contributionPoints} contribution`}
                {action.status === "declined" &&
                  `Declined: ${action.declineReason} · no points awarded`}
              </p>
              <ClaimApproval claim={action} />
              <div className="flex flex-wrap items-center gap-1.5">
                <time
                  dateTime={action.completedAt}
                  className="mr-1 tabular-nums text-xs text-muted-foreground"
                >
                  {dateFormat.format(new Date(action.completedAt))}
                </time>
                <Reactions action={action} isOwn={isOwn} />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

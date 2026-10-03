"use client";

import { households, users } from "@/data/seed";
import { dispatch, useDemoState } from "@/lib/demo-store";
import { cn } from "@/lib/utils";

const reactionEmojis = ["🌱", "👏", "💚"];

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

export function ActivityFeed() {
  const state = useDemoState();
  const actions = [...state.actions].sort((a, b) =>
    b.completedAt.localeCompare(a.completedAt),
  );

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
        const user = users.find((u) => u.id === action.userId);
        const house = households.find((h) => h.id === action.householdId);
        const goal = state.goals.find((g) => g.id === action.goalId);
        const isOwn = action.userId === state.currentUserId;
        return (
          <li key={action.id} className="space-y-2 border-b pb-4 last:border-0">
            <p>
              <span className="font-bold">{user?.name}</span>{" "}
              <span className="text-muted-foreground">({house?.label})</span>{" "}
              did <span className="font-bold">{goal?.title.toLowerCase()}</span>
            </p>
            {action.note && <p className="text-sm">“{action.note}”</p>}
            <div className="flex flex-wrap items-center gap-1.5">
              <time
                dateTime={action.completedAt}
                className="mr-1 font-mono text-xs text-muted-foreground"
              >
                {dateFormat.format(new Date(action.completedAt))}
              </time>
              {reactionEmojis.map((emoji) => {
                const count = action.reactions.filter(
                  (r) => r.emoji === emoji,
                ).length;
                const mine = action.reactions.some(
                  (r) => r.emoji === emoji && r.userId === state.currentUserId,
                );
                if (isOwn && count === 0) return null;
                return (
                  <button
                    key={emoji}
                    type="button"
                    disabled={isOwn}
                    aria-pressed={mine}
                    aria-label={`React with ${emoji}`}
                    onClick={() =>
                      dispatch({
                        type: "toggle-reaction",
                        actionId: action.id,
                        emoji,
                      })
                    }
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default",
                      mine
                        ? "border-moss bg-moss/10"
                        : "border-border bg-card hover:bg-muted",
                    )}
                  >
                    {emoji}
                    {count > 0 && (
                      <span className="ml-1 font-mono text-xs">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

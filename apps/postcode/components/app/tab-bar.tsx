"use client";

import { Bell, House, Sprout, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tab = "street" | "goals" | "activity" | "you";

const tabs = [
  { id: "street", label: "Street", icon: House },
  { id: "goals", label: "Goals", icon: Sprout },
  { id: "activity", label: "Activity", icon: Bell },
  { id: "you", label: "You", icon: UserRound },
] as const;

export function TabBar({
  active,
  onChange,
  badges,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
  badges?: Partial<Record<Tab, number>>;
}) {
  return (
    <nav className="grid shrink-0 grid-cols-4 border-t bg-card pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {tabs.map(({ id, label, icon: Icon }) => {
        const badge = badges?.[id] ?? 0;
        return (
          <button
            key={id}
            type="button"
            aria-current={active === id ? "page" : undefined}
            onClick={() => onChange(id)}
            className={cn(
              "flex flex-col items-center gap-0.5 pt-2.5 pb-1 text-xs outline-none focus-visible:bg-muted",
              active === id ? "font-bold text-moss" : "text-muted-foreground",
            )}
          >
            <span className="relative">
              <Icon
                className="size-6"
                strokeWidth={active === id ? 2.4 : 1.8}
              />
              {badge > 0 && (
                <span className="absolute -top-1 -right-2 grid min-w-4 place-items-center rounded-full bg-lamp px-1 font-mono text-[0.65rem] leading-4 font-bold text-foreground">
                  {badge}
                </span>
              )}
            </span>
            {label}
          </button>
        );
      })}
    </nav>
  );
}

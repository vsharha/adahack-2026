"use client";

import { Bell, House, Sprout, UserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "street", label: "Street", icon: House },
  { id: "goals", label: "Goals", icon: Sprout },
  { id: "activity", label: "Activity", icon: Bell },
  { id: "you", label: "You", icon: UserRound },
] as const;

type Tab = (typeof tabs)[number]["id"];

export function TabBar({ badges }: { badges?: Partial<Record<Tab, number>> }) {
  const pathname = usePathname();
  const router = useRouter();

  // Buttons rather than links, so the browser shows no URL hint on hover;
  // prefetching keeps tab switches as fast as links.
  useEffect(() => {
    tabs.forEach(({ id }) => router.prefetch(`/${id}`));
  }, [router]);

  return (
    <nav className="grid shrink-0 grid-cols-4 border-t bg-card pb-[max(0.5rem,env(safe-area-inset-bottom))] md:pb-5">
      {tabs.map(({ id, label, icon: Icon }) => {
        const badge = badges?.[id] ?? 0;
        const active = pathname === `/${id}`;
        return (
          <button
            key={id}
            type="button"
            onClick={() => router.push(`/${id}`)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-0.5 pt-2.5 pb-1 text-xs outline-none focus-visible:bg-muted",
              active ? "font-bold text-moss-ink" : "text-muted-foreground",
            )}
          >
            <span className="relative">
              <Icon className="size-6" strokeWidth={active ? 2.4 : 1.8} />
              {badge > 0 && (
                <span className="absolute -top-1 -right-2 grid min-w-4 place-items-center rounded-full bg-lamp px-1 tabular-nums text-[0.65rem] leading-4 font-bold text-on-lamp">
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

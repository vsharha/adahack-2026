"use client";

import { Bell, Gift, House, Sprout, UserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "street", label: "Street", icon: House },
  { id: "goals", label: "Goals", icon: Sprout },
  { id: "activity", label: "Activity", icon: Bell },
  { id: "rewards", label: "Rewards", icon: Gift },
  { id: "you", label: "You", icon: UserRound },
] as const;

type Tab = (typeof tabs)[number]["id"];

export function TabBar({ badges }: { badges?: Partial<Record<Tab, number>> }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeIndex = tabs.findIndex(({ id }) => pathname === `/${id}`);

  // Buttons rather than links, so the browser shows no URL hint on hover;
  // prefetching keeps tab switches as fast as links.
  useEffect(() => {
    tabs.forEach(({ id }) => router.prefetch(`/${id}`));
  }, [router]);

  return (
    <nav
      aria-label="Main navigation"
      className="absolute inset-x-3 bottom-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] z-40 rounded-full border border-border/70 bg-card/90 p-1.5 shadow-[0_8px_28px_-8px_var(--device-shadow)] backdrop-blur-xl md:bottom-6"
    >
      <div className="relative grid grid-cols-5">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-1/5 rounded-full bg-moss motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            transform: `translateX(${Math.max(0, activeIndex) * 100}%)`,
            opacity: activeIndex < 0 ? 0 : 1,
          }}
        />
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
                "relative z-10 flex h-14 flex-col items-center justify-center gap-0.5 rounded-full text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card motion-safe:transition-colors motion-safe:duration-200",
                active
                  ? "text-on-moss"
                  : "text-muted-foreground hover:text-foreground",
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
      </div>
    </nav>
  );
}

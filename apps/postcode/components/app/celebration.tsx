"use client";

import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { findUser, useDemoState } from "@/lib/demo-store";

/** Full-screen moment when a shared goal reaches its pledge threshold. */
export function Celebration({
  goalId,
  onClose,
}: {
  goalId: string;
  onClose: () => void;
}) {
  const state = useDemoState();
  const goal = state.goals.find((g) => g.id === goalId);
  if (!goal) return null;
  const pledgers = state.pledges
    .filter((p) => p.goalId === goalId)
    .map((p) => findUser(state, p.userId))
    .filter((u) => u !== undefined);

  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="celebration-title"
      data-status-surface="moss"
      className="celebration-in absolute inset-0 z-50 flex flex-col items-center bg-moss px-6 pt-16 pb-8 text-center text-on-moss"
    >
      <div className="rounded-illustration bg-background/20 px-6 pt-5 pb-3">
        <svg viewBox="-60 -110 120 120" className="w-36" aria-hidden>
          <rect x={-4} y={-40} width={8} height={40} fill="var(--trunk)" />
          <g className="grow-in">
            <circle cx={0} cy={-62} r={34} fill="var(--leaf)" />
            <circle cx={-20} cy={-46} r={20} fill="var(--leaf-light)" />
            <circle cx={18} cy={-80} r={18} fill="var(--leaf-light)" />
          </g>
          {[-48, -24, 24, 48].map((x, i) => (
            <ellipse
              key={x}
              className="leaf-fall"
              style={{ animationDelay: `${300 + i * 150}ms` }}
              cx={x}
              cy={-96 + (i % 2) * 14}
              rx={7}
              ry={3}
              transform={`rotate(-35 ${x} ${-96 + (i % 2) * 14})`}
              fill="var(--lamp)"
            />
          ))}
        </svg>
      </div>

      <p className="mt-6 text-sm text-on-moss/80">
        {pledgers.length} neighbours pledged
      </p>
      <h1 id="celebration-title" className="mt-2 text-3xl font-bold">
        It&apos;s going ahead!
      </h1>
      <p className="mt-3 text-xl leading-snug">{goal.title}</p>

      <ul className="mt-6 flex flex-wrap justify-center gap-3">
        {pledgers.map((u) => (
          <li key={u.id} className="flex flex-col items-center gap-1">
            <Avatar user={u} className="size-12 text-lg ring-2 ring-on-moss" />
            <span className="text-sm">{u.name}</span>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-on-moss/90">
        A new tree is planted on your street. Each household that does it earns{" "}
        {goal.points} points.
      </p>

      <Button
        size="lg"
        className="mt-auto h-12 w-full bg-on-moss text-base text-moss hover:bg-on-moss/90"
        onClick={onClose}
        autoFocus
      >
        Let&apos;s do it
      </Button>
    </div>
  );
}

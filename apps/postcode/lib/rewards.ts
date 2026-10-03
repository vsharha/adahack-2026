import type { DemoState } from "@/lib/types";

export const monthlyRewardLimit = 100;

const month = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "2-digit",
  timeZone: "Europe/London",
});

export function rewardMonth(date: string): string {
  const parts = month.formatToParts(new Date(date));
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}`;
}

export function rewardsEarnedThisMonth(
  state: DemoState,
  householdId: string,
  now: string,
): number {
  const currentMonth = rewardMonth(now);
  return state.rewardEarnings
    .filter(
      (earning) =>
        earning.source !== "demo-starting" &&
        earning.householdId === householdId &&
        rewardMonth(earning.earnedAt) === currentMonth,
    )
    .reduce((sum, earning) => sum + earning.points, 0);
}

export function rewardAward(
  state: DemoState,
  householdId: string,
  requested: number,
  now: string,
): number {
  return Math.min(
    requested,
    Math.max(
      0,
      monthlyRewardLimit - rewardsEarnedThisMonth(state, householdId, now),
    ),
  );
}

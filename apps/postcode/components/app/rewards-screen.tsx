"use client";

import { HouseholdRewards } from "@/components/household-rewards";
import { households } from "@/data/seed";
import { useDemoState, useMe } from "@/lib/demo-store";
import { rewardBalance } from "@/lib/progress";
import { monthlyRewardLimit, rewardsEarnedThisMonth } from "@/lib/rewards";

export function RewardsScreen() {
  const state = useDemoState();
  const me = useMe();
  const house = households.find((household) => household.id === me.householdId);
  const earned = rewardsEarnedThisMonth(
    state,
    me.householdId,
    new Date().toISOString(),
  );

  return (
    <div className="space-y-6 px-5 pt-4 pb-6">
      <header>
        <h1 className="text-2xl font-bold">Rewards</h1>
        <p className="text-sm text-muted-foreground">
          {house?.label} · shared household balance
        </p>
      </header>

      <section className="space-y-3 rounded-xl border bg-card p-4">
        <dl>
          <dt className="text-sm text-muted-foreground">
            Available for rewards
          </dt>
          <dd className="tabular-nums text-3xl font-bold">
            {rewardBalance(state, me.householdId)}
            <span className="ml-2 text-sm font-normal">reward points</span>
          </dd>
        </dl>
        <p className="text-sm text-muted-foreground">
          Each household starts with 20 demo rewards. Earn more when one
          organiser confirms your participation.
        </p>
      </section>

      <section
        className="space-y-2 rounded-xl border bg-card p-4"
        aria-labelledby="reward-allowance"
      >
        <h2 id="reward-allowance" className="font-bold">
          Monthly reward allowance
        </h2>
        <p className="tabular-nums">
          {earned} of {monthlyRewardLimit} reward points earned this month
        </p>
        <progress
          value={earned}
          max={monthlyRewardLimit}
          aria-label="Reward points earned this month"
          className="h-2 w-full accent-moss"
        />
        <p className="text-sm text-muted-foreground">
          Trial setting · household allowance, across all eligible activities.
          Rewards count in the month they are confirmed, in UK time. Spending
          does not reopen the allowance. Your balance carries forward.
        </p>
        {earned >= monthlyRewardLimit && (
          <p className="text-sm font-bold text-moss-ink">
            Keep joining in: contribution points are still available.
          </p>
        )}
      </section>

      <HouseholdRewards />
    </div>
  );
}

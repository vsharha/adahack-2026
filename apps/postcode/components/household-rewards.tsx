"use client";

import { Bike, Droplets, ShoppingBag, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { rewardOffers } from "@/data/rewards";
import { dispatch, useDemoState, useMe } from "@/lib/demo-store";
import { rewardBalance } from "@/lib/progress";

const icons = [Bike, Droplets, ShoppingBag];

export function HouseholdRewards() {
  const state = useDemoState();
  const me = useMe();
  const balance = rewardBalance(state, me.householdId);
  return (
    <section className="space-y-3" aria-labelledby="household-rewards">
      <div>
        <h2 id="household-rewards" className="text-lg font-bold">
          Rewards for joining in
        </h2>
        <p className="text-sm text-muted-foreground">
          Fictional partners and example offers. Every voucher is a demo.
        </p>
      </div>
      {rewardOffers.map((offer, index) => {
        const Icon = icons[index];
        const voucher = state.redemptions.find(
          (redemption) =>
            redemption.householdId === me.householdId &&
            redemption.offerId === offer.id,
        );
        const shortfall = Math.max(0, offer.cost - balance);
        return (
          <article
            key={offer.id}
            className="space-y-3 rounded-xl border bg-card p-4"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-moss/10 text-moss-ink">
                <Icon className="size-5" />
              </span>
              <div>
                <h3 className="font-bold">{offer.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {offer.partner} · fictional partner
                </p>
              </div>
            </div>
            <p className="font-bold text-moss-ink">{offer.benefit}</p>
            <p className="tabular-nums text-sm">{offer.cost} reward points</p>
            <p className="text-sm text-muted-foreground">
              {offer.restrictions}
            </p>
            {voucher ? (
              <div
                className="space-y-2 rounded-lg border border-dashed bg-moss/10 p-3"
                role="status"
              >
                <p className="flex items-center gap-2 font-bold">
                  <Ticket className="size-4" /> Your demo voucher
                </p>
                <p className="font-bold break-all">{voucher.voucherCode}</p>
                <p className="text-sm">
                  {voucher.benefit} · {voucher.cost} rewards spent
                </p>
                <p className="text-xs text-muted-foreground">
                  Saved for your household. Your contribution and house colour
                  are unchanged.
                </p>
              </div>
            ) : (
              <>
                <Button
                  className="w-full"
                  disabled={shortfall > 0}
                  onClick={() =>
                    dispatch({ type: "redeem-reward", offerId: offer.id })
                  }
                >
                  Redeem {offer.title.toLowerCase()}
                </Button>
                {shortfall > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Earn {shortfall} more reward points to redeem.
                  </p>
                )}
              </>
            )}
          </article>
        );
      })}
    </section>
  );
}

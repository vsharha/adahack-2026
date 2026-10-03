import assert from "node:assert/strict";
import test from "node:test";
import { initialState } from "../data/seed";
import { reduceDemoState } from "../lib/demo-reducer";
import { householdPoints, rewardBalance } from "../lib/progress";
import { rewardMonth, rewardsEarnedThisMonth } from "../lib/rewards";
import type { DemoState } from "../lib/types";

const now = "2026-10-03T12:00:00Z";
const goalId = "g-litter-pick";
const as = (state: DemoState, userId: string) =>
  reduceDemoState(state, { type: "sign-in", userId }, now);

function heldActivity() {
  let state = as(structuredClone(initialState), "priya");
  state = reduceDemoState(state, { type: "pledge", goalId }, now);
  state = as(state, "margaret");
  return reduceDemoState(state, { type: "mark-activity-held", goalId }, now);
}

test("attendance requires a pledged household and a held activity", () => {
  let state = as(structuredClone(initialState), "priya");
  assert.equal(
    reduceDemoState(state, { type: "report-attendance", goalId }, now),
    state,
  );
  assert.equal(
    reduceDemoState(state, { type: "mark-activity-held", goalId }, now),
    state,
  );
  state = as(heldActivity(), "isla");
  assert.equal(
    reduceDemoState(state, { type: "report-attendance", goalId }, now),
    state,
  );
  state = as(heldActivity(), "priya");
  assert.equal(
    reduceDemoState(state, { type: "mark-done", goalId }, now),
    state,
  );
});

test("pending claims award nothing and confirmation awards contribution once", () => {
  let state = as(heldActivity(), "priya");
  const before = householdPoints(state, "h1");
  state = reduceDemoState(state, { type: "report-attendance", goalId }, now);
  const claim = state.actions.at(-1)!;
  assert.equal(claim.status, "pending");
  assert.equal(householdPoints(state, "h1"), before);
  assert.equal(rewardBalance(state, "h1"), 0);
  assert.equal(
    reduceDemoState(state, { type: "report-attendance", goalId }, now),
    state,
  );
  assert.equal(
    reduceDemoState(
      state,
      { type: "confirm-attendance", actionId: claim.id },
      now,
    ),
    state,
  );
  state = as(state, "margaret");
  state = reduceDemoState(
    state,
    { type: "confirm-attendance", actionId: claim.id },
    now,
  );
  assert.equal(householdPoints(state, "h1"), before + 20);
  assert.equal(rewardBalance(state, "h1"), 20);
  assert.equal(state.rewardEarnings.length, 1);
  assert.equal(
    reduceDemoState(
      state,
      { type: "confirm-attendance", actionId: claim.id },
      now,
    ),
    state,
  );
});

test("designated organisers cannot approve claims from their household", () => {
  let state = heldActivity();
  state.users.push({
    id: "housemate",
    name: "Housemate",
    householdId: "h7",
    interests: [],
  });
  state = as(state, "margaret");
  state = reduceDemoState(state, { type: "pledge", goalId }, now);
  state = as(state, "housemate");
  state = reduceDemoState(state, { type: "report-attendance", goalId }, now);
  const claim = state.actions.at(-1)!;
  assert.equal(claim.householdId, "h7");
  state = as(state, "margaret");
  assert.equal(
    reduceDemoState(
      state,
      { type: "confirm-attendance", actionId: claim.id },
      now,
    ),
    state,
  );
  assert.equal(
    reduceDemoState(
      state,
      { type: "decline-attendance", actionId: claim.id, reason: "Not present" },
      now,
    ),
    state,
  );
  assert.equal(
    reduceDemoState(state, { type: "report-attendance", goalId }, now),
    state,
  );
  state = as(state, "isla");
  state = reduceDemoState(
    state,
    { type: "confirm-attendance", actionId: claim.id },
    now,
  );
  assert.equal(state.actions.at(-1)?.confirmedBy, "isla");
});

test("decline requires a reason and a fresh claim can be submitted", () => {
  let state = reduceDemoState(
    as(heldActivity(), "priya"),
    { type: "report-attendance", goalId },
    now,
  );
  const claim = state.actions.at(-1)!;
  state = as(state, "margaret");
  assert.equal(
    reduceDemoState(
      state,
      { type: "decline-attendance", actionId: claim.id, reason: " " },
      now,
    ),
    state,
  );
  state = reduceDemoState(
    state,
    {
      type: "decline-attendance",
      actionId: claim.id,
      reason: "Could not confirm attendance",
    },
    now,
  );
  assert.equal(state.actions.at(-1)?.contributionPoints, 0);
  state = as(state, "priya");
  state = reduceDemoState(state, { type: "report-attendance", goalId }, now);
  assert.equal(state.actions.at(-1)?.status, "pending");
  assert.equal(
    state.actions.filter((action) => action.status === "pending").length,
    1,
  );
});

test("private reports are restricted to the household that owns the goal", () => {
  const state = as(structuredClone(initialState), "margaret");
  assert.equal(
    reduceDemoState(
      state,
      { type: "mark-done", goalId: "g-h1-thermostat" },
      now,
    ),
    state,
  );
});

test("the monthly cap makes a partial award without reducing contribution", () => {
  let state = as(heldActivity(), "priya");
  state.rewardEarnings = [
    { actionId: "earlier", householdId: "h1", points: 95, earnedAt: now },
  ];
  state = reduceDemoState(state, { type: "report-attendance", goalId }, now);
  const claim = state.actions.at(-1)!;
  const before = householdPoints(state, "h1");
  state = as(state, "margaret");
  state = reduceDemoState(
    state,
    { type: "confirm-attendance", actionId: claim.id },
    now,
  );
  assert.equal(state.rewardEarnings.at(-1)?.points, 5);
  assert.equal(rewardsEarnedThisMonth(state, "h1", now), 100);
  assert.equal(householdPoints(state, "h1"), before + 20);
});

test("reaching the allowance does not prevent participation or contribution", () => {
  let state = as(heldActivity(), "priya");
  state.rewardEarnings = [
    { actionId: "earlier", householdId: "h1", points: 100, earnedAt: now },
  ];
  state = reduceDemoState(state, { type: "report-attendance", goalId }, now);
  const claim = state.actions.at(-1)!;
  state = as(state, "margaret");
  state = reduceDemoState(
    state,
    { type: "confirm-attendance", actionId: claim.id },
    now,
  );
  assert.equal(state.rewardEarnings.at(-1)?.points, 0);
  assert.equal(state.actions.at(-1)?.contributionPoints, 20);
  assert.equal(state.actions.at(-1)?.status, "confirmed");
});

test("UK calendar months count confirmation time and retain previous balances", () => {
  assert.equal(rewardMonth("2026-09-30T23:30:00Z"), "2026-10");
  assert.equal(rewardMonth("2026-10-31T23:30:00Z"), "2026-10");
  const state = structuredClone(initialState);
  state.rewardEarnings = [
    {
      actionId: "september",
      householdId: "h1",
      points: 100,
      earnedAt: "2026-09-15T12:00:00Z",
    },
    { actionId: "october", householdId: "h1", points: 20, earnedAt: now },
    { actionId: "neighbour", householdId: "h7", points: 80, earnedAt: now },
  ];
  state.redemptions = [
    {
      id: "r1",
      householdId: "h1",
      offerId: "repair",
      cost: 20,
      redeemedAt: now,
      voucherCode: "DEMO-TEST",
      offerTitle: "Repair",
      benefit: "Example",
      restrictions: "Demo",
    },
  ];
  assert.equal(rewardsEarnedThisMonth(state, "h1", now), 20);
  assert.equal(rewardBalance(state, "h1"), 100);
  assert.equal(rewardsEarnedThisMonth(state, "h1", "2026-11-01T12:00:00Z"), 0);
  assert.equal(rewardBalance(state, "h1"), 100);
});

test("housemates share claims and reward allowance", () => {
  let state = as(heldActivity(), "priya");
  state.users.push({
    id: "housemate",
    name: "Housemate",
    householdId: "h1",
    interests: [],
  });
  state.rewardEarnings = [
    { actionId: "earlier", householdId: "h1", points: 95, earnedAt: now },
  ];
  state = as(state, "housemate");
  state = reduceDemoState(state, { type: "report-attendance", goalId }, now);
  const claim = state.actions.at(-1)!;
  state = as(state, "priya");
  assert.equal(
    reduceDemoState(state, { type: "report-attendance", goalId }, now),
    state,
  );
  state = as(state, "margaret");
  state = reduceDemoState(
    state,
    { type: "confirm-attendance", actionId: claim.id },
    now,
  );
  assert.equal(rewardsEarnedThisMonth(state, "h1", now), 100);
  state = reduceDemoState(
    state,
    { type: "delete-user", userId: "housemate" },
    now,
  );
  assert.equal(
    state.actions.find((action) => action.id === claim.id)?.status,
    "confirmed",
  );
  assert.equal(rewardsEarnedThisMonth(state, "h1", now), 100);
});

test("redemption spends rewards once and preserves contribution and earning allowance", () => {
  let state = as(heldActivity(), "priya");
  state = reduceDemoState(state, { type: "report-attendance", goalId }, now);
  const claim = state.actions.at(-1)!;
  state = as(state, "margaret");
  state = reduceDemoState(
    state,
    { type: "confirm-attendance", actionId: claim.id },
    now,
  );
  state = as(state, "priya");
  const contribution = householdPoints(state, "h1");
  state = reduceDemoState(
    state,
    { type: "redeem-reward", offerId: "bicycle-repair" },
    now,
  );
  assert.equal(rewardBalance(state, "h1"), 0);
  assert.equal(householdPoints(state, "h1"), contribution);
  assert.equal(rewardsEarnedThisMonth(state, "h1", now), 20);
  assert.match(state.redemptions[0].voucherCode, /^DEMO-/);
  assert.equal(state.redemptions[0].benefit, "£5 off a bicycle repair");
  assert.equal(
    reduceDemoState(
      state,
      { type: "redeem-reward", offerId: "bicycle-repair" },
      now,
    ),
    state,
  );
});

test("unknown offers, insufficient balance and signed-out redemption change nothing", () => {
  const state = as(structuredClone(initialState), "priya");
  assert.equal(
    reduceDemoState(
      state,
      { type: "redeem-reward", offerId: "bicycle-repair" },
      now,
    ),
    state,
  );
  assert.equal(
    reduceDemoState(state, { type: "redeem-reward", offerId: "unknown" }, now),
    state,
  );
  const signedOut = reduceDemoState(state, { type: "sign-out" }, now);
  assert.equal(
    reduceDemoState(
      signedOut,
      { type: "redeem-reward", offerId: "bicycle-repair" },
      now,
    ),
    signedOut,
  );
});

test("another household cannot spend the claimant household's rewards", () => {
  const state = as(structuredClone(initialState), "margaret");
  state.rewardEarnings = [
    { actionId: "earlier", householdId: "h1", points: 100, earnedAt: now },
  ];
  assert.equal(
    reduceDemoState(
      state,
      { type: "redeem-reward", offerId: "bicycle-repair" },
      now,
    ),
    state,
  );
});

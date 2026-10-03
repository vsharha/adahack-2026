import assert from "node:assert/strict";
import test from "node:test";
import { initialState } from "../data/seed";
import { reduceDemoState } from "../lib/demo-reducer";
import { householdPoints } from "../lib/progress";
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

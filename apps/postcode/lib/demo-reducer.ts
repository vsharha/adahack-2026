import { householdSuggestions, initialState } from "@/data/seed";
import {
  goalsForUser,
  hasHouseholdCompleted,
  isUnlocked,
} from "@/lib/progress";
import { findUser, isPremade, nextHousehold } from "@/lib/households";
import { rewardAward } from "@/lib/rewards";
import { rewardOffers } from "@/data/rewards";
import { rewardBalance } from "@/lib/progress";
import type { DemoState, InterestId, User } from "@/lib/types";

export type DemoAction =
  | { type: "sign-in"; userId: string }
  | { type: "sign-out" }
  | { type: "add-user"; name: string; interests: InterestId[] }
  | { type: "delete-user"; userId: string }
  /** `userId` defaults to the signed-in user; scripted neighbours pass their own. */
  | { type: "pledge"; goalId: string; userId?: string }
  | { type: "withdraw-pledge"; goalId: string }
  | { type: "mark-done"; goalId: string; userId?: string }
  | { type: "report-attendance"; goalId: string }
  | { type: "confirm-attendance"; actionId: string }
  | { type: "decline-attendance"; actionId: string; reason: string }
  | { type: "redeem-reward"; offerId: string }
  | {
      type: "toggle-reaction";
      actionId: string;
      emoji: string;
      userId?: string;
    }
  | { type: "adopt-suggestion"; suggestionId: string }
  | { type: "reset" };

export function reduceDemoState(
  state: DemoState,
  action: DemoAction,
  now = new Date().toISOString(),
): DemoState {
  const me = findUser(state, state.currentUserId);
  switch (action.type) {
    case "sign-in":
      return findUser(state, action.userId)
        ? { ...state, currentUserId: action.userId }
        : state;
    case "sign-out":
      return { ...state, currentUserId: null };
    case "add-user": {
      const user: User = {
        id: `u-${Date.now()}`,
        name: action.name.trim(),
        householdId: nextHousehold(state),
        interests: action.interests,
      };
      return {
        ...state,
        users: [...state.users, user],
        currentUserId: user.id,
      };
    }
    case "delete-user":
      if (isPremade(action.userId)) return state;
      return {
        ...state,
        users: state.users.filter((u) => u.id !== action.userId),
        currentUserId:
          state.currentUserId === action.userId ? null : state.currentUserId,
        pledges: state.pledges.filter((p) => p.userId !== action.userId),
        actions: state.actions
          .filter((a) => a.userId !== action.userId || a.status === "confirmed")
          .map((a) => ({
            ...a,
            reactions: a.reactions.filter((r) => r.userId !== action.userId),
          })),
      };
    case "reset":
      return initialState;
  }

  const userId =
    ("userId" in action ? action.userId : undefined) ?? me?.id ?? null;
  const user = findUser(state, userId);
  if (!user) return state;

  switch (action.type) {
    case "pledge":
      if (
        state.pledges.some(
          (p) => p.goalId === action.goalId && p.userId === user.id,
        )
      )
        return state;
      return {
        ...state,
        pledges: [...state.pledges, { goalId: action.goalId, userId: user.id }],
      };
    case "withdraw-pledge":
      return {
        ...state,
        pledges: state.pledges.filter(
          (p) => !(p.goalId === action.goalId && p.userId === user.id),
        ),
      };
    case "mark-done": {
      const goal = state.goals.find((g) => g.id === action.goalId);
      if (
        !goal ||
        goal.activity ||
        !goalsForUser(state, user).some((visible) => visible.id === goal.id) ||
        !isUnlocked(state, goal) ||
        (goal.level !== "household" &&
          !state.pledges.some(
            (pledge) =>
              pledge.goalId === goal.id &&
              findUser(state, pledge.userId)?.householdId === user.householdId,
          )) ||
        hasHouseholdCompleted(state, goal.id, user.householdId)
      )
        return state;
      return {
        ...state,
        actions: [
          ...state.actions,
          {
            id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            goalId: goal.id,
            userId: user.id,
            householdId: user.householdId,
            completedAt: now,
            status: "self-reported",
            contributionPoints: goal.points,
            reactions: [],
          },
        ],
      };
    }
    case "report-attendance": {
      const goal = state.goals.find((goal) => goal.id === action.goalId);
      if (
        !goal?.activity ||
        !isUnlocked(state, goal) ||
        now < goal.activity.scheduledAt ||
        !goalsForUser(state, user).some((item) => item.id === goal.id) ||
        hasHouseholdCompleted(state, goal.id, user.householdId) ||
        !state.pledges.some(
          (pledge) =>
            pledge.goalId === goal.id &&
            findUser(state, pledge.userId)?.householdId === user.householdId,
        )
      )
        return state;
      return {
        ...state,
        actions: [
          ...state.actions,
          {
            id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            goalId: goal.id,
            activityId: goal.activity.id,
            userId: user.id,
            householdId: user.householdId,
            completedAt: now,
            status: "pending",
            contributionPoints: 0,
            reactions: [],
          },
        ],
      };
    }
    case "confirm-attendance":
    case "decline-attendance": {
      const claim = state.actions.find((claim) => claim.id === action.actionId);
      const goal = state.goals.find((goal) => goal.id === claim?.goalId);
      if (
        !claim ||
        claim.status !== "pending" ||
        !goal?.activity ||
        now < goal.activity.scheduledAt ||
        claim.activityId !== goal.activity.id ||
        !goal.activity.organiserIds.includes(user.id) ||
        user.householdId === claim.householdId
      )
        return state;
      if (action.type === "decline-attendance" && !action.reason.trim())
        return state;
      return {
        ...state,
        rewardEarnings:
          action.type === "confirm-attendance"
            ? [
                ...state.rewardEarnings,
                {
                  actionId: claim.id,
                  householdId: claim.householdId,
                  points: rewardAward(
                    state,
                    claim.householdId,
                    goal.activity.rewardPoints,
                    now,
                  ),
                  earnedAt: now,
                },
              ]
            : state.rewardEarnings,
        actions: state.actions.map((item) =>
          item.id !== claim.id
            ? item
            : action.type === "confirm-attendance"
              ? {
                  ...item,
                  status: "confirmed",
                  contributionPoints: goal.points,
                  confirmedBy: user.id,
                  confirmedAt: now,
                }
              : {
                  ...item,
                  status: "declined",
                  declinedBy: user.id,
                  declineReason: action.reason.trim(),
                },
        ),
      };
    }
    case "redeem-reward": {
      const offer = rewardOffers.find((offer) => offer.id === action.offerId);
      if (
        !offer ||
        rewardBalance(state, user.householdId) < offer.cost ||
        state.redemptions.some(
          (redemption) =>
            redemption.householdId === user.householdId &&
            redemption.offerId === offer.id,
        )
      )
        return state;
      const id = crypto.randomUUID();
      return {
        ...state,
        redemptions: [
          ...state.redemptions,
          {
            id,
            householdId: user.householdId,
            offerId: offer.id,
            cost: offer.cost,
            redeemedAt: now,
            voucherCode: `DEMO-${id.slice(0, 8).toUpperCase()}`,
            offerTitle: offer.title,
            benefit: offer.benefit,
            restrictions: offer.restrictions,
          },
        ],
      };
    }
    case "toggle-reaction":
      return {
        ...state,
        actions: state.actions.map((a) => {
          if (a.id !== action.actionId) return a;
          // One reaction per person: the same emoji removes it, another
          // replaces it.
          const mine = a.reactions.some(
            (r) => r.userId === user.id && r.emoji === action.emoji,
          );
          const others = a.reactions.filter((r) => r.userId !== user.id);
          return {
            ...a,
            reactions: mine
              ? others
              : [...others, { userId: user.id, emoji: action.emoji }],
          };
        }),
      };
    case "adopt-suggestion": {
      const suggestion = householdSuggestions.find(
        (s) => s.id === action.suggestionId,
      );
      if (!suggestion) return state;
      const id = `g-${user.householdId}-${suggestion.id}`;
      if (state.goals.some((g) => g.id === id)) return state;
      return {
        ...state,
        goals: [
          ...state.goals,
          {
            id,
            level: "household",
            householdId: user.householdId,
            title: suggestion.title,
            description: suggestion.description,
            basis: suggestion.basis,
            points: suggestion.points,
            origin: "suggested",
          },
        ],
      };
    }
  }
}

import { initialState } from "@/data/seed";
import type {
  CompletedAction,
  DemoState,
  Redemption,
  RewardEarning,
} from "@/lib/types";

export type StoredDemoState = Omit<
  DemoState,
  "actions" | "rewardEarnings" | "redemptions"
> & {
  actions: Array<
    Omit<CompletedAction, "status" | "contributionPoints"> &
      Partial<Pick<CompletedAction, "status" | "contributionPoints">>
  >;
  rewardEarnings?: RewardEarning[];
  redemptions?: Redemption[];
};

export function migrateDemoState(saved: StoredDemoState): DemoState {
  const previousPoints = new Map(
    saved.goals.map((goal) => [goal.id, goal.points]),
  );
  const seedGoals = new Map(initialState.goals.map((goal) => [goal.id, goal]));
  const goals = saved.goals.map((goal) => {
    const seed = seedGoals.get(goal.id);
    if (!seed) return goal;
    return {
      ...goal,
      title: seed.title,
      description: seed.description,
      basis: seed.basis,
      activity: seed.activity
        ? { ...seed.activity, ...goal.activity }
        : goal.activity,
    };
  });
  const added = initialState.goals.filter(
    (goal) => goal.activity && !goals.some((item) => item.id === goal.id),
  );
  return {
    ...saved,
    goals: [...added, ...goals],
    pledges: [
      ...saved.pledges,
      ...initialState.pledges.filter((pledge) =>
        added.some((goal) => goal.id === pledge.goalId),
      ),
    ],
    actions: saved.actions.map((action) => ({
      ...action,
      status: action.status ?? "self-reported",
      contributionPoints:
        action.contributionPoints ?? previousPoints.get(action.goalId) ?? 0,
    })),
    rewardEarnings: [
      ...(saved.rewardEarnings ?? []),
      ...initialState.rewardEarnings.filter(
        (starting) =>
          !saved.rewardEarnings?.some(
            (earning) => earning.actionId === starting.actionId,
          ),
      ),
    ],
    redemptions: saved.redemptions ?? [],
  };
}

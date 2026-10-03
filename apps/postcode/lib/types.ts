export type InterestId =
  | "gardening"
  | "walking-cycling"
  | "wildlife-tidy-ups"
  | "energy-at-home"
  | "heritage-green-spaces"
  | "repair-reuse"
  | "food-composting"
  | "families-kids";

export interface InterestGroup {
  id: InterestId;
  name: string;
}

/** Anonymous: a house in the locality drawing, never tied to a real address. */
export interface Household {
  id: string;
  label: string;
}

export interface User {
  id: string;
  name: string;
  householdId: string;
  interests: InterestId[];
}

export type GoalScope =
  | { level: "postcode"; threshold: number }
  | { level: "group"; groupId: InterestId; threshold: number }
  | { level: "household"; householdId: string };

export type Goal = GoalScope & {
  id: string;
  title: string;
  description: string;
  /** The local data the goal was suggested from, shown to explain why. */
  basis: string;
  /** Earned by a household each time it reports completing the goal. */
  points: number;
  origin: "suggested" | "written";
  activity?: {
    id: string;
    scheduledAt: string;
    organiserIds: string[];
    rewardPoints: number;
    heldAt?: string;
  };
};

/** A household-level suggestion a household can adopt as its own goal. */
export interface HouseholdSuggestion {
  id: string;
  title: string;
  description: string;
  basis: string;
  points: number;
}

/** A conditional pledge: the user acts once the goal reaches its threshold. */
export interface Pledge {
  goalId: string;
  userId: string;
}

export interface Reaction {
  userId: string;
  emoji: string;
}

/** A reported action; points are recorded when the report becomes eligible. */
export interface CompletedAction {
  id: string;
  goalId: string;
  userId: string;
  householdId: string;
  completedAt: string;
  status: "self-reported" | "pending" | "confirmed" | "declined";
  contributionPoints: number;
  activityId?: string;
  confirmedBy?: string;
  confirmedAt?: string;
  declinedBy?: string;
  declineReason?: string;
  note?: string;
  photoUrl?: string;
  reactions: Reaction[];
}

export interface RewardEarning {
  actionId: string;
  householdId: string;
  points: number;
  earnedAt: string;
}

export interface Redemption {
  id: string;
  householdId: string;
  offerId: string;
  cost: number;
  redeemedAt: string;
  voucherCode: string;
  offerTitle: string;
  benefit: string;
  restrictions: string;
}

/** Everything the demo changes in the browser; the rest of the seed is fixed. */
export interface DemoState {
  /** Premade neighbours first, then users added through onboarding. */
  users: User[];
  /** Null while the account picker or onboarding is showing. */
  currentUserId: string | null;
  goals: Goal[];
  pledges: Pledge[];
  actions: CompletedAction[];
  rewardEarnings: RewardEarning[];
  redemptions: Redemption[];
}

export interface GreenSpace {
  name: string;
  kind: string;
  distanceM: number;
  areaM2?: number;
}

/** One postcode's row from the domestic electricity consumption data. */
export interface ElectricityRow {
  postcode: string;
  year: number;
  meters: number;
  totalKwh: number;
  meanKwh: number;
  medianKwh: number;
}

export interface Grant {
  title: string;
  recipient: string;
  amountGbp: number;
  awardedOn: string;
  /** The recipient's registered address, not necessarily where the money was spent. */
  recipientPostcode: string;
  funder: string;
}

export interface AirQualityHour {
  time: string;
  europeanAqi: number;
  pm2_5: number;
  pm10: number;
  nitrogenDioxide: number;
  ozone: number;
}

/** The area data shipped as a snapshot so the demo works offline. */
export interface AreaSnapshot {
  district: string;
  latitude: number;
  longitude: number;
  greenSpaces: GreenSpace[];
  electricity: ElectricityRow[];
  grants: Grant[];
  /** Fallback for when the live Open-Meteo call fails. */
  airQualityFallback: AirQualityHour[];
}

import type {
  DemoState,
  Household,
  HouseholdSuggestion,
  InterestGroup,
  User,
} from "@/lib/types";

/** The demo street's full postcode, shared by every household on it. */
export const streetPostcode = "EH8 9YL";

export const interestGroups: InterestGroup[] = [
  { id: "gardening", name: "Gardening and growing" },
  { id: "walking-cycling", name: "Walking and cycling" },
  { id: "wildlife-tidy-ups", name: "Wildlife and tidy-ups" },
  { id: "energy-at-home", name: "Energy at home" },
  { id: "heritage-green-spaces", name: "Heritage and green spaces" },
  { id: "repair-reuse", name: "Repair and reuse" },
  { id: "food-composting", name: "Food and composting" },
  { id: "families-kids", name: "Families and kids" },
];

export const households: Household[] = Array.from({ length: 12 }, (_, i) => ({
  id: `h${i + 1}`,
  label: `House ${i + 1}`,
}));

/**
 * The premade neighbours, in 5 of the 12 houses. The two demo personas come
 * first: a young family household and a later-in-life neighbour who joined
 * through heritage and green spaces.
 */
export const premadeUsers: User[] = [
  {
    id: "priya",
    name: "Priya",
    householdId: "h1",
    interests: ["families-kids", "food-composting", "energy-at-home"],
  },
  {
    id: "margaret",
    name: "Margaret",
    householdId: "h7",
    interests: ["heritage-green-spaces", "gardening", "wildlife-tidy-ups"],
  },
  {
    id: "fiona",
    name: "Fiona",
    householdId: "h4",
    interests: ["families-kids", "wildlife-tidy-ups", "walking-cycling"],
  },
  {
    id: "ewan",
    name: "Ewan",
    householdId: "h10",
    interests: ["walking-cycling", "repair-reuse", "energy-at-home"],
  },
  {
    id: "isla",
    name: "Isla",
    householdId: "h9",
    interests: ["gardening", "heritage-green-spaces", "food-composting"],
  },
];

// Demo suggestions are written from the saved local context; no model runs.
export const householdSuggestions: HouseholdSuggestion[] = [
  {
    id: "s-thermostat",
    title: "Turn the thermostat down one degree",
    description: "Set the heating one degree lower for the month.",
    basis: "Domestic electricity use per meter in EH8.",
    points: 10,
  },
  {
    id: "s-line-dry",
    title: "Line-dry the washing for a week",
    description: "Skip the tumble dryer for seven days.",
    basis: "Domestic electricity use per meter in EH8.",
    points: 8,
  },
  {
    id: "s-food-caddy",
    title: "Use the food waste caddy every day",
    description: "Put all food scraps in the caddy for a week.",
    basis: "Food and composting is a common interest on the street.",
    points: 6,
  },
];

export const initialState: DemoState = {
  users: premadeUsers,
  currentUserId: null,
  rewardEarnings: [],
  redemptions: [],
  goals: [
    {
      id: "g-litter-pick",
      level: "postcode",
      threshold: 3,
      title: "Litter pick at Nicolson Square Gardens",
      description:
        "Spend an hour caring for the gardens with your neighbours. Fictional demo activity.",
      basis:
        "Nicolson Square Gardens is listed in Edinburgh Council’s parks directory. Its condition has not been assessed.",
      points: 20,
      origin: "suggested",
      activity: {
        id: "litter-pick-2026-10-03",
        scheduledAt: "2026-10-03T10:00:00Z",
        organiserIds: ["margaret", "isla"],
        rewardPoints: 20,
      },
    },
    {
      id: "g-car-free-school-run",
      level: "postcode",
      threshold: 4,
      title: "Walk or cycle the school run for a week",
      description: "Leave the car at home for every school run for a week.",
      basis: "The air-quality forecast for EH8.",
      points: 15,
      origin: "suggested",
    },
    {
      id: "g-pollinator-verge",
      level: "postcode",
      threshold: 5,
      title: "Plant up the verge for pollinators",
      description:
        "Sow wildflowers along the shared verge on a Saturday morning.",
      basis: "Green space near EH8 and its distance from the street.",
      points: 20,
      origin: "suggested",
    },
    {
      id: "g-park-tidy",
      level: "group",
      groupId: "heritage-green-spaces",
      threshold: 3,
      title: "Tidy the nearest park's paths",
      description: "Clear litter and leaves from the paths for an hour.",
      basis:
        "Nicolson Square Gardens is listed in Edinburgh Council’s parks directory.",
      points: 12,
      origin: "suggested",
    },
    {
      id: "g-seed-swap",
      level: "group",
      groupId: "gardening",
      threshold: 2,
      title: "Swap seeds and cuttings",
      description: "Bring spare seeds or cuttings to share with the group.",
      basis: "Green space near EH8.",
      points: 10,
      origin: "suggested",
    },
    {
      id: "g-play-street",
      level: "group",
      groupId: "families-kids",
      threshold: 3,
      title: "Close the street for a play afternoon",
      description: "A car-free afternoon for the kids to play outside.",
      basis: "The air-quality forecast for EH8.",
      points: 15,
      origin: "suggested",
    },
    {
      id: "g-draught-proof",
      level: "group",
      groupId: "energy-at-home",
      threshold: 3,
      title: "Draught-proof one room",
      description: "Seal the gaps around one room's windows and doors.",
      basis: "Domestic electricity use per meter in EH8.",
      points: 15,
      origin: "suggested",
    },
    {
      id: "g-h1-thermostat",
      level: "household",
      householdId: "h1",
      title: "Turn the thermostat down one degree",
      description: "Set the heating one degree lower for the month.",
      basis: "Domestic electricity use per meter in EH8.",
      points: 10,
      origin: "suggested",
    },
  ],
  pledges: [
    { goalId: "g-litter-pick", userId: "fiona" },
    { goalId: "g-litter-pick", userId: "ewan" },
    // One short of the threshold, so a single pledge in the demo unlocks it.
    { goalId: "g-car-free-school-run", userId: "fiona" },
    { goalId: "g-car-free-school-run", userId: "ewan" },
    { goalId: "g-car-free-school-run", userId: "isla" },
    { goalId: "g-pollinator-verge", userId: "margaret" },
    { goalId: "g-pollinator-verge", userId: "isla" },
    { goalId: "g-park-tidy", userId: "margaret" },
    { goalId: "g-park-tidy", userId: "isla" },
    { goalId: "g-seed-swap", userId: "margaret" },
    { goalId: "g-seed-swap", userId: "isla" },
    { goalId: "g-play-street", userId: "fiona" },
    { goalId: "g-draught-proof", userId: "ewan" },
  ],
  actions: [
    {
      id: "a1",
      status: "self-reported",
      contributionPoints: 10,
      goalId: "g-seed-swap",
      userId: "isla",
      householdId: "h9",
      completedAt: "2026-09-27T15:00:00Z",
      note: "Brought tomato seeds and a rosemary cutting.",
      reactions: [
        { userId: "margaret", emoji: "🌱" },
        { userId: "fiona", emoji: "💚" },
      ],
    },
    {
      id: "a2",
      status: "self-reported",
      contributionPoints: 10,
      goalId: "g-seed-swap",
      userId: "margaret",
      householdId: "h7",
      completedAt: "2026-09-27T16:00:00Z",
      note: "Sweet peas from my own garden.",
      reactions: [{ userId: "isla", emoji: "👏" }],
    },
    {
      id: "a3",
      status: "self-reported",
      contributionPoints: 10,
      goalId: "g-h1-thermostat",
      userId: "priya",
      householdId: "h1",
      completedAt: "2026-10-01T08:00:00Z",
      reactions: [{ userId: "fiona", emoji: "🌱" }],
    },
  ],
};

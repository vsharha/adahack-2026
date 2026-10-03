import type {
  DemoState,
  Household,
  HouseholdSuggestion,
  InterestGroup,
  User,
} from "@/lib/types";

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
 * The two demo personas come first: a young family household and a
 * later-in-life neighbour who joins through heritage and green spaces.
 */
export const users: User[] = [
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
    id: "tom",
    name: "Tom",
    householdId: "h1",
    interests: ["walking-cycling", "families-kids"],
  },
  {
    id: "ewan",
    name: "Ewan",
    householdId: "h2",
    interests: ["walking-cycling", "repair-reuse"],
  },
  {
    id: "aisha",
    name: "Aisha",
    householdId: "h3",
    interests: ["gardening", "food-composting"],
  },
  {
    id: "callum",
    name: "Callum",
    householdId: "h4",
    interests: ["energy-at-home", "repair-reuse"],
  },
  {
    id: "fiona",
    name: "Fiona",
    householdId: "h5",
    interests: ["families-kids", "wildlife-tidy-ups"],
  },
  {
    id: "jamal",
    name: "Jamal",
    householdId: "h6",
    interests: ["walking-cycling", "energy-at-home"],
  },
  {
    id: "isla",
    name: "Isla",
    householdId: "h8",
    interests: ["gardening", "heritage-green-spaces"],
  },
  {
    id: "duncan",
    name: "Duncan",
    householdId: "h8",
    interests: ["heritage-green-spaces", "repair-reuse"],
  },
  {
    id: "mei",
    name: "Mei",
    householdId: "h9",
    interests: ["food-composting", "families-kids"],
  },
  {
    id: "rory",
    name: "Rory",
    householdId: "h10",
    interests: ["wildlife-tidy-ups", "walking-cycling"],
  },
  {
    id: "helen",
    name: "Helen",
    householdId: "h11",
    interests: ["heritage-green-spaces", "gardening"],
  },
  {
    id: "sam",
    name: "Sam",
    householdId: "h12",
    interests: ["energy-at-home", "food-composting"],
  },
];

// Hand-written placeholders: the pre-generated suggestions from the EH8 data
// replace these goals and household suggestions.
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
  currentUserId: "priya",
  goals: [
    {
      id: "g-pollinator-verge",
      level: "postcode",
      threshold: 6,
      title: "Plant up the verge for pollinators",
      description:
        "Sow wildflowers along the shared verge on a Saturday morning.",
      basis: "Green space near EH8 and its distance from the street.",
      points: 20,
      origin: "suggested",
    },
    {
      id: "g-car-free-school-run",
      level: "postcode",
      threshold: 5,
      title: "Walk or cycle the school run for a week",
      description: "Leave the car at home for every school run for a week.",
      basis: "The air-quality forecast for EH8.",
      points: 15,
      origin: "suggested",
    },
    {
      id: "g-park-tidy",
      level: "group",
      groupId: "heritage-green-spaces",
      threshold: 4,
      title: "Tidy the nearest park's paths",
      description: "Clear litter and leaves from the paths for an hour.",
      basis: "Green space near EH8 and nearby heritage grants.",
      points: 12,
      origin: "suggested",
    },
    {
      id: "g-repair-cafe",
      level: "group",
      groupId: "repair-reuse",
      threshold: 3,
      title: "Host a repair afternoon",
      description: "Bring one broken thing each and fix it together.",
      basis: "Grants made to repair and reuse projects near EH8.",
      points: 12,
      origin: "suggested",
    },
    {
      id: "g-priya-thermostat",
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
    // One short of the threshold, so a single pledge in the demo unlocks it.
    { goalId: "g-car-free-school-run", userId: "tom" },
    { goalId: "g-car-free-school-run", userId: "fiona" },
    { goalId: "g-car-free-school-run", userId: "jamal" },
    { goalId: "g-car-free-school-run", userId: "mei" },
    { goalId: "g-pollinator-verge", userId: "aisha" },
    { goalId: "g-pollinator-verge", userId: "isla" },
    { goalId: "g-pollinator-verge", userId: "rory" },
    { goalId: "g-park-tidy", userId: "isla" },
    { goalId: "g-park-tidy", userId: "duncan" },
    { goalId: "g-park-tidy", userId: "helen" },
    { goalId: "g-repair-cafe", userId: "ewan" },
    { goalId: "g-repair-cafe", userId: "callum" },
    { goalId: "g-repair-cafe", userId: "duncan" },
  ],
  actions: [
    {
      id: "a1",
      goalId: "g-repair-cafe",
      userId: "ewan",
      householdId: "h2",
      completedAt: "2026-09-27T15:00:00Z",
      note: "Fixed two bike lights and a toaster.",
      reactions: [
        { userId: "callum", emoji: "🔧" },
        { userId: "duncan", emoji: "👏" },
      ],
    },
    {
      id: "a2",
      goalId: "g-repair-cafe",
      userId: "callum",
      householdId: "h4",
      completedAt: "2026-09-27T15:30:00Z",
      reactions: [],
    },
    {
      id: "a3",
      goalId: "g-repair-cafe",
      userId: "duncan",
      householdId: "h8",
      completedAt: "2026-09-27T16:00:00Z",
      note: "The lamp works again.",
      reactions: [{ userId: "isla", emoji: "💡" }],
    },
    {
      id: "a4",
      goalId: "g-priya-thermostat",
      userId: "priya",
      householdId: "h1",
      completedAt: "2026-10-01T08:00:00Z",
      reactions: [{ userId: "fiona", emoji: "🌱" }],
    },
  ],
};

"use client";

import { households } from "@/data/seed";
import { useCurrentUser, useDemoState } from "@/lib/demo-store";
import {
  householdPoints,
  sharedGoalsGoingAhead,
  totalPoints,
} from "@/lib/progress";

const houseWidth = 100;
const ground = 290;
const heights = [230, 210, 245, 220, 232, 214, 248, 224, 210, 238, 218, 230];

/** Household points at which each layer of greenery appears on a house. */
const tiers = { groundBoxes: 1, allBoxes: 15, ivy: 25, tree: 40 };

/** The street total at which the verge is fully green. */
const fullStreetPoints = 300;

/** Where each shared goal that goes ahead plants a street tree, in order. */
const streetTreeSlots = [200, 800, 500, 1100, 300, 900];

function mix(from: string, to: string, t: number) {
  const parse = (hex: string) =>
    [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const a = parse(from);
  const b = parse(to);
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
}

function WindowBox({ x, y }: { x: number; y: number }) {
  return (
    <g className="grow-in">
      <rect x={x - 3} y={y + 30} width={24} height={6} fill="var(--moss)" />
      {[0, 8, 16].map((dx) => (
        <circle
          key={dx}
          cx={x + 1 + dx}
          cy={y + 28}
          r={4.5}
          fill="var(--leaf)"
        />
      ))}
    </g>
  );
}

function Tree({ x, scale = 1 }: { x: number; scale?: number }) {
  return (
    <g
      className="grow-in"
      transform={`translate(${x} ${ground}) scale(${scale})`}
    >
      <rect x={-3} y={-30} width={6} height={30} fill="#5b4a37" />
      <circle cx={0} cy={-46} r={22} fill="var(--moss)" />
      <circle cx={-12} cy={-36} r={13} fill="var(--leaf)" opacity={0.85} />
      <circle cx={10} cy={-56} r={11} fill="var(--leaf)" opacity={0.7} />
    </g>
  );
}

function House({
  index,
  points,
  isCurrent,
}: {
  index: number;
  points: number;
  isCurrent: boolean;
}) {
  const x = index * houseWidth;
  const h = heights[index];
  const top = ground - h;
  const floorHeight = (h - 60) / 3;
  const windowY = (floor: number) =>
    top + 24 + floor * floorHeight + (floorHeight - 30) / 2;
  const windowXs = [x + 18, x + 64];

  return (
    <g>
      <rect
        x={x + 22}
        y={top - 16}
        width={10}
        height={18}
        fill="var(--sandstone-dark)"
      />
      <rect
        x={x + 70}
        y={top - 12}
        width={10}
        height={14}
        fill="var(--sandstone-dark)"
      />
      <rect
        x={x}
        y={top}
        width={houseWidth}
        height={h}
        fill="var(--sandstone)"
        stroke="var(--sandstone-dark)"
      />
      <rect x={x} y={top} width={houseWidth} height={12} fill="var(--slate)" />
      {[0, 1, 2].flatMap((floor) =>
        windowXs.map((wx) => (
          <rect
            key={`${floor}-${wx}`}
            x={wx}
            y={windowY(floor)}
            width={18}
            height={30}
            fill="#e9eef0"
            stroke="var(--slate)"
            strokeWidth={2}
          />
        )),
      )}
      <rect
        x={x + 40}
        y={ground - 42}
        width={20}
        height={42}
        fill={isCurrent ? "var(--lamp)" : "var(--slate)"}
      />
      {points >= tiers.groundBoxes &&
        windowXs.map((wx) => (
          <WindowBox key={`g-${wx}`} x={wx} y={windowY(2)} />
        ))}
      {points >= tiers.allBoxes &&
        [0, 1].flatMap((floor) =>
          windowXs.map((wx) => (
            <WindowBox key={`${floor}-${wx}`} x={wx} y={windowY(floor)} />
          )),
        )}
      {points >= tiers.ivy && (
        <g className="grow-in">
          {Array.from({ length: 9 }, (_, i) => (
            <circle
              key={i}
              cx={x + 10 + (i % 2) * 5}
              cy={ground - 8 - i * (h * 0.07)}
              r={7 - i * 0.4}
              fill={i % 2 ? "var(--leaf)" : "var(--moss)"}
            />
          ))}
        </g>
      )}
      {points >= tiers.tree && <Tree x={x + 84} scale={0.75} />}
      {isCurrent && (
        <g>
          <rect
            x={x + 26}
            y={top - 44}
            width={48}
            height={22}
            rx={4}
            fill="var(--lamp)"
          />
          <text
            x={x + 50}
            y={top - 29}
            textAnchor="middle"
            fontSize={13}
            fontWeight={700}
            fill="var(--foreground)"
          >
            You
          </text>
        </g>
      )}
    </g>
  );
}

export function StreetDrawing() {
  const state = useDemoState();
  const user = useCurrentUser();
  const total = totalPoints(state);
  const trees = sharedGoalsGoingAhead(state).length;
  const verge = mix(
    "#b9ad8e",
    "#79b26a",
    Math.min(1, total / fullStreetPoints),
  );

  return (
    <svg
      viewBox="0 -10 1200 350"
      className="h-auto w-full min-w-[720px]"
      role="img"
      aria-label={`The street: ${total} points earned, ${trees} shared goals going ahead.`}
    >
      {households.map((household, i) => (
        <House
          key={household.id}
          index={i}
          points={householdPoints(state, household.id)}
          isCurrent={household.id === user.householdId}
        />
      ))}
      <rect x={0} y={ground} width={1200} height={20} fill="#9aa3a0" />
      <rect
        x={0}
        y={ground + 20}
        width={1200}
        height={30}
        fill={verge}
        className="transition-[fill] duration-1000"
      />
      {streetTreeSlots.slice(0, trees).map((x) => (
        <g key={x} transform="translate(0 40)">
          <Tree x={x} />
        </g>
      ))}
    </svg>
  );
}

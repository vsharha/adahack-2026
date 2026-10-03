"use client";

import { useMemo, useSyncExternalStore } from "react";

type Pt = readonly [number, number];

const CX = 220;
const CY = 270;
const R = 205;
const THETA = (48 * Math.PI) / 180;
const LEAN = (14 * Math.PI) / 180;
const THICKNESS = 0.17;
const RELIEF = 0.12;
const TEETH = 72;
const TOOTH = 0.035;
const HATCH_LINES = 54;
// Steep lines sit across the relief's sideways displacement, so the bends show.
const HATCH_ANGLE = (-70 * Math.PI) / 180;

const cosT = Math.cos(THETA);
const sinT = Math.sin(THETA);
const cosL = Math.cos(LEAN);
const sinL = Math.sin(LEAN);

/** Coin-local (u, v) on the unit face, z along the face normal, to screen. */
function project(u: number, v: number, z: number): Pt {
  const x = R * (u * cosT + z * sinT);
  const y = R * v;
  return [CX + x * cosL - y * sinL, CY + x * sinL + y * cosL];
}

function arc(
  cx: number,
  cy: number,
  r: number,
  fromDeg: number,
  toDeg: number,
  steps: number,
): Pt[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = ((fromDeg + ((toDeg - fromDeg) * i) / steps) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  });
}

// "CO₂" embossed as stroked polylines; v grows downward like screen space.
const GLYPH: { pts: Pt[]; w: number }[] = [
  { pts: arc(-0.34, -0.02, 0.27, 45, 315, 32), w: 0.095 },
  { pts: arc(0.27, -0.02, 0.25, 0, 360, 40), w: 0.095 },
  {
    pts: [...arc(0.6, 0.215, 0.065, 180, 385, 14), [0.53, 0.35], [0.67, 0.35]],
    w: 0.05,
  },
];

function smooth(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function segmentDistance(px: number, py: number, a: Pt, b: Pt) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const t = Math.min(
    1,
    Math.max(0, ((px - a[0]) * dx + (py - a[1]) * dy) / (dx * dx + dy * dy)),
  );
  return Math.hypot(a[0] + t * dx - px, a[1] + t * dy - py);
}

/** Relief height in [0, 1]: the raised glyph plus the coin's raised rim. */
function height(u: number, v: number) {
  const r = Math.hypot(u, v);
  const rim = smooth(0.8, 0.845, r) * (1 - smooth(0.945, 0.98, r));
  let signed = Infinity;
  for (const stroke of GLYPH) {
    for (let i = 1; i < stroke.pts.length; i++) {
      const d =
        segmentDistance(u, v, stroke.pts[i - 1], stroke.pts[i]) - stroke.w;
      if (d < signed) signed = d;
    }
  }
  const glyph = 1 - smooth(-0.008, 0.014, signed);
  return Math.max(glyph, rim * 0.75);
}

/** Ramer–Douglas–Peucker, so flat runs of a hatch line collapse to two points. */
function simplify(points: Pt[], epsilon: number): Pt[] {
  if (points.length < 3) return points;
  const [ax, ay] = points[0];
  const [bx, by] = points[points.length - 1];
  const length = Math.hypot(bx - ax, by - ay) || 1;
  let worst = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i];
    const d = Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / length;
    if (d > worst) {
      worst = d;
      index = i;
    }
  }
  if (worst <= epsilon) return [points[0], points[points.length - 1]];
  const left = simplify(points.slice(0, index + 1), epsilon);
  return [...left.slice(0, -1), ...simplify(points.slice(index), epsilon)];
}

const toPath = (points: Pt[], close = false) =>
  points
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join("") + (close ? "Z" : "");

function toothRadius(halfPeriod: number) {
  return halfPeriod % 2 === 0 ? 1 + TOOTH : 1;
}

function silhouette(z: number, visibleOnly: boolean): Pt[] {
  const points: Pt[] = [];
  for (let k = 0; k < TEETH * 2; k++) {
    const r = toothRadius(k);
    for (const step of [0, 0.5, 1]) {
      const phi = ((k + step) * Math.PI) / TEETH;
      if (visibleOnly && Math.cos(phi) > 0) continue;
      points.push(project(r * Math.cos(phi), r * Math.sin(phi), z));
    }
  }
  return points;
}

function buildCoin() {
  const front = toPath(silhouette(0, false), true);
  const back = toPath(silhouette(-THICKNESS, true));

  const sides: string[] = [];
  for (let k = 0; k < TEETH * 2; k++) {
    for (const step of [0, 0.5]) {
      const phi = ((k + step) * Math.PI) / TEETH;
      if (Math.cos(phi) > -0.02) continue;
      const r = step === 0 ? 1 + TOOTH : toothRadius(k);
      const u = r * Math.cos(phi);
      const v = r * Math.sin(phi);
      sides.push(toPath([project(u, v, 0), project(u, v, -THICKNESS)]));
    }
  }

  const disc = toPath(
    arc(0, 0, 1, 0, 360, 120).map(([u, v]) => project(u, v, 0)),
    true,
  );

  const dir: Pt = [Math.cos(HATCH_ANGLE), Math.sin(HATCH_ANGLE)];
  const normal: Pt = [-dir[1], dir[0]];
  const hatch: string[] = [];
  for (let i = 0; i < HATCH_LINES; i++) {
    const s = -1 + ((i + 0.5) * 2) / HATCH_LINES;
    const half = Math.sqrt(Math.max(0, 0.972 ** 2 - s * s));
    if (half < 0.03) continue;
    const samples: Pt[] = [];
    const count = Math.ceil((2 * half) / 0.006);
    for (let j = 0; j <= count; j++) {
      const t = -half + (2 * half * j) / count;
      const u = normal[0] * s + dir[0] * t;
      const v = normal[1] * s + dir[1] * t;
      samples.push(project(u, v, RELIEF * height(u, v)));
    }
    hatch.push(toPath(simplify(samples, 0.25)));
  }

  return {
    front,
    back,
    sides: sides.join(""),
    disc,
    hatch: hatch.join(""),
  };
}

const noSubscription = () => () => {};

/**
 * A carbon credit as an object: one tonne, stamped CO₂, with a milled edge.
 * Drawn only in the browser: Node and Chrome round the trigonometry
 * differently, so server-built paths would not match on hydration.
 */
export function CarbonCoin({ className }: { className?: string }) {
  const inBrowser = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
  const coin = useMemo(() => (inBrowser ? buildCoin() : null), [inBrowser]);
  return (
    <svg
      viewBox="0 0 440 540"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {coin && (
        <g
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={coin.back} strokeWidth={1.2} />
          <path d={coin.sides} strokeWidth={0.8} />
          <path d={coin.front} fill="var(--coin-fill)" strokeWidth={1.3} />
          <path d={coin.disc} strokeWidth={0.9} />
          <path d={coin.hatch} strokeWidth={1.05} />
        </g>
      )}
    </svg>
  );
}

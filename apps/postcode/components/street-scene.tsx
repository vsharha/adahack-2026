"use client";

import {
  ContactShadows,
  OrthographicCamera,
  RoundedBox,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import * as THREE from "three";
import { Avatar } from "@/components/avatar";
import { households } from "@/data/seed";
import { useDemoState } from "@/lib/demo-store";
import {
  householdPoints,
  sharedGoalsGoingAhead,
  totalPoints,
} from "@/lib/progress";
import type { User } from "@/lib/types";

/** Household points at which each greening stage appears on a house. */
const stages = { windowBoxes: 1, hedge: 10, gardenTree: 20, greenRoof: 30 };

/** The street total at which the ground is fully green. */
const fullStreetPoints = 150;

const spacing = 1.75;
const farRowZ = -1.55;
const nearRowZ = 1.85;
/** The width of the street in scene units, used to fit it to the canvas. */
const sceneWidth = 6 * spacing + 0.6;

/** Where each shared goal that goes ahead plants a street tree, in order. */
const streetTreeSlots: [number, number][] = [
  [-1.5 * spacing, 0.15],
  [1.5 * spacing, 0.15],
  [0, 0.15],
  [-2.5 * spacing, 0.15],
  [2.5 * spacing, 0.15],
  [-0.5 * spacing, 0.15],
];

function housePosition(index: number): [number, number] {
  const column = index % 6;
  return [(column - 2.5) * spacing, index < 6 ? farRowZ : nearRowZ];
}

// Scene colours and light levels come from the design tokens, re-read when the
// theme attribute on <html> changes.
const tokenNames = [
  "house-1",
  "house-2",
  "house-3",
  "house-4",
  "roof",
  "window",
  "door",
  "lamp",
  "leaf",
  "leaf-light",
  "moss",
  "trunk",
  "pavement",
  "verge-bare",
  "verge-full",
  "scene-ambient",
  "scene-sun",
  "window-glow",
] as const;
type Tokens = Record<(typeof tokenNames)[number], string>;

let cachedTheme: string | undefined;
let cachedTokens: Tokens | undefined;

function readTokens(): Tokens {
  const theme = document.documentElement.dataset.theme ?? "";
  if (cachedTokens && theme === cachedTheme) return cachedTokens;
  const style = getComputedStyle(document.documentElement);
  cachedTheme = theme;
  cachedTokens = Object.fromEntries(
    tokenNames.map((name) => [
      name,
      style.getPropertyValue(`--${name}`).trim(),
    ]),
  ) as Tokens;
  return cachedTokens;
}

function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function useTokens(): Tokens {
  return useSyncExternalStore(subscribeToTheme, readTokens, readTokens);
}

const reducedMotion = () =>
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Grows its children from nothing when they first appear. */
function Grow({
  children,
  position,
}: {
  children: ReactNode;
  position?: [number, number, number];
}) {
  const group = useRef<THREE.Group>(null);
  const skip = useMemo(() => reducedMotion(), []);
  useFrame((_, delta) => {
    const g = group.current;
    if (!g || g.scale.x >= 0.999) return;
    const next = skip ? 1 : THREE.MathUtils.damp(g.scale.x, 1, 7, delta);
    g.scale.setScalar(next > 0.999 ? 1 : next);
  });
  return (
    <group ref={group} position={position} scale={skip ? 1 : 0.001}>
      {children}
    </group>
  );
}

function roofGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.66, 0);
  shape.lineTo(0.66, 0);
  shape.lineTo(0, 0.48);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 1.32,
    bevelEnabled: false,
  });
  geometry.translate(0, 0, -0.66);
  geometry.rotateY(Math.PI / 2);
  return geometry;
}

function Tree({ tokens, scale = 1 }: { tokens: Tokens; scale?: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.44, 8]} />
        <meshLambertMaterial color={tokens.trunk} />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow>
        <sphereGeometry args={[0.3, 16, 12]} />
        <meshLambertMaterial color={tokens.leaf} />
      </mesh>
      <mesh position={[0.14, 0.78, 0.08]} castShadow>
        <sphereGeometry args={[0.17, 16, 12]} />
        <meshLambertMaterial color={tokens["leaf-light"]} />
      </mesh>
    </group>
  );
}

function House({
  index,
  points,
  tokens,
  roof,
  isYou,
}: {
  index: number;
  points: number;
  tokens: Tokens;
  roof: THREE.BufferGeometry;
  isYou: boolean;
}) {
  const [x, z] = housePosition(index);
  const facesRoad = index < 6;
  const wall = tokens[`house-${(index % 4) + 1}` as keyof Tokens];
  const glow = Number(tokens["window-glow"]) || 0;
  // Windows on the side facing the camera, where the garden is.
  const frontZ = 0.51;

  return (
    <group position={[x, 0, z]}>
      <RoundedBox
        args={[1.2, 0.9, 1]}
        radius={0.06}
        position={[0, 0.45, 0]}
        castShadow
      >
        <meshLambertMaterial color={wall} />
      </RoundedBox>
      <mesh geometry={roof} position={[0, 0.9, 0]} castShadow>
        <meshLambertMaterial
          color={points >= stages.greenRoof ? tokens.leaf : tokens.roof}
        />
      </mesh>
      {points >= stages.greenRoof && (
        <Grow position={[0, 1.1, 0]}>
          {[-0.35, 0, 0.35].map((dx) => (
            <mesh key={dx} position={[dx, 0.04, 0.16]}>
              <sphereGeometry args={[0.1, 10, 8]} />
              <meshLambertMaterial color={tokens["leaf-light"]} />
            </mesh>
          ))}
        </Grow>
      )}
      {[-0.3, 0.3].map((dx) => (
        <mesh key={dx} position={[dx, 0.55, frontZ]}>
          <boxGeometry args={[0.22, 0.26, 0.02]} />
          <meshLambertMaterial
            color={tokens.window}
            emissive={tokens.window}
            emissiveIntensity={glow}
          />
        </mesh>
      ))}
      {facesRoad && (
        <mesh position={[0, 0.2, frontZ]}>
          <boxGeometry args={[0.2, 0.36, 0.02]} />
          <meshLambertMaterial color={isYou ? tokens.lamp : tokens.door} />
        </mesh>
      )}
      {points >= stages.windowBoxes && (
        <Grow position={[0, 0.4, frontZ + 0.04]}>
          {[-0.3, 0.3].map((dx) => (
            <mesh key={dx} position={[dx, 0, 0]}>
              <boxGeometry args={[0.26, 0.07, 0.08]} />
              <meshLambertMaterial color={tokens.leaf} />
            </mesh>
          ))}
        </Grow>
      )}
      {points >= stages.hedge && (
        <Grow position={[0, 0, 0.98]}>
          <RoundedBox
            args={[1.3, 0.2, 0.16]}
            radius={0.06}
            position={[0, 0.1, 0]}
            castShadow
          >
            <meshLambertMaterial color={tokens.leaf} />
          </RoundedBox>
        </Grow>
      )}
      {points >= stages.gardenTree && (
        <Grow position={[0.42, 0, 0.72]}>
          <Tree tokens={tokens} scale={0.75} />
        </Grow>
      )}
    </group>
  );
}

/** A ground texture that fades to transparent at its top and bottom, so the street has no visible border. */
function useFadeTexture() {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const context = canvas.getContext("2d");
    if (context) {
      const gradient = context.createLinearGradient(0, 0, 0, 256);
      // An alpha map is read from the green channel, so the fade is painted
      // from black (transparent) to white (opaque).
      gradient.addColorStop(0, "rgb(0,0,0)");
      gradient.addColorStop(0.2, "rgb(90,90,90)");
      gradient.addColorStop(0.42, "rgb(255,255,255)");
      gradient.addColorStop(0.62, "rgb(255,255,255)");
      gradient.addColorStop(0.82, "rgb(90,90,90)");
      gradient.addColorStop(1, "rgb(0,0,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 256, 256);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);
}

/** A three-quarter view from above, zoomed so the whole street fits the width. */
function FitCamera() {
  const width = useThree((three) => three.size.width);
  const camera = useRef<THREE.OrthographicCamera>(null);
  useEffect(() => {
    camera.current?.lookAt(0, 0.4, 0.3);
    camera.current?.updateProjectionMatrix();
  }, [width]);
  return (
    <OrthographicCamera
      ref={camera}
      makeDefault
      position={[2, 10, 9]}
      zoom={width / (sceneWidth * 1.1)}
      near={0.1}
      far={100}
    />
  );
}

interface Anchor {
  householdId: string;
  left: number;
  top: number;
}

/** Reports where above each house its pin goes, in canvas pixels. */
function PinAnchors({ onChange }: { onChange: (anchors: Anchor[]) => void }) {
  const camera = useThree((three) => three.camera);
  const size = useThree((three) => three.size);
  const measured = useRef("");
  useFrame(() => {
    const key = `${size.width}x${size.height}`;
    if (measured.current === key) return;
    measured.current = key;
    camera.updateMatrixWorld();
    onChange(
      households.map((household, i) => {
        const [x, z] = housePosition(i);
        const point = new THREE.Vector3(x, 1.55, z).project(camera);
        return {
          householdId: household.id,
          left: ((point.x + 1) / 2) * size.width,
          top: ((1 - point.y) / 2) * size.height,
        };
      }),
    );
  });
  return null;
}

function Street({
  youHouseholdId,
  onAnchors,
}: {
  youHouseholdId?: string;
  onAnchors: (anchors: Anchor[]) => void;
}) {
  const state = useDemoState();
  const tokens = useTokens();
  const roof = useMemo(() => roofGeometry(), []);
  const fade = useFadeTexture();
  const trees = sharedGoalsGoingAhead(state).length;
  const ground = useMemo(
    () =>
      new THREE.Color(tokens["verge-bare"]).lerp(
        new THREE.Color(tokens["verge-full"]),
        Math.min(1, totalPoints(state) / fullStreetPoints),
      ),
    [tokens, state],
  );

  return (
    <>
      <FitCamera />
      <PinAnchors onChange={onAnchors} />
      <ambientLight intensity={Number(tokens["scene-ambient"]) || 1} />
      <directionalLight
        position={[4, 9, 6]}
        intensity={Number(tokens["scene-sun"]) || 1}
      />

      <mesh rotation-x={-Math.PI / 2} position={[0, -0.001, 0.2]}>
        <planeGeometry args={[sceneWidth * 3, 10]} />
        <meshBasicMaterial
          color={ground}
          alphaMap={fade}
          transparent
          depthWrite={false}
        />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0.15]}>
        <planeGeometry args={[sceneWidth * 3, 1.1]} />
        <meshBasicMaterial color={tokens.pavement} />
      </mesh>

      {households.map((household, i) => (
        <House
          key={household.id}
          index={i}
          points={householdPoints(state, household.id)}
          tokens={tokens}
          roof={roof}
          isYou={household.id === youHouseholdId}
        />
      ))}

      {streetTreeSlots.slice(0, trees).map(([x, z]) => (
        <Grow key={`${x}-${z}`} position={[x, 0, z]}>
          <Tree tokens={tokens} scale={0.9} />
        </Grow>
      ))}

      <ContactShadows
        position={[0, 0.002, 0.2]}
        scale={[sceneWidth + 2, 8]}
        blur={2.2}
        opacity={0.35}
        far={2.5}
        resolution={512}
      />
    </>
  );
}

export function StreetScene({
  youHouseholdId,
  showNeighbours = false,
  label,
}: {
  youHouseholdId?: string;
  showNeighbours?: boolean;
  label: string;
}) {
  const state = useDemoState();
  const [anchors, setAnchors] = useState<Anchor[]>([]);

  function pinFor(householdId: string): ReactNode {
    if (householdId === youHouseholdId)
      return (
        <span className="rounded-full bg-lamp px-2.5 py-1 text-xs font-bold whitespace-nowrap text-on-lamp shadow">
          You
        </span>
      );
    if (!showNeighbours) return undefined;
    const occupants: User[] = state.users.filter(
      (u) => u.householdId === householdId,
    );
    if (occupants.length === 0) return undefined;
    return (
      <span className="flex -space-x-1.5">
        {occupants.map((u) => (
          <Avatar
            key={u.id}
            user={u}
            className="size-6 text-[0.65rem] shadow ring-2 ring-background"
          />
        ))}
      </span>
    );
  }

  return (
    <div role="img" aria-label={label} className="relative h-64 w-full">
      <Canvas
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
        className="mask-[linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]"
      >
        <Street youHouseholdId={youHouseholdId} onAnchors={setAnchors} />
      </Canvas>
      {anchors.map(({ householdId, left, top }) => {
        const pin = pinFor(householdId);
        return (
          pin && (
            <span
              key={householdId}
              aria-hidden
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-full"
              style={{ left, top }}
            >
              {pin}
            </span>
          )
        );
      })}
    </div>
  );
}

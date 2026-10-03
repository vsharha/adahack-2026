"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { StreetDrawing } from "@/components/street-drawing";
import { useDemoState } from "@/lib/demo-store";
import { sharedGoalsGoingAhead, totalPoints } from "@/lib/progress";

const StreetScene = dynamic(
  () => import("@/components/street-scene").then((m) => m.StreetScene),
  { ssr: false, loading: () => <div className="h-64 w-full" /> },
);

let webGL: boolean | undefined;

function supportsWebGL(): boolean {
  if (webGL === undefined) {
    try {
      const canvas = document.createElement("canvas");
      webGL = !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
    } catch {
      webGL = false;
    }
  }
  return webGL;
}

const noopSubscribe = () => () => {};

/**
 * The street, edge to edge with no frame: the 3D scene where WebGL works,
 * otherwise the 2D drawing.
 */
export function StreetView({
  youHouseholdId,
  showNeighbours = false,
}: {
  youHouseholdId?: string;
  showNeighbours?: boolean;
}) {
  const state = useDemoState();
  const canRender3D = useSyncExternalStore(
    noopSubscribe,
    supportsWebGL,
    () => true,
  );
  const label = `The street: ${totalPoints(state)} points earned, ${sharedGoalsGoingAhead(state).length} shared goals going ahead.`;

  return (
    <div className="bg-linear-to-b from-transparent via-secondary/60 to-transparent">
      {canRender3D ? (
        <StreetScene
          youHouseholdId={youHouseholdId}
          showNeighbours={showNeighbours}
          label={label}
        />
      ) : (
        <StreetDrawing
          youHouseholdId={youHouseholdId}
          showNeighbours={showNeighbours}
        />
      )}
    </div>
  );
}

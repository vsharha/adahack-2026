"use client";

import dynamic from "next/dynamic";

const PitchDeck = dynamic(() => import("./pitch-deck"), {
  ssr: false,
  loading: () => (
    <main className="flex min-h-dvh items-center justify-center bg-background text-foreground">
      <p role="status">Loading the presentation…</p>
    </main>
  ),
});

export default function Presentation() {
  return <PitchDeck />;
}

"use client";

import { Signal, Wifi } from "lucide-react";
import {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
} from "react";
import { StageLinks } from "@/components/app/stage-links";

const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 844;
/** Share of the window's height (or width, if narrower) the phone fills. */
const PHONE_FILL = 0.92;

const PhoneScreenContext = createContext<HTMLElement | null>(null);

/**
 * The phone's screen, for portals: dialogs and popovers rendered into it are
 * scaled and clipped with the drawn phone instead of covering the page.
 */
export function usePhoneScreen() {
  return useContext(PhoneScreenContext);
}

function subscribe(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

/**
 * Full screen on a phone; drawn as a handset on wider screens and on any
 * screen with a mouse, for demos. The handset is laid out at a fixed 390 × 844
 * and scaled to fill the same share of the window at any browser zoom, so it
 * keeps an iPhone's proportions. `--status-bar` is the height of the drawn
 * status bar, which floats over the screen; scrolling screens pad their top by
 * it so content starts below it. App content has its own stacking context
 * below the drawn system chrome.
 */
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState<HTMLElement | null>(null);
  const width = useSyncExternalStore(
    subscribe,
    () => window.innerWidth,
    () => null,
  );
  const height = useSyncExternalStore(
    subscribe,
    () => window.innerHeight,
    () => null,
  );
  const scale =
    width === null || height === null
      ? null
      : PHONE_FILL * Math.min(height / PHONE_HEIGHT, width / PHONE_WIDTH);
  const gutter =
    width === null || scale === null ? 0 : (width - PHONE_WIDTH * scale) / 2;

  return (
    <div className="min-h-dvh framed:relative framed:grid framed:h-dvh framed:place-items-center framed:overflow-hidden framed:bg-stage">
      <StageLinks gutter={gutter} />
      <div
        className={
          scale === null
            ? "framed:invisible framed:size-0"
            : "framed:h-(--phone-height) framed:w-(--phone-width)"
        }
        style={
          scale === null
            ? undefined
            : ({
                "--phone-scale": scale,
                "--phone-width": `${PHONE_WIDTH * scale}px`,
                "--phone-height": `${PHONE_HEIGHT * scale}px`,
              } as React.CSSProperties)
        }
      >
        <div
          ref={setScreen}
          className="phone-screen relative flex h-dvh w-full flex-col overflow-hidden bg-background [--status-bar:0px] framed:h-[844px] framed:w-[390px] framed:origin-top-left framed:scale-(--phone-scale) framed:rounded-[3.25rem] framed:border-8 framed:border-device framed:shadow-[0_30px_80px_-20px_var(--device-shadow)] framed:[--status-bar:3rem]"
        >
          <div
            aria-hidden
            className="font-system pointer-events-none absolute inset-x-0 top-0 z-60 hidden h-12 text-(--status-ink) items-center justify-between px-7 text-[15px] font-semibold framed:flex"
          >
            <span className="status-bar-fade pointer-events-none absolute inset-x-0 top-0 -z-10 h-18" />
            <span className="tabular-nums">9:41</span>
            <span className="absolute top-1/2 left-1/2 h-7 w-26 -translate-x-1/2 -translate-y-1/2 rounded-full bg-device" />
            <span className="flex items-center gap-1">
              <Signal className="size-4" strokeWidth={3} />
              <Wifi className="size-4" strokeWidth={3} />
              <span className="ml-0.5 flex items-center">
                <span className="grid h-3.5 w-6.5 place-items-center rounded-[5px] bg-(--status-ink) text-[10px] leading-none font-bold text-(--status-surface)">
                  100
                </span>
                <span className="ml-px h-1.5 w-0.5 rounded-r-full bg-(--status-ink)/45" />
              </span>
            </span>
          </div>
          <PhoneScreenContext value={screen}>
            <div className="relative z-0 min-h-0 flex-1">{children}</div>
          </PhoneScreenContext>
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-2 left-1/2 z-50 hidden h-1.5 w-32 -translate-x-1/2 rounded-full bg-(--status-ink)/40 framed:block"
          />
        </div>
      </div>
    </div>
  );
}

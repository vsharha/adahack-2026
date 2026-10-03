import { BatteryFull, Signal, Wifi } from "lucide-react";

/**
 * Full screen on a phone; drawn as a handset on wider screens for demos.
 * `--status-bar` is the height of the drawn status bar, which floats over the
 * screen; scrolling screens pad their top by it so content starts below it.
 */
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh md:grid md:place-items-center md:py-8">
      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-background [--status-bar:0px] md:h-[844px] md:[--status-bar:3rem] md:max-h-[calc(100dvh-4rem)] md:w-[390px] md:rounded-[3.25rem] md:border-[12px] md:border-slate md:shadow-[0_30px_80px_-20px_rgb(31_42_48/0.45)]">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 z-40 hidden h-12 items-center justify-between px-7 text-sm font-bold md:flex"
        >
          <span className="status-bar-fade pointer-events-none absolute inset-x-0 top-0 -z-10 h-18" />
          <span className="font-mono">9:41</span>
          <span className="absolute top-1/2 left-1/2 h-7 w-26 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate" />
          <span className="flex items-center gap-1">
            <Signal className="size-4" />
            <Wifi className="size-4" />
            <BatteryFull className="size-5" />
          </span>
        </div>
        <div className="relative min-h-0 flex-1">{children}</div>
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-2 left-1/2 z-50 hidden h-1.5 w-32 -translate-x-1/2 rounded-full bg-foreground/40 md:block"
        />
      </div>
    </div>
  );
}

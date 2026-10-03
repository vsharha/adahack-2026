import { Signal, Wifi } from "lucide-react";

/**
 * Full screen on a phone; drawn as a handset on wider screens for demos.
 * `--status-bar` is the height of the drawn status bar, which floats over the
 * screen; scrolling screens pad their top by it so content starts below it.
 */
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh md:grid md:place-items-center md:py-8">
      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-background [--status-bar:0px] md:h-[844px] md:[--status-bar:3rem] md:max-h-[calc(100dvh-4rem)] md:w-[390px] md:rounded-[3.25rem] md:border-8 md:border-[#1f2224] md:shadow-[0_30px_80px_-20px_rgb(31_42_48/0.45)]">
        <div
          aria-hidden
          className="font-system absolute inset-x-0 top-0 z-40 hidden h-12 items-center justify-between px-7 text-[15px] font-semibold md:flex"
        >
          <span className="status-bar-fade pointer-events-none absolute inset-x-0 top-0 -z-10 h-18" />
          <span className="tabular-nums">9:41</span>
          <span className="absolute top-1/2 left-1/2 h-7 w-26 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1f2224]" />
          <span className="flex items-center gap-1">
            <Signal className="size-4" strokeWidth={3} />
            <Wifi className="size-4" strokeWidth={3} />
            <span className="ml-0.5 flex items-center">
              <span className="grid h-3.5 w-6.5 place-items-center rounded-[5px] bg-foreground text-[10px] leading-none font-bold text-background">
                100
              </span>
              <span className="ml-px h-1.5 w-0.5 rounded-r-full bg-foreground/45" />
            </span>
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

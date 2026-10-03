import { ExternalLink, Leaf, Wind, Zap } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { notificationHref } from "@/lib/notification-target";
import area from "@/data/area.json";

const number = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/London",
});

function SourceLink({ href, label }: { href: string; label: string }) {
  return (
    <p className="text-xs text-muted-foreground">
      Source:{" "}
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
      >
        {label} <ExternalLink className="size-3" aria-hidden />
      </a>
    </p>
  );
}

export function LocalContext() {
  const aqi = area.air.hours.map((hour) => hour.europeanAqi);
  return (
    <section className="space-y-3 px-5" aria-labelledby="local-context">
      <div>
        <h2 id="local-context" className="text-lg font-bold">
          Around your postcode
        </h2>
        <p className="text-sm text-muted-foreground">
          Saved local context · checked{" "}
          {date.format(new Date(`${area.retrievedOn}T12:00:00Z`))}
        </p>
      </div>
      <div className="divide-y rounded-xl border bg-card">
        <article className="space-y-2 p-4">
          <h3 className="flex items-center gap-2 font-bold">
            <Leaf className="size-4 text-moss-ink" /> Green space nearby
          </h3>
          {area.greenSpaces.map((space) => (
            <p key={space.name}>
              {space.name}
              <span className="block text-sm text-muted-foreground">
                {space.kind} · Edinburgh Council directory
              </span>
            </p>
          ))}
          <p className="text-sm text-muted-foreground">
            A local place to care for together. The litter pick is a fictional
            demo activity.
          </p>
          <Link
            href={notificationHref({ tab: "goals", goalId: "g-litter-pick" })}
            className={buttonVariants({
              variant: "outline",
              className: "w-full",
            })}
          >
            View the garden litter pick
          </Link>
          {area.greenSpaces.map((space) => (
            <SourceLink
              key={space.name}
              href={space.source}
              label="Edinburgh Council directory"
            />
          ))}
        </article>
        <article className="space-y-2 p-4">
          <h3 className="flex items-center gap-2 font-bold">
            <Wind className="size-4 text-moss-ink" /> Air near EH8
          </h3>
          <p className="tabular-nums">
            {Math.min(...aqi)}–{Math.max(...aqi)} European AQI
          </p>
          <p className="text-sm text-muted-foreground">
            Saved model forecast for{" "}
            {date.format(new Date(area.air.hours[0].time))}. Lower values mean
            less air pollution. Covers the surrounding model grid, rather than a
            street sensor.
          </p>
          <Link
            href={notificationHref({
              tab: "goals",
              goalId: "g-car-free-school-run",
            })}
            className={buttonVariants({
              variant: "outline",
              className: "w-full",
            })}
          >
            Explore walking and cycling
          </Link>
          <SourceLink
            href={area.air.source}
            label="Open-Meteo / CAMS forecast"
          />
        </article>
        <article className="space-y-2 p-4">
          <h3 className="flex items-center gap-2 font-bold">
            <Zap className="size-4 text-moss-ink" /> Electricity in EH8
          </h3>
          <p>
            <span className="tabular-nums">
              {number.format(area.electricity.meanKwh)} kWh
            </span>{" "}
            per domestic meter in {area.electricity.year}
          </p>
          <p className="text-sm text-muted-foreground">
            District average across {number.format(area.electricity.meters)}{" "}
            recorded meters. This informs home goals; it does not measure your
            household or award points.
          </p>
          <Link
            href="/goals?scope=household"
            className={buttonVariants({
              variant: "outline",
              className: "w-full",
            })}
          >
            Explore home energy goals
          </Link>
          <SourceLink
            href={area.electricity.source}
            label="Government electricity statistics"
          />
        </article>
      </div>
    </section>
  );
}

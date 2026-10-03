import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

const colours = [
  "bg-avatar-1 text-on-avatar-1",
  "bg-avatar-2 text-on-avatar-2",
  "bg-avatar-3 text-on-avatar-3",
  "bg-avatar-4 text-on-avatar-4",
  "bg-avatar-5 text-on-avatar-5",
  "bg-avatar-6 text-on-avatar-6",
];

/** Fixed for the premade neighbours, so the demo's faces never share a colour. */
const premadeColours: Record<string, string> = {
  priya: colours[0],
  margaret: colours[4],
  fiona: colours[2],
  ewan: colours[1],
  isla: colours[5],
};

function colourFor(id: string) {
  if (premadeColours[id]) return premadeColours[id];
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return colours[hash % colours.length];
}

export function Avatar({
  user,
  className,
}: {
  user: Pick<User, "id" | "name">;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full font-bold",
        colourFor(user.id),
        className,
      )}
    >
      {user.name.trim()[0]?.toUpperCase()}
    </span>
  );
}

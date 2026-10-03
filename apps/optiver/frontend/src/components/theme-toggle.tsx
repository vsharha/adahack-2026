"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import {
  useAppearance,
  setAppearance,
  type Appearance,
} from "@/lib/appearance";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const appearances: {
  value: Appearance;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle() {
  const appearance = useAppearance();

  const CurrentIcon =
    appearances.find((a) => a.value === appearance)?.icon || Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative rounded-full">
          <CurrentIcon className="h-4 w-4" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {appearances.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setAppearance(value)}
            className="flex items-center gap-2"
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
            {appearance === value && <span className="ml-auto text-xs">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

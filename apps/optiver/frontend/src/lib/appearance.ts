"use client";

import { useEffect, useSyncExternalStore } from "react";
import { appearanceStorageKey } from "@/lib/appearance-script";

export type Appearance = "system" | "light" | "dark";

const darkQuery = "(prefers-color-scheme: dark)";
const listeners = new Set<() => void>();

function read(): Appearance {
  try {
    const saved = localStorage.getItem(appearanceStorageKey);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // Storage can be unavailable; fall back to the system setting.
  }
  return "system";
}

function resolveTheme(appearance: Appearance): "light" | "dark" {
  if (appearance !== "system") return appearance;
  return matchMedia(darkQuery).matches ? "dark" : "light";
}

function apply() {
  const theme = resolveTheme(read());
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function setAppearance(appearance: Appearance) {
  try {
    if (appearance === "system") localStorage.removeItem(appearanceStorageKey);
    else localStorage.setItem(appearanceStorageKey, appearance);
  } catch {
    // The choice still applies for this visit.
  }
  apply();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Re-applies the theme when the system preference changes; mount once per page. */
export function useSystemThemeSync() {
  useEffect(() => {
    const media = matchMedia(darkQuery);
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);
}

export function useAppearance(): Appearance {
  return useSyncExternalStore(subscribe, read, () => "system");
}

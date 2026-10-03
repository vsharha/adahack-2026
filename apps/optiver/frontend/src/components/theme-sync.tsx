"use client";

import { useSystemThemeSync } from "@/lib/appearance";

/** Syncs the theme when the system preference changes. Mount once in layout. */
export function ThemeSync() {
  useSystemThemeSync();
  return null;
}

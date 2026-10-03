"use client";

import { useEffect } from "react";
import { useSystemThemeSync } from "@/lib/appearance";
import { applyTheme } from "@/lib/appearance-script";

/** Syncs the theme when the system preference changes. Mount once in layout. */
export function ThemeSync() {
  useSystemThemeSync();

  useEffect(() => {
    // Apply theme on mount to handle SSR/CSR sync
    applyTheme();
  }, []);

  return null;
}

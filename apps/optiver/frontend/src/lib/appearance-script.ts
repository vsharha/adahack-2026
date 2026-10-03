export const appearanceStorageKey = "optiver-appearance";

const darkQuery = "(prefers-color-scheme: dark)";

export function resolveTheme(
  appearance: "system" | "light" | "dark",
): "light" | "dark" {
  if (appearance !== "system") return appearance;
  return matchMedia(darkQuery).matches ? "dark" : "light";
}

export function applyTheme(): void {
  try {
    const saved = localStorage.getItem(appearanceStorageKey);
    const appearance: "system" | "light" | "dark" =
      saved === "light" || saved === "dark" ? saved : "system";
    document.documentElement.dataset.theme = resolveTheme(appearance);
  } catch {
    // Storage unavailable; use system default
    document.documentElement.dataset.theme = matchMedia(darkQuery).matches
      ? "dark"
      : "light";
  }
}

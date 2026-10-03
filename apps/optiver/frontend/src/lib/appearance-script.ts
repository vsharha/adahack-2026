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
    const theme = resolveTheme(appearance);

    // Use class instead of data attribute for Tailwind dark variant
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  } catch {
    // Storage unavailable; use system default
    const theme = matchMedia(darkQuery).matches ? "dark" : "light";
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }
}

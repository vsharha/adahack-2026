export const appearanceStorageKey = "optiver-appearance";

/**
 * Runs in `<head>` before the page paints, so the saved light or dark choice
 * (or the system setting) applies without a flash of the other theme.
 * Kept in sync with `resolveTheme` in `lib/appearance.ts`.
 */
export const appearanceScript = `try {
  var p = localStorage.getItem("${appearanceStorageKey}") || "system";
  var dark = p === "dark" || (p === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
} catch (e) {}`;

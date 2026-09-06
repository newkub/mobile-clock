import { appStore } from "../store/app";

export type ThemeMode = "dark" | "light" | "auto";

/** Apply the effective theme to the document root immediately. */
export function syncTheme() {
  const mode = appStore.globalSettings.theme as ThemeMode;
  let isDark = mode === "dark";
  if (mode === "auto") {
    isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  document.documentElement.classList.toggle("dark", isDark);
}

/** Toggle the reduce-motion class on <html> based on OS preference. */
export function syncMotionPreference() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.toggle("reduce-motion", reduced);
}

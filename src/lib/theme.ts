import { appStore } from "../store/app";

export type ThemeMode = "dark" | "light" | "auto";

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

/** Apply the effective theme and custom appearance to the document root. */
export function syncTheme() {
  const mode = appStore.globalSettings.theme as ThemeMode;
  let isDark = mode === "dark";
  if (mode === "auto") {
    isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  const root = document.documentElement;
  root.classList.toggle("dark", isDark);

  const accent = appStore.globalSettings.accentColor;
  if (accent) {
    const [h, s, l] = hexToHsl(accent);
    root.style.setProperty("--color-primary", `${h} ${s}% ${l}%`);
    root.style.setProperty("--color-primary-glow", `${h} ${s}% ${Math.min(l + 10, 100)}%`);
  }

  const fontSize = appStore.globalSettings.fontSize;
  if (fontSize) {
    root.style.fontSize = `${fontSize}px`;
  }
}

/** Toggle the reduce-motion class on <html> based on OS preference. */
export function syncMotionPreference() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.toggle("reduce-motion", reduced);
}

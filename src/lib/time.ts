import { appStore } from "../store/app";

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = m.toString().padStart(2, "0");
  const ss = s.toString().padStart(2, "0");
  if (h > 0) return `${h}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

/** Format a wall-clock time using the user's 12h/24h preference. */
export function formatShortTime(d: Date, includeSeconds = false): string {
  const hour12 = appStore.globalSettings.timeFormat === "12h";
  const options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12,
  };
  if (includeSeconds) options.second = "2-digit";
  return d.toLocaleTimeString(undefined, options);
}

/** Format a static hour/minute pair (e.g., an alarm time) using the user's preference. */
export function formatHourMinute(hour: number, minute: number): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return formatShortTime(d);
}

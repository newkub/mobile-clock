import { type PomodoroSession } from "../store/app";

export const DAY = 86_400_000;
export const WEEKS = 52;
export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const dateKey = (d: Date) => d.toISOString().slice(0, 10);

export function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return new Date(Number(y), Number(m) - 1, Number(d))
    .toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatFocus(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function colorLevel(seconds: number) {
  if (seconds <= 0) return "bg-surface-3";
  if (seconds < 1800) return "bg-primary/20";
  if (seconds < 5400) return "bg-primary/40";
  if (seconds < 10800) return "bg-primary/70";
  return "bg-primary";
}

export function buildGrid(sessions: PomodoroSession[]) {
  const map = new Map(sessions.map((s) => [s.date, s]));
  const days: { date: string; seconds: number }[] = [];
  for (let i = WEEKS * 7 - 1; i >= 0; i--) {
    const date = dateKey(new Date(Date.now() - i * DAY));
    days.push({ date, seconds: map.get(date)?.totalFocusSeconds ?? 0 });
  }
  return days;
}

export function streakFor(sessions: PomodoroSession[]) {
  const map = new Map(sessions.map((s) => [s.date, s.totalFocusSeconds]));
  const now = Date.now();
  let offset = 0;
  while (offset < WEEKS * 7 && !map.get(dateKey(new Date(now - offset * DAY)))) offset++;
  let count = 0;
  for (let i = offset; i < WEEKS * 7; i++) {
    if ((map.get(dateKey(new Date(now - i * DAY))) ?? 0) > 0) count++;
    else break;
  }
  return count;
}

/** Monday-first weekday index (0 = Mon … 6 = Sun) for an ISO date key. */
export const weekdayIndex = (iso: string) => (new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7;

export function buildWeekdayTotals(sessions: PomodoroSession[]) {
  const totals = [0, 0, 0, 0, 0, 0, 0];
  for (const s of sessions) totals[weekdayIndex(s.date)] += s.totalFocusSeconds;
  const max = Math.max(...totals, 1);
  return totals.map((seconds, i) => ({
    label: WEEKDAY_LABELS[i],
    seconds,
    pct: seconds > 0 ? Math.max(8, Math.round((seconds / max) * 100)) : 4,
  }));
}

export interface MonthCell {
  date: string;
  day: number;
  seconds: number;
  isToday: boolean;
}

/** Cells for the current month, Monday-first; `null` = leading blank. */
export function buildMonth(sessions: PomodoroSession[]) {
  const map = new Map(sessions.map((s) => [s.date, s.totalFocusSeconds]));
  const now = new Date();
  const [year, month, today] = [now.getFullYear(), now.getMonth(), dateKey(now)];
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells: (MonthCell | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= new Date(year, month + 1, 0).getDate(); d++) {
    const date = dateKey(new Date(year, month, d));
    cells.push({ date, day: d, seconds: map.get(date) ?? 0, isToday: date === today });
  }
  return cells;
}

/** Best-effort elapsed stopwatch time (seconds) from its persisted snapshot. */
export function readStopwatchSeconds(): number {
  try {
    const raw = localStorage.getItem("wrikka-stopwatch-state");
    if (!raw) return 0;
    const s = JSON.parse(raw) as { running?: boolean; offset?: number; startedAt?: number };
    const offset = typeof s.offset === "number" ? s.offset : 0;
    const extra = s.running && typeof s.startedAt === "number" ? Date.now() - s.startedAt : 0;
    return Math.max(0, Math.round((offset + extra) / 1000));
  } catch {
    return 0;
  }
}


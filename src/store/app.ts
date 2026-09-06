import { createStore } from "solid-js/store";
import type { Alarm, ClockSubTab, FocusTask, Goal, Habit, HabitCompletion, PomodoroSession, Reminder, TimeEntry, TimerPreset, WorldClock } from "../types";

export * from "../types";

export interface GlobalSettings {
  theme: "dark" | "light" | "auto";
  haptics: boolean;
  sound: boolean;
  notifications: boolean;
  /** Pomodoro durations in minutes. */
  pomodoroFocus: number;
  pomodoroShort: number;
  pomodoroLong: number;
  /** "12h" or "24h" — controls time display across the app. */
  timeFormat: "12h" | "24h";
  /** Alert sound style. */
  soundTheme: "beep" | "chime" | "digital" | "soft";
  /** Accent color used for primary UI highlights. */
  accentColor: string;
  /** Base font size in px (affects rem-based sizes). */
  fontSize: number;
  /** Eye break reminder. */
  eyeBreakEnabled: boolean;
  eyeBreakInterval: number;
}

export interface StatusMessage {
  text: string;
  type: "info" | "success" | "warning" | "error";
}

export interface RingingAlert {
  kind: "alarm" | "reminder";
  id: string;
  title: string;
}

const STORAGE_KEY = "wrikka-clock-store";

const defaultGlobal: GlobalSettings = {
  theme: "auto",
  haptics: true,
  sound: true,
  notifications: true,
  pomodoroFocus: 25,
  pomodoroShort: 5,
  pomodoroLong: 15,
  timeFormat: "24h",
  soundTheme: "beep",
  accentColor: "#6366f1",
  fontSize: 16,
  eyeBreakEnabled: false,
  eyeBreakInterval: 20,
};

const defaultPresets: TimerPreset[] = [
  { id: "p1", name: "3 min", seconds: 180, color: "#22c55e" },
  { id: "p2", name: "5 min", seconds: 300, color: "#3b82f6" },
  { id: "p3", name: "10 min", seconds: 600, color: "#a855f7" },
  { id: "p4", name: "15 min", seconds: 900, color: "#f59e0b" },
  { id: "p5", name: "25 min", seconds: 1500, color: "#6366f1" },
];

export interface AppState {
  clockSubTab: ClockSubTab;
  globalSettings: GlobalSettings;
  status: StatusMessage | null;
  alarms: Alarm[];
  timerPresets: TimerPreset[];
  reminders: Reminder[];
  pomodoroSessions: PomodoroSession[];
  worldClocks: WorldClock[];
  focusTasks: FocusTask[];
  habits: Habit[];
  habitCompletions: HabitCompletion[];
  notes: { id: string; text: string; createdAt: number }[];
  sleepSessions: { id: string; start: number; end: number | null }[];
  timeEntries: TimeEntry[];
  goals: Goal[];
  tabOrder: ClockSubTab[];
  elevenLabsKey: string;
  settingsOpen: boolean;
  /** Currently ringing in-app alert (web only; native uses OS notifications). */
  ringing: RingingAlert | null;
  /** Whether the first-run onboarding has been dismissed. */
  hasCompletedOnboarding: boolean;
}

export const initialState: AppState = {
  clockSubTab: "overview",
  globalSettings: defaultGlobal,
  status: null,
  alarms: [],
  timerPresets: defaultPresets,
  reminders: [],
  pomodoroSessions: [],
  worldClocks: [],
  focusTasks: [],
  habits: [],
  habitCompletions: [],
  notes: [],
  sleepSessions: [],
  timeEntries: [],
  goals: [],
  tabOrder: [
    "overview",
    "clock",
    "alarm",
    "stopwatch",
    "timer",
    "pomodoro",
    "reminder",
    "focus",
    "stats",
    "habits",
    "ambient",
    "breathing",
    "notes",
    "sleep",
    "time",
    "goals",
    "calendar",
  ],
  elevenLabsKey: "",
  settingsOpen: false,
  ringing: null,
  hasCompletedOnboarding: false,
};

export const SUB_TAB_ORDER: ClockSubTab[] = [
  "overview",
  "clock",
  "alarm",
  "stopwatch",
  "timer",
  "pomodoro",
  "reminder",
  "focus",
  "stats",
  "habits",
  "ambient",
  "breathing",
  "notes",
  "sleep",
  "time",
  "goals",
  "calendar",
];

const validSubTabs: ClockSubTab[] = SUB_TAB_ORDER;

function loadState(): Partial<AppState> {
  // Skip hydration during SSR / non-DOM contexts.
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<AppState>;
    // Only keep known keys so stale fields from older versions are dropped.
    const clean: Partial<AppState> = {};
    if (parsed.clockSubTab && validSubTabs.includes(parsed.clockSubTab)) {
      clean.clockSubTab = parsed.clockSubTab;
    }
    if (parsed.globalSettings) clean.globalSettings = parsed.globalSettings;
    if (Array.isArray(parsed.alarms)) clean.alarms = parsed.alarms;
    if (Array.isArray(parsed.timerPresets)) clean.timerPresets = parsed.timerPresets;
    if (Array.isArray(parsed.reminders)) clean.reminders = parsed.reminders;
    if (Array.isArray(parsed.pomodoroSessions)) clean.pomodoroSessions = parsed.pomodoroSessions;
    if (Array.isArray(parsed.worldClocks)) clean.worldClocks = parsed.worldClocks;
    if (Array.isArray(parsed.focusTasks)) clean.focusTasks = parsed.focusTasks;
    if (Array.isArray(parsed.habits)) clean.habits = parsed.habits;
    if (Array.isArray(parsed.habitCompletions)) clean.habitCompletions = parsed.habitCompletions;
    if (Array.isArray(parsed.notes)) clean.notes = parsed.notes;
    if (Array.isArray(parsed.sleepSessions)) clean.sleepSessions = parsed.sleepSessions;
    if (Array.isArray(parsed.timeEntries)) clean.timeEntries = parsed.timeEntries;
    if (Array.isArray(parsed.goals)) clean.goals = parsed.goals;
    if (Array.isArray(parsed.tabOrder)) {
      const filtered = parsed.tabOrder.filter((t): t is ClockSubTab => validSubTabs.includes(t));
      const missing = validSubTabs.filter((t) => !filtered.includes(t));
      clean.tabOrder = [...filtered, ...missing];
    }
    if (typeof parsed.elevenLabsKey === "string") clean.elevenLabsKey = parsed.elevenLabsKey;
    if (typeof parsed.hasCompletedOnboarding === "boolean") clean.hasCompletedOnboarding = parsed.hasCompletedOnboarding;
    return clean;
  } catch {
    return {};
  }
}

export function mergeWithDefault(loaded: Partial<AppState>): AppState {
  return {
    ...initialState,
    ...loaded,
    globalSettings: { ...defaultGlobal, ...loaded.globalSettings },
  };
}

const [store, setStore] = createStore<AppState>(mergeWithDefault(loadState()));

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
export function queuePersist() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(persist, 200);
}

export { store as appStore, setStore };
export const setAppStore = setStore;

export * from "./actions";

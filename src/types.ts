export type Day = "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU";

export type ClockSubTab =
  | "overview"
  | "clock"
  | "alarm"
  | "stopwatch"
  | "timer"
  | "pomodoro"
  | "reminder"
  | "focus"
  | "stats"
  | "habits"
  | "ambient"
  | "breathing"
  | "notes"
  | "sleep";

export interface Alarm {
  id: string;
  hour: number;
  minute: number;
  label: string;
  enabled: boolean;
  repeat: Day[];
  sound: "beep" | "bell" | "ai";
  soundUrl?: string;
  aiText?: string;
}

export interface TimerPreset {
  id: string;
  name: string;
  seconds: number;
  color: string;
}

export interface Reminder {
  id: string;
  title: string;
  date: string; // ISO date
  time: string; // HH:MM
  repeat: "none" | "daily" | "weekly" | "monthly";
  enabled: boolean;
  createdAt: number;
}

export interface PomodoroSession {
  date: string;
  completedCycles: number;
  totalFocusSeconds: number;
}

export interface WorldClock {
  id: string;
  zone: string;
  label: string;
}

export interface FocusTask {
  id: string;
  title: string;
  completed: boolean;
  completedAt: number | null;
  totalFocusSeconds: number;
  completedPomodoros: number;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export interface Habit {
  id: string;
  title: string;
  color: string;
  icon: string;
  frequency: string;
  /** ISO dates when the habit should be active (frequency === weekly) or completed (daily). */
  targetDays: string[];
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  date: string; // ISO date
  completedAt: number;
  note: string | null;
}

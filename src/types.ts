export type Day = "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU";

export type ClockSubTab =
  | "clock"
  | "alarm"
  | "stopwatch"
  | "timer"
  | "pomodoro"
  | "reminder"
  | "stats"
  | "ambient"
  | "breathing"
  | "focus";

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

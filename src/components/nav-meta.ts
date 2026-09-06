import type { ClockSubTab } from "../store/app";

export const subTabMeta: Record<ClockSubTab, { label: string; icon: string }> = {
  overview: { label: "Overview", icon: "i-mdi-view-dashboard-outline" },
  clock: { label: "Clock", icon: "i-mdi-clock-outline" },
  alarm: { label: "Alarm", icon: "i-mdi-alarm" },
  stopwatch: { label: "Stopwatch", icon: "i-mdi-timer-outline" },
  timer: { label: "Timer", icon: "i-mdi-timer-sand" },
  pomodoro: { label: "Pomodoro", icon: "i-mdi-brain" },
  reminder: { label: "Reminder", icon: "i-mdi-bell-outline" },
  focus: { label: "Focus", icon: "i-mdi-checkbox-marked-circle-plus-outline" },
  stats: { label: "Stats", icon: "i-mdi-chart-bar" },
  habits: { label: "Habits", icon: "i-mdi-calendar-check" },
  ambient: { label: "Ambient", icon: "i-mdi-weather-rainy" },
  breathing: { label: "Breathe", icon: "i-mdi-weather-windy" },
  notes: { label: "Notes", icon: "i-mdi-note-text-outline" },
  sleep: { label: "Sleep", icon: "i-mdi-sleep" },
  time: { label: "Time", icon: "i-mdi-clock-time-four-outline" },
  goals: { label: "Goals", icon: "i-mdi-target" },
  calendar: { label: "Calendar", icon: "i-mdi-calendar" },
};

export const subTabTitles: Record<string, string> = Object.fromEntries(
  Object.entries(subTabMeta).map(([id, m]) => [id, m.label]),
);

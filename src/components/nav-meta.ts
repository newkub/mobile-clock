import type { ClockSubTab } from "../store/app";

export const subTabMeta: Record<ClockSubTab, { label: string; icon: string }> = {
  overview: { label: "Overview", icon: "i-mdi-view-dashboard-outline" },
  clock: { label: "Clock", icon: "i-mdi-clock-outline" },
  alarm: { label: "Alarm", icon: "i-mdi-alarm" },
  stopwatch: { label: "Stopwatch", icon: "i-mdi-timer-outline" },
  timer: { label: "Timer", icon: "i-mdi-timer-sand" },
  pomodoro: { label: "Pomodoro", icon: "i-mdi-brain" },
  reminder: { label: "Reminder", icon: "i-mdi-bell-outline" },
  habits: { label: "Habits", icon: "i-mdi-calendar-check" },
  ambient: { label: "Ambient", icon: "i-mdi-weather-rainy" },
  breathing: { label: "Breathe", icon: "i-mdi-weather-windy" },
  time: { label: "Time", icon: "i-mdi-clock-time-four-outline" },
};

export const subTabTitles: Record<string, string> = Object.fromEntries(
  Object.entries(subTabMeta).map(([id, m]) => [id, m.label]),
);

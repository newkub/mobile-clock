import { produce } from "solid-js/store";
import type { Alarm, ClockSubTab, PomodoroSession, Reminder, TimerPreset } from "../types";
import { appStore, initialState, setStore, queuePersist, mergeWithDefault, type GlobalSettings } from "./app";

export function setClockSubTab(tab: ClockSubTab) {
  setStore("clockSubTab", tab);
  queuePersist();
}

export function setGlobalSetting<K extends keyof GlobalSettings>(key: K, value: GlobalSettings[K]) {
  setStore("globalSettings", key, value);
  queuePersist();
}

export function setStatus(status: { text: string; type: "info" | "success" | "warning" | "error" }) {
  setStore("status", status);
  if (status.type !== "error") {
    setTimeout(() => setStore("status", null), 3000);
  }
}

export function clearStatus() {
  setStore("status", null);
}

export function addAlarm(alarm: Alarm) {
  setStore(produce((s) => { s.alarms.push(alarm); }));
  queuePersist();
}

export function updateAlarm(id: string, patch: Partial<Alarm>) {
  setStore(
    "alarms",
    (alarms) => alarms.map((a) => (a.id === id ? { ...a, ...patch } as Alarm : a))
  );
  queuePersist();
}

export function removeAlarm(id: string) {
  setStore("alarms", (alarms) => alarms.filter((a) => a.id !== id));
  queuePersist();
}

export function toggleAlarm(id: string) {
  const alarm = appStore.alarms.find((a) => a.id === id);
  if (!alarm) return;
  updateAlarm(id, { enabled: !alarm.enabled });
}

export function addTimerPreset(preset: TimerPreset) {
  setStore(produce((s) => { s.timerPresets.push(preset); }));
  queuePersist();
}

export function removeTimerPreset(id: string) {
  setStore("timerPresets", (presets) => presets.filter((p) => p.id !== id));
  queuePersist();
}

export function addReminder(r: Reminder) {
  setStore(produce((s) => { s.reminders.push(r); }));
  queuePersist();
}

export function updateReminder(id: string, patch: Partial<Reminder>) {
  setStore(
    "reminders",
    (reminders) => reminders.map((r) => (r.id === id ? { ...r, ...patch } as Reminder : r))
  );
  queuePersist();
}

export function removeReminder(id: string) {
  setStore("reminders", (reminders) => reminders.filter((r) => r.id !== id));
  queuePersist();
}

export function toggleReminder(id: string) {
  const r = appStore.reminders.find((x) => x.id === id);
  if (!r) return;
  updateReminder(id, { enabled: !r.enabled });
}

export function addPomodoroSession(session: PomodoroSession) {
  setStore(produce((s) => {
    const existing = s.pomodoroSessions.find((x) => x.date === session.date);
    if (existing) {
      existing.completedCycles += session.completedCycles;
      existing.totalFocusSeconds += session.totalFocusSeconds;
    } else {
      s.pomodoroSessions.push(session);
    }
  }));
  queuePersist();
}

export function setElevenLabsKey(key: string) {
  setStore("elevenLabsKey", key);
  queuePersist();
}

export function openSettings() {
  setStore("settingsOpen", true);
}

export function closeSettings() {
  setStore("settingsOpen", false);
}

export function completeOnboarding() {
  setStore("hasCompletedOnboarding", true);
  queuePersist();
}

export function resetStore() {
  setStore(initialState);
  queuePersist();
}

/** Export all persisted app data as a JSON string (transient UI state excluded). */
export function exportAppData(): string {
  const snapshot = { ...appStore, ringing: null, settingsOpen: false, status: null };
  return JSON.stringify(snapshot, null, 2);
}

/** Restore app data from a previously exported JSON string. Returns success. */
export function importAppData(json: string): boolean {
  try {
    const parsed = JSON.parse(json);
    const fresh = mergeWithDefault(parsed);
    setStore(
      produce((s) => {
        for (const key of Object.keys(initialState) as (keyof typeof initialState)[]) {
          (s as any)[key] = (fresh as any)[key];
        }
      }),
    );
    queuePersist();
    return true;
  } catch {
    return false;
  }
}

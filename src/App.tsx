import { createEffect, createSignal, onCleanup, onMount, Switch, Match } from "solid-js";
import { appStore, setClockSubTab, closeSettings, SUB_TAB_ORDER } from "./store/app";
import { startAlarmWatcher } from "./lib/notifications";
import { haptic } from "./lib/capacitor";
import { syncTheme } from "./lib/theme";
import { Header } from "./components/Header";
import { TabBar } from "./components/TabBar";
import { StatusToast } from "./components/StatusToast";
import { SettingsModal } from "./components/SettingsModal";
import { AlarmRingOverlay } from "./components/AlarmRingOverlay";
import { OnboardingOverlay } from "./components/OnboardingOverlay";
import { ClockView } from "./tabs/clock-sub/Clock";
import { AlarmTab } from "./tabs/clock-sub/Alarm";
import { StopwatchTab } from "./tabs/clock-sub/Stopwatch";
import { TimerTab } from "./tabs/clock-sub/Timer";
import { PomodoroTab } from "./tabs/clock-sub/Pomodoro";
import { ReminderTab } from "./tabs/clock-sub/Reminder";
import { StatsTab } from "./tabs/clock-sub/Stats";
import { AmbientTab } from "./tabs/clock-sub/Ambient";
import { BreathingTab } from "./tabs/clock-sub/Breathing";

export default function App() {
  // Apply theme to <html> whenever the setting or OS preference changes.
  createEffect(syncTheme);

  // Track network status and show a small offline banner.
  const [online, setOnline] = createSignal(navigator.onLine);
  onMount(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    onCleanup(() => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    });
  });

  // Keep the web notification watcher armed: it restarts whenever the
  // alarms/reminders in the store change.
  createEffect(() => {
    const stop = startAlarmWatcher(
      appStore.alarms.map((a) => ({
        id: a.id,
        hour: a.hour,
        minute: a.minute,
        enabled: a.enabled,
        label: a.label,
      })),
      appStore.reminders.map((r) => ({
        id: r.id,
        date: r.date,
        time: r.time,
        enabled: r.enabled,
        title: r.title,
      })),
    );
    onCleanup(stop);
  });

  // Swipe left/right on the main content to move between clock sub-tabs.
  onMount(() => {
    let startX = 0;
    let startY = 0;
    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
    };
    const onEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      const idx = SUB_TAB_ORDER.indexOf(appStore.clockSubTab);
      const next = dx < 0 ? idx + 1 : idx - 1;
      if (next < 0 || next >= SUB_TAB_ORDER.length) return;
      haptic("light");
      setClockSubTab(SUB_TAB_ORDER[next]);
    };
    const el = document.getElementById("clock-main");
    el?.addEventListener("touchstart", onStart, { passive: true });
    el?.addEventListener("touchend", onEnd, { passive: true });
    onCleanup(() => {
      el?.removeEventListener("touchstart", onStart);
      el?.removeEventListener("touchend", onEnd);
    });
  });

  // Keyboard: ←/→ switch sub-tabs (skipped while typing or when an overlay is open).
  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) return;
      if (appStore.settingsOpen || appStore.ringing) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const idx = SUB_TAB_ORDER.indexOf(appStore.clockSubTab);
      const next = e.key === "ArrowRight" ? idx + 1 : idx - 1;
      if (next < 0 || next >= SUB_TAB_ORDER.length) return;
      setClockSubTab(SUB_TAB_ORDER[next]);
    };
    window.addEventListener("keydown", onKey);
    onCleanup(() => window.removeEventListener("keydown", onKey));
  });

  return (
    <div class="flex h-dvh w-full flex-col bg-bg text-text">
      <Header />
      <StatusToast />
      <main id="clock-main" class="tab-content flex-1 overflow-y-auto">
        <div class="animate-fade mx-auto h-full w-full max-w-5xl">
        <Switch fallback={<ClockView />}>
          <Match when={appStore.clockSubTab === "clock"}><ClockView /></Match>
          <Match when={appStore.clockSubTab === "alarm"}><AlarmTab /></Match>
          <Match when={appStore.clockSubTab === "stopwatch"}><StopwatchTab /></Match>
          <Match when={appStore.clockSubTab === "timer"}><TimerTab /></Match>
          <Match when={appStore.clockSubTab === "pomodoro"}><PomodoroTab /></Match>
          <Match when={appStore.clockSubTab === "reminder"}><ReminderTab /></Match>
          <Match when={appStore.clockSubTab === "stats"}><StatsTab /></Match>
          <Match when={appStore.clockSubTab === "ambient"}><AmbientTab /></Match>
          <Match when={appStore.clockSubTab === "breathing"}><BreathingTab /></Match>
        </Switch>
        </div>
      </main>
      <TabBar />
      {appStore.settingsOpen && <SettingsModal onClose={closeSettings} />}
      <AlarmRingOverlay />
      {!appStore.hasCompletedOnboarding && !appStore.ringing && <OnboardingOverlay />}

      {!online() && (
        <div class="fixed bottom-2 left-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-warning/30 bg-warning/10 p-3 text-center text-sm text-warning" role="status">
          <span class="i-mdi-wifi-off -mt-0.5 mr-1.5 inline-block h-4 w-4 align-middle" />
          You are offline. Alarms and timers keep running locally.
        </div>
      )}
    </div>
  );
}

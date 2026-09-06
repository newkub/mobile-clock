import { For, Show, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { appStore, setClockSubTab } from "../../store/app";
import { haptic } from "../../lib/capacitor";
import { computeHabitStreak, isHabitCompletedOn } from "../../lib/habits";

export function OverviewTab() {
  const [now, setNow] = createSignal(new Date());

  onMount(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    onCleanup(() => clearInterval(t));
  });

  const hour = () => now().getHours();
  const greeting = () => (hour() < 12 ? "Good morning" : hour() < 18 ? "Good afternoon" : "Good evening");

  const dateLabel = () =>
    now().toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

  const timeString = () =>
    now().toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: appStore.globalSettings.timeFormat === "12h",
    });

  const dayProgress = () =>
    Math.round(
      ((now().getHours() * 3600 + now().getMinutes() * 60 + now().getSeconds()) / 86400) * 100,
    );

  const today = createMemo(() => new Date().toISOString().slice(0, 10));
  const habitsToday = createMemo(() =>
    appStore.habits.filter((h) => isHabitCompletedOn(h, today())),
  );
  const pomodoroToday = () =>
    appStore.pomodoroSessions
      .filter((s) => s.date === today())
      .reduce((sum, s) => sum + s.completedCycles, 0);
  const alarmsOn = () => appStore.alarms.filter((a) => a.enabled).length;
  const remindersOn = () => appStore.reminders.filter((r) => r.enabled).length;

  const nextAlarm = () => {
    const active = appStore.alarms.filter((a) => a.enabled).sort((a, b) => {
      if (a.hour !== b.hour) return a.hour - b.hour;
      return a.minute - b.minute;
    });
    return active[0];
  };

  const quickActions = [
    { id: "pomodoro" as const, label: "Pomodoro", icon: "i-mdi-brain", color: "text-primary" },
    { id: "habits" as const, label: "Habits", icon: "i-mdi-calendar-check", color: "text-warning" },
    { id: "ambient" as const, label: "Ambient", icon: "i-mdi-weather-rainy", color: "text-success" },
    { id: "breathing" as const, label: "Breathe", icon: "i-mdi-weather-windy", color: "text-accent" },
  ];

  function go(tab: typeof quickActions[number]["id"]) {
    haptic("light");
    setClockSubTab(tab);
  }

  return (
    <div class="tab-content h-full overflow-y-auto p-5 pb-28 md:pb-8">
      <div class="mx-auto max-w-4xl space-y-6">
        <div class="space-y-1">
          <h2 class="text-3xl font-bold text-text md:text-4xl">{greeting()}</h2>
          <p class="text-text-secondary">{dateLabel()}</p>
        </div>

        <div class="glass rounded-3xl p-6 text-center">
          <p class="text-5xl font-bold tabular-nums text-text md:text-7xl">{timeString()}</p>
          {/* Day progress: how much of today has elapsed */}
          <div class="mt-4">
            <div class="h-1.5 overflow-hidden rounded-full bg-surface-3" role="progressbar" aria-valuenow={dayProgress()} aria-valuemin={0} aria-valuemax={100} aria-label="Day progress">
              <div
                class="h-full rounded-full bg-primary transition-[width] duration-1000"
                style={{ width: `${dayProgress()}%` }}
              />
            </div>
            <p class="mt-1.5 text-xs text-text-secondary">{dayProgress()}% of the day</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <For each={quickActions}>
            {(action) => (
              <button
                onClick={() => go(action.id)}
                class="flex flex-col items-center gap-2 rounded-2xl bg-surface-2 p-4 transition active:scale-95 hover:bg-surface-3"
                aria-label={action.label}
              >
                <span class={`${action.icon} h-6 w-6 ${action.color}`} />
                <span class="text-sm font-medium text-text">{action.label}</span>
              </button>
            )}
          </For>
        </div>

        <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div class="rounded-2xl bg-surface-2 p-4 text-center">
            <p class="text-2xl font-bold text-success">
              {habitsToday().length}<span class="text-sm font-normal text-text-secondary">/{appStore.habits.length}</span>
            </p>
            <p class="text-xs text-text-secondary">Habits today</p>
          </div>
          <div class="rounded-2xl bg-surface-2 p-4 text-center">
            <p class="text-2xl font-bold text-warning">{pomodoroToday()}</p>
            <p class="text-xs text-text-secondary">Pomodoros</p>
          </div>
          <div class="rounded-2xl bg-surface-2 p-4 text-center">
            <p class="text-2xl font-bold text-primary">{alarmsOn()}</p>
            <p class="text-xs text-text-secondary">Alarms on</p>
          </div>
          <div class="rounded-2xl bg-surface-2 p-4 text-center">
            <p class="text-2xl font-bold text-accent">{remindersOn()}</p>
            <p class="text-xs text-text-secondary">Reminders</p>
          </div>
        </div>

        <Show when={appStore.habits.length > 0}>
          <div class="rounded-2xl bg-surface-2 p-4">
            <h3 class="mb-3 flex items-center gap-2 text-sm font-semibold text-text-secondary">
              <span class="i-mdi-fire h-4 w-4 text-warning" /> Today's habits
            </h3>
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              <For each={appStore.habits}>
                {(habit) => {
                  const completed = () => !!isHabitCompletedOn(habit, today());
                  const streak = () => computeHabitStreak(habit, appStore.habitCompletions);
                  return (
                    <button
                      onClick={() => go("habits")}
                      class={`flex items-center gap-3 rounded-xl border p-3 text-left transition active:scale-95 ${
                        completed() ? "border-success/30 bg-success/10" : "border-border bg-surface"
                      }`}
                    >
                      <span
                        class={`${habit.icon} h-5 w-5 shrink-0`}
                        style={{ color: habit.color }}
                      />
                      <div class="min-w-0 flex-1">
                        <p class={`truncate text-sm font-medium ${completed() ? "text-success" : "text-text"}`}>
                          {habit.title}
                        </p>
                        <p class="text-xs text-text-secondary">Streak {streak()} day{streak() === 1 ? "" : "s"}</p>
                      </div>
                    </button>
                  );
                }}
              </For>
            </div>
          </div>
        </Show>

        <Show when={nextAlarm()}>
          <div class="rounded-2xl border border-border bg-surface-2 p-4">
            <h3 class="mb-1 text-sm font-semibold text-text-secondary">Next alarm</h3>
            <p class="text-lg font-bold text-text">
              {nextAlarm()?.hour.toString().padStart(2, "0")}:{nextAlarm()?.minute.toString().padStart(2, "0")}
              <span class="ml-2 text-sm font-normal text-text-secondary">{nextAlarm()?.label}</span>
            </p>
          </div>
        </Show>
      </div>
    </div>
  );
}

import { createSignal, createMemo, onMount, onCleanup, Show, For } from "solid-js";
import { AnalogClock } from "../../components/AnalogClock";
import { appStore } from "../../store/app";
import { useIsMd } from "../../hooks/use-media-query";
import { formatShortTime, formatTimeInZone } from "../../lib/time";
import { setClockSubTab, removeWorldClock } from "../../store/actions";
import { haptic } from "../../lib/capacitor";
import { showStatus } from "../../lib/status";
import { quickStartTimer } from "./Timer";
import { quickStartFocus } from "./Pomodoro";
import { AddWorldClockModal } from "../../components/AddWorldClockModal";

function gmtOffset(d: Date): string {
  const mins = -d.getTimezoneOffset();
  const sign = mins >= 0 ? "+" : "-";
  const abs = Math.abs(mins);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `GMT${sign}${h}${m ? `:${m.toString().padStart(2, "0")}` : ""}`;
}

export function ClockView() {
  const [now, setNow] = createSignal(new Date());
  const [isAdding, setIsAdding] = createSignal(false);
  const isMd = useIsMd();

  onMount(() => {
    const t = setInterval(() => setNow(new Date()), 250);
    onCleanup(() => clearInterval(t));
  });

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offset = createMemo(() => gmtOffset(now()));

  const nextAlarm = createMemo(() => {
    const enabled = appStore.alarms.filter((a) => a.enabled);
    if (!enabled.length) return null;
    const dates = enabled
      .map((a) => {
        const d = new Date();
        d.setHours(a.hour, a.minute, 0, 0);
        if (d <= new Date()) d.setDate(d.getDate() + 1);
        return { date: d, label: a.label || "Alarm" };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    return dates[0];
  });

  return (
    <div class="tab-content flex h-full flex-col items-center gap-6 overflow-y-auto p-5 pb-28 md:flex-row md:items-center md:justify-center md:gap-14 md:pb-8">
      <AnalogClock size={isMd() ? 360 : 280} />

      <div class="flex flex-col items-center gap-4 text-center md:items-start md:text-left">
        <div>
          <p class="text-5xl font-bold tabular-nums text-glow md:text-7xl">
            {formatShortTime(now(), true)}
          </p>
          <p class="mt-2 text-lg text-text-secondary md:text-xl">
            {now().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <p class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-sm text-text-secondary">
            <span class="i-mdi-earth h-4 w-4 text-primary" />
            {timeZone} · {offset()}
          </p>
        </div>

        <Show when={nextAlarm()}>
          {(alarm) => (
            <div class="flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm">
              <span class="i-mdi-alarm h-4 w-4 text-primary" />
              <span class="text-text">
                Next: {alarm().label} at{" "}
                {formatShortTime(alarm().date)}
              </span>
            </div>
          )}
        </Show>

        <div class="mt-2 flex flex-wrap justify-center gap-2 md:justify-start">
          <button
            onClick={() => {
              haptic("light");
              setClockSubTab("alarm");
              showStatus("Tap New Alarm to add one", "info");
            }}
            class="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-sm font-medium text-text-secondary transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 hover:text-text"
          >
            <span class="i-mdi-alarm-plus h-4 w-4" /> Add alarm
          </button>
          <button
            onClick={() => {
              quickStartTimer(300, "#3b82f6");
              setClockSubTab("timer");
            }}
            class="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-sm font-medium text-text-secondary transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 hover:text-text"
          >
            <span class="i-mdi-timer h-4 w-4" /> 5 min timer
          </button>
          <button
            onClick={() => {
              quickStartFocus();
              setClockSubTab("pomodoro");
            }}
            class="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-sm font-medium text-text-secondary transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 hover:text-text"
          >
            <span class="i-mdi-brain h-4 w-4" /> Focus 25m
          </button>
        </div>

        <div class="mt-2 w-full">
          <div class="mb-2 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-text-secondary">World clocks</h3>
            <button
              onClick={() => { haptic("light"); setIsAdding(true); }}
              class="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-secondary transition hover:text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label="Add world clock"
            >
              <span class="i-mdi-plus h-3.5 w-3.5" /> Add
            </button>
          </div>
          <div class="grid w-full grid-cols-2 gap-2 md:grid-cols-3">
            <For each={appStore.worldClocks}>
                {(clock) => (
                  <div class="flex flex-col rounded-2xl bg-surface-2 p-3 text-left">
                    <div class="flex items-start justify-between">
                      <p class="truncate text-xs font-medium text-text">{clock.label}</p>
                      <button
                        onClick={() => { haptic("light"); removeWorldClock(clock.id); }}
                        class="ml-1 rounded-full p-1 text-text-secondary transition hover:text-danger focus:outline-none focus:ring-2 focus:ring-primary/50"
                        aria-label={`Remove ${clock.label}`}
                      >
                        <span class="i-mdi-close h-3 w-3" />
                      </button>
                    </div>
                    <p class="mt-1 text-lg font-bold tabular-nums text-text">{formatTimeInZone(now(), clock.zone)}</p>
                    <p class="text-[10px] text-text-secondary">
                      {now().toLocaleDateString(undefined, { timeZone: clock.zone, day: "numeric", month: "short" })}
                    </p>
                  </div>
                )}
              </For>
            </div>
          </div>
      </div>

      <Show when={isAdding()}>
        <AddWorldClockModal onClose={() => setIsAdding(false)} />
      </Show>
    </div>
  );
}

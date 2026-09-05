import { For } from "solid-js";
import { appStore, setClockSubTab, SUB_TAB_ORDER, type ClockSubTab } from "../store/app";
import { haptic } from "../lib/capacitor";

const subTabMeta: Record<ClockSubTab, { label: string; icon: string }> = {
  clock: { label: "Clock", icon: "i-mdi-clock-outline" },
  alarm: { label: "Alarm", icon: "i-mdi-alarm" },
  stopwatch: { label: "Stopwatch", icon: "i-mdi-timer-outline" },
  timer: { label: "Timer", icon: "i-mdi-timer-sand" },
  pomodoro: { label: "Pomodoro", icon: "i-mdi-brain" },
  reminder: { label: "Reminder", icon: "i-mdi-bell-outline" },
};

export function TabBar() {
  return (
    <nav
      class="glass mx-3 mb-2 flex max-w-full justify-between gap-1 rounded-3xl p-1.5 pb-safe overflow-x-auto"
      aria-label="Clock features"
    >
      <For each={SUB_TAB_ORDER}>
        {(id) => {
          const meta = subTabMeta[id];
          const active = () => id === appStore.clockSubTab;
          return (
            <button
              onClick={() => { haptic("light"); setClockSubTab(id); }}
              class={`flex min-w-14 flex-1 flex-col items-center gap-0.5 rounded-2xl px-2 py-2 transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                active() ? "bg-primary/15 text-primary" : "text-text-secondary hover:text-text"
              }`}
              aria-current={active() ? "page" : undefined}
              aria-label={meta.label}
            >
              <span class={`${meta.icon} h-6 w-6`} aria-hidden="true" />
              <span class="text-[10px] font-semibold leading-none">{meta.label}</span>
            </button>
          );
        }}
      </For>
    </nav>
  );
}

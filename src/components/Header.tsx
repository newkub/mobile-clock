import { appStore, openSettings } from "../store/app";
import { haptic } from "../lib/capacitor";

const titles: Record<string, string> = {
  clock: "Clock",
  alarm: "Alarm",
  stopwatch: "Stopwatch",
  timer: "Timer",
  pomodoro: "Pomodoro",
  reminder: "Reminder",
};

export function Header() {
  return (
    <header class="flex items-center justify-between px-5 pt-safe pt-4 pb-2">
      <div class="flex items-center gap-2.5">
        <span class="i-mdi-clock-outline h-7 w-7 text-primary" aria-hidden="true" />
        <div>
          <h1 class="text-xl font-bold leading-tight text-text">
            {titles[appStore.clockSubTab] ?? "Clock"}
          </h1>
          <p class="text-xs text-text-secondary">Wrikka Clock</p>
        </div>
      </div>
      <button
        onClick={() => { haptic("light"); openSettings(); }}
        class="glass rounded-full p-2.5 text-text-secondary transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 hover:text-text"
        aria-label="Open settings"
      >
        <span class="i-mdi-cog-outline h-5 w-5" />
      </button>
    </header>
  );
}

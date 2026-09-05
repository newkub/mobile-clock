import { For } from "solid-js";
import { appStore, openSettings, setClockSubTab, SUB_TAB_ORDER } from "../store/app";
import { haptic } from "../lib/capacitor";
import { subTabMeta, subTabTitles } from "./nav-meta";

export function Header() {
  return (
    <header class="px-5 pb-2 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <div class="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
        <div class="flex items-center gap-2.5">
          <span class="i-mdi-clock-outline h-7 w-7 text-primary" aria-hidden="true" />
          <div>
            <h1 class="text-xl font-bold leading-tight text-text">
              {subTabTitles[appStore.clockSubTab] ?? "Clock"}
            </h1>
            <p class="text-xs text-text-secondary">
              {new Date().toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
            </p>
          </div>
        </div>

        {/* Top navigation — tablet and desktop only (mobile uses the bottom TabBar) */}
        <nav class="hidden items-center gap-0.5 rounded-full bg-surface-2 p-1 md:flex" aria-label="Clock features">
          <For each={SUB_TAB_ORDER}>
            {(id) => {
              const meta = subTabMeta[id];
              const active = () => id === appStore.clockSubTab;
              return (
                <button
                  onClick={() => { haptic("light"); setClockSubTab(id); }}
                  class={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    active() ? "bg-primary/15 text-primary" : "text-text-secondary hover:text-text"
                  }`}
                  aria-current={active() ? "page" : undefined}
                >
                  <span class={`${meta.icon} h-4 w-4`} aria-hidden="true" />
                  {meta.label}
                </button>
              );
            }}
          </For>
        </nav>

        <button
          onClick={() => { haptic("light"); openSettings(); }}
          class="glass rounded-full p-2.5 text-text-secondary transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 hover:text-text"
          aria-label="Open settings"
        >
          <span class="i-mdi-cog-outline h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

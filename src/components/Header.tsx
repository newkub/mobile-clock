import { For } from "solid-js";
import { appStore, openSettings, setClockSubTab, SUB_TAB_ORDER } from "../store/app";
import { haptic } from "../lib/capacitor";
import { subTabMeta, subTabTitles } from "./nav-meta";

export function Header() {
  return (
    <header class="px-5 pb-2 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <div class="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <button
          onClick={() => { haptic("light"); setClockSubTab("overview"); }}
          class="flex items-center gap-2.5 rounded-lg text-left transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-label="Go to overview"
        >
          <span class="i-mdi-clock-outline h-7 w-7 text-primary" aria-hidden="true" />
          <div>
            <h1 class="text-xl font-bold leading-tight text-text">
              {subTabTitles[appStore.clockSubTab] ?? "Overview"}
            </h1>
            <p class="text-xs text-text-secondary">
              {new Date().toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
            </p>
          </div>
        </button>

        {/* Top navigation — tablet and desktop only (mobile uses the bottom TabBar) */}
        <nav class="hidden min-w-0 flex-1 items-center justify-center gap-4 overflow-x-auto px-2 md:flex" aria-label="Clock features">
          <For each={SUB_TAB_ORDER}>
            {(id) => {
              const meta = subTabMeta[id];
              const active = () => id === appStore.clockSubTab;
              return (
                <button
                  onClick={() => { haptic("light"); setClockSubTab(id); }}
                  class={`flex shrink-0 items-center gap-1.5 whitespace-nowrap py-2 text-sm font-medium transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    active() ? "text-primary" : "text-text-secondary hover:text-text"
                  }`}
                  aria-current={active() ? "page" : undefined}
                  aria-label={meta.label}
                >
                  <span class={`${meta.icon} h-4 w-4`} aria-hidden="true" />
                  <span class="hidden lg:inline">{meta.label}</span>
                </button>
              );
            }}
          </For>
        </nav>

        <button
          onClick={() => { haptic("light"); openSettings(); }}
          class="shrink-0 rounded-full p-2 text-text-secondary transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 hover:bg-surface-2 hover:text-text"
          aria-label="Open settings"
        >
          <span class="i-mdi-cog h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

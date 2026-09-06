import { For } from "solid-js";
import { appStore, setClockSubTab } from "../store/app";
import { haptic } from "../lib/capacitor";
import { subTabMeta } from "./nav-meta";

export function TabBar() {
  return (
    <nav
      class="glass mx-3 mb-2 flex max-w-full gap-1 overflow-x-auto rounded-3xl p-1.5 pb-safe md:hidden"
      aria-label="Clock features"
    >
      <For each={appStore.tabOrder}>
        {(id) => {
          const meta = subTabMeta[id];
          const active = () => id === appStore.clockSubTab;
          return (
            <button
              onClick={() => { haptic("light"); setClockSubTab(id); }}
              class={`flex min-w-12 flex-1 flex-col items-center gap-0.5 rounded-2xl px-2 py-2 transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                active() ? "bg-primary/15 text-primary" : "text-text-secondary hover:text-text"
              }`}
              aria-current={active() ? "page" : undefined}
              aria-label={meta.label}
            >
              <span class={`${meta.icon} h-6 w-6`} aria-hidden="true" />
              <span class="text-[9px] font-semibold leading-none">{meta.label}</span>
            </button>
          );
        }}
      </For>
    </nav>
  );
}

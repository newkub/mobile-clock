import { onCleanup, onMount } from "solid-js";
import { appStore } from "../store/app";

/**
 * Bind keyboard shortcuts while the calling component is mounted.
 * Keys: "space", "r", "l", ... — ignored while typing in inputs or
 * while a modal/alert overlay is open.
 */
export function useShortcuts(map: Record<string, () => void>) {
  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) return;
      if (appStore.settingsOpen || appStore.ringing) return;
      const key = e.code === "Space" ? "space" : e.key.toLowerCase();
      const fn = map[key];
      if (fn) {
        e.preventDefault();
        fn();
      }
    };
    window.addEventListener("keydown", onKey);
    onCleanup(() => window.removeEventListener("keydown", onKey));
  });
}

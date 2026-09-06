import { createSignal, onMount, onCleanup } from "solid-js";
import { haptic } from "../lib/capacitor";

export function FullscreenButton(props: { class?: string }) {
  const [isFullscreen, setIsFullscreen] = createSignal(false);

  onMount(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    onCleanup(() => document.removeEventListener("fullscreenchange", handler));
  });

  function toggle() {
    haptic("light");
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => setIsFullscreen(false));
    } else {
      document.documentElement.requestFullscreen().catch(() => setIsFullscreen(false));
    }
  }

  return (
    <button
      onClick={toggle}
      class={`rounded-full p-2 text-text-secondary transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 hover:text-text hover:bg-surface-2/50 ${props.class ?? ""}`}
      aria-label={isFullscreen() ? "Exit fullscreen" : "Enter fullscreen"}
    >
      <span class={`h-5 w-5 ${isFullscreen() ? "i-mdi-fullscreen-exit" : "i-mdi-fullscreen"}`} />
    </button>
  );
}

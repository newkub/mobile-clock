import { createSignal, onCleanup, onMount } from "solid-js";

/** Reactive matchMedia accessor. */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = createSignal(false);
  onMount(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", onChange);
    onCleanup(() => mql.removeEventListener("change", onChange));
  });
  return matches;
}

/** md breakpoint (768px) — matches UnoCSS/Tailwind `md:`. */
export function useIsMd() {
  return useMediaQuery("(min-width: 768px)");
}

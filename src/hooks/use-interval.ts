import { createEffect, onCleanup, type Accessor } from "solid-js";

export function useInterval(callback: () => void, delay: Accessor<number | null | undefined>) {
  createEffect(() => {
    const d = delay();
    if (d === null || d === undefined) return;
    const id = setInterval(callback, d);
    onCleanup(() => clearInterval(id));
  });
}

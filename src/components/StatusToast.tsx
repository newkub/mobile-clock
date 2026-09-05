import { Show } from "solid-js";
import { appStore } from "../store/app";

const iconClass: Record<string, string> = {
  info: "i-mdi-information",
  success: "i-mdi-check-circle",
  warning: "i-mdi-alert",
  error: "i-mdi-close-circle",
};

const colorClass: Record<string, string> = {
  info: "bg-surface text-text",
  success: "bg-primary/20 text-primary",
  warning: "bg-warning/20 text-warning",
  error: "bg-danger/20 text-danger",
};

export function StatusToast() {
  return (
    <Show when={appStore.status} fallback={null}>
      {(status) => (
        <div
          class="fixed left-1/2 top-0 z-[80] w-full max-w-md -translate-x-1/2 px-4 pt-safe pt-4"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div
            class={`glass flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lg ${
              colorClass[status().type]
            }`}
          >
            <span class={`${iconClass[status().type]} h-5 w-5 shrink-0`} aria-hidden="true" />
            <p class="flex-1 text-sm font-medium">{status().text}</p>
          </div>
        </div>
      )}
    </Show>
  );
}

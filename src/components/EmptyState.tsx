import type { JSX } from "solid-js";

type EmptyStateProps = {
  icon: string;
  title: string;
  subtitle?: string;
  action?: JSX.Element;
};

export function EmptyState(props: EmptyStateProps) {
  return (
    <div class="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-text-secondary" role="status" aria-live="polite">
      <div class="rounded-3xl bg-surface-2 p-6">
        <span class={`${props.icon} h-10 w-10 text-primary`} aria-hidden="true" />
      </div>
      <p class="text-center text-lg font-semibold text-text">{props.title}</p>
      {props.subtitle && <p class="text-center text-sm text-text-secondary">{props.subtitle}</p>}
      {props.action && <div class="mt-2">{props.action}</div>}
    </div>
  );
}

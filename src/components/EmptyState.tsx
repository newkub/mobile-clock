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
      <div class="animate-empty-float rounded-3xl border border-primary/15 bg-primary/10 p-7">
        <span class={`${props.icon} h-14 w-14 text-primary`} aria-hidden="true" />
      </div>
      <p class="text-center text-lg font-semibold text-text">{props.title}</p>
      {props.subtitle && (
        <p class="max-w-xs text-center text-sm leading-relaxed text-muted">{props.subtitle}</p>
      )}
      {props.action && <div class="mt-2">{props.action}</div>}
    </div>
  );
}

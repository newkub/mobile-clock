import { createMemo, Show } from "solid-js";
import { appStore } from "../../../store/app";
import { EmptyState } from "../../../components/EmptyState";

export function CurrentAlarmCard() {
  const next = createMemo(() => {
    const enabled = appStore.alarms.filter((a) => a.enabled);
    if (!enabled.length) return null;
    const dates = enabled
      .map((a) => {
        const d = new Date();
        d.setHours(a.hour, a.minute, 0, 0);
        if (d < new Date()) d.setDate(d.getDate() + 1);
        return d;
      })
      .sort((d1, d2) => d1.getTime() - d2.getTime());
    return dates[0];
  });

  return (
    <Show
      when={next()}
      fallback={
        <EmptyState
          icon="i-mdi-alarm"
          title="No active alarms"
          subtitle="Add an alarm to see the next one"
        />
      }
    >
      <div class="rounded-3xl bg-gradient-to-br from-primary/20 to-accent/10 p-6 text-center glow-primary">
        <p class="text-sm text-text-secondary">Next alarm</p>
        <p class="mt-2 text-5xl font-bold text-glow">
          {next()?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
        </p>
        <p class="mt-1 text-text-secondary">{next()?.toLocaleDateString("th-TH", { weekday: "long" })}</p>
      </div>
    </Show>
  );
}

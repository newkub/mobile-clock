import { createMemo, createSignal, onCleanup, onMount, Show } from "solid-js";
import { appStore } from "../../../store/app";
import { EmptyState } from "../../../components/EmptyState";
import { formatShortTime } from "../../../lib/time";

function ringsIn(target: Date, now: Date): string {
  const mins = Math.max(0, Math.round((target.getTime() - now.getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (mins < 1) return "less than a minute";
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

export function CurrentAlarmCard() {
  const [now, setNow] = createSignal(new Date());

  onMount(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    onCleanup(() => clearInterval(t));
  });

  const next = createMemo(() => {
    const enabled = appStore.alarms.filter((a) => a.enabled);
    if (!enabled.length) return null;
    const dates = enabled
      .map((a) => {
        const d = new Date();
        d.setHours(a.hour, a.minute, 0, 0);
        if (d < new Date()) d.setDate(d.getDate() + 1);
        return { date: d, label: a.label || "Alarm" };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    return dates[0];
  });

  return (
    <Show
      when={next()}
      fallback={
        <EmptyState
          icon="i-mdi-alarm"
          title="No active alarms"
          subtitle="Tap New Alarm below to add one"
        />
      }
    >
      <div class="rounded-3xl bg-gradient-to-br from-primary/20 to-accent/10 p-6 text-center glow-primary">
        <p class="text-sm text-text-secondary">Next alarm</p>
        <p class="mt-2 text-5xl font-bold text-glow">
          {next() ? formatShortTime(next()!.date) : ""}
        </p>
        <p class="mt-1 text-text-secondary">
          {next()?.date.toLocaleDateString(undefined, { weekday: "long" })}
          {" · "}
          {next()?.label}
        </p>
        <p class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
          <span class="i-mdi-timer-sand h-3.5 w-3.5" />
          Rings in {next() ? ringsIn(next()!.date, now()) : ""}
        </p>
      </div>
    </Show>
  );
}

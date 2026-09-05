import { createSignal, createMemo, onMount, onCleanup, Show } from "solid-js";
import { AnalogClock } from "../../components/AnalogClock";
import { appStore } from "../../store/app";

function gmtOffset(d: Date): string {
  const mins = -d.getTimezoneOffset();
  const sign = mins >= 0 ? "+" : "-";
  const abs = Math.abs(mins);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `GMT${sign}${h}${m ? `:${m.toString().padStart(2, "0")}` : ""}`;
}

export function ClockView() {
  const [now, setNow] = createSignal(new Date());

  onMount(() => {
    const t = setInterval(() => setNow(new Date()), 250);
    onCleanup(() => clearInterval(t));
  });

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offset = createMemo(() => gmtOffset(now()));

  const nextAlarm = createMemo(() => {
    const enabled = appStore.alarms.filter((a) => a.enabled);
    if (!enabled.length) return null;
    const dates = enabled
      .map((a) => {
        const d = new Date();
        d.setHours(a.hour, a.minute, 0, 0);
        if (d <= new Date()) d.setDate(d.getDate() + 1);
        return { date: d, label: a.label || "Alarm" };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    return dates[0];
  });

  return (
    <div class="tab-content flex h-full flex-col items-center gap-6 overflow-y-auto p-5 pb-28">
      <div class="mt-4">
        <AnalogClock size={280} />
      </div>

      <div class="text-center">
        <p class="text-5xl font-bold tabular-nums text-glow">
          {now().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
        </p>
        <p class="mt-2 text-lg text-text-secondary">
          {now().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
        <p class="mt-1 inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-sm text-text-secondary">
          <span class="i-mdi-earth h-4 w-4 text-primary" />
          {timeZone} · {offset()}
        </p>
      </div>

      <Show when={nextAlarm()}>
        {(alarm) => (
          <div class="flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm">
            <span class="i-mdi-alarm h-4 w-4 text-primary" />
            <span class="text-text">
              Next: {alarm().label} at{" "}
              {alarm().date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
            </span>
          </div>
        )}
      </Show>
    </div>
  );
}

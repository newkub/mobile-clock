import { createMemo, For, Show } from "solid-js";
import { EmptyState } from "../../components/EmptyState";
import { haptic } from "../../lib/capacitor";
import { formatDuration } from "../../lib/time";
import { appStore, type PomodoroSession } from "../../store/app";

const DAY = 86_400_000;
const WEEKS = 52;

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatFocus(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function colorLevel(seconds: number) {
  if (seconds <= 0) return "bg-surface-3";
  if (seconds < 1800) return "bg-primary/20";
  if (seconds < 5400) return "bg-primary/40";
  if (seconds < 10800) return "bg-primary/70";
  return "bg-primary";
}

function buildGrid(sessions: PomodoroSession[]) {
  const map = new Map(sessions.map((s) => [s.date, s]));
  const now = new Date();
  const days = [];
  for (let i = 0; i < WEEKS * 7; i++) {
    const d = new Date(now.getTime() - i * DAY);
    const date = dateKey(d);
    const s = map.get(date);
    days.unshift({ date, seconds: s ? s.totalFocusSeconds : 0 });
  }
  return days;
}

function streakFor(sessions: PomodoroSession[]) {
  const map = new Map(sessions.map((s) => [s.date, s.totalFocusSeconds]));
  const now = new Date();
  let offset = 0;
  while (offset < WEEKS * 7 && !(map.get(dateKey(new Date(now.getTime() - offset * DAY))))) {
    offset++;
  }
  if (offset >= WEEKS * 7) return 0;
  let count = 0;
  for (let i = offset; i < WEEKS * 7; i++) {
    const seconds = map.get(dateKey(new Date(now.getTime() - i * DAY)));
    if (seconds && seconds > 0) count++;
    else break;
  }
  return count;
}

export function StatsTab() {
  const sessions = createMemo(() => appStore.pomodoroSessions);
  const grid = createMemo(() => buildGrid(sessions()));
  const totalSeconds = createMemo(() =>
    sessions().reduce((sum, s) => sum + s.totalFocusSeconds, 0)
  );
  const totalCycles = createMemo(() =>
    sessions().reduce((sum, s) => sum + s.completedCycles, 0)
  );
  const activeDays = createMemo(() => new Set(sessions().map((s) => s.date)).size);
  const dailyAvg = createMemo(() => Math.round(totalSeconds() / Math.max(1, activeDays())));
  const streak = createMemo(() => streakFor(sessions()));
  const recent = createMemo(() =>
    [...sessions()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10)
  );

  const summary = createMemo(() => [
    { label: "Total focus", value: formatDuration(totalSeconds()), icon: "i-mdi-timer" },
    { label: "Cycles", value: totalCycles().toString(), icon: "i-mdi-brain" },
    { label: "Daily avg", value: formatDuration(dailyAvg()), icon: "i-mdi-chart-line" },
    { label: "Streak", value: `${streak()}d`, icon: "i-mdi-fire" },
  ]);

  return (
    <div class="tab-content h-full overflow-y-auto p-5 pb-28 md:pb-8">
      <div class="mx-auto max-w-4xl space-y-6">
        <h2 class="flex items-center gap-2 text-2xl font-bold text-text">
          <span class="i-mdi-chart-box h-6 w-6 text-primary" />
          Stats
        </h2>

        <Show
          when={appStore.pomodoroSessions.length > 0}
          fallback={
            <EmptyState
              icon="i-mdi-chart-box-outline"
              title="No focus data yet"
              subtitle="Complete a Pomodoro session to see your activity."
            />
          }
        >
          <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
            <For each={summary()}>
              {(card) => (
                <div class="rounded-2xl bg-surface-2 p-4 text-center">
                  <span class={`${card.icon} mx-auto mb-2 block h-5 w-5 text-primary`} />
                  <p class="text-2xl font-bold tabular-nums text-glow text-primary">{card.value}</p>
                  <p class="text-xs text-text-secondary">{card.label}</p>
                </div>
              )}
            </For>
          </div>

          <div class="rounded-2xl bg-surface-2 p-4">
            <div class="mb-3 flex items-center justify-between">
              <h3 class="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                Activity
              </h3>
              <div class="flex items-center gap-1" aria-label="Activity intensity legend">
                <span class="h-2.5 w-2.5 rounded-sm bg-surface-3" />
                <span class="h-2.5 w-2.5 rounded-sm bg-primary/20" />
                <span class="h-2.5 w-2.5 rounded-sm bg-primary/40" />
                <span class="h-2.5 w-2.5 rounded-sm bg-primary/70" />
                <span class="h-2.5 w-2.5 rounded-sm bg-primary" />
              </div>
            </div>
            <div class="overflow-x-auto pb-2">
              <div
                class="grid w-max grid-flow-col grid-rows-7 gap-1"
                role="img"
                aria-label="Focus activity over the last 52 weeks"
              >
                <For each={grid()}>
                  {(day) => (
                    <button
                      type="button"
                      onClick={() => haptic("light")}
                      class={`h-2.5 w-2.5 rounded-sm transition hover:scale-125 focus:outline-none focus:ring-1 focus:ring-primary/50 ${colorLevel(day.seconds)}`}
                      title={`${formatDate(day.date)} · ${formatFocus(day.seconds)}`}
                      aria-label={`${formatDate(day.date)}: ${formatFocus(day.seconds)} of focus`}
                    />
                  )}
                </For>
              </div>
            </div>
          </div>

          <div class="rounded-2xl bg-surface-2 p-4">
            <h3 class="mb-3 flex items-center gap-2 text-sm font-semibold text-text-secondary uppercase tracking-wide">
              <span class="i-mdi-history h-4 w-4" />
              Recent activity
            </h3>
            <ul class="divide-y divide-border">
              <For each={recent()}>
                {(session) => (
                  <li
                    onClick={() => haptic("light")}
                    class="flex items-center justify-between py-2.5 text-sm transition active:scale-[0.99]"
                  >
                    <div>
                      <p class="font-medium text-text">{formatDate(session.date)}</p>
                      <p class="text-xs text-text-secondary">
                        {session.completedCycles} cycle{session.completedCycles === 1 ? "" : "s"}
                      </p>
                    </div>
                    <span class="font-semibold tabular-nums text-primary">
                      {formatFocus(session.totalFocusSeconds)}
                    </span>
                  </li>
                )}
              </For>
            </ul>
          </div>
        </Show>
      </div>
    </div>
  );
}

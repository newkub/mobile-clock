import { createMemo, For, Show, type JSX } from "solid-js";
import { EmptyState } from "../../components/EmptyState";
import { haptic } from "../../lib/capacitor";
import { formatDuration } from "../../lib/time";
import { appStore } from "../../store/app";
import {
  buildGrid,
  buildMonth,
  buildWeekdayTotals,
  colorLevel,
  dateKey,
  formatDate,
  formatFocus,
  readStopwatchSeconds,
  streakFor,
  WEEKS,
  WEEKDAY_LABELS,
} from "../../lib/stats";

function SectionTitle(props: { icon: string; children: JSX.Element }) {
  return (
    <h3 class="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-secondary">
      <span class={`${props.icon} h-4 w-4`} /> {props.children}
    </h3>
  );
}

export function StatsTab() {
  const sessions = createMemo(() => appStore.pomodoroSessions);
  const grid = createMemo(() => buildGrid(sessions()));
  const totalSeconds = createMemo(() => sessions().reduce((sum, s) => sum + s.totalFocusSeconds, 0));
  const totalCycles = createMemo(() => sessions().reduce((sum, s) => sum + s.completedCycles, 0));
  const activeDays = createMemo(() => new Set(sessions().map((s) => s.date)).size);
  const dailyAvg = createMemo(() => Math.round(totalSeconds() / Math.max(1, activeDays())));
  const streak = createMemo(() => streakFor(sessions()));
  const recent = createMemo(() => [...sessions()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10));
  const todaySession = createMemo(() => sessions().find((s) => s.date === dateKey(new Date())));
  const weekdayTotals = createMemo(() => buildWeekdayTotals(sessions()));
  const monthCells = createMemo(() => buildMonth(sessions()));
  const monthLabel = new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const stopwatchSeconds = readStopwatchSeconds();

  const summary = createMemo(() => [
    { label: "Total focus", value: formatDuration(totalSeconds()), icon: "i-mdi-timer", hint: "All-time Pomodoro focus time" },
    { label: "Cycles", value: totalCycles().toString(), icon: "i-mdi-brain", hint: "Completed Pomodoro cycles" },
    { label: "Daily avg", value: formatDuration(dailyAvg()), icon: "i-mdi-chart-line", hint: "Average focus per active day" },
    { label: "Streak", value: `${streak()}d`, icon: "i-mdi-fire", hint: "Consecutive days with focus" },
  ]);
  const extras = createMemo(() => [
    { label: "Stopwatch", value: formatFocus(stopwatchSeconds), icon: "i-mdi-timer-outline", hint: "Elapsed stopwatch time" },
    { label: "Alarms", value: `${appStore.alarms.length} set`, icon: "i-mdi-alarm", hint: "Configured alarms" },
    { label: "Reminders", value: `${appStore.reminders.length} set`, icon: "i-mdi-bell-outline", hint: "Scheduled reminders" },
  ]);

  return (
    <div class="tab-content h-full overflow-y-auto p-5 pb-28 md:pb-8">
      <div class="mx-auto max-w-4xl space-y-6">
        <h2 class="flex items-center gap-2 text-2xl font-bold text-text">
          <span class="i-mdi-chart-box h-6 w-6 text-primary" /> Stats
        </h2>

        <Show
          when={appStore.pomodoroSessions.length > 0}
          fallback={
            <EmptyState icon="i-mdi-chart-box-outline" title="No focus data yet"
              subtitle="Complete a Pomodoro session to see your activity." />
          }
        >
          <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
            <For each={summary()}>
              {(card) => (
                <div class="rounded-2xl bg-surface-2 p-4 text-center" title={card.hint}>
                  <span class={`${card.icon} mx-auto mb-2 block h-5 w-5 text-primary`} />
                  <p class="text-2xl font-bold tabular-nums text-glow text-primary">{card.value}</p>
                  <p class="text-xs text-text-secondary">{card.label}</p>
                </div>
              )}
            </For>
          </div>

          <Show when={todaySession()}>
            {(session) => (
              <div class="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3">
                <div class="flex items-center gap-3">
                  <span class="i-mdi-calendar-today h-5 w-5 text-primary" />
                  <div>
                    <p class="text-sm font-semibold text-text">Today's focus</p>
                    <p class="text-xs text-text-secondary">
                      {session().completedCycles} cycle{session().completedCycles === 1 ? "" : "s"} completed
                    </p>
                  </div>
                </div>
                <span class="text-lg font-bold tabular-nums text-primary">
                  {formatFocus(session().totalFocusSeconds)}
                </span>
              </div>
            )}
          </Show>

          <div class="grid gap-6 md:grid-cols-2">
            <div class="rounded-2xl bg-surface-2 p-4">
              <SectionTitle icon="i-mdi-chart-bar">Focus by weekday</SectionTitle>
              <div class="flex h-28 items-end gap-2">
                <For each={weekdayTotals()}>
                  {(day) => (
                    <div class="flex h-full flex-1 flex-col items-center justify-end gap-1"
                      title={`${day.label} · ${formatFocus(day.seconds)} total focus`}>
                      <div style={{ height: `${day.pct}%` }}
                        class={`w-full rounded-t-md transition-all ${day.seconds > 0 ? "bg-primary/70 hover:bg-primary" : "bg-surface-3"}`} />
                      <span class="text-xs text-text-secondary">{day.label}</span>
                    </div>
                  )}
                </For>
              </div>
            </div>

            <div class="rounded-2xl bg-surface-2 p-4">
              <SectionTitle icon="i-mdi-calendar-month">{monthLabel}</SectionTitle>
              <div class="grid grid-cols-7 gap-1 text-center">
                <For each={WEEKDAY_LABELS}>
                  {(label) => <span class="pb-1 text-xs font-medium text-muted">{label[0]}</span>}
                </For>
                <For each={monthCells()}>
                  {(cell) =>
                    cell ? (
                      <div
                        class={`flex aspect-square flex-col items-center justify-center rounded-md text-xs ${
                          cell.isToday ? "font-bold text-text ring-1 ring-primary" : "text-text-secondary"
                        }`}
                        title={`${formatDate(cell.date)} · ${cell.seconds > 0 ? `${formatFocus(cell.seconds)} focused` : "No focus"}`}
                      >
                        {cell.day}
                        <span class={`mt-0.5 h-1.5 w-1.5 rounded-full ${colorLevel(cell.seconds)}`} />
                      </div>
                    ) : (
                      <span />
                    )
                  }
                </For>
              </div>
            </div>
          </div>

          <div class="rounded-2xl bg-surface-2 p-4">
            <div class="mb-3 flex items-center justify-between">
              <h3 class="text-sm font-semibold uppercase tracking-wide text-text-secondary">
                Activity · last {WEEKS} weeks
              </h3>
              <div class="flex items-center gap-1" aria-label="Activity intensity legend">
                <span class="mr-1 text-xs text-muted">Less</span>
                <For each={["bg-surface-3", "bg-primary/20", "bg-primary/40", "bg-primary/70", "bg-primary"]}>
                  {(c) => <span class={`h-2.5 w-2.5 rounded-sm ${c}`} />}
                </For>
                <span class="ml-1 text-xs text-muted">More</span>
              </div>
            </div>
            <div class="overflow-x-auto pb-2">
              <div class="grid w-max grid-flow-col grid-rows-7 gap-1" role="img"
                aria-label="Focus activity over the last 52 weeks">
                <For each={grid()}>
                  {(day) => (
                    <button type="button" onClick={() => haptic("light")}
                      class={`h-2.5 w-2.5 rounded-sm transition hover:scale-125 focus:outline-none focus:ring-1 focus:ring-primary/50 ${colorLevel(day.seconds)}`}
                      title={`${formatDate(day.date)} · ${day.seconds > 0 ? `${formatFocus(day.seconds)} focused` : "No focus"}`}
                      aria-label={`${formatDate(day.date)}: ${formatFocus(day.seconds)} of focus`} />
                  )}
                </For>
              </div>
            </div>
          </div>

          <div class="rounded-2xl bg-surface-2 p-4">
            <SectionTitle icon="i-mdi-puzzle-outline">Beyond focus</SectionTitle>
            <div class="grid grid-cols-3 gap-3">
              <For each={extras()}>
                {(item) => (
                  <div title={item.hint}
                    class="flex flex-col items-center gap-1 rounded-xl bg-surface-3 px-2 py-3 text-center">
                    <span class={`${item.icon} h-5 w-5 text-primary`} />
                    <p class="font-semibold tabular-nums text-text">{item.value}</p>
                    <p class="text-xs text-text-secondary">{item.label}</p>
                  </div>
                )}
              </For>
            </div>
          </div>

          <div class="rounded-2xl bg-surface-2 p-4">
            <SectionTitle icon="i-mdi-history">Recent activity</SectionTitle>
            <ul class="divide-y divide-border">
              <For each={recent()}>
                {(session) => (
                  <li onClick={() => haptic("light")}
                    class="flex items-center justify-between py-2.5 text-sm transition active:scale-[0.99]">
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

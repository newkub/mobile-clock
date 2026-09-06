import { For, Show, createEffect, createMemo, createSignal } from "solid-js";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { haptic } from "../../lib/capacitor";
import { showStatus } from "../../lib/status";
import { appStore } from "../../store/app";
import {
  completeHabit,
  computeHabitStreak,
  createHabit,
  deleteHabit,
  isHabitCompletedOn,
  loadHabits,
  uncompleteHabit,
} from "../../lib/habits";

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const WEEKS = 20;

function iso(d: Date) {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildWeeks(): string[][] {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - start.getDay() - (WEEKS - 1) * 7);
  const weeks: string[][] = [];
  const cursor = new Date(start);
  for (let w = 0; w < WEEKS; w++) {
    const col: string[] = [];
    for (let d = 0; d < 7; d++) {
      col.push(iso(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(col);
  }
  return weeks;
}

export function HabitsTab() {
  const [loading, setLoading] = createSignal(true);
  const [draft, setDraft] = createSignal("");

  createEffect(() => {
    loadHabits().finally(() => setLoading(false));
  });

  const weeks = createMemo(buildWeeks);
  const todayStr = createMemo(() => iso(new Date()));

  const monthLabels = createMemo(() => {
    const cols = weeks();
    return cols.map((col, i) => {
      const m = col[0].slice(5, 7);
      const prev = i > 0 ? cols[i - 1][0].slice(5, 7) : "";
      if (m === prev) return "";
      const d = new Date(col[0]);
      return d.toLocaleDateString(undefined, { month: "short" });
    });
  });

  async function add() {
    const title = draft().trim();
    if (!title) return;
    setDraft("");
    haptic("medium");
    const habit = await createHabit(title);
    showStatus(habit ? "Habit added" : "Saved locally", habit ? "success" : "info");
  }

  async function toggle(habitId: string, date: string) {
    const habit = appStore.habits.find((h) => h.id === habitId);
    if (!habit) return;
    haptic("light");
    if (isHabitCompletedOn(habit, date)) {
      await uncompleteHabit(habitId, date);
    } else {
      await completeHabit(habitId, date);
    }
  }

  async function remove(habitId: string) {
    haptic("light");
    await deleteHabit(habitId);
    showStatus("Habit deleted", "info");
  }

  const totalDone = (habitId: string) =>
    appStore.habitCompletions.filter((c) => c.habitId === habitId).length;

  return (
    <div class="tab-content h-full overflow-y-auto p-5 pb-28 md:pb-8">
      <div class="mx-auto max-w-4xl space-y-5">
        <h2 class="flex items-center gap-2 text-2xl font-bold text-text">
          <span class="i-mdi-calendar-check h-6 w-6 text-primary" /> Habits
        </h2>

        <Show when={!loading()} fallback={<p class="text-center text-sm text-text-secondary">Loading habits…</p>}>
          <div class="rounded-2xl bg-surface-2 p-4">
            <div class="flex gap-2">
              <input
                type="text"
                value={draft()}
                onInput={(e) => setDraft(e.currentTarget.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
                placeholder="What do you want to do every day?"
                class="flex-1 rounded-xl border border-border bg-surface-3 px-4 py-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                aria-label="New habit"
              />
              <Button onClick={add} variant="primary" class="h-12 w-12 shrink-0 rounded-xl p-0" aria-label="Add habit">
                <span class="i-mdi-plus h-5 w-5" />
              </Button>
            </div>
          </div>

          <Show
            when={appStore.habits.length > 0}
            fallback={
              <EmptyState
                icon="i-mdi-calendar-check"
                title="No habits yet"
                subtitle="Plan a daily habit, then tap a day to check it off."
              />
            }
          >
            <div class="space-y-4">
              <For each={appStore.habits}>
                {(habit) => {
                  const streak = () => computeHabitStreak(habit, appStore.habitCompletions);
                  return (
                    <div class="rounded-2xl border border-border bg-surface-2 p-4">
                      <div class="mb-3 flex items-center gap-3">
                        <span class={`${habit.icon} h-5 w-5 shrink-0`} style={{ color: habit.color }} />
                        <div class="min-w-0 flex-1">
                          <p class="truncate text-sm font-medium text-text">{habit.title}</p>
                          <p class="text-xs text-text-secondary">
                            <span class="i-mdi-fire h-3 w-3 text-warning" /> {streak()} day{streak() === 1 ? "" : "s"} streak
                            <span class="mx-1.5 opacity-40">·</span>
                            {totalDone(habit.id)} total
                          </p>
                        </div>
                        <button
                          onClick={() => remove(habit.id)}
                          class="shrink-0 rounded-lg p-2 text-text-secondary transition hover:bg-danger/10 hover:text-danger"
                          aria-label={`Delete ${habit.title}`}
                        >
                          <span class="i-mdi-delete h-4 w-4" />
                        </button>
                      </div>

                      {/* GitHub-style contribution chart */}
                      <div class="overflow-x-auto">
                        <div class="min-w-max">
                          <div class="mb-1 flex gap-[3px] pl-9">
                            <For each={monthLabels()}>
                              {(label) => (
                                <span class="w-3.5 shrink-0 overflow-visible text-[9px] leading-none text-text-secondary">
                                  {label}
                                </span>
                              )}
                            </For>
                          </div>
                          <div class="flex gap-[3px]">
                            <div class="flex w-8 shrink-0 flex-col gap-[3px]">
                              <For each={DAY_LABELS}>
                                {(label) => (
                                  <span class="flex h-3.5 items-center text-[9px] leading-none text-text-secondary">
                                    {label}
                                  </span>
                                )}
                              </For>
                            </div>
                            <For each={weeks()}>
                              {(col) => (
                                <div class="flex flex-col gap-[3px]">
                                  <For each={col}>
                                    {(date) => {
                                      const completed = () => !!isHabitCompletedOn(habit, date);
                                      const isToday = date === todayStr();
                                      const isFuture = date > todayStr();
                                      return (
                                        <button
                                          onClick={() => toggle(habit.id, date)}
                                          class={`h-3.5 w-3.5 rounded-[3px] transition hover:scale-125 focus:outline-none focus:ring-1 focus:ring-primary/50 ${
                                            isToday ? "ring-2 ring-primary" : ""
                                          } ${isFuture && !completed() ? "border border-dashed border-border bg-transparent" : completed() ? "" : "bg-surface-3"}`}
                                          style={completed() ? { background: habit.color } : {}}
                                          title={`${date} · ${completed() ? "Done" : isFuture ? "Planned day" : "Not done"}`}
                                          aria-label={`${habit.title} on ${date}: ${completed() ? "done" : "not done"}`}
                                          aria-pressed={completed()}
                                        />
                                      );
                                    }}
                                  </For>
                                </div>
                              )}
                            </For>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>

            <div class="flex items-center justify-end gap-1.5 pt-1 text-[10px] text-text-secondary">
              <span>Less</span>
              <span class="h-3 w-3 rounded-[3px] bg-surface-3" />
              <span class="h-3 w-3 rounded-[3px] bg-primary" />
              <span>More</span>
            </div>
          </Show>
        </Show>
      </div>
    </div>
  );
}

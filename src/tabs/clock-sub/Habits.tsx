import { For, Show, createEffect, createSignal } from "solid-js";
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

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function last7Days() {
  const days: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(iso(d));
  }
  return days;
}

function dayLabel(date: string) {
  const d = new Date(date);
  return DAYS[d.getDay()];
}

export function HabitsTab() {
  const [loading, setLoading] = createSignal(true);
  const [draft, setDraft] = createSignal("");

  createEffect(() => {
    loadHabits().finally(() => setLoading(false));
  });

  async function add() {
    const title = draft().trim();
    if (!title) return;
    setDraft("");
    haptic("medium");
    const habit = await createHabit(title);
    if (habit) showStatus("Habit added", "success");
    else showStatus("Saved locally", "info");
  }

  async function toggle(habitId: string, date: string) {
    haptic("light");
    const habit = appStore.habits.find((h) => h.id === habitId);
    if (!habit) return;
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

  const days = last7Days();

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
                placeholder="Add a new habit..."
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
                subtitle="Build a streak by tracking daily habits."
              />
            }
          >
            <div class="space-y-3">
              <For each={appStore.habits}>
                {(habit) => {
                  const streak = () => computeHabitStreak(habit, appStore.habitCompletions);
                  return (
                    <div class="rounded-2xl border border-border bg-surface-2 p-4">
                      <div class="mb-3 flex items-center gap-3">
                        <span
                          class={`${habit.icon} h-5 w-5 shrink-0`}
                          style={{ color: habit.color }}
                        />
                        <div class="min-w-0 flex-1">
                          <p class="truncate text-sm font-medium text-text">{habit.title}</p>
                          <p class="text-xs text-text-secondary">
                            <span class="i-mdi-fire h-3 w-3 text-warning" /> {streak()} day{streak() === 1 ? "" : "s"} streak
                          </p>
                        </div>
                        <button
                          onClick={() => remove(habit.id)}
                          class="shrink-0 rounded-lg p-2 text-text-secondary transition hover:bg-danger/10 hover:text-danger"
                          aria-label="Delete habit"
                        >
                          <span class="i-mdi-delete h-4 w-4" />
                        </button>
                      </div>

                      <div class="grid grid-cols-7 gap-2">
                        <For each={days}>
                          {(date) => {
                            const completed = () => isHabitCompletedOn(habit, date);
                            const isToday = date === iso(new Date());
                            return (
                              <button
                                onClick={() => toggle(habit.id, date)}
                                class={`flex flex-col items-center gap-1 rounded-xl py-2 transition active:scale-95 ${
                                  completed()
                                    ? "bg-success/20 text-success"
                                    : isToday
                                      ? "bg-surface-3 text-text"
                                      : "text-text-secondary"
                                }`}
                                aria-label={`Toggle ${habit.title} on ${date}`}
                              >
                                <span class="text-[10px] font-medium">{dayLabel(date)}</span>
                                <span class="text-[10px] font-bold">
                                  {new Date(date).getDate()}
                                </span>
                              </button>
                            );
                          }}
                        </For>
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
          </Show>
        </Show>
      </div>
    </div>
  );
}

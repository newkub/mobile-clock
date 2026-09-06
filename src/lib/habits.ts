import type { Habit, HabitCompletion } from "../types";
import { appStore, setStore, queuePersist } from "../store/app";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { AppRouter } from "../orpc";

const link = new RPCLink({ url: "/rpc" });
const orpc = createORPCClient<RouterClient<AppRouter>>(link);

function now() {
  return Math.floor(Date.now() / 1000);
}

function generateId() {
  return `${now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isoDate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export async function loadHabits(): Promise<{ habits: Habit[]; completions: HabitCompletion[] }> {
  try {
    const [habits, completions] = await Promise.all([
      orpc.habits.list(),
      orpc.habits.listCompletions(),
    ]);
    setStore("habits", habits);
    setStore("habitCompletions", completions);
    queuePersist();
    return { habits, completions };
  } catch {
    return { habits: appStore.habits, completions: appStore.habitCompletions };
  }
}

export async function createHabit(title: string, opts: Partial<Pick<Habit, "color" | "icon" | "frequency" | "targetDays">> = {}): Promise<Habit | null> {
  const habit: Habit = {
    id: generateId(),
    title: title.trim(),
    color: opts.color ?? "#6366f1",
    icon: opts.icon ?? "i-mdi-check-circle",
    frequency: opts.frequency ?? "daily",
    targetDays: opts.targetDays ?? [],
    sortOrder: appStore.habits.length,
    createdAt: now(),
    updatedAt: now(),
  };

  setStore("habits", (prev) => [...prev, habit]);
  queuePersist();

  try {
    const saved = await orpc.habits.create({
      title: habit.title,
      color: habit.color,
      icon: habit.icon,
      frequency: habit.frequency as "daily" | "weekly",
      targetDays: habit.targetDays,
      sortOrder: habit.sortOrder,
    });
    setStore("habits", (prev) => prev.map((h) => (h.id === habit.id ? saved : h)));
    queuePersist();
    return saved;
  } catch {
    return habit;
  }
}

export async function updateHabit(id: string, patch: Partial<Habit>): Promise<Habit | null> {
  const existing = appStore.habits.find((h) => h.id === id);
  if (!existing) return null;

  const updated: Habit = {
    ...existing,
    title: patch.title !== undefined ? patch.title.trim() : existing.title,
    color: patch.color ?? existing.color,
    icon: patch.icon ?? existing.icon,
    frequency: patch.frequency ?? existing.frequency,
    targetDays: patch.targetDays ?? existing.targetDays,
    sortOrder: patch.sortOrder ?? existing.sortOrder,
    updatedAt: now(),
  };

  setStore("habits", (prev) => prev.map((h) => (h.id === id ? updated : h)));
  queuePersist();

  try {
    const saved = await orpc.habits.update({
      id,
      title: updated.title,
      color: updated.color,
      icon: updated.icon,
      frequency: updated.frequency as "daily" | "weekly",
      targetDays: updated.targetDays,
      sortOrder: updated.sortOrder,
    });
    setStore("habits", (prev) => prev.map((h) => (h.id === id ? saved : h)));
    queuePersist();
    return saved;
  } catch {
    return updated;
  }
}

export async function deleteHabit(id: string): Promise<void> {
  setStore("habits", (prev) => prev.filter((h) => h.id !== id));
  setStore("habitCompletions", (prev) => prev.filter((c) => c.habitId !== id));
  queuePersist();
  try {
    await orpc.habits.delete({ id });
  } catch {
    // already removed from local store
  }
}

export function isHabitCompletedOn(habit: Habit, date: string): HabitCompletion | undefined {
  return appStore.habitCompletions.find((c) => c.habitId === habit.id && c.date === date);
}

export async function completeHabit(habitId: string, date = isoDate()): Promise<HabitCompletion | null> {
  const existing = appStore.habitCompletions.find((c) => c.habitId === habitId && c.date === date);
  if (existing) return existing;

  const completion: HabitCompletion = {
    id: generateId(),
    habitId,
    date,
    completedAt: now(),
    note: null,
  };

  setStore("habitCompletions", (prev) => [...prev, completion]);
  queuePersist();

  try {
    const saved = await orpc.habits.complete({ habitId, date });
    setStore("habitCompletions", (prev) => prev.map((c) => (c.id === completion.id ? saved : c)));
    queuePersist();
    return saved;
  } catch {
    return completion;
  }
}

export async function uncompleteHabit(habitId: string, date = isoDate()): Promise<void> {
  const existing = appStore.habitCompletions.find((c) => c.habitId === habitId && c.date === date);
  if (!existing) return;

  setStore("habitCompletions", (prev) => prev.filter((c) => c.id !== existing.id));
  queuePersist();

  try {
    await orpc.habits.uncomplete({ id: existing.id });
  } catch {
    // already removed
  }
}

export function computeHabitStreak(habit: Habit, completions: HabitCompletion[]): number {
  const today = isoDate();
  const dates = new Set(completions.filter((c) => c.habitId === habit.id).map((c) => c.date));
  let streak = 0;
  let d = new Date(today);
  // If not completed today, start checking from yesterday.
  if (!dates.has(today)) {
    d.setDate(d.getDate() - 1);
  }
  while (dates.has(d.toISOString().slice(0, 10))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

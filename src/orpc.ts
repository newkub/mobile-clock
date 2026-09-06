import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { os } from "@orpc/server";
import { z } from "zod";
import {
  tasks,
  createTaskSchema,
  updateTaskSchema,
  habits,
  habitCompletions,
  createHabitSchema,
  updateHabitSchema,
  insertHabitCompletionSchema,
  deleteHabitCompletionSchema,
} from "./db/schema";
import type { Env } from "./db/env";

const base = os.$context<{ env: Env }>();

function now() {
  return Math.floor(Date.now() / 1000);
}

function generateId() {
  return `${now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toHabit(row: typeof habits.$inferSelect) {
  try {
    return {
      ...row,
      targetDays: JSON.parse(row.targetDays) as string[],
      color: row.color,
      icon: row.icon,
    };
  } catch {
    return { ...row, targetDays: [] };
  }
}

export const listTasks = base.handler(async ({ context }) => {
  const db = drizzle(context.env.DB);
  const rows = await db.select().from(tasks).orderBy(tasks.sortOrder, tasks.createdAt);
  return rows;
});

export const createTask = base
  .input(createTaskSchema)
  .handler(async ({ input, context }) => {
    const db = drizzle(context.env.DB);
    const task = {
      id: generateId(),
      title: input.title,
      completed: false,
      completedAt: null as number | null,
      totalFocusSeconds: 0,
      completedPomodoros: 0,
      sortOrder: input.sortOrder ?? 0,
      createdAt: now(),
      updatedAt: now(),
    };
    await db.insert(tasks).values(task);
    return task;
  });

export const updateTask = base
  .input(updateTaskSchema.extend({ id: z.string().min(1) }))
  .handler(async ({ input, context }) => {
    const db = drizzle(context.env.DB);
    const rows = await db.select().from(tasks).where(eq(tasks.id, input.id)).limit(1);
    const existing = rows[0];
    if (!existing) {
      throw new Error("not found");
    }

    const completed = input.completed !== undefined ? input.completed : existing.completed;
    const completedAt = completed ? (existing.completedAt ?? now()) : null;
    const updated = {
      ...existing,
      title: input.title ?? existing.title,
      completed,
      completedAt,
      totalFocusSeconds: input.totalFocusSeconds ?? existing.totalFocusSeconds,
      completedPomodoros: input.completedPomodoros ?? existing.completedPomodoros,
      sortOrder: input.sortOrder ?? existing.sortOrder,
      updatedAt: now(),
    };
    await db.update(tasks).set(updated).where(eq(tasks.id, input.id));
    return updated;
  });

export const deleteTask = base
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) => {
    const db = drizzle(context.env.DB);
    await db.delete(tasks).where(eq(tasks.id, input.id));
    return { ok: true };
  });

// Habits

export const listHabits = base.handler(async ({ context }) => {
  const db = drizzle(context.env.DB);
  const rows = await db.select().from(habits).orderBy(habits.sortOrder, habits.createdAt);
  return rows.map(toHabit);
});

export const createHabit = base
  .input(createHabitSchema)
  .handler(async ({ input, context }) => {
    const db = drizzle(context.env.DB);
    const task = {
      id: generateId(),
      title: input.title,
      color: input.color ?? "#6366f1",
      icon: input.icon ?? "i-mdi-check-circle",
      frequency: input.frequency ?? "daily",
      targetDays: JSON.stringify(input.targetDays ?? []),
      sortOrder: input.sortOrder ?? 0,
      createdAt: now(),
      updatedAt: now(),
    };
    await db.insert(habits).values(task);
    return toHabit(task);
  });

export const updateHabit = base
  .input(updateHabitSchema.extend({ id: z.string().min(1) }))
  .handler(async ({ input, context }) => {
    const db = drizzle(context.env.DB);
    const rows = await db.select().from(habits).where(eq(habits.id, input.id)).limit(1);
    const existing = rows[0];
    if (!existing) {
      throw new Error("not found");
    }

    const updated = {
      ...existing,
      title: input.title ?? existing.title,
      color: input.color ?? existing.color,
      icon: input.icon ?? existing.icon,
      frequency: input.frequency ?? existing.frequency,
      targetDays: input.targetDays !== undefined ? JSON.stringify(input.targetDays) : existing.targetDays,
      sortOrder: input.sortOrder ?? existing.sortOrder,
      updatedAt: now(),
    };
    await db.update(habits).set(updated).where(eq(habits.id, input.id));
    return toHabit(updated);
  });

export const deleteHabit = base
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) => {
    const db = drizzle(context.env.DB);
    await db.delete(habitCompletions).where(eq(habitCompletions.habitId, input.id));
    await db.delete(habits).where(eq(habits.id, input.id));
    return { ok: true };
  });

export const listHabitCompletions = base
  .input(z.object({ habitId: z.string().min(1).optional() }).optional())
  .handler(async ({ input, context }) => {
    const db = drizzle(context.env.DB);
    const rows = await db
      .select()
      .from(habitCompletions)
      .where(input?.habitId ? eq(habitCompletions.habitId, input.habitId) : undefined)
      .orderBy(habitCompletions.date);
    return rows;
  });

export const createHabitCompletion = base
  .input(insertHabitCompletionSchema)
  .handler(async ({ input, context }) => {
    const db = drizzle(context.env.DB);
    const id = generateId();
    const item = {
      id,
      habitId: input.habitId,
      date: input.date,
      completedAt: now(),
      note: input.note ?? null,
    };
    await db.insert(habitCompletions).values(item);
    return item;
  });

export const deleteHabitCompletion = base
  .input(deleteHabitCompletionSchema)
  .handler(async ({ input, context }) => {
    const db = drizzle(context.env.DB);
    await db.delete(habitCompletions).where(eq(habitCompletions.id, input.id));
    return { ok: true };
  });

export const router = {
  tasks: {
    list: listTasks,
    create: createTask,
    update: updateTask,
    delete: deleteTask,
  },
  habits: {
    list: listHabits,
    create: createHabit,
    update: updateHabit,
    delete: deleteHabit,
    listCompletions: listHabitCompletions,
    complete: createHabitCompletion,
    uncomplete: deleteHabitCompletion,
  },
};

export type AppRouter = typeof router;

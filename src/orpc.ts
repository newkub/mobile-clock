import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { os } from "@orpc/server";
import { z } from "zod";
import { tasks, createTaskSchema, updateTaskSchema } from "./db/schema";
import type { Env } from "./db/env";

const base = os.$context<{ env: Env }>();

function now() {
  return Math.floor(Date.now() / 1000);
}

function generateId() {
  return `${now()}-${Math.random().toString(36).slice(2, 9)}`;
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

export const router = {
  tasks: {
    list: listTasks,
    create: createTask,
    update: updateTask,
    delete: deleteTask,
  },
};

export type AppRouter = typeof router;

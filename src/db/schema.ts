import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  completedAt: integer("completed_at"),
  totalFocusSeconds: integer("total_focus_seconds").notNull().default(0),
  completedPomodoros: integer("completed_pomodoros").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const insertTaskSchema = createInsertSchema(tasks, {
  title: z.string().min(1).max(255),
});

export const createTaskSchema = insertTaskSchema.pick({ title: true, sortOrder: true });

export const updateTaskSchema = createInsertSchema(tasks, {
  title: z.string().min(1).max(255).optional(),
}).partial();

export const selectTaskSchema = createSelectSchema(tasks);

export type Task = z.infer<typeof selectTaskSchema>;

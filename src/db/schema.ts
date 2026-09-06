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

export const habits = sqliteTable("habits", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  color: text("color").notNull().default("#6366f1"),
  icon: text("icon").notNull().default("i-mdi-check-circle"),
  frequency: text("frequency").notNull().default("daily"),
  targetDays: text("target_days").notNull().default("[]"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const habitCompletions = sqliteTable("habit_completions", {
  id: text("id").primaryKey(),
  habitId: text("habit_id").notNull(),
  date: text("date").notNull(),
  completedAt: integer("completed_at").notNull(),
  note: text("note"),
});

const stringToArray = z
  .union([z.string().transform((s) => JSON.parse(s)), z.array(z.string())])
  .pipe(z.array(z.string()));

export const insertHabitSchema = createInsertSchema(habits, {
  title: z.string().min(1).max(255),
  color: z.string().max(32).optional(),
  icon: z.string().max(64).optional(),
  frequency: z.enum(["daily", "weekly"]).optional(),
  targetDays: stringToArray.optional(),
});

export const createHabitSchema = insertHabitSchema.pick({
  title: true,
  color: true,
  icon: true,
  frequency: true,
  targetDays: true,
  sortOrder: true,
});

export const updateHabitSchema = createInsertSchema(habits, {
  title: z.string().min(1).max(255).optional(),
  color: z.string().max(32).optional(),
  icon: z.string().max(64).optional(),
  frequency: z.enum(["daily", "weekly"]).optional(),
  targetDays: stringToArray.optional(),
}).partial();

export const selectHabitSchema = createSelectSchema(habits);

export type HabitRow = z.infer<typeof selectHabitSchema>;

export const insertHabitCompletionSchema = z.object({
  habitId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(255).optional(),
});

export const deleteHabitCompletionSchema = z.object({
  id: z.string().min(1),
});

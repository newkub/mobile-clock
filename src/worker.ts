import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { createTaskSchema, tasks, updateTaskSchema } from "./db/schema";

export interface Env {
  DB: D1Database;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

const idParam = z.object({ id: z.string().min(1) });

function now() {
  return Math.floor(Date.now() / 1000);
}

function generateId() {
  return `${now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const app = new Hono<{ Bindings: Env }>();

app.use("/api/*", cors({
  origin: ["http://localhost:5173", "http://localhost:8788", "https://mobile-clock.newkubise.workers.dev"],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type"],
}));

app.get("/api/health", (c) => c.json({ ok: true }));

app.get("/api/tasks", async (c) => {
  const db = drizzle(c.env.DB);
  const rows = await db.select().from(tasks).orderBy(tasks.sortOrder, tasks.createdAt);
  return c.json(rows);
});

app.post("/api/tasks", async (c) => {
  const body = await c.req.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const task = {
    id: generateId(),
    title: parsed.data.title,
    completed: false,
    completedAt: null as number | null,
    totalFocusSeconds: 0,
    completedPomodoros: 0,
    sortOrder: parsed.data.sortOrder ?? 0,
    createdAt: now(),
    updatedAt: now(),
  };

  const db = drizzle(c.env.DB);
  await db.insert(tasks).values(task);
  return c.json(task, 201);
});

app.put("/api/tasks/:id", async (c) => {
  const params = idParam.safeParse({ id: c.req.param("id") });
  if (!params.success) return c.json({ error: "invalid id" }, 400);

  const body = await c.req.json();
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const db = drizzle(c.env.DB);
  const rows = await db.select().from(tasks).where(eq(tasks.id, params.data.id)).limit(1);
  const existing = rows[0];
  if (!existing) return c.json({ error: "not found" }, 404);

  const completed = parsed.data.completed !== undefined ? parsed.data.completed : existing.completed;
  const completedAt = completed ? (existing.completedAt ?? now()) : null;

  const updated = {
    ...existing,
    title: parsed.data.title ?? existing.title,
    completed,
    completedAt,
    totalFocusSeconds: parsed.data.totalFocusSeconds ?? existing.totalFocusSeconds,
    completedPomodoros: parsed.data.completedPomodoros ?? existing.completedPomodoros,
    sortOrder: parsed.data.sortOrder ?? existing.sortOrder,
    updatedAt: now(),
  };

  await db.update(tasks).set(updated).where(eq(tasks.id, params.data.id));
  return c.json(updated);
});

app.delete("/api/tasks/:id", async (c) => {
  const params = idParam.safeParse({ id: c.req.param("id") });
  if (!params.success) return c.json({ error: "invalid id" }, 400);

  const db = drizzle(c.env.DB);
  await db.delete(tasks).where(eq(tasks.id, params.data.id));
  return c.json({ ok: true });
});

app.all("*", async (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;

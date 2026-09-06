import { Hono } from "hono";
import { cors } from "hono/cors";

export interface Env {
  DB: D1Database;
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  completed_at: number | null;
  total_focus_seconds: number;
  completed_pomodoros: number;
  sort_order: number;
  created_at: number;
  updated_at: number;
}

function now() {
  return Math.floor(Date.now() / 1000);
}

function id() {
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
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM tasks ORDER BY sort_order ASC, created_at DESC"
  ).all<Task>();
  return c.json(results ?? []);
});

app.post("/api/tasks", async (c) => {
  const body = await c.req.json<{ title?: string }>();
  const title = (body.title ?? "").trim();
  if (!title) return c.json({ error: "title is required" }, 400);

  const task: Task = {
    id: id(),
    title,
    completed: false,
    completed_at: null,
    total_focus_seconds: 0,
    completed_pomodoros: 0,
    sort_order: 0,
    created_at: now(),
    updated_at: now(),
  };

  await c.env.DB.prepare(
    `INSERT INTO tasks
     (id, title, completed, completed_at, total_focus_seconds, completed_pomodoros, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    task.id,
    task.title,
    task.completed ? 1 : 0,
    task.completed_at,
    task.total_focus_seconds,
    task.completed_pomodoros,
    task.sort_order,
    task.created_at,
    task.updated_at
  ).run();

  return c.json(task, 201);
});

app.put("/api/tasks/:id", async (c) => {
  const taskId = c.req.param("id");
  const body = await c.req.json<Partial<Task>>();
  const title = (body.title ?? "").trim();

  const existing = await c.env.DB.prepare("SELECT * FROM tasks WHERE id = ?").bind(taskId).first<Task>();
  if (!existing) return c.json({ error: "not found" }, 404);

  const completed = body.completed !== undefined ? body.completed : existing.completed;
  const completedAt = completed ? (existing.completed_at ?? now()) : null;
  const updated: Task = {
    ...existing,
    title: title || existing.title,
    completed,
    completed_at: completedAt,
    total_focus_seconds: body.total_focus_seconds ?? existing.total_focus_seconds,
    completed_pomodoros: body.completed_pomodoros ?? existing.completed_pomodoros,
    sort_order: body.sort_order ?? existing.sort_order,
    updated_at: now(),
  };

  await c.env.DB.prepare(
    `UPDATE tasks SET
      title = ?,
      completed = ?,
      completed_at = ?,
      total_focus_seconds = ?,
      completed_pomodoros = ?,
      sort_order = ?,
      updated_at = ?
     WHERE id = ?`
  ).bind(
    updated.title,
    updated.completed ? 1 : 0,
    updated.completed_at,
    updated.total_focus_seconds,
    updated.completed_pomodoros,
    updated.sort_order,
    updated.updated_at,
    taskId
  ).run();

  return c.json(updated);
});

app.delete("/api/tasks/:id", async (c) => {
  const taskId = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM tasks WHERE id = ?").bind(taskId).run();
  return c.json({ ok: true });
});

// Serve the SPA for all non-API routes.
app.all("*", async (c) => {
  if (c.env.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.text("Not found", 404);
});

export default app;

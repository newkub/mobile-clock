import type { FocusTask } from "../types";
import { appStore, setStore, queuePersist } from "../store/app";

const API = "/api/tasks";

function fromServer(t: Record<string, unknown>): FocusTask {
  return {
    id: String(t.id),
    title: String(t.title),
    completed: Boolean(t.completed),
    completedAt: typeof t.completed_at === "number" ? t.completed_at : null,
    totalFocusSeconds: Number(t.total_focus_seconds ?? 0),
    completedPomodoros: Number(t.completed_pomodoros ?? 0),
    sortOrder: Number(t.sort_order ?? 0),
    createdAt: Number(t.created_at),
    updatedAt: Number(t.updated_at),
  };
}

function toServer(task: FocusTask) {
  return {
    id: task.id,
    title: task.title,
    completed: task.completed,
    completed_at: task.completedAt,
    total_focus_seconds: task.totalFocusSeconds,
    completed_pomodoros: task.completedPomodoros,
    sort_order: task.sortOrder,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
  };
}

export async function loadTasks(): Promise<FocusTask[]> {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = (await res.json()) as Record<string, unknown>[];
    const tasks = raw.map(fromServer).sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt - a.createdAt);
    setStore("focusTasks", tasks);
    queuePersist();
    return tasks;
  } catch {
    return appStore.focusTasks;
  }
}

export async function createTask(title: string): Promise<FocusTask | null> {
  const now = Math.floor(Date.now() / 1000);
  const task: FocusTask = {
    id: `${now}-${Math.random().toString(36).slice(2, 9)}`,
    title: title.trim(),
    completed: false,
    completedAt: null,
    totalFocusSeconds: 0,
    completedPomodoros: 0,
    sortOrder: appStore.focusTasks.length,
    createdAt: now,
    updatedAt: now,
  };

  setStore("focusTasks", (prev) => [...prev, task]);
  queuePersist();

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: task.title }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const saved = fromServer((await res.json()) as Record<string, unknown>);
    setStore("focusTasks", (prev) => prev.map((t) => (t.id === task.id ? saved : t)));
    queuePersist();
    return saved;
  } catch {
    return task;
  }
}

export async function updateTask(id: string, patch: Partial<FocusTask>): Promise<FocusTask | null> {
  const existing = appStore.focusTasks.find((t) => t.id === id);
  if (!existing) return null;

  const now = Math.floor(Date.now() / 1000);
  const completed = patch.completed !== undefined ? patch.completed : existing.completed;
  const completedAt = completed ? (existing.completedAt ?? now) : null;
  const updated: FocusTask = {
    ...existing,
    title: patch.title !== undefined ? patch.title.trim() : existing.title,
    completed,
    completedAt,
    totalFocusSeconds: patch.totalFocusSeconds ?? existing.totalFocusSeconds,
    completedPomodoros: patch.completedPomodoros ?? existing.completedPomodoros,
    sortOrder: patch.sortOrder ?? existing.sortOrder,
    updatedAt: now,
  };

  setStore("focusTasks", (prev) => prev.map((t) => (t.id === id ? updated : t)));
  queuePersist();

  try {
    const res = await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toServer(updated)),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const saved = fromServer((await res.json()) as Record<string, unknown>);
    setStore("focusTasks", (prev) => prev.map((t) => (t.id === id ? saved : t)));
    queuePersist();
    return saved;
  } catch {
    return updated;
  }
}

export async function deleteTask(id: string): Promise<void> {
  setStore("focusTasks", (prev) => prev.filter((t) => t.id !== id));
  queuePersist();
  try {
    const res = await fetch(`${API}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch {
    // already removed from local store
  }
}

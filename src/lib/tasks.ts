import type { FocusTask } from "../types";
import { appStore, setStore, queuePersist } from "../store/app";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { AppRouter } from "../orpc";

const link = new RPCLink({ url: "/rpc" });
const orpc = createORPCClient<RouterClient<AppRouter>>(link);

export async function loadTasks(): Promise<FocusTask[]> {
  try {
    const tasks = await orpc.tasks.list();
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
    const saved = await orpc.tasks.create({ title: task.title, sortOrder: task.sortOrder });
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
    const saved = await orpc.tasks.update({
      id,
      title: updated.title,
      completed: updated.completed,
      completedAt: updated.completedAt,
      totalFocusSeconds: updated.totalFocusSeconds,
      completedPomodoros: updated.completedPomodoros,
      sortOrder: updated.sortOrder,
    });
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
    await orpc.tasks.delete({ id });
  } catch {
    // already removed from local store
  }
}

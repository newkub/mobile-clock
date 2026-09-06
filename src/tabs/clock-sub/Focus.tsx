import { createEffect, createSignal, For, Show } from "solid-js";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { haptic } from "../../lib/capacitor";
import { showStatus } from "../../lib/status";
import { createTask, deleteTask, loadTasks, updateTask } from "../../lib/tasks";
import { formatDuration } from "../../lib/time";
import { appStore } from "../../store/app";

export function FocusTab() {
  const [loading, setLoading] = createSignal(true);
  const [draft, setDraft] = createSignal("");
  const [editingId, setEditingId] = createSignal<string | null>(null);

  createEffect(() => {
    loadTasks().finally(() => setLoading(false));
  });

  async function addTask() {
    const title = draft().trim();
    if (!title) return;
    setDraft("");
    haptic("medium");
    const task = await createTask(title);
    if (task) showStatus("Task added", "success");
    else showStatus("Saved locally", "info");
  }

  async function toggle(taskId: string) {
    const task = appStore.focusTasks.find((t) => t.id === taskId);
    if (!task) return;
    haptic("light");
    await updateTask(taskId, { completed: !task.completed });
  }

  async function remove(taskId: string) {
    haptic("light");
    await deleteTask(taskId);
    showStatus("Task deleted", "info");
  }

  async function saveEdit(id: string, newTitle: string) {
    const title = newTitle.trim();
    if (!title) return;
    setEditingId(null);
    haptic("light");
    await updateTask(id, { title });
  }

  const openCount = () => appStore.focusTasks.filter((t) => !t.completed).length;
  const doneCount = () => appStore.focusTasks.filter((t) => t.completed).length;

  return (
    <div class="tab-content h-full overflow-y-auto p-5 pb-28 md:pb-8">
      <div class="mx-auto max-w-4xl space-y-5">
        <h2 class="flex items-center gap-2 text-2xl font-bold text-text">
          <span class="i-mdi-checkbox-marked-circle-plus-outline h-6 w-6 text-primary" /> Focus
        </h2>

        <Show when={!loading()} fallback={<p class="text-center text-sm text-text-secondary">Loading tasks…</p>}>
          <div class="rounded-2xl bg-surface-2 p-4">
            <div class="flex gap-2">
              <input
                type="text"
                value={draft()}
                onInput={(e) => setDraft(e.currentTarget.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                placeholder="What do you want to focus on?"
                class="flex-1 rounded-xl border border-border bg-surface-3 px-4 py-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                aria-label="New focus task"
              />
              <Button onClick={addTask} variant="primary" class="h-12 w-12 shrink-0 rounded-xl p-0" aria-label="Add task">
                <span class="i-mdi-plus h-5 w-5" />
              </Button>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div class="rounded-2xl bg-surface-2 p-3 text-center">
              <p class="text-xl font-bold text-primary">{openCount()}</p>
              <p class="text-xs text-text-secondary">Open</p>
            </div>
            <div class="rounded-2xl bg-surface-2 p-3 text-center">
              <p class="text-xl font-bold text-success">{doneCount()}</p>
              <p class="text-xs text-text-secondary">Done</p>
            </div>
            <div class="rounded-2xl bg-surface-2 p-3 text-center">
              <p class="text-xl font-bold text-text">
                {formatDuration(appStore.focusTasks.reduce((s, t) => s + t.totalFocusSeconds, 0))}
              </p>
              <p class="text-xs text-text-secondary">Focus time</p>
            </div>
          </div>

          <Show
            when={appStore.focusTasks.length > 0}
            fallback={
              <EmptyState
                icon="i-mdi-checkbox-marked-circle-plus-outline"
                title="No focus tasks yet"
                subtitle="Add a task and start a Pomodoro to track real progress."
              />
            }
          >
            <ul class="space-y-2">
              <For each={appStore.focusTasks}>
                {(task) => {
                  const isEditing = () => editingId() === task.id;
                  return (
                    <li class="flex items-center gap-3 rounded-2xl border border-border bg-surface-2 p-3 transition active:scale-[0.99]">
                      <button
                        onClick={() => toggle(task.id)}
                        class={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 transition ${
                          task.completed ? "border-success bg-success/20" : "border-border hover:border-primary"
                        }`}
                        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                      >
                        <Show when={task.completed}>
                          <span class="i-mdi-check h-5 w-5 text-success" />
                        </Show>
                      </button>

                      <div class="min-w-0 flex-1">
                        <Show
                          when={isEditing()}
                          fallback={
                            <>
                              <p
                                class={`truncate text-sm font-medium ${task.completed ? "text-text-secondary line-through" : "text-text"}`}
                                onDblClick={() => setEditingId(task.id)}
                              >
                                {task.title}
                              </p>
                              <p class="text-xs text-text-secondary">
                                {task.completedPomodoros} pomodoro{task.completedPomodoros === 1 ? "" : "s"} · {" "}
                                {formatDuration(task.totalFocusSeconds)}
                              </p>
                            </>
                          }
                        >
                          <input
                            type="text"
                            value={task.title}
                            onBlur={(e) => saveEdit(task.id, e.currentTarget.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit(task.id, e.currentTarget.value);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            class="w-full rounded-lg border border-primary bg-surface-3 px-2 py-1 text-sm text-text outline-none"
                            autofocus
                          />
                        </Show>
                      </div>

                      <button
                        onClick={() => setEditingId(task.id)}
                        class="shrink-0 rounded-lg p-2 text-text-secondary transition hover:bg-surface-3"
                        aria-label="Edit task"
                      >
                        <span class="i-mdi-pencil h-4 w-4" />
                      </button>

                      <button
                        onClick={() => remove(task.id)}
                        class="shrink-0 rounded-lg p-2 text-text-secondary transition hover:bg-danger/10 hover:text-danger"
                        aria-label="Delete task"
                      >
                        <span class="i-mdi-delete h-4 w-4" />
                      </button>
                    </li>
                  );
                }}
              </For>
            </ul>
          </Show>
        </Show>
      </div>
    </div>
  );
}

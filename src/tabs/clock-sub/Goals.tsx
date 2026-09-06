import { For, Show, createSignal } from "solid-js";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { haptic } from "../../lib/capacitor";
import { showStatus } from "../../lib/status";
import { appStore } from "../../store/app";
import { addGoal, removeGoal, updateGoal } from "../../store/actions";

export function GoalsTab() {
  const [title, setTitle] = createSignal("");
  const [target, setTarget] = createSignal(10);
  const [unit, setUnit] = createSignal("");

  function add() {
    const t = title().trim();
    if (!t) return;
    haptic("medium");
    addGoal(t, target(), unit().trim());
    setTitle("");
    setTarget(10);
    setUnit("");
    showStatus("Goal added", "success");
  }

  function bump(id: string, delta: number) {
    const goal = appStore.goals.find((g) => g.id === id);
    if (!goal) return;
    haptic("light");
    updateGoal(id, { current: Math.max(0, Math.min(goal.target, goal.current + delta)) });
  }

  return (
    <div class="tab-content h-full overflow-y-auto p-5 pb-28 md:pb-8">
      <div class="mx-auto max-w-4xl space-y-5">
        <h2 class="flex items-center gap-2 text-2xl font-bold text-text">
          <span class="i-mdi-target h-6 w-6 text-primary" /> Goals
        </h2>

        <div class="rounded-2xl bg-surface-2 p-4">
          <div class="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={title()}
              onInput={(e) => setTitle(e.currentTarget.value)}
              placeholder="Goal title"
              class="flex-1 rounded-xl border border-border bg-surface-3 px-4 py-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              aria-label="Goal title"
            />
            <input
              type="number"
              min={1}
              value={target()}
              onInput={(e) => setTarget(Math.max(1, parseInt(e.currentTarget.value) || 1))}
              class="w-24 rounded-xl border border-border bg-surface-3 px-3 py-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              aria-label="Target"
            />
            <input
              type="text"
              value={unit()}
              onInput={(e) => setUnit(e.currentTarget.value)}
              placeholder="Unit"
              class="w-24 rounded-xl border border-border bg-surface-3 px-3 py-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              aria-label="Unit"
            />
            <Button onClick={add} variant="primary" class="h-12 shrink-0 rounded-xl px-4" aria-label="Add goal">
              <span class="i-mdi-plus h-5 w-5" />
            </Button>
          </div>
        </div>

        <Show
          when={appStore.goals.length > 0}
          fallback={
            <EmptyState
              icon="i-mdi-target"
              title="No goals yet"
              subtitle="Set a goal and track progress."
            />
          }
        >
          <div class="space-y-3">
            <For each={appStore.goals}>
              {(goal) => {
                const progress = () => Math.min(100, Math.round((goal.current / goal.target) * 100));
                return (
                  <div class="rounded-2xl border border-border bg-surface-2 p-4">
                    <div class="mb-2 flex items-center justify-between">
                      <p class="truncate text-sm font-medium text-text">{goal.title}</p>
                      <p class="text-xs text-text-secondary">
                        {goal.current}/{goal.target} {goal.unit}
                      </p>
                    </div>
                    <div class="mb-3 h-2 w-full rounded-full bg-surface-3">
                      <div
                        class="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${progress()}%` }}
                      />
                    </div>
                    <div class="flex items-center justify-between">
                      <div class="flex gap-1">
                        <Button onClick={() => bump(goal.id, -1)} variant="secondary" size="sm" aria-label="Decrease">
                          <span class="i-mdi-minus h-4 w-4" />
                        </Button>
                        <Button onClick={() => bump(goal.id, 1)} variant="primary" size="sm" aria-label="Increase">
                          <span class="i-mdi-plus h-4 w-4" />
                        </Button>
                      </div>
                      <button
                        onClick={() => { haptic("light"); removeGoal(goal.id); showStatus("Goal deleted", "info"); }}
                        class="rounded-lg p-2 text-text-secondary transition hover:bg-danger/10 hover:text-danger"
                        aria-label="Delete goal"
                      >
                        <span class="i-mdi-delete h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
}

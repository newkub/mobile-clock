import { For, Show, createMemo } from "solid-js";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { haptic } from "../../lib/capacitor";
import { showStatus } from "../../lib/status";
import { appStore } from "../../store/app";
import { startSleep, endSleep } from "../../store/actions";

function formatDuration(ms: number) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return `${h}h ${m}m`;
}

export function SleepTab() {
  const activeSession = createMemo(() =>
    appStore.sleepSessions.find((s) => s.end === null),
  );

  function toggle() {
    const active = activeSession();
    if (active) {
      haptic("light");
      endSleep(active.id);
      showStatus("Sleep session ended", "success");
    } else {
      haptic("medium");
      startSleep();
      showStatus("Sleep tracking started", "success");
    }
  }

  const sessions = createMemo(() =>
    appStore.sleepSessions
      .filter((s) => s.end !== null)
      .sort((a, b) => b.start - a.start)
      .slice(0, 14),
  );

  return (
    <div class="tab-content h-full overflow-y-auto p-5 pb-28 md:pb-8">
      <div class="mx-auto max-w-4xl space-y-5">
        <h2 class="flex items-center gap-2 text-2xl font-bold text-text">
          <span class="i-mdi-sleep h-6 w-6 text-primary" /> Sleep Tracker
        </h2>

        <div class="glass rounded-3xl p-6 text-center">
          <p class="mb-2 text-sm text-text-secondary">
            {activeSession() ? "Sleeping..." : "Not tracking"}
          </p>
          <p class="text-5xl font-bold tabular-nums text-text md:text-7xl">
            {activeSession()
              ? formatDuration(Date.now() - activeSession()!.start)
              : "--:--"}
          </p>
          <Button
            onClick={toggle}
            variant={activeSession() ? "danger" : "primary"}
            class="mt-4 rounded-xl px-6 py-3"
            aria-label={activeSession() ? "Stop sleep tracking" : "Start sleep tracking"}
          >
            {activeSession() ? "Wake up" : "Go to sleep"}
          </Button>
        </div>

        <Show
          when={sessions().length > 0}
          fallback={
            <EmptyState
              icon="i-mdi-sleep"
              title="No sleep sessions yet"
              subtitle="Start tracking your sleep to see history."
            />
          }
        >
          <div class="rounded-2xl bg-surface-2 p-4">
            <h3 class="mb-3 text-sm font-semibold text-text-secondary">Recent sleep</h3>
            <div class="space-y-2">
              <For each={sessions()}>
                {(s) => (
                  <div class="flex items-center justify-between rounded-xl border border-border bg-surface p-3">
                    <div>
                      <p class="text-sm font-medium text-text">
                        {new Date(s.start).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </p>
                      <p class="text-xs text-text-secondary">
                        {new Date(s.start).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                        {" → "}
                        {s.end && new Date(s.end).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <p class="text-sm font-bold text-primary">
                      {s.end ? formatDuration(s.end - s.start) : "—"}
                    </p>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}

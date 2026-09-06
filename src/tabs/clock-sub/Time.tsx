import { For, Show, createMemo, createSignal } from "solid-js";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { haptic } from "../../lib/capacitor";
import { showStatus } from "../../lib/status";
import { appStore } from "../../store/app";
import { startTimeEntry, endTimeEntry, removeTimeEntry } from "../../store/actions";

function formatDuration(ms: number) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function TimeTab() {
  const [project, setProject] = createSignal("");
  const [exporting, setExporting] = createSignal(false);

  const activeEntry = createMemo(() => appStore.timeEntries.find((e) => e.end === null));
  const entries = createMemo(() => appStore.timeEntries.filter((e) => e.end !== null).sort((a, b) => b.start - a.start));

  function start() {
    const p = project().trim() || "Focus";
    haptic("medium");
    startTimeEntry(p);
    setProject("");
    showStatus("Timer started", "success");
  }

  function stop(id: string) {
    haptic("light");
    endTimeEntry(id);
    showStatus("Timer stopped", "success");
  }

  function exportCsv() {
    setExporting(true);
    const rows = [
      ["Project", "Start", "End", "Duration (s)"],
      ...entries().map((e) => [
        e.project,
        new Date(e.start).toISOString(),
        e.end ? new Date(e.end).toISOString() : "",
        e.end ? Math.floor((e.end - e.start) / 1000) : 0,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timesheet-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
    haptic("success");
    showStatus("CSV exported", "success");
  }

  const groupedByProject = createMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries()) {
      const d = e.end ? e.end - e.start : 0;
      map.set(e.project, (map.get(e.project) ?? 0) + d);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  });

  return (
    <div class="tab-content h-full overflow-y-auto p-5 pb-28 md:pb-8">
      <div class="mx-auto max-w-4xl space-y-5">
        <h2 class="flex items-center gap-2 text-2xl font-bold text-text">
          <span class="i-mdi-clock-time-four-outline h-6 w-6 text-primary" /> Time Tracking
        </h2>

        <div class="glass rounded-3xl p-6">
          <div class="flex gap-2">
            <input
              type="text"
              value={project()}
              onInput={(e) => setProject(e.currentTarget.value)}
              placeholder="Project name"
              class="flex-1 rounded-xl border border-border bg-surface-3 px-4 py-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              aria-label="Project name"
            />
            <Show
              when={!activeEntry()}
              fallback={
                <Button onClick={() => stop(activeEntry()!.id)} variant="danger" class="rounded-xl px-5 py-3" aria-label="Stop timer">
                  Stop
                </Button>
              }
            >
              <Button onClick={start} variant="primary" class="rounded-xl px-5 py-3" aria-label="Start timer">
                Start
              </Button>
            </Show>
          </div>
          <Show when={activeEntry()}>
            <p class="mt-3 text-center text-3xl font-bold tabular-nums text-text">
              {formatDuration(Date.now() - activeEntry()!.start)}
            </p>
            <p class="text-center text-sm text-text-secondary">{activeEntry()!.project}</p>
          </Show>
        </div>

        <Show when={groupedByProject().length > 0}>
          <div class="rounded-2xl bg-surface-2 p-4">
            <h3 class="mb-3 text-sm font-semibold text-text-secondary">Summary by project</h3>
            <div class="space-y-2">
              <For each={groupedByProject()}>
                {([project, ms]) => (
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-text">{project}</span>
                    <span class="text-sm font-bold text-primary">{formatDuration(ms)}</span>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>

        <Show
          when={entries().length > 0}
          fallback={
            <EmptyState
              icon="i-mdi-clock-time-four-outline"
              title="No time entries yet"
              subtitle="Start a timer to track project time."
            />
          }
        >
          <div class="rounded-2xl bg-surface-2 p-4">
            <div class="mb-3 flex items-center justify-between">
              <h3 class="text-sm font-semibold text-text-secondary">History</h3>
              <Button onClick={exportCsv} variant="secondary" size="sm" disabled={exporting()} aria-label="Export CSV">
                <span class="i-mdi-download h-4 w-4" /> Export CSV
              </Button>
            </div>
            <div class="space-y-2">
              <For each={entries()}>
                {(e) => (
                  <div class="flex items-center justify-between rounded-xl border border-border bg-surface p-3">
                    <div>
                      <p class="text-sm font-medium text-text">{e.project}</p>
                      <p class="text-xs text-text-secondary">
                        {new Date(e.start).toLocaleString()} → {e.end && new Date(e.end).toLocaleTimeString()}
                      </p>
                    </div>
                    <div class="flex items-center gap-2">
                      <p class="text-sm font-bold text-primary">{e.end ? formatDuration(e.end - e.start) : "—"}</p>
                      <button
                        onClick={() => { haptic("light"); removeTimeEntry(e.id); }}
                        class="rounded-lg p-1.5 text-text-secondary transition hover:bg-danger/10 hover:text-danger"
                        aria-label="Delete entry"
                      >
                        <span class="i-mdi-delete h-4 w-4" />
                      </button>
                    </div>
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

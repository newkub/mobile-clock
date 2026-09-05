import { createSignal, createEffect, For, Show } from "solid-js";
import { CircleProgress } from "../../components/CircleProgress";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { EmptyState } from "../../components/EmptyState";
import { useInterval } from "../../hooks/use-interval";
import { haptic } from "../../lib/capacitor";
import { showStatus } from "../../lib/status";
import { playBeep } from "../../lib/audio";
import { formatDuration } from "../../lib/time";
import { appStore, addTimerPreset, removeTimerPreset, type TimerPreset } from "../../store/app";

function format(total: number) {
  return formatDuration(total);
}

export function TimerTab() {
  const [seconds, setSeconds] = createSignal(60);
  const [remaining, setRemaining] = createSignal(60);
  const [running, setRunning] = createSignal(false);
  const [showAdd, setShowAdd] = createSignal(false);
  const [newName, setNewName] = createSignal("");
  const [newSec, setNewSec] = createSignal(300);
  const [newColor, setNewColor] = createSignal("#6366f1");

  const tick = () => {
    setRemaining((r) => Math.max(0, r - 1));
  };

  useInterval(tick, () => (running() ? 1000 : null));

  createEffect(() => {
    if (running() && remaining() <= 0) {
      setRunning(false);
      if (appStore.globalSettings.sound) playBeep(660, 1.2, "sine");
      haptic("success");
    }
  });

  function start() {
    setRunning(true);
    haptic("medium");
  }

  function pause() {
    setRunning(false);
    haptic("light");
  }

  function reset() {
    setRunning(false);
    setRemaining(seconds());
    haptic("light");
  }

  function selectPreset(p: TimerPreset) {
    setSeconds(p.seconds);
    setRemaining(p.seconds);
    setRunning(false);
    haptic("light");
  }

  function adjust(delta: number) {
    setRemaining((r) => Math.max(0, r + delta));
    setSeconds((s) => Math.max(0, s + delta));
  }

  function addCustom() {
    addTimerPreset({
      id: `tp_${Date.now()}`,
      name: newName() || `${newSec()}s`,
      seconds: newSec(),
      color: newColor(),
    });
    setShowAdd(false);
    setNewName("");
    setNewSec(300);
    haptic("success");
    showStatus("Timer preset saved", "success");
  }

  function removePreset(id: string) {
    removeTimerPreset(id);
    haptic("light");
    showStatus("Preset removed", "info");
  }

  return (
    <div class="tab-content flex h-full flex-col items-center gap-5 overflow-y-auto p-5 pb-28">
      <div class="mt-2">
        <CircleProgress
          progress={seconds() > 0 ? (seconds() - remaining()) / seconds() : 0}
          size={260}
          stroke={12}
          color="#6366f1"
        >
          <div class="text-center">
            <p class="text-6xl font-bold tabular-nums text-glow">{format(remaining())}</p>
            <p class="mt-1 text-sm text-text-secondary">
              {running() ? "Running" : remaining() === seconds() ? "Ready" : "Paused"}
            </p>
          </div>
        </CircleProgress>
      </div>

      <div class="flex items-center gap-3">
        <button onClick={() => adjust(-60)} class="rounded-2xl bg-surface-3 px-4 py-2 text-sm text-text-secondary transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 hover:text-text" aria-label="Decrease 1 minute">-1m</button>
        <button onClick={() => adjust(-10)} class="rounded-2xl bg-surface-3 px-4 py-2 text-sm text-text-secondary transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 hover:text-text" aria-label="Decrease 10 seconds">-10s</button>
        <button onClick={() => adjust(10)} class="rounded-2xl bg-surface-3 px-4 py-2 text-sm text-text-secondary transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 hover:text-text" aria-label="Increase 10 seconds">+10s</button>
        <button onClick={() => adjust(60)} class="rounded-2xl bg-surface-3 px-4 py-2 text-sm text-text-secondary transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 hover:text-text" aria-label="Increase 1 minute">+1m</button>
      </div>

      <div class="flex w-full max-w-sm gap-3">
        <Button
          onClick={running() ? pause : start}
          class="h-16 flex-1 rounded-3xl text-xl"
          variant={running() ? "secondary" : "primary"}
          aria-label={running() ? "Pause timer" : "Start timer"}
        >
          {running() ? (
            <><span class="i-mdi-pause mr-2 h-5 w-5" /> Pause</>
          ) : (
            <><span class="i-mdi-play mr-2 h-5 w-5" /> Start</>
          )}
        </Button>
        <Button onClick={reset} class="h-16 flex-1 rounded-3xl text-xl" variant="secondary" aria-label="Reset timer">
          <span class="i-mdi-refresh mr-2 h-5 w-5" /> Reset
        </Button>
      </div>

      <div class="w-full max-w-sm rounded-3xl bg-surface-2 p-4">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-text-secondary uppercase tracking-wide">Presets</h3>
          <button
            onClick={() => setShowAdd(!showAdd())}
            class="flex items-center gap-1 text-sm font-medium text-primary transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50"
            aria-label={showAdd() ? "Close add preset" : "Add preset"}
          >
            <span class="i-mdi-plus h-4 w-4" /> Add
          </button>
        </div>

        <Show when={showAdd()}>
          <div class="mb-4 rounded-2xl border border-border bg-surface-3 p-4">
            <Input value={newName()} onChange={setNewName} placeholder="Name" class="mb-2" />
            <div class="mb-3 flex items-center gap-3">
              <input
                type="number"
                value={newSec()}
                onInput={(e) => setNewSec(Math.max(0, parseInt(e.currentTarget.value) || 0))}
                class="w-28 rounded-xl border border-border bg-surface-2 px-3 py-2 text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                aria-label="Preset seconds"
              />
              <span class="text-sm text-text-secondary">seconds</span>
              <input
                type="color"
                value={newColor()}
                onInput={(e) => setNewColor(e.currentTarget.value)}
                class="ml-auto h-10 w-14 rounded-lg bg-transparent transition focus:outline-none focus:ring-2 focus:ring-primary/50"
                aria-label="Preset color"
              />
            </div>
            <Button onClick={addCustom} class="w-full" aria-label="Save preset">
              <span class="i-mdi-content-save mr-2 h-4 w-4" /> Save Preset
            </Button>
          </div>
        </Show>

        <Show when={appStore.timerPresets.length === 0 && !showAdd()}>
          <EmptyState
            icon="i-mdi-timer"
            title="No presets yet"
            subtitle="Add a custom timer preset"
          />
        </Show>

        <div class="flex flex-wrap gap-2">
          <For each={appStore.timerPresets}>
            {(p) => (
              <div class="group relative flex items-center gap-2 rounded-full border border-border bg-surface-3 pl-4 pr-2">
                <button
                  onClick={() => selectPreset(p)}
                  class="py-2 pr-1 text-sm font-medium transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  style={{ color: p.color }}
                  aria-label={`Select preset ${p.name}`}
                >
                  {p.name}
                </button>
                <button
                  onClick={() => removePreset(p.id)}
                  class="rounded-full p-1 text-text-secondary opacity-0 transition active:scale-95 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary/50 hover:text-danger group-hover:opacity-100"
                  aria-label={`Remove preset ${p.name}`}
                >
                  <span class="i-mdi-delete h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}

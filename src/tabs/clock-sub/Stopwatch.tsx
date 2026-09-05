import { createSignal, createMemo, For } from "solid-js";
import { CircleProgress } from "../../components/CircleProgress";
import { Button } from "../../components/Button";
import { useInterval } from "../../hooks/use-interval";
import { haptic } from "../../lib/capacitor";
import { showStatus } from "../../lib/status";

interface Lap {
  id: number;
  split: number;
  total: number;
}

function format(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`;
}

export function StopwatchTab() {
  const [running, setRunning] = createSignal(false);
  const [time, setTime] = createSignal(0);
  const [laps, setLaps] = createSignal<Lap[]>([]);

  let startRef = 0;
  let offsetRef = 0;

  const tick = () => {
    setTime(offsetRef + (Date.now() - startRef));
  };

  useInterval(tick, () => (running() ? 16 : null));

  function start() {
    startRef = Date.now();
    setRunning(true);
    haptic("medium");
  }

  function stop() {
    offsetRef = time();
    setRunning(false);
    haptic("heavy");
  }

  function reset() {
    setRunning(false);
    setTime(0);
    setLaps([]);
    offsetRef = 0;
    haptic("light");
  }

  function lap() {
    const list = laps();
    const prev = list.length ? list[list.length - 1].total : 0;
    setLaps([...list, { id: list.length + 1, split: time() - prev, total: time() }]);
    haptic("light");
  }

  const bestLap = createMemo(() => (laps().length ? Math.min(...laps().map((l) => l.split)) : null));
  const worstLap = createMemo(() => (laps().length ? Math.max(...laps().map((l) => l.split)) : null));

  async function shareLaps() {
    const text = laps().map((l) => `Lap ${l.id}: ${format(l.split)} / ${format(l.total)}`).join("\n");
    if (navigator.share) {
      await navigator.share({ title: "Stopwatch laps", text });
    } else {
      await navigator.clipboard.writeText(text);
      showStatus("Laps copied to clipboard", "success");
    }
    haptic("success");
  }

  return (
    <div class="tab-content flex h-full flex-col items-center gap-6 overflow-y-auto p-5 pb-28">
      <div class="mt-4 flex flex-col items-center gap-2">
        <CircleProgress progress={0} size={260} stroke={10}>
          <div class="text-center">
            <p class="text-6xl font-bold tabular-nums text-glow">{format(time())}</p>
            <p class="mt-1 text-sm text-text-secondary">
              {time() === 0 ? "Tap start to begin" : `${laps().length} lap${laps().length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </CircleProgress>
      </div>

      <div class="flex w-full max-w-sm gap-3">
        <Button
          onClick={running() ? stop : start}
          class="h-16 flex-1 rounded-3xl text-xl"
          variant={running() ? "danger" : "primary"}
          aria-label={running() ? "Stop stopwatch" : "Start stopwatch"}
        >
          {running() ? (
            <><span class="i-mdi-pause mr-2 h-5 w-5" /> Stop</>
          ) : (
            <><span class="i-mdi-play mr-2 h-5 w-5" /> Start</>
          )}
        </Button>
        {running() ? (
          <Button onClick={lap} class="h-16 flex-1 rounded-3xl text-xl" variant="secondary" aria-label="Record lap">
            <span class="i-mdi-flag mr-2 h-5 w-5" /> Lap
          </Button>
        ) : (
          <Button onClick={reset} class="h-16 flex-1 rounded-3xl text-xl" variant="secondary" aria-label="Reset stopwatch">
            <span class="i-mdi-refresh mr-2 h-5 w-5" /> Reset
          </Button>
        )}
      </div>

      {laps().length > 0 && (
        <Button onClick={shareLaps} variant="ghost" size="sm" class="-mt-2" aria-label="Export or share laps">
          <span class="i-mdi-share mr-2 h-4 w-4" /> Export laps
        </Button>
      )}

      {laps().length > 0 && (
        <div class="w-full max-w-sm rounded-3xl bg-surface-2 p-4">
          <h3 class="mb-2 text-sm font-semibold text-text-secondary uppercase tracking-wide">Laps</h3>
          <div class="max-h-52 space-y-2 overflow-y-auto">
            <For each={laps().slice().reverse()}>
              {(lap) => {
                const isBest = lap.split === bestLap();
                const isWorst = lap.split === worstLap() && laps().length > 2;
                return (
                  <div
                    class={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
                      isBest ? "border-success/30 bg-success/10" : isWorst ? "border-danger/30 bg-danger/10" : "border-border bg-surface-3"
                    }`}
                  >
                    <span class="text-sm text-text-secondary">Lap {lap.id}</span>
                    <div class="text-right">
                      <p class="font-mono text-lg font-semibold">{format(lap.split)}</p>
                      <p class="text-xs text-muted">{format(lap.total)}</p>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      )}
    </div>
  );
}

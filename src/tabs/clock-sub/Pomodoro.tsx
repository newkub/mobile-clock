import { createSignal, createMemo, createEffect, For, Show } from "solid-js";
import { CircleProgress } from "../../components/CircleProgress";
import { Button } from "../../components/Button";
import { useInterval } from "../../hooks/use-interval";
import { haptic } from "../../lib/capacitor";
import { playBeep } from "../../lib/audio";
import { formatDuration } from "../../lib/time";
import { appStore, addPomodoroSession } from "../../store/app";

const FOCUS_SECONDS = 25 * 60;
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 15 * 60;

type Phase = "focus" | "short" | "long";

function format(total: number) {
  return formatDuration(total);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function PomodoroTab() {
  const [phase, setPhase] = createSignal<Phase>("focus");
  const [remaining, setRemaining] = createSignal(FOCUS_SECONDS);
  const [running, setRunning] = createSignal(false);
  const [completedInSession, setCompletedInSession] = createSignal(0);

  const total = createMemo(() =>
    phase() === "focus" ? FOCUS_SECONDS : phase() === "short" ? SHORT_BREAK : LONG_BREAK
  );

  const tick = () => {
    setRemaining((r) => Math.max(0, r - 1));
  };

  useInterval(tick, () => (running() ? 1000 : null));

  createEffect(() => {
    if (running() && remaining() <= 0) {
      if (appStore.globalSettings.sound) playBeep(880, 0.8, "triangle");
      haptic("success");

      if (phase() === "focus") {
        addPomodoroSession({ date: todayStr(), completedCycles: 1, totalFocusSeconds: FOCUS_SECONDS });
        const nextCount = completedInSession() + 1;
        setCompletedInSession(nextCount);
        if (nextCount % 4 === 0) {
          setPhase("long");
          setRemaining(LONG_BREAK);
        } else {
          setPhase("short");
          setRemaining(SHORT_BREAK);
        }
      } else {
        setPhase("focus");
        setRemaining(FOCUS_SECONDS);
        setRunning(false);
      }
    }
  });

  const start = () => {
    setRunning(true);
  };

  const pause = () => {
    setRunning(false);
  };

  function reset() {
    setRunning(false);
    setRemaining(total());
    haptic("light");
  }

  function manualPhase(next: Phase) {
    setRunning(false);
    setPhase(next);
    setRemaining(next === "focus" ? FOCUS_SECONDS : next === "short" ? SHORT_BREAK : LONG_BREAK);
  }

  const progress = createMemo(() => (total() - remaining()) / total());
  const color = createMemo(() => (phase() === "focus" ? "#6366f1" : phase() === "short" ? "#22c55e" : "#a855f7"));

  const today = todayStr();
  const todayCycles = createMemo(() => {
    const session = appStore.pomodoroSessions.find((s) => s.date === today);
    return session ? session.completedCycles : 0;
  });
  const totalCycles = createMemo(() => appStore.pomodoroSessions.reduce((sum, s) => sum + s.completedCycles, 0));

  const phaseIcon: Record<Phase, string> = {
    focus: "i-mdi-brain",
    short: "i-mdi-coffee",
    long: "i-mdi-coffee",
  };

  return (
    <div class="tab-content flex h-full flex-col items-center gap-5 overflow-y-auto p-5 pb-28">
      <div class="flex rounded-full bg-surface-2 p-1">
        <For each={["focus", "short", "long"] as Phase[]}>
          {(p) => (
            <button
              onClick={() => manualPhase(p)}
              class={`flex items-center rounded-full px-4 py-2 text-sm font-semibold capitalize transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                phase() === p
                  ? p === "focus"
                    ? "bg-primary text-white"
                    : p === "short"
                      ? "bg-success text-white"
                      : "bg-accent text-white"
                  : "text-text-secondary"
              }`}
              aria-label={`Switch to ${p} phase`}
            >
              <span class={`${phaseIcon[p]} mr-1 h-4 w-4`} />
              {p}
            </button>
          )}
        </For>
      </div>

      <div class="mt-2">
        <CircleProgress progress={progress()} size={260} stroke={14} color={color()}>
          <div class="text-center">
            <p class="text-6xl font-bold tabular-nums text-glow" style={{ color: color() }}>
              {format(remaining())}
            </p>
            <p class="mt-1 text-sm capitalize text-text-secondary">{phase()} time</p>
          </div>
        </CircleProgress>
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

      <div class="grid w-full max-w-sm grid-cols-2 gap-3">
        <div class="rounded-2xl bg-surface-2 p-4 text-center">
          <p class="text-3xl font-bold text-primary">{todayCycles()}</p>
          <p class="text-xs text-text-secondary">Today</p>
        </div>
        <div class="rounded-2xl bg-surface-2 p-4 text-center">
          <p class="text-3xl font-bold text-success">{totalCycles()}</p>
          <p class="text-xs text-text-secondary">All time</p>
        </div>
      </div>

      <Show when={todayCycles() > 0 && todayCycles() % 4 === 0}>
        <div class="flex items-center gap-2 rounded-2xl bg-success/10 p-3 text-success">
          <span class="i-mdi-trophy h-5 w-5" />
          <span class="font-medium">Great focus streak! Take a long break.</span>
        </div>
      </Show>
    </div>
  );
}

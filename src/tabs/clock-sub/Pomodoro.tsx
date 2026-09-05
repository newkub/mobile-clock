import { createSignal, createMemo, createEffect, createRoot, onCleanup, For, Show } from "solid-js";
import { CircleProgress } from "../../components/CircleProgress";
import { Button } from "../../components/Button";
import { useShortcuts } from "../../hooks/use-shortcuts";
import { haptic } from "../../lib/capacitor";
import { playBeep } from "../../lib/audio";
import { formatDuration } from "../../lib/time";
import { appStore, addPomodoroSession } from "../../store/app";

type Phase = "focus" | "short" | "long";

function format(total: number) {
  return formatDuration(total);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Durations come from global settings (minutes) so users can customize them.
function phaseSeconds(p: Phase) {
  const g = appStore.globalSettings;
  const mins = p === "focus" ? g.pomodoroFocus : p === "short" ? g.pomodoroShort : g.pomodoroLong;
  return Math.max(1, mins) * 60;
}

// Module-scoped state: survives tab switches. The countdown is driven by a
// wall-clock deadline so phases complete even while the tab is unmounted.
const [phase, setPhase] = createSignal<Phase>("focus");
const [remaining, setRemaining] = createSignal(phaseSeconds("focus"));
const [running, setRunning] = createSignal(false);
const [completedInSession, setCompletedInSession] = createSignal(0);
let endsAtRef = 0;

const POMO_LS_KEY = "wrikka-pomodoro-state";

// Restore a running/paused pomodoro from a previous session.
try {
  const raw = localStorage.getItem(POMO_LS_KEY);
  if (raw) {
    const s = JSON.parse(raw);
    if (s.phase === "focus" || s.phase === "short" || s.phase === "long") setPhase(s.phase);
    if (typeof s.completed === "number") setCompletedInSession(s.completed);
    if (s.running && typeof s.endsAt === "number") {
      endsAtRef = s.endsAt;
      setRemaining(Math.max(0, Math.ceil((s.endsAt - Date.now()) / 1000)));
      setRunning(remaining() > 0);
    } else if (typeof s.remaining === "number") {
      setRemaining(Math.max(0, s.remaining));
    }
  }
} catch {
  // ignore corrupt state
}

function syncDeadline() {
  endsAtRef = Date.now() + remaining() * 1000;
}

// Keep the countdown + phase transitions alive outside the component so they
// keep working while another sub-tab is mounted.
createRoot(() => {
  createEffect(() => {
    const snapshot = {
      phase: phase(),
      remaining: remaining(),
      running: running(),
      endsAt: endsAtRef,
      completed: completedInSession(),
    };
    try {
      localStorage.setItem(POMO_LS_KEY, JSON.stringify(snapshot));
    } catch {
      // ignore
    }
  });

  createEffect(() => {
    if (!running()) return;
    const id = setInterval(() => {
      setRemaining(Math.max(0, Math.ceil((endsAtRef - Date.now()) / 1000)));
    }, 250);
    onCleanup(() => clearInterval(id));
  });

  createEffect(() => {
    if (running() && remaining() <= 0) {
      if (appStore.globalSettings.sound) playBeep(880, 0.8, "triangle");
      haptic("success");

      if (phase() === "focus") {
        addPomodoroSession({ date: todayStr(), completedCycles: 1, totalFocusSeconds: phaseSeconds("focus") });
        const nextCount = completedInSession() + 1;
        setCompletedInSession(nextCount);
        const nextPhase: Phase = nextCount % 4 === 0 ? "long" : "short";
        setPhase(nextPhase);
        setRemaining(phaseSeconds(nextPhase));
        // Auto-start the break: the countdown keeps running.
        endsAtRef = Date.now() + phaseSeconds(nextPhase) * 1000;
      } else {
        setPhase("focus");
        setRemaining(phaseSeconds("focus"));
        setRunning(false);
      }
    }
  });
});

export function PomodoroTab() {
  const total = createMemo(() => phaseSeconds(phase()));

  const start = () => {
    if (remaining() <= 0) setRemaining(total());
    syncDeadline();
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
    setRemaining(phaseSeconds(next));
  }

  useShortcuts({
    space: () => (running() ? pause() : start()),
    r: reset,
  });

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
    long: "i-mdi-sofa",
  };
  const phaseLabel: Record<Phase, string> = {
    focus: "Focus",
    short: "Short break",
    long: "Long break",
  };

  return (
    <div class="tab-content h-full overflow-y-auto p-5 pb-28 md:pb-8">
      <div class="mx-auto flex max-w-4xl flex-col items-center gap-5 md:grid md:grid-cols-2 md:items-start md:gap-10">
        {/* Left column: phase pills + dial + controls */}
        <div class="flex w-full flex-col items-center gap-5">
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
              {phaseLabel[p]}
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
            <p class="mt-1 text-sm text-text-secondary">{phaseLabel[phase()]} time</p>
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

          <p class="hidden text-xs text-muted md:block">
            <kbd class="rounded bg-surface-3 px-1.5 py-0.5">Space</kbd> start/pause ·{" "}
            <kbd class="rounded bg-surface-3 px-1.5 py-0.5">R</kbd> reset
          </p>
        </div>

        {/* Right column: stats */}
        <div class="flex w-full max-w-sm flex-col gap-3 md:max-w-none">
      <div class="grid w-full grid-cols-2 gap-3">
        <div class="rounded-2xl bg-surface-2 p-4 text-center">
          <p class="text-3xl font-bold text-primary">{todayCycles()}</p>
          <p class="text-xs text-text-secondary">Today</p>
        </div>
        <div class="rounded-2xl bg-surface-2 p-4 text-center">
          <p class="text-3xl font-bold text-success">{totalCycles()}</p>
          <p class="text-xs text-text-secondary">All time</p>
        </div>
      </div>

      <div class="rounded-2xl bg-surface-2 p-4">
        <h3 class="mb-1 flex items-center gap-2 text-sm font-semibold text-text-secondary">
          <span class="i-mdi-information-outline h-4 w-4" /> How it works
        </h3>
        <p class="text-xs leading-relaxed text-text-secondary">
          {appStore.globalSettings.pomodoroFocus} min focus → {appStore.globalSettings.pomodoroShort} min short break.
          After 4 focus rounds, take a {appStore.globalSettings.pomodoroLong} min long break.
          Breaks start automatically when a focus round ends.
        </p>
      </div>

      <Show when={todayCycles() > 0 && todayCycles() % 4 === 0}>
        <div class="flex items-center gap-2 rounded-2xl bg-success/10 p-3 text-success">
          <span class="i-mdi-trophy h-5 w-5" />
          <span class="font-medium">Great focus streak! Take a long break.</span>
        </div>
      </Show>
        </div>
      </div>
    </div>
  );
}

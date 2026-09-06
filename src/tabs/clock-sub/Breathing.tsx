import { createSignal, createEffect, createRoot, onCleanup, For, Show } from "solid-js";
import { FullscreenButton } from "../../components/FullscreenButton";
import { Button } from "../../components/Button";
import { useShortcuts } from "../../hooks/use-shortcuts";
import { haptic } from "../../lib/capacitor";
import { showStatus } from "../../lib/status";
import { formatDuration } from "../../lib/time";
import { appStore } from "../../store/app";
import { PATTERNS, PHASE_META } from "../../lib/breathing";

type HapticType = Parameters<typeof haptic>[0];

// Module-scoped state: survives sub-tab switches like Timer/Pomodoro.
const [patternId, setPatternId] = createSignal(PATTERNS[0].id);
const [running, setRunning] = createSignal(false);
const [phaseIdx, setPhaseIdx] = createSignal(0);
const [secondsLeft, setSecondsLeft] = createSignal(PATTERNS[0].phases[0].seconds);
const [cycles, setCycles] = createSignal(0);
const [scale, setScale] = createSignal(1);
const [animMs, setAnimMs] = createSignal(600);
const [reducedMotion, setReducedMotion] = createSignal(false);
const [elapsed, setElapsed] = createSignal(0);
const [voiceGuide, setVoiceGuide] = createSignal(false);

const VOICE_KEY = "wrikka-breathing-voice";
try {
  const raw = localStorage.getItem(VOICE_KEY);
  if (raw === "1") setVoiceGuide(true);
} catch {}

function speak(text: string) {
  if (!voiceGuide() || typeof speechSynthesis === "undefined") return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0;
    u.pitch = 1.0;
    speechSynthesis.speak(u);
  } catch {}
}

// Respect the OS reduced-motion preference (the global .reduce-motion class
// also collapses CSS transitions, but we skip scale changes entirely here).
if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  setReducedMotion(mq.matches);
  mq.addEventListener?.("change", (e) => setReducedMotion(e.matches));
}

const pattern = () => PATTERNS.find((p) => p.id === patternId()) ?? PATTERNS[0];
const phase = () => pattern().phases[phaseIdx()];
const meta = () => PHASE_META[phase().kind];

/** Haptic only when enabled in settings (haptic() itself no-ops off native). */
function buzz(type: HapticType) {
  if (appStore.globalSettings.haptics) haptic(type);
}

function enterPhase(idx: number) {
  const ph = pattern().phases[idx];
  setPhaseIdx(idx);
  setSecondsLeft(ph.seconds);
  // Drive the CSS transition duration so the animation matches the breath.
  setAnimMs(ph.seconds * 1000);
  const target = PHASE_META[ph.kind].scale;
  if (!reducedMotion() && target !== null) setScale(target);
  buzz("light");
  speak(ph.label);
}

// 1s countdown ticker kept alive outside the component so a session continues
// while another sub-tab is mounted.
createRoot(() => {
  createEffect(() => {
    if (!running()) return;
    const id = setInterval(() => {
      setElapsed((e) => e + 1);
      const left = secondsLeft() - 1;
      if (left > 0) {
        setSecondsLeft(left);
      } else {
        const next = (phaseIdx() + 1) % pattern().phases.length;
        if (next === 0) setCycles((c) => c + 1);
        enterPhase(next);
      }
    }, 1000);
    onCleanup(() => clearInterval(id));
  });
});

export function BreathingTab() {
  function reset() {
    setRunning(false);
    setPhaseIdx(0);
    setSecondsLeft(pattern().phases[0].seconds);
    setAnimMs(600);
    setScale(1);
  }

  function start() {
    setCycles(0);
    setElapsed(0);
    setScale(1);
    enterPhase(0);
    setRunning(true);
    buzz("medium");
  }

  function stop() {
    if (running() && elapsed() > 2) {
      showStatus(
        `Breathed ${formatDuration(elapsed())} · ${cycles()} cycle${cycles() === 1 ? "" : "s"} done`,
        "success"
      );
    }
    reset();
    buzz("light");
  }

  function select(id: string) {
    if (id === patternId()) return;
    reset();
    setPatternId(id);
    setSecondsLeft(pattern().phases[0].seconds);
    buzz("light");
  }

  useShortcuts({
    space: () => (running() ? stop() : start()),
  });

  const phaseProgress = () => {
    const s = phase().seconds;
    return s > 0 ? ((s - secondsLeft()) / s) * 100 : 0;
  };

  return (
    <div class="tab-content relative h-full overflow-y-auto p-5 pb-28 md:pb-8">
      <FullscreenButton class="absolute right-4 top-4 md:right-6 md:top-6" />
      <div class="mx-auto flex max-w-md flex-col items-center gap-5">
        <div class="text-center">
          <h2 class="flex items-center justify-center gap-2 text-lg font-bold">
            <span class={`${pattern().icon} h-5 w-5 text-primary`} />
            {pattern().name} Breathing
          </h2>
          <p class="mt-0.5 text-xs text-text-secondary">{pattern().tagline}</p>
        </div>

        {/* Pattern selector + voice guide */}
        <div class="flex flex-col items-center gap-2">
          <div class="flex flex-wrap justify-center gap-1 rounded-2xl bg-surface-2 p-1.5">
            <For each={PATTERNS}>
              {(p) => (
                <button
                  onClick={() => select(p.id)}
                  class={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    patternId() === p.id ? "bg-primary text-white" : "text-text-secondary"
                  }`}
                  aria-label={`Select ${p.name} breathing pattern`}
                >
                  <span class={`${p.icon} h-4 w-4`} /> {p.name}
                </button>
              )}
            </For>
          </div>
          <button
            onClick={() => {
              setVoiceGuide(!voiceGuide());
              try { localStorage.setItem(VOICE_KEY, voiceGuide() ? "1" : "0"); } catch {}
              haptic("light");
            }}
            class={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              voiceGuide() ? "bg-primary/15 text-primary" : "bg-surface-2 text-text-secondary"
            }`}
            aria-label={voiceGuide() ? "Disable voice guide" : "Enable voice guide"}
          >
            <span class={`h-4 w-4 ${voiceGuide() ? "i-mdi-volume-high" : "i-mdi-volume-off"}`} />
            {voiceGuide() ? "Voice guide on" : "Voice guide off"}
          </button>
        </div>

        {/* Breath circle */}
        <div class="relative mt-2 h-72 w-72">
          <div class="absolute inset-0 rounded-full border border-border/60" />
          <div
            class="absolute inset-10 rounded-full"
            style={{
              transform: `scale(${scale()})`,
              background: meta().soft,
              border: `2px solid ${meta().color}`,
              "box-shadow": `0 0 44px ${meta().soft}`,
              "transition-property": "transform, background-color, border-color, box-shadow",
              "transition-duration": `${animMs()}ms, 700ms, 700ms, 700ms`,
              "transition-timing-function": "cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
          <div
            class="absolute inset-16 rounded-full border-2 opacity-40"
            style={{
              "border-color": meta().color,
              transform: `scale(${Math.max(0.6, Math.min(1.15, 0.85 + (scale() - 1) * 0.2))})`,
              transition: `transform ${animMs()}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            }}
          />
          <div class="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
            <span class={`${meta().icon} h-6 w-6`} style={{ color: meta().color }} />
            <p class="text-xl font-semibold" style={{ color: meta().color }}>
              {running() ? phase().label : "Ready"}
            </p>
            <p class="text-6xl font-bold tabular-nums text-glow" style={{ color: meta().color }}>
              {running() ? secondsLeft() : "·"}
            </p>
            <p class="text-xs text-text-secondary">
              {running() ? `${phase().seconds}s ${phase().label.toLowerCase()}` : "press start to begin"}
            </p>
          </div>
        </div>

        {/* Phase indicators */}
        <div class="flex flex-wrap items-center justify-center gap-2">
          <For each={pattern().phases}>
            {(ph, i) => {
              const active = () => running() && i() === phaseIdx();
              return (
                <div
                  class={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${active() ? "text-white" : "border border-border bg-surface-2 text-text-secondary"}`}
                  style={active() ? { background: PHASE_META[ph.kind].color } : {}}
                >
                  <span class={`${PHASE_META[ph.kind].icon} h-3.5 w-3.5`} /> {ph.label} {ph.seconds}s
                </div>
              );
            }}
          </For>
        </div>

        {/* In-phase progress bar */}
        <div class="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-surface-3" role="progressbar" aria-label="Phase progress" aria-valuenow={Math.round(phaseProgress())} aria-valuemin={0} aria-valuemax={100}>
          <div class="h-full rounded-full" style={{ width: `${phaseProgress()}%`, background: meta().color, transition: "width 900ms linear, background-color 500ms" }} />
        </div>

        <div class="flex w-full max-w-xs gap-3">
          <Button
            onClick={running() ? stop : start}
            class="h-16 flex-1 rounded-3xl text-xl"
            variant={running() ? "secondary" : "primary"}
            aria-label={running() ? "Stop breathing session" : "Start breathing session"}
          >
            <span class={`${running() ? "i-mdi-stop" : "i-mdi-play"} mr-2 h-5 w-5`} /> {running() ? "Stop" : "Start"}
          </Button>
        </div>

        <p class="text-xs text-text-secondary">
          <Show when={running()} fallback={cycles() > 0 ? `${cycles()} cycle${cycles() === 1 ? "" : "s"} completed` : "Breathe with the circle"}>
            Cycle {cycles() + 1} · {formatDuration(elapsed())}
          </Show>
        </p>

        <p class="hidden text-xs text-muted md:block">
          <kbd class="rounded bg-surface-3 px-1.5 py-0.5">Space</kbd> start/stop
        </p>
      </div>
    </div>
  );
}

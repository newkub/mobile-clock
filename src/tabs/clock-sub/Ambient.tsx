import { createEffect, createSignal, For, Show } from "solid-js";
import { haptic } from "../../lib/capacitor";
import { formatDuration } from "../../lib/time";
import { type SoundId, generateBuffer } from "../../lib/ambient";

const PREFS_KEY = "wrikka-ambient-prefs";

interface SoundDef {
  id: SoundId;
  label: string;
  icon: string;
}

const SOUNDS: SoundDef[] = [
  { id: "brown", label: "Brown noise", icon: "i-mdi-waveform" },
  { id: "pink", label: "Pink noise", icon: "i-mdi-sine-wave" },
  { id: "rain", label: "Rain", icon: "i-mdi-weather-rainy" },
  { id: "cafe", label: "Cafe", icon: "i-mdi-coffee" },
];

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
const activeSources = new Map<SoundId, AudioBufferSourceNode>();
let sleepTimer: number | null = null;
const buffers = new Map<SoundId, AudioBuffer>();
const [volume, setVolume] = createSignal(0.75);
const [activeIds, setActiveIds] = createSignal<Set<SoundId>>(new Set());
const [sleepMinutes, setSleepMinutes] = createSignal(0);
const [elapsed, setElapsed] = createSignal(0);

const [vizBars, setVizBars] = createSignal<number[]>(Array.from({ length: 8 }, () => 20));

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return;
    const p = JSON.parse(raw) as { volume?: number; sleepMinutes?: number; activeIds?: SoundId[] };
    if (typeof p.volume === "number") setVolume(clamp(p.volume, 0, 1));
    if (typeof p.sleepMinutes === "number") setSleepMinutes(clamp(p.sleepMinutes, 0, 60));
    if (Array.isArray(p.activeIds)) {
      const valid = p.activeIds.filter((id) => SOUNDS.some((s) => s.id === id));
      if (valid.length > 0) {
        for (const id of valid) void startSound(id);
      }
    }
  } catch {}
}
function savePrefs() {
  try {
    localStorage.setItem(
      PREFS_KEY,
      JSON.stringify({ volume: volume(), sleepMinutes: sleepMinutes(), activeIds: [...activeIds()] })
    );
  } catch {}
}
createEffect(savePrefs);

let elapsedTimer: number | null = null;
function startElapsed() {
  if (elapsedTimer) return;
  const started = Date.now() - elapsed() * 1000;
  elapsedTimer = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
}
function stopElapsed() {
  if (elapsedTimer) { clearInterval(elapsedTimer); elapsedTimer = null; }
  setElapsed(0);
}

let vizTimer: number | null = null;
function startViz() {
  if (vizTimer) return;
  vizTimer = window.setInterval(() => {
    setVizBars(Array.from({ length: 8 }, () => 15 + Math.random() * 75));
  }, 150);
}
function stopViz() {
  if (vizTimer) { clearInterval(vizTimer); vizTimer = null; }
  setVizBars(Array.from({ length: 8 }, () => 20));
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function stopAmbient() {
  if (sleepTimer) {
    clearTimeout(sleepTimer);
    sleepTimer = null;
  }
  for (const source of activeSources.values()) {
    try { source.stop(); } catch {}
    source.disconnect();
  }
  activeSources.clear();
  setActiveIds(new Set<SoundId>());
  stopElapsed();
  stopViz();
  haptic("light");
}

function ensureCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = volume();
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

async function startSound(id: SoundId) {
  const ctx = ensureCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
  if (activeSources.has(id)) return;
  let buffer = buffers.get(id);
  if (!buffer || buffer.sampleRate !== ctx.sampleRate) {
    buffer = generateBuffer(id, ctx);
    buffers.set(id, buffer);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(masterGain!);
  source.start();
  source.onended = () => {
    source.disconnect();
    activeSources.delete(id);
    setActiveIds(new Set<SoundId>(activeSources.keys()));
    if (activeSources.size === 0) {
      stopElapsed();
      stopViz();
    }
  };
  activeSources.set(id, source);
  setActiveIds(new Set(activeSources.keys()));
  startElapsed();
  startViz();
}

function stopSound(id: SoundId) {
  const source = activeSources.get(id);
  if (source) {
    try { source.stop(); } catch {}
    source.disconnect();
    activeSources.delete(id);
    setActiveIds(new Set<SoundId>(activeSources.keys()));
  }
  if (activeSources.size === 0) {
    stopElapsed();
    stopViz();
    if (sleepTimer) {
      clearTimeout(sleepTimer);
      sleepTimer = null;
    }
  }
}

function toggleAmbient(id: SoundId) {
  if (activeIds().has(id)) {
    stopSound(id);
    haptic("light");
  } else {
    void startSound(id);
    haptic("medium");
    if (sleepMinutes() > 0 && activeSources.size > 0) {
      if (sleepTimer) clearTimeout(sleepTimer);
      sleepTimer = window.setTimeout(() => stopAmbient(), sleepMinutes() * 60_000);
    }
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", () => {
    if (audioCtx?.state === "suspended") void audioCtx.resume();
  }, { once: true });
}

loadPrefs();

export function AmbientTab() {
  const playingLabels = () => [...activeIds()].map((id) => SOUNDS.find((s) => s.id === id)?.label).filter(Boolean).join(" + ");

  return (
    <div class="tab-content relative h-full overflow-y-auto p-5 pb-28 md:pb-8">
      <div class="mx-auto max-w-4xl space-y-5">
        <Show when={activeIds().size > 0}>
          <div class="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3">
            <div class="flex items-center gap-2 text-sm font-medium text-primary">
              <span class="i-mdi-volume-high h-4 w-4 animate-pulse" />
              <span>Playing {playingLabels()}</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-sm tabular-nums text-primary">{formatDuration(elapsed())}</span>
              <button
                onClick={stopAmbient}
                class="rounded-lg p-1.5 text-primary transition hover:bg-primary/20"
                aria-label="Stop all sounds"
              >
                <span class="i-mdi-stop h-4 w-4" />
              </button>
            </div>
          </div>
        </Show>
        <div class="flex h-10 items-end justify-center gap-1">
          <For each={vizBars()}>
            {(h) => (
              <span
                class="w-2.5 rounded-sm bg-primary/60 transition-all duration-150"
                style={{ height: `${h}%` }}
              />
            )}
          </For>
        </div>
        <div class="rounded-2xl bg-surface-2 p-4 space-y-4">
          <div class="flex items-center gap-3">
            <span class="i-mdi-volume-high h-5 w-5 text-text-secondary" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume()}
              onInput={(e) => {
                const v = parseFloat(e.currentTarget.value);
                setVolume(v);
                if (masterGain) masterGain.gain.value = v;
              }}
              class="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-surface-3 accent-primary"
              aria-label="Master volume"
            />
            <span class="w-10 text-right text-sm text-text-secondary tabular-nums">{Math.round(volume() * 100)}%</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="i-mdi-timer-sand h-5 w-5 text-text-secondary" />
            <select
              value={sleepMinutes()}
              onChange={(e) => {
                const minutes = parseInt(e.currentTarget.value, 10);
                setSleepMinutes(minutes);
                if (activeIds().size > 0) {
                  if (sleepTimer) clearTimeout(sleepTimer);
                  if (minutes > 0) sleepTimer = window.setTimeout(() => stopAmbient(), minutes * 60_000);
                }
              }}
              class="flex-1 rounded-xl border border-border bg-surface-3 px-3 py-2 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              aria-label="Sleep timer"
            >
              <option value="0">Off</option>
              <option value="5">5 minutes</option>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">60 minutes</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <For each={SOUNDS}>
            {(sound) => {
              const isActive = () => activeIds().has(sound.id);
              return (
                <button
                  onClick={() => toggleAmbient(sound.id)}
                  class={`relative flex flex-col items-center gap-3 rounded-2xl border p-5 transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    isActive() ? "border-primary bg-primary/10" : "border-border bg-surface-2 hover:bg-surface-3"
                  }`}
                  aria-label={isActive() ? `Remove ${sound.label} from mix` : `Add ${sound.label} to mix`}
                  aria-pressed={isActive() ? "true" : "false"}
                >
                  {isActive() && (
                    <span class="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                  )}
                  <span class={`h-10 w-10 ${sound.icon} ${isActive() ? "text-primary" : "text-text-secondary"}`} />
                  <span class="text-sm font-medium text-text">{sound.label}</span>
                  <span class={`flex h-10 w-10 items-center justify-center rounded-full transition ${isActive() ? "bg-primary text-white" : "bg-surface-3 text-text"}`}>
                    <span class={`h-5 w-5 ${isActive() ? "i-mdi-minus" : "i-mdi-plus"}`} />
                  </span>
                </button>
              );
            }}
          </For>
        </div>
        <p class="text-center text-xs text-text-secondary">Select multiple sounds to mix them together.</p>
      </div>
    </div>
  );
}

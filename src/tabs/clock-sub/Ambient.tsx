import { createSignal, For, Show } from "solid-js";
import { haptic } from "../../lib/capacitor";

type SoundId = "brown" | "pink" | "rain" | "cafe";

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

const BUFFER_DURATION = 25; // seconds per generated loop
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let activeSource: AudioBufferSourceNode | null = null;
let sleepTimer: number | null = null;
const buffers = new Map<SoundId, AudioBuffer>();
const [volume, setVolume] = createSignal(0.75);
const [activeId, setActiveId] = createSignal<SoundId | null>(null);
const [sleepMinutes, setSleepMinutes] = createSignal(0);

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
function fadeEnv(i: number, length: number, fade: number) {
  if (i < fade) return i / fade;
  if (i >= length - fade) return (length - 1 - i) / fade;
  return 1;
}
function makePink() {
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  return function () {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    const out = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;
    return out * 0.11;
  };
}
function generateBuffer(id: SoundId, ctx: AudioContext) {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * BUFFER_DURATION);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  const fade = Math.min(1024, Math.floor(length / 2));
  if (id === "pink") {
    const pink = makePink();
    for (let i = 0; i < length; i++) {
      const out = pink();
      data[i] = clamp(out * fadeEnv(i, length, fade), -1, 1);
    }
  } else if (id === "brown") {
    let brown = 0, dc = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      brown = 0.996 * brown + 0.004 * white;
      dc = 0.999 * dc + 0.001 * brown;
      const out = (brown - dc) * 4.5;
      data[i] = clamp(out * fadeEnv(i, length, fade), -1, 1);
    }
  } else if (id === "rain") {
    const pink = makePink();
    let rainInt = 0.6, drop = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      const p = pink();
      rainInt += (Math.random() * 2 - 1) * 0.0002;
      rainInt = clamp(rainInt, 0.4, 1.0);
      if (Math.random() < 0.0001) drop += 0.5 + Math.random() * 0.5;
      drop *= 0.998;
      let out = (p + white * 0.2) * (0.65 + 0.35 * rainInt) + drop * white * 0.3;
      out *= 0.4;
      data[i] = clamp(out * fadeEnv(i, length, fade), -1, 1);
    }
  } else {
    const pink = makePink();
    let cafe = 0, murmur = 0, t = 0;
    for (let i = 0; i < length; i++) {
      const p = pink();
      cafe = 0.7 * cafe + 0.3 * p;
      murmur = 0.7 * murmur + 0.3 * (Math.random() * 2 - 1);
      let amp = 0.5 + 0.2 * Math.sin(t) + 0.15 * Math.sin(t * 2.3) + 0.1 * Math.sin(t * 5.7) + 0.1 * murmur;
      amp = clamp(amp, 0.3, 1.0);
      t += 0.0004;
      const out = cafe * amp * 1.4;
      data[i] = clamp(out * fadeEnv(i, length, fade), -1, 1);
    }
  }
  return buffer;
}
function stopAmbient() {
  if (sleepTimer) {
    clearTimeout(sleepTimer);
    sleepTimer = null;
  }
  if (activeSource) {
    try { activeSource.stop(); } catch {}
    activeSource.disconnect();
    activeSource = null;
  }
  setActiveId(null);
  haptic("light");
}
async function playAmbient(id: SoundId) {
  if (activeId() === id) {
    stopAmbient();
    return;
  }
  stopAmbient();
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audioCtx = new Ctx();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = volume();
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }
  let buffer = buffers.get(id);
  if (!buffer || buffer.sampleRate !== audioCtx.sampleRate) {
    buffer = generateBuffer(id, audioCtx);
    buffers.set(id, buffer);
  }
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(masterGain!);
  source.start();
  source.onended = () => source.disconnect();
  activeSource = source;
  setActiveId(id);
  haptic("medium");
  if (sleepMinutes() > 0) {
    sleepTimer = window.setTimeout(() => stopAmbient(), sleepMinutes() * 60_000);
  }
}

export function AmbientTab() {
  return (
    <div class="tab-content relative h-full overflow-y-auto p-5 pb-28 md:pb-8">
      <div class="mx-auto max-w-4xl space-y-5">
        <Show when={activeId()}>
          <div class="flex items-center gap-2 text-sm font-medium text-primary">
            <span class="i-mdi-volume-high h-4 w-4 animate-pulse" />
            <span>Playing {SOUNDS.find((s) => s.id === activeId())?.label}</span>
          </div>
        </Show>
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
                if (activeId()) {
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
              const isActive = activeId() === sound.id;
              return (
                <button
                  onClick={() => playAmbient(sound.id)}
                  class={`relative flex flex-col items-center gap-3 rounded-2xl border p-5 transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    isActive ? "border-primary bg-primary/10" : "border-border bg-surface-2 hover:bg-surface-3"
                  }`}
                  aria-label={isActive ? `Pause ${sound.label}` : `Play ${sound.label}`}
                  aria-pressed={isActive ? "true" : "false"}
                >
                  {isActive && (
                    <span class="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                  )}
                  <span class={`h-10 w-10 ${sound.icon} ${isActive ? "text-primary" : "text-text-secondary"}`} />
                  <span class="text-sm font-medium text-text">{sound.label}</span>
                  <span class={`flex h-10 w-10 items-center justify-center rounded-full transition ${isActive ? "bg-primary text-white" : "bg-surface-3 text-text"}`}>
                    <span class={`h-5 w-5 ${isActive ? "i-mdi-pause" : "i-mdi-play"}`} />
                  </span>
                </button>
              );
            }}
          </For>
        </div>
      </div>
    </div>
  );
}

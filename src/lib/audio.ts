import { appStore } from "../store/app";

let audioCtx: AudioContext | null = null;

function ensureCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext; }).webkitAudioContext)();
  }
  return audioCtx;
}

export function playBeep(frequency = 880, duration = 0.12, type: OscillatorType = "sine") {
  const ctx = ensureCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);

  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export type SoundKind = "timer" | "alarm" | "pomodoro";

const BASE_FREQ: Record<SoundKind, number> = {
  timer: 660,
  alarm: 880,
  pomodoro: 784,
};

/** Play the user-selected alert sound for a given event kind. */
export function playFinishAlert(kind: SoundKind = "timer") {
  if (!appStore.globalSettings.sound) return;
  const theme = appStore.globalSettings.soundTheme;
  const base = BASE_FREQ[kind];

  switch (theme) {
    case "chime":
      playBeep(base, 0.35, "sine");
      setTimeout(() => playBeep(base * 2, 0.6, "triangle"), 180);
      break;
    case "digital":
      for (let i = 0; i < 3; i++) {
        setTimeout(() => playBeep(base * 1.25, 0.1, "square"), i * 110);
      }
      break;
    case "soft":
      playBeep(base / 2, 1.0, "sine");
      break;
    default:
      playBeep(base, 0.5, "sine");
  }
}

export function playAlarmPreview(url: string, loop = false): HTMLAudioElement {
  const audio = new Audio(url);
  audio.loop = loop;
  audio.volume = 0.85;
  audio.play().catch(() => null);
  return audio;
}

export function stopAudio(audio?: HTMLAudioElement | null) {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
}

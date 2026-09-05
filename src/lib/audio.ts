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


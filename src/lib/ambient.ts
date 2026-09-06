export type SoundId = "brown" | "pink" | "rain" | "cafe";

const BUFFER_DURATION = 25;

export function clamp(v: number, min: number, max: number) {
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

export function generateBuffer(id: SoundId, ctx: AudioContext) {
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

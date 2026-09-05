import { describe, expect, it, vi } from "vitest";
import { playBeep, stopAudio } from "../lib/audio";

class FakeAudioContext {
  currentTime = 0;
  state = "running";
  destination = {} as AudioDestinationNode;
  createOscillator() {
    return {
      type: "sine",
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn().mockReturnThis(),
      start: vi.fn(),
      stop: vi.fn(),
    } as unknown as OscillatorNode;
  }
  createGain() {
    return {
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn().mockReturnThis(),
    } as unknown as GainNode;
  }
  resume() {
    return Promise.resolve();
  }
}

describe("audio", () => {
  it("playBeep does not throw with a mocked AudioContext", () => {
    (window as any).AudioContext = FakeAudioContext;
    expect(() => playBeep(440, 0.1, "sine")).not.toThrow();
  });

  it("stopAudio is safe with a null element", () => {
    expect(() => stopAudio(null)).not.toThrow();
  });
});

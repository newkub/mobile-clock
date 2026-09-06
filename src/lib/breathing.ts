export type PhaseKind = "inhale" | "hold" | "exhale";

export interface BreathPhase { kind: PhaseKind; label: string; seconds: number }
export interface BreathPattern { id: string; name: string; tagline: string; icon: string; phases: BreathPhase[] }

export const PATTERNS: BreathPattern[] = [
  {
    id: "box", name: "Box", tagline: "4-4-4-4 · steady calm & focus", icon: "i-mdi-cube-outline",
    phases: [
      { kind: "inhale", label: "Inhale", seconds: 4 },
      { kind: "hold", label: "Hold", seconds: 4 },
      { kind: "exhale", label: "Exhale", seconds: 4 },
      { kind: "hold", label: "Hold", seconds: 4 },
    ],
  },
  {
    id: "478", name: "4-7-8", tagline: "4-7-8 · unwind & drift to sleep", icon: "i-mdi-sleep",
    phases: [
      { kind: "inhale", label: "Inhale", seconds: 4 },
      { kind: "hold", label: "Hold", seconds: 7 },
      { kind: "exhale", label: "Exhale", seconds: 8 },
    ],
  },
  {
    id: "coherent", name: "Coherent", tagline: "5-5 · heart-rate variability calm", icon: "i-mdi-heart-pulse",
    phases: [
      { kind: "inhale", label: "Inhale", seconds: 5 },
      { kind: "exhale", label: "Exhale", seconds: 5 },
    ],
  },
  {
    id: "deep", name: "Deep", tagline: "6-3-6-3 · deeper oxygen", icon: "i-mdi-lungs",
    phases: [
      { kind: "inhale", label: "Inhale", seconds: 6 },
      { kind: "hold", label: "Hold", seconds: 3 },
      { kind: "exhale", label: "Exhale", seconds: 6 },
      { kind: "hold", label: "Hold", seconds: 3 },
    ],
  },
];

export const PHASE_META: Record<PhaseKind, { icon: string; color: string; soft: string; scale: number | null }> = {
  inhale: { icon: "i-mdi-arrow-up-bold", color: "hsl(var(--color-primary))", soft: "hsl(var(--color-primary) / 0.22)", scale: 1.3 },
  hold: { icon: "i-mdi-pause", color: "hsl(var(--color-accent))", soft: "hsl(var(--color-accent) / 0.22)", scale: null },
  exhale: { icon: "i-mdi-arrow-down-bold", color: "hsl(var(--color-success))", soft: "hsl(var(--color-success) / 0.22)", scale: 0.8 },
};

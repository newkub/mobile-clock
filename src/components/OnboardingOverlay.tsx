import { createSignal } from "solid-js";
import { Button } from "./Button";
import { completeOnboarding } from "../store/actions";
import { haptic } from "../lib/capacitor";

const steps = [
  {
    icon: "i-mdi-clock-outline",
    title: "Welcome to Wrikka Clock",
    body: "A local-first clock, alarm, timer, stopwatch, pomodoro, and reminder app — all private on your device.",
  },
  {
    icon: "i-mdi-gesture-swipe",
    title: "Get around quickly",
    body: "On mobile, swipe left/right between tabs or use the bottom bar. On desktop, the nav lives at the top of the header.",
  },
  {
    icon: "i-mdi-keyboard-outline",
    title: "Keyboard shortcuts",
    body: "Use ←/→ to switch tabs. In Stopwatch, Timer, and Pomodoro: Space to start/pause, R to reset, and L to record a lap.",
  },
];

export function OnboardingOverlay() {
  const [step, setStep] = createSignal(0);

  function next() {
    haptic("light");
    if (step() < steps.length - 1) {
      setStep((s) => s + 1);
    } else {
      completeOnboarding();
    }
  }

  function skip() {
    haptic("light");
    completeOnboarding();
  }

  return (
    <div
      class="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-bg/95 p-6 text-center backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Wrikka Clock"
    >
      <div class="w-full max-w-sm rounded-3xl bg-surface p-6 shadow-2xl">
        <span class={`${steps[step()].icon} mx-auto block h-16 w-16 text-primary`} aria-hidden="true" />
        <h2 class="mt-4 text-2xl font-bold text-text">{steps[step()].title}</h2>
        <p class="mt-2 text-sm leading-relaxed text-text-secondary">{steps[step()].body}</p>

        <div class="mt-6 flex items-center justify-center gap-2">
          {steps.map((_, i) => (
            <span
              class={`h-2 w-2 rounded-full transition ${i === step() ? "bg-primary" : "bg-surface-3"}`}
              aria-hidden="true"
            />
          ))}
        </div>

        <div class="mt-6 flex gap-3">
          <Button onClick={skip} variant="ghost" class="flex-1" aria-label="Skip onboarding">
            Skip
          </Button>
          <Button onClick={next} class="flex-1" aria-label={step() === steps.length - 1 ? "Get started" : "Next tip"}>
            {step() === steps.length - 1 ? "Get started" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}

import { createSignal, onCleanup, onMount, Show } from "solid-js";
import { appStore, setStore, addReminder } from "../store/app";
import { Button } from "./Button";
import { haptic } from "../lib/capacitor";
import { playBeep } from "../lib/audio";
import { showStatus } from "../lib/status";

/**
 * Full-screen alert shown while an alarm/reminder is ringing (web/PWA).
 * Native builds rely on OS notifications instead.
 */
export function AlarmRingOverlay() {
  const [now, setNow] = createSignal(new Date());

  onMount(() => {
    haptic("heavy");
    const clock = setInterval(() => setNow(new Date()), 1000);

    // Repeat a short beep while the alert is ringing.
    let beep: ReturnType<typeof setInterval> | null = null;
    if (appStore.globalSettings.sound) {
      playBeep(880, 0.5, "sine");
      beep = setInterval(() => playBeep(880, 0.5, "sine"), 1500);
    }

    onCleanup(() => {
      clearInterval(clock);
      if (beep) clearInterval(beep);
    });
  });

  function dismiss() {
    haptic("medium");
    setStore("ringing", null);
  }

  function snooze() {
    const r = appStore.ringing;
    if (!r) return;
    const at = new Date(Date.now() + 5 * 60 * 1000);
    const pad = (n: number) => n.toString().padStart(2, "0");
    addReminder({
      id: `snz_${Date.now()}`,
      title: `Snoozed: ${r.title}`,
      date: `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`,
      time: `${pad(at.getHours())}:${pad(at.getMinutes())}`,
      repeat: "none",
      enabled: true,
      createdAt: Date.now(),
    });
    haptic("success");
    showStatus("Snoozed for 5 minutes", "info");
    setStore("ringing", null);
  }

  const isAlarm = () => appStore.ringing?.kind === "alarm";

  return (
    <Show when={appStore.ringing}>
      {(r) => (
        <div
          class="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-bg/95 p-6 backdrop-blur-md"
          role="alertdialog"
          aria-modal="true"
          aria-label={r().title}
        >
          <div class="animate-pulse rounded-full bg-primary/15 p-10">
            <span
              class={`${isAlarm() ? "i-mdi-alarm" : "i-mdi-bell-ring"} h-20 w-20 text-primary`}
              aria-hidden="true"
            />
          </div>

          <div class="text-center">
            <p class="text-6xl font-bold tabular-nums text-glow">
              {now().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
            </p>
            <p class="mt-3 text-2xl font-semibold text-text">{r().title}</p>
            <p class="mt-1 text-sm text-text-secondary">
              {isAlarm() ? "Alarm is ringing" : "Reminder"}
            </p>
          </div>

          <div class="flex w-full max-w-xs flex-col gap-3">
            <Show when={isAlarm()}>
              <Button onClick={snooze} variant="secondary" size="lg" aria-label="Snooze for 5 minutes">
                <span class="i-mdi-snooze mr-2 h-5 w-5" /> Snooze 5 min
              </Button>
            </Show>
            <Button onClick={dismiss} size="lg" aria-label="Dismiss alert">
              <span class="i-mdi-check mr-2 h-5 w-5" /> Dismiss
            </Button>
          </div>
        </div>
      )}
    </Show>
  );
}

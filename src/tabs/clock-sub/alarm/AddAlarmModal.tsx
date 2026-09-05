import { createSignal, For } from "solid-js";
import { addAlarm, type Alarm, type Day } from "../../../store/app";
import { Button } from "../../../components/Button";
import { Input } from "../../../components/Input";
import { TimePicker } from "../../../components/TimePicker";
import { DAYS, DAY_LABELS } from "./constants";

export function AddAlarmModal(props: { onClose: () => void }) {
  const [hour, setHour] = createSignal(7);
  const [minute, setMinute] = createSignal(30);
  const [label, setLabel] = createSignal("");
  const [repeat, setRepeat] = createSignal<Day[]>(["MO", "TU", "WE", "TH", "FR"]);
  const [sound, setSound] = createSignal<Alarm["sound"]>("beep");

  function save() {
    addAlarm({
      id: `a_${Date.now()}`,
      hour: hour(),
      minute: minute(),
      label: label() || "Alarm",
      enabled: true,
      repeat: repeat(),
      sound: sound(),
    });
    props.onClose();
  }

  function toggleDay(d: Day) {
    setRepeat((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  return (
    <div class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4">
      <div class="w-full max-w-md rounded-3xl bg-surface p-6">
        <h2 class="mb-4 text-xl font-bold">New Alarm</h2>
        <TimePicker hour={hour()} minute={minute()} onChange={(h, m) => { setHour(h); setMinute(m); }} />
        <div class="mt-4">
          <Input value={label()} onChange={setLabel} placeholder="Label" />
        </div>
        <div class="mt-4">
          <label class="mb-2 block text-sm text-text-secondary">Repeat</label>
          <div class="flex gap-2">
            <For each={DAYS}>
              {(d: Day) => (
                <button
                    onClick={() => toggleDay(d)}
                    class={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                      repeat().includes(d) ? "bg-primary text-white" : "bg-surface-3 text-text-secondary"
                    }`}
                    aria-label={`Toggle ${d}`}
                  >
                    {DAY_LABELS[d]}
                  </button>
              )}
            </For>
          </div>
        </div>
        <div class="mt-4">
          <label class="mb-2 block text-sm text-text-secondary">Sound</label>
          <div class="flex gap-2">
            <For each={["beep", "bell", "ai"] as const}>
              {(s) => (
                <button
                    onClick={() => setSound(s)}
                    class={`flex flex-1 items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-medium capitalize transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                      sound() === s
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-surface-3 text-text-secondary"
                    }`}
                    aria-label={`Select ${s} sound`}
                  >
                    <span class="i-mdi-music h-4 w-4" /> {s}
                  </button>
              )}
            </For>
          </div>
        </div>
        <div class="mt-6 flex gap-3">
          <Button onClick={props.onClose} variant="secondary" class="flex-1" aria-label="Cancel adding alarm">Cancel</Button>
          <Button onClick={save} class="flex-1" aria-label="Save alarm">Save</Button>
        </div>
      </div>
    </div>
  );
}

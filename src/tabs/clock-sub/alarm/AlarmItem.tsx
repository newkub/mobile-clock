import { createSignal, For, Show } from "solid-js";
import { updateAlarm, removeAlarm, toggleAlarm, type Alarm, type Day } from "../../../store/app";
import { Input } from "../../../components/Input";
import { Switch } from "../../../components/Switch";
import { Button } from "../../../components/Button";
import { haptic } from "../../../lib/capacitor";
import { scheduleAlarm, cancelAlarm } from "../../../lib/notifications";
import { hashId } from "../../../lib/hash";
import { DAYS, DAY_LABELS } from "./constants";
import { AiSoundEditor } from "./AiSoundEditor";

export function AlarmItem(props: { alarm: Alarm }) {
  const [expanded, setExpanded] = createSignal(false);

  async function handleToggle(enabled: boolean) {
    toggleAlarm(props.alarm.id);
    if (enabled) {
      await haptic("success");
      const next = new Date();
      next.setHours(props.alarm.hour, props.alarm.minute, 0, 0);
      if (next < new Date()) next.setDate(next.getDate() + 1);
      await scheduleAlarm({
        id: hashId(props.alarm.id),
        title: props.alarm.label || "Alarm",
        body: "Time to wake up!",
        schedule: { at: next },
      });
    } else {
      await haptic("light");
      await cancelAlarm(hashId(props.alarm.id));
    }
  }

  return (
    <div class="rounded-3xl bg-surface-2 p-4 transition">
      <div class="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded())}
          class="flex flex-1 items-center gap-4 text-left transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-label={expanded() ? "Collapse alarm" : "Expand alarm"}
        >
          <div>
            <p class="text-3xl font-bold tabular-nums">
              {props.alarm.hour.toString().padStart(2, "0")}:{props.alarm.minute.toString().padStart(2, "0")}
            </p>
            <p class="text-sm text-text-secondary">{props.alarm.label || "Alarm"}</p>
          </div>
          {expanded() ? (
            <span class="i-mdi-chevron-up ml-auto h-5 w-5 text-text-secondary" />
          ) : (
            <span class="i-mdi-chevron-down ml-auto h-5 w-5 text-text-secondary" />
          )}
        </button>
        <Switch checked={props.alarm.enabled} onChange={(v) => handleToggle(v)} aria-label={`Toggle ${props.alarm.label || "alarm"}`} />
      </div>
      <div class="mt-3 flex gap-1">
        <For each={DAYS}>
          {(d: Day) => (
            <span
              class={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                props.alarm.repeat.includes(d)
                  ? "bg-primary text-white"
                  : "bg-surface-3 text-text-secondary"
              }`}
            >
              {DAY_LABELS[d]}
            </span>
          )}
        </For>
      </div>
      <Show when={expanded()}>
        <div class="mt-4 space-y-3 border-t border-border pt-4">
          <Input
            label="Label"
            value={props.alarm.label}
            onChange={(v) => updateAlarm(props.alarm.id, { label: v })}
          />
          <div>
            <label class="mb-2 block text-sm text-text-secondary">Sound</label>
            <div class="flex gap-2">
              <For each={["beep", "bell", "ai"] as const}>
                {(s) => (
                  <button
                    onClick={() => updateAlarm(props.alarm.id, { sound: s })}
                    class={`flex flex-1 items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-medium capitalize transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                      props.alarm.sound === s
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-surface-3 text-text-secondary"
                    }`}
                    aria-label={`Select ${s} sound`}
                  >
                    <span class="i-mdi-music h-4 w-4" />
                    {s}
                  </button>
                )}
              </For>
            </div>
          </div>
          <Show when={props.alarm.sound === "ai"}>
            <AiSoundEditor alarm={props.alarm} />
          </Show>
          <Button onClick={() => removeAlarm(props.alarm.id)} variant="danger" class="w-full" aria-label={`Delete ${props.alarm.label || "alarm"}`}>
            <span class="i-mdi-delete mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </Show>
    </div>
  );
}

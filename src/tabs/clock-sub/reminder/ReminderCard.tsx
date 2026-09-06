import { createSignal, For, Show } from "solid-js";
import { Button } from "../../../components/Button";
import { Switch } from "../../../components/Switch";
import { type Reminder } from "../../../store/app";
import { repeatLabels } from "./repeatLabels";
import { formatShortTime } from "../../../lib/time";

export function ReminderCard(props: {
  reminder: Reminder;
  onToggle: () => void;
  onRemove: () => void;
  onUpdate: (patch: Partial<Reminder>) => void;
}) {
  const [expanded, setExpanded] = createSignal(false);

  return (
    <div class={`rounded-3xl border bg-surface-2 p-4 transition ${props.reminder.enabled ? "border-primary/30" : "border-border"}`}>
      <div class="flex items-center gap-3">
        <div class={`rounded-2xl p-3 ${props.reminder.enabled ? "bg-primary/10 text-primary" : "bg-surface-3 text-text-secondary"}`}>
          <span class="i-mdi-bell h-6 w-6" />
        </div>
        <button
          onClick={() => setExpanded(!expanded())}
          class="flex-1 text-left transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-label={expanded() ? "Collapse reminder" : "Expand reminder"}
        >
          <p class="font-semibold text-text">{props.reminder.title}</p>
          <p class="text-sm text-text-secondary">
            {(() => {
              const d = new Date(`${props.reminder.date}T${props.reminder.time}`);
              return `${d.toLocaleDateString(undefined, { day: "numeric", month: "short" })} ${formatShortTime(d)}`;
            })()}{" "}
            · {repeatLabels[props.reminder.repeat]}
          </p>
        </button>
        <Switch
          checked={props.reminder.enabled}
          onChange={() => props.onToggle()}
          aria-label={`Toggle ${props.reminder.title || "reminder"}`}
        />
      </div>

      <Show when={expanded()}>
        <div class="mt-4 space-y-3 border-t border-border pt-4">
          <div class="flex gap-2">
            <div class="flex-1">
              <label class="mb-1 flex items-center gap-1 text-xs text-text-secondary">
                <span class="i-mdi-calendar h-3 w-3" /> Date
              </label>
              <input
                type="date"
                value={props.reminder.date}
                onInput={(e) => props.onUpdate({ date: e.currentTarget.value })}
                class="w-full rounded-xl border border-border bg-surface-3 px-3 py-2 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                aria-label="Reminder date"
              />
            </div>
            <div class="flex-1">
              <label class="mb-1 flex items-center gap-1 text-xs text-text-secondary">
                <span class="i-mdi-clock h-3 w-3" /> Time
              </label>
              <input
                type="time"
                value={props.reminder.time}
                onInput={(e) => props.onUpdate({ time: e.currentTarget.value })}
                class="w-full rounded-xl border border-border bg-surface-3 px-3 py-2 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                aria-label="Reminder time"
              />
            </div>
          </div>

          <div>
            <label class="mb-1 flex items-center gap-1 text-xs text-text-secondary">
              <span class="i-mdi-repeat h-3 w-3" /> Repeat
            </label>
            <div class="flex gap-2">
              <For each={["none", "daily", "weekly", "monthly"] as const}>
                {(r) => (
                  <button
                    onClick={() => props.onUpdate({ repeat: r })}
                    class={`flex-1 rounded-xl py-2 text-xs font-medium capitalize transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                      props.reminder.repeat === r
                        ? "bg-primary text-white"
                        : "bg-surface-3 text-text-secondary"
                    }`}
                    aria-label={`Repeat ${r}`}
                  >
                    {r}
                  </button>
                )}
              </For>
            </div>
          </div>

          <Button onClick={props.onRemove} variant="danger" class="w-full" aria-label={`Delete ${props.reminder.title || "reminder"}`}>
            <span class="i-mdi-delete mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </Show>
    </div>
  );
}

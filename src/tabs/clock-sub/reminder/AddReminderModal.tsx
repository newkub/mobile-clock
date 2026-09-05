import { createSignal, For } from "solid-js";
import { Button } from "../../../components/Button";
import { Input } from "../../../components/Input";
import { type Reminder } from "../../../store/app";

export function AddReminderModal(props: { onClose: () => void; onAdd: (r: Reminder) => void }) {
  const [title, setTitle] = createSignal("");
  const initialDate = (() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  })();
  const [date, setDate] = createSignal(initialDate);
  const [time, setTime] = createSignal("09:00");
  const [repeat, setRepeat] = createSignal<Reminder["repeat"]>("none");

  function save() {
    props.onAdd({
      id: `r_${Date.now()}`,
      title: title() || "Reminder",
      date: date(),
      time: time(),
      repeat: repeat(),
      enabled: true,
      createdAt: Date.now(),
    });
    props.onClose();
  }

  return (
    <div class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4">
      <div class="w-full max-w-md rounded-3xl bg-surface p-6">
        <h2 class="mb-4 flex items-center gap-2 text-xl font-bold">
          <span class="i-mdi-bell h-6 w-6 text-primary" /> New Reminder
        </h2>
        <Input value={title()} onChange={setTitle} placeholder="What to remember?" class="mb-3" />
        <div class="mb-3 flex gap-2">
          <Input type="date" value={date()} onChange={setDate} aria-label="Date" />
          <Input type="time" value={time()} onChange={setTime} aria-label="Time" />
        </div>
        <div class="mb-5">
          <label class="mb-2 block text-sm text-text-secondary">Repeat</label>
          <div class="flex gap-2">
            <For each={["none", "daily", "weekly", "monthly"] as const}>
              {(r) => (
                <button
                  onClick={() => setRepeat(r)}
                  class={`flex-1 rounded-xl py-2 text-xs font-medium capitalize transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    repeat() === r ? "bg-primary text-white" : "bg-surface-3 text-text-secondary"
                  }`}
                  aria-label={`Repeat ${r}`}
                >
                  {r}
                </button>
              )}
            </For>
          </div>
        </div>
        <div class="flex gap-3">
          <Button onClick={props.onClose} variant="secondary" class="flex-1" aria-label="Cancel">Cancel</Button>
          <Button onClick={save} class="flex-1" aria-label="Save reminder">Save</Button>
        </div>
      </div>
    </div>
  );
}

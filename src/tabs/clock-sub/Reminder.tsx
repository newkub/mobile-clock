import { createSignal, createMemo, For, onMount, Show } from "solid-js";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import {
  appStore,
  addReminder,
  removeReminder,
  updateReminder,
  toggleReminder,
  type Reminder,
} from "../../store/app";
import { scheduleAlarm, cancelAlarm, requestNotificationPermission } from "../../lib/notifications";
import { haptic } from "../../lib/capacitor";
import { showStatus } from "../../lib/status";
import { hashId } from "../../lib/hash";
import { ReminderCard } from "./reminder/ReminderCard";
import { AddReminderModal } from "./reminder/AddReminderModal";

export function ReminderTab() {
  const [isAdding, setIsAdding] = createSignal(false);
  const [now, setNow] = createSignal(new Date());

  onMount(() => {
    requestNotificationPermission();

    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  });

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const title = params.get("title");
    const date = params.get("date");
    const time = params.get("time");
    if (title && date && time) {
      addReminder({
        id: `r_${Date.now()}`,
        title,
        date,
        time,
        repeat: "none",
        enabled: true,
        createdAt: Date.now(),
      });
      window.history.replaceState({}, "", window.location.pathname);
      haptic("success");
    }
  });

  const sorted = createMemo(() =>
    [...appStore.reminders].sort(
      (a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()
    )
  );
  const future = createMemo(() =>
    sorted().filter((r) => new Date(`${r.date}T${r.time}`) >= now())
  );
  const past = createMemo(() =>
    sorted().filter((r) => new Date(`${r.date}T${r.time}`) < now())
  );

  async function handleToggle(r: Reminder) {
    const enabled = !r.enabled;
    toggleReminder(r.id);
    if (enabled) {
      const at = new Date(`${r.date}T${r.time}`);
      await scheduleAlarm({
        id: hashId(r.id),
        title: r.title,
        body: "Reminder",
        schedule: { at },
      });
      haptic("success");
    } else {
      await cancelAlarm(hashId(r.id));
      haptic("light");
    }
  }

  function handleRemove(r: Reminder) {
    removeReminder(r.id);
    haptic("light");
    showStatus("Reminder removed", "info");
  }

  return (
    <div class="tab-content flex h-full flex-col gap-4 overflow-y-auto p-5 pb-28">
      <div class="rounded-2xl border border-dashed border-border bg-surface-2/50 p-4">
        <h3 class="text-sm font-semibold text-text-secondary">Add from notification panel</h3>
        <p class="mt-1 text-xs text-muted">
          Share to app with <code>?title=&amp;date=&amp;time=</code> query
        </p>
      </div>

      <Show when={future().length === 0}>
        <EmptyState
          icon="i-mdi-bell"
          title="No upcoming reminders"
          subtitle="Add a reminder to get started"
        />
      </Show>

      <For each={future()}>
        {(r) => (
          <ReminderCard
            reminder={r}
            onToggle={() => handleToggle(r)}
            onRemove={() => handleRemove(r)}
            onUpdate={(patch) => updateReminder(r.id, patch)}
          />
        )}
      </For>

      <Show when={past().length > 0}>
        <h3 class="text-sm font-semibold text-text-secondary">Past</h3>
        <For each={past()}>
          {(r) => (
            <ReminderCard
              reminder={r}
              onToggle={() => handleToggle(r)}
              onRemove={() => handleRemove(r)}
              onUpdate={(patch) => updateReminder(r.id, patch)}
            />
          )}
        </For>
      </Show>

      <Button onClick={() => setIsAdding(true)} class="mt-2 w-full" size="lg" aria-label="New reminder">
        <span class="i-mdi-plus mr-2 h-5 w-5" /> New Reminder
      </Button>

      <Show when={isAdding()}>
        <AddReminderModal
          onClose={() => setIsAdding(false)}
          onAdd={(r) => {
            addReminder(r);
            if (r.enabled) {
              const at = new Date(`${r.date}T${r.time}`);
              scheduleAlarm({ id: hashId(r.id), title: r.title, body: "Reminder", schedule: { at } });
            }
            haptic("success");
          }}
        />
      </Show>
    </div>
  );
}

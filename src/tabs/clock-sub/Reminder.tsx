import { createSignal, createMemo, For, onMount, Show } from "solid-js";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
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
import { repeatLabels } from "./reminder/repeatLabels";

export function ReminderTab() {
  const [isAdding, setIsAdding] = createSignal(false);
  const [search, setSearch] = createSignal("");
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

  const filtered = (list: Reminder[]) => {
    const q = search().trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => {
      const text = `${r.title} ${r.date} ${r.time} ${repeatLabels[r.repeat]}`.toLowerCase();
      return text.includes(q);
    });
  };
  const futureFiltered = createMemo(() => filtered(future()));
  const pastFiltered = createMemo(() => filtered(past()));

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

  function clearPast() {
    if (!window.confirm(`Clear ${past().length} past reminder${past().length > 1 ? "s" : ""}?`)) return;
    for (const r of pastFiltered()) removeReminder(r.id);
    haptic("success");
    showStatus("Past reminders cleared", "info");
  }

  return (
    <div class="tab-content h-full overflow-y-auto p-5 pb-28 md:pb-8">
      <div class="mx-auto flex max-w-3xl flex-col gap-4">
        <Show when={appStore.reminders.length > 0}>
          <Input
            value={search()}
            onChange={setSearch}
            placeholder="Search reminders..."
            class="w-full"
            aria-label="Search reminders"
          />
        </Show>

        <Show when={future().length === 0 && !search()}>
          <EmptyState
            icon="i-mdi-bell"
            title="No upcoming reminders"
            subtitle="Add a reminder to get started"
          />
        </Show>

        <Show when={search() && futureFiltered().length === 0 && pastFiltered().length === 0}>
          <p class="text-center text-sm text-text-secondary">No reminders match your search</p>
        </Show>

        <div class="grid gap-4 md:grid-cols-2">
          <For each={futureFiltered()}>
            {(r) => (
              <ReminderCard
                reminder={r}
                onToggle={() => handleToggle(r)}
                onRemove={() => handleRemove(r)}
                onUpdate={(patch) => updateReminder(r.id, patch)}
              />
            )}
          </For>
        </div>

        <Show when={past().length > 0}>
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-text-secondary">Past</h3>
            <button
              onClick={clearPast}
              class="flex items-center gap-1 text-xs font-medium text-danger transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-danger/50"
              aria-label="Clear past reminders"
            >
              <span class="i-mdi-delete-sweep h-4 w-4" /> Clear past
            </button>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <For each={pastFiltered()}>
              {(r) => (
                <ReminderCard
                  reminder={r}
                  onToggle={() => handleToggle(r)}
                  onRemove={() => handleRemove(r)}
                  onUpdate={(patch) => updateReminder(r.id, patch)}
                />
              )}
            </For>
          </div>
        </Show>

        <Button onClick={() => setIsAdding(true)} class="mt-2 w-full" size="lg" aria-label="New reminder">
          <span class="i-mdi-plus mr-2 h-5 w-5" /> New Reminder
        </Button>
      </div>

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

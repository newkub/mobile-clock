import { createSignal, For, Show } from "solid-js";
import { appStore } from "../../store/app";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { CurrentAlarmCard } from "./alarm/CurrentAlarmCard";
import { AlarmItem } from "./alarm/AlarmItem";
import { AddAlarmModal } from "./alarm/AddAlarmModal";

export function AlarmTab() {
  const [isAdding, setIsAdding] = createSignal(false);

  return (
    <div class="tab-content flex h-full flex-col gap-4 overflow-y-auto p-5 pb-24">
      <CurrentAlarmCard />
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-text">My Alarms</h2>
        <span class="text-sm text-text-secondary">{appStore.alarms.filter((a) => a.enabled).length} on</span>
      </div>
      <Show when={appStore.alarms.length === 0 && !isAdding()}>
        <EmptyState
          icon="i-mdi-alarm"
          title="No alarms yet"
          subtitle="Tap New Alarm to add one"
        />
      </Show>
      <For each={appStore.alarms}>
        {(alarm) => <AlarmItem alarm={alarm} />}
      </For>
      <Button onClick={() => setIsAdding(true)} class="mt-2 w-full" size="lg" aria-label="New alarm">
        <span class="i-mdi-plus mr-2 h-5 w-5" /> New Alarm
      </Button>
      <Show when={isAdding()}>
        <AddAlarmModal onClose={() => setIsAdding(false)} />
      </Show>
    </div>
  );
}

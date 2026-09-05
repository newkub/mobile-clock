import { createSignal, createMemo, For, Show } from "solid-js";
import { appStore } from "../../store/app";
import { Button } from "../../components/Button";
import { CurrentAlarmCard } from "./alarm/CurrentAlarmCard";
import { AlarmItem } from "./alarm/AlarmItem";
import { AddAlarmModal } from "./alarm/AddAlarmModal";

export function AlarmTab() {
  const [isAdding, setIsAdding] = createSignal(false);
  const sorted = createMemo(() =>
    [...appStore.alarms].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute))
  );

  return (
    <div class="tab-content h-full overflow-y-auto p-5 pb-24 md:pb-8">
      <div class="mx-auto flex max-w-3xl flex-col gap-4">
        <CurrentAlarmCard />
        <Show when={appStore.alarms.length > 0}>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-text">My Alarms</h2>
            <span class="text-sm text-text-secondary">{appStore.alarms.filter((a) => a.enabled).length} on</span>
          </div>
        </Show>
        <div class="grid gap-4 md:grid-cols-2">
          <For each={sorted()}>
            {(alarm) => <AlarmItem alarm={alarm} />}
          </For>
        </div>
        <Button onClick={() => setIsAdding(true)} class="mt-2 w-full" size="lg" aria-label="New alarm">
          <span class="i-mdi-plus mr-2 h-5 w-5" /> New Alarm
        </Button>
      </div>
      <Show when={isAdding()}>
        <AddAlarmModal onClose={() => setIsAdding(false)} />
      </Show>
    </div>
  );
}

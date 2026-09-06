import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { AppRouter } from "../orpc";
import { appStore, setStore } from "../store/app";
import { produce } from "solid-js/store";
import { createSignal } from "solid-js";

const link = new RPCLink({ url: "/rpc" });
const orpc = createORPCClient<RouterClient<AppRouter>>(link);

const SYNC_KEY = "state";
const SYNC_KEYS = [
  "alarms",
  "reminders",
  "timerPresets",
  "pomodoroSessions",
  "worldClocks",
  "focusTasks",
  "habits",
  "habitCompletions",
  "notes",
  "sleepSessions",
  "timeEntries",
  "goals",
  "elevenLabsKey",
  "globalSettings",
  "tabOrder",
  "hiddenTabs",
  "hasCompletedOnboarding",
] as const;

export { SYNC_KEYS };

const [syncing, setSyncing] = createSignal(false);
const [lastSyncedAt, setLastSyncedAt] = createSignal<number | null>(null);
const [syncFailed, setSyncFailed] = createSignal(false);
export { syncing, lastSyncedAt, syncFailed };

let ready = false;
let pushing = false;
let pushTimer: number | null = null;

export function markReady() {
  ready = true;
}

export function schedulePush() {
  if (!ready) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => void pushState(), 800);
}

export async function pushState() {
  if (!ready || pushing) return;
  pushing = true;
  try {
    const data: Record<string, unknown> = {};
    for (const key of SYNC_KEYS) {
      data[key] = appStore[key];
    }
    await orpc.sync.set({ key: SYNC_KEY, value: JSON.stringify(data) });
    setLastSyncedAt(Date.now());
    setSyncFailed(false);
  } catch {
    setSyncFailed(true);
    // offline or server unreachable — ignore
  } finally {
    pushing = false;
  }
}

/** Manual sync: pull remote state into local, then push the merged result back. */
export async function syncNow() {
  setSyncing(true);
  try {
    await pullState();
    await pushState();
  } finally {
    setSyncing(false);
  }
}

export async function pullState() {
  try {
    const res = await orpc.sync.get({ key: SYNC_KEY });
    if (res?.value) {
      const data = JSON.parse(res.value) as Record<string, unknown>;
      setStore(
        produce((s) => {
          for (const key of SYNC_KEYS) {
            const v = data[key];
            if (v !== undefined) {
              (s as unknown as Record<string, unknown>)[key] = v;
            }
          }
        }),
      );
      setLastSyncedAt(Date.now());
      setSyncFailed(false);
    }
  } catch {
    setSyncFailed(true);
    // ignore
  } finally {
    ready = true;
  }
}

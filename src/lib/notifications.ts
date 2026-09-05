import { LocalNotifications } from "@capacitor/local-notifications";
import { isNative } from "./capacitor";

export interface AlarmNotification {
  id: number;
  title: string;
  body: string;
  schedule: {
    at?: Date;
    every?: "day" | "week" | "month" | "year" | { hour: number; minute: number; };
  };
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (isNative()) {
    const { display } = await LocalNotifications.requestPermissions();
    return display === "granted";
  }
  if ("Notification" in window) {
    const result = await Notification.requestPermission();
    return result === "granted";
  }
  return false;
}

export async function checkPermission(): Promise<boolean> {
  if (isNative()) {
    const { display } = await LocalNotifications.checkPermissions();
    return display === "granted";
  }
  if ("Notification" in window) {
    return Notification.permission === "granted";
  }
  return false;
}

export async function showLocalNotification(title: string, body: string) {
  if (isNative()) {
    await LocalNotifications.schedule({
      notifications: [{ id: Date.now(), title, body, schedule: { at: new Date() } }],
    });
    return;
  }
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      // Prefer service worker controlled notification
      const registration = await navigator.serviceWorker?.ready;
      if (registration) {
        await registration.showNotification(title, { body, icon: "/logo.svg" });
      } else {
        new Notification(title, { body, icon: "/logo.svg" });
      }
    } catch {
      // ignore
    }
  }
}

export async function scheduleAlarm(alarm: AlarmNotification) {
  if (isNative()) {
    const every = typeof alarm.schedule.every === "string" ? alarm.schedule.every : undefined;
    await LocalNotifications.schedule({
      notifications: [
        {
          id: alarm.id,
          title: alarm.title,
          body: alarm.body,
          schedule: alarm.schedule.at
            ? { at: alarm.schedule.at, allowWhileIdle: true, every }
            : undefined,
          extra: { type: "alarm" },
        },
      ],
    });
    return;
  }
  // Web: the alarm watcher (started by a createEffect in App.tsx) handles firing
  // via interval. We persist the intent in the alarm object itself; the watcher
  // reads alarms from the store.
}

export async function cancelAlarm(id: number) {
  if (isNative()) {
    await LocalNotifications.cancel({ notifications: [{ id }] });
  }
}

export async function scheduleReminder(alarm: AlarmNotification) {
  await scheduleAlarm(alarm);
  return alarm.id;
}

export async function cancelNotification(id: number) {
  await cancelAlarm(id);
}

export async function getPendingAlarms(): Promise<{ id: number; schedule?: Date; }[]> {
  if (isNative()) {
    const { notifications } = await LocalNotifications.getPending();
    return notifications.map((n) => ({
      id: n.id,
      schedule: n.schedule?.at ? new Date(n.schedule.at) : undefined,
    }));
  }
  return [];
}

// Web-only: check every second and trigger a notification for matching alarms/reminders.
// Returns a stop function so callers can re-arm the watcher when the
// alarms/reminders change (e.g. from a createEffect in App.tsx).
export function startAlarmWatcher(
  alarms: { id: string; hour: number; minute: number; enabled: boolean; label: string; }[],
  reminders: { id: string; date: string; time: string; enabled: boolean; title: string; }[]
): () => void {
  if (isNative()) return () => {};
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return () => {};
  }

  let lastFired = new Date();

  const interval = setInterval(async () => {
    const now = new Date();
    const current = {
      hour: now.getHours(),
      minute: now.getMinutes(),
      date: now.toISOString().split("T")[0],
      time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    };

    for (const a of alarms) {
      if (!a.enabled) continue;
      if (a.hour === current.hour && a.minute === current.minute && now.getSeconds() < 2) {
        if (now.getTime() - lastFired.getTime() > 50_000) {
          await showLocalNotification(`Alarm: ${a.label || "Alarm"}`, "Your alarm is ringing");
        }
      }
    }

    for (const r of reminders) {
      if (!r.enabled) continue;
      if (r.date === current.date && r.time === current.time && now.getSeconds() < 2) {
        if (now.getTime() - lastFired.getTime() > 50_000) {
          await showLocalNotification(`Reminder: ${r.title}`, "You have a reminder now");
        }
      }
    }

    if (now.getSeconds() < 2) {
      lastFired = now;
    }
  }, 1000);

  return () => clearInterval(interval);
}

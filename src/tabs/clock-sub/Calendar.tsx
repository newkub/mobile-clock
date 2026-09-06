import { For, Show, createMemo, createSignal } from "solid-js";
import { appStore } from "../../store/app";

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getMonthDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: { date: string; day: number; inMonth: boolean }[] = [];
  // Pad leading days
  const startDay = first.getDay();
  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: iso(d), day: d.getDate(), inMonth: false });
  }
  // Month days
  for (let d = 1; d <= last.getDate(); d++) {
    days.push({ date: iso(new Date(year, month, d)), day: d, inMonth: true });
  }
  // Pad trailing days to fill 6 rows (42 cells)
  while (days.length < 42) {
    const d = new Date(year, month + 1, days.length - (startDay + last.getDate()) + 1);
    days.push({ date: iso(d), day: d.getDate(), inMonth: false });
  }
  return days;
}

export function CalendarTab() {
  const today = new Date();
  const [currentYear, setCurrentYear] = createSignal(today.getFullYear());
  const [currentMonth, setCurrentMonth] = createSignal(today.getMonth());

  const monthName = createMemo(() =>
    new Date(currentYear(), currentMonth(), 1).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    }),
  );

  const days = createMemo(() => getMonthDays(currentYear(), currentMonth()));
  const todayStr = createMemo(() => iso(today));

  const activityDates = createMemo(() => {
    const set = new Set<string>();
    for (const c of appStore.habitCompletions) set.add(c.date);
    for (const t of appStore.focusTasks) if (t.completedAt) set.add(iso(new Date(t.completedAt)));
    for (const n of appStore.notes) set.add(iso(new Date(n.createdAt)));
    for (const s of appStore.sleepSessions) set.add(iso(new Date(s.start)));
    return set;
  });

  function prevMonth() {
    if (currentMonth() === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear() - 1);
    } else {
      setCurrentMonth(currentMonth() - 1);
    }
  }

  function nextMonth() {
    if (currentMonth() === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear() + 1);
    } else {
      setCurrentMonth(currentMonth() + 1);
    }
  }

  return (
    <div class="tab-content h-full overflow-y-auto p-5 pb-28 md:pb-8">
      <div class="mx-auto max-w-4xl space-y-5">
        <h2 class="flex items-center gap-2 text-2xl font-bold text-text">
          <span class="i-mdi-calendar h-6 w-6 text-primary" /> Calendar
        </h2>

        <div class="glass rounded-3xl p-4">
          <div class="mb-4 flex items-center justify-between">
            <button
              onClick={prevMonth}
              class="rounded-xl p-2 text-text-secondary transition hover:bg-surface-2 hover:text-text"
              aria-label="Previous month"
            >
              <span class="i-mdi-chevron-left h-5 w-5" />
            </button>
            <h3 class="text-lg font-bold text-text">{monthName()}</h3>
            <button
              onClick={nextMonth}
              class="rounded-xl p-2 text-text-secondary transition hover:bg-surface-2 hover:text-text"
              aria-label="Next month"
            >
              <span class="i-mdi-chevron-right h-5 w-5" />
            </button>
          </div>

          <div class="grid grid-cols-7 gap-1">
            <For each={WEEKDAYS}>
              {(d) => (
                <div class="py-2 text-center text-xs font-semibold text-text-secondary">{d}</div>
              )}
            </For>
            <For each={days()}>
              {(d) => {
                const active = activityDates().has(d.date);
                const isToday = d.date === todayStr();
                return (
                  <div
                    class={`flex flex-col items-center justify-center rounded-xl py-2 text-sm transition ${
                      isToday
                        ? "bg-primary text-white font-bold"
                        : d.inMonth
                          ? "text-text"
                          : "text-text-secondary/40"
                    }`}
                  >
                    <span>{d.day}</span>
                    <Show when={active && !isToday}>
                      <span class="mt-1 h-1.5 w-1.5 rounded-full bg-success" />
                    </Show>
                  </div>
                );
              }}
            </For>
          </div>
        </div>

        <div class="rounded-2xl bg-surface-2 p-4 text-sm text-text-secondary">
          <p class="flex items-center gap-2">
            <span class="h-2 w-2 rounded-full bg-success" /> Activity day (habit, task, note, or sleep)
          </p>
        </div>
      </div>
    </div>
  );
}

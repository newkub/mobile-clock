import { createMemo, createSignal } from "solid-js";
import { Modal } from "./Modal";
import { Input } from "./Input";
import { Button } from "./Button";
import { addWorldClock } from "../store/actions";
import { haptic } from "../lib/capacitor";

const COMMON_ZONES = [
  "UTC",
  "Asia/Bangkok",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Dubai",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

const ALL_ZONES = (() => {
  try {
    // @ts-ignore -- supportedValuesOf is available in modern browsers
    return Intl.supportedValuesOf("timeZone") as string[];
  } catch {
    return COMMON_ZONES;
  }
})();

export function AddWorldClockModal(props: { onClose: () => void }) {
  const [search, setSearch] = createSignal("");

  const zones = createMemo(() => {
    const q = search().trim().toLowerCase();
    if (!q) return ALL_ZONES.slice(0, 50);
    return ALL_ZONES.filter((z) => z.toLowerCase().includes(q)).slice(0, 100);
  });

  function select(zone: string) {
    const offset = new Date().toLocaleTimeString("en-US", { timeZone: zone, timeZoneName: "shortOffset" }).split(" ").pop() || "";
    addWorldClock({
      id: `${zone.replace(/\//g, "-")}-${Date.now()}`,
      zone,
      label: `${zone.replace(/_/g, " ")} (${offset})`,
    });
    haptic("success");
    props.onClose();
  }

  return (
    <Modal onClose={props.onClose} panelClass="max-h-[80vh]" aria-label="Add world clock">
      <h2 class="mb-3 text-lg font-bold text-text">Add world clock</h2>
      <Input
        value={search()}
        onChange={setSearch}
        placeholder="Search city or timezone..."
        class="mb-3 w-full"
        aria-label="Search timezones"
      />
      <div class="h-72 space-y-1 overflow-y-auto rounded-2xl bg-surface-2 p-2">
        {zones().length === 0 && <p class="p-3 text-sm text-text-secondary">No matching timezones</p>}
        {zones().map((z) => (
          <button
            onClick={() => select(z)}
            class="w-full rounded-xl px-3 py-2 text-left text-sm text-text transition hover:bg-surface-3 focus:outline-none focus:ring-2 focus:ring-primary/50 active:scale-[0.99]"
            aria-label={`Add ${z}`}
          >
            {z.replace(/_/g, " ")}
          </button>
        ))}
      </div>
      <Button onClick={props.onClose} variant="ghost" class="mt-3 w-full">Cancel</Button>
    </Modal>
  );
}

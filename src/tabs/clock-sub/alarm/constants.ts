import type { Day } from "../../../store/app";

export const DAYS: Day[] = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

export const DAY_LABELS: Record<Day, string> = {
  MO: "M",
  TU: "T",
  WE: "W",
  TH: "T",
  FR: "F",
  SA: "S",
  SU: "S",
};

const WEEKDAYS: Day[] = ["MO", "TU", "WE", "TH", "FR"];
const WEEKEND: Day[] = ["SA", "SU"];

/** Human-readable summary for an alarm's repeat pattern. */
export function repeatSummary(repeat: Day[]): string {
  const has = (d: Day) => repeat.includes(d);
  if (repeat.length === 0) return "Once";
  if (repeat.length === 7) return "Every day";
  if (WEEKDAYS.every(has) && !WEEKEND.some(has)) return "Weekdays";
  if (WEEKEND.every(has) && !WEEKDAYS.some(has)) return "Weekends";
  return DAYS.filter(has).map((d) => DAY_LABELS[d]).join(" ");
}

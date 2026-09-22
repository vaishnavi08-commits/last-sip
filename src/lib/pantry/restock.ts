import { daysBetween } from "@/lib/dates";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// "I've ordered": restarts the clock and nudges the estimate a little
// toward the real gap since the last restock, rather than fully replacing
// it on one data point.
export function computeOrderedUpdate(
  item: { estimated_days: number; last_restock_date: string },
  today: string,
): { estimated_days: number; last_restock_date: string } {
  const daysSince = daysBetween(item.last_restock_date, today);
  const estimated_days =
    daysSince > 0 ? clamp(Math.round(item.estimated_days * 0.8 + daysSince * 0.2), 1, 90) : item.estimated_days;
  return { estimated_days, last_restock_date: today };
}

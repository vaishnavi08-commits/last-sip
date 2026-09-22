import { LADDER, WaitWindowKey, nameForCatalogId, possessive, snapToLadder } from "@/lib/catalog";
import { todayISO } from "@/lib/dates";

export type PantryRow = {
  id: string;
  catalog_id: string | null;
  custom_name: string | null;
  estimated_days: number;
  cant_wait: boolean;
  pet_name: string | null;
  last_restock_date: string;
};

export type ComputedItem = {
  id: string;
  name: string;
  cantWait: boolean;
  packLabel: string;
  off: number;
  justOrdered: boolean;
};

export function itemName(it: { catalog_id: string | null; custom_name: string | null; pet_name: string | null }): string {
  const base = it.custom_name ?? nameForCatalogId(it.catalog_id) ?? "Item";
  return it.pet_name ? `${possessive(it.pet_name)} ${base.toLowerCase()}` : base;
}

function daysBetween(fromISO: string, toISO: string): number {
  const from = new Date(fromISO + "T00:00:00Z").getTime();
  const to = new Date(toISO + "T00:00:00Z").getTime();
  return Math.round((to - from) / 86400000);
}

// The first-basket preview shown right after onboarding, when every item's
// clock effectively starts today.
export function computePantryPreview(rows: PantryRow[]) {
  const list = rows
    .map((it) => ({
      id: it.id,
      name: itemName(it),
      cantWait: it.cant_wait,
      packLabel: LADDER[snapToLadder(it.estimated_days)].l,
      off: Math.max(1, Math.round(it.estimated_days * 0.85)),
    }))
    .sort((a, b) => a.off - b.off || a.name.localeCompare(b.name));
  const first = list.length ? list[0].off : 1;
  return { list, first };
}

export function splitByWindow<T extends { off: number }>(list: T[], first: number, winDays: number) {
  return {
    within: list.filter((x) => x.off <= first + winDays),
    later: list.filter((x) => x.off > first + winDays),
  };
}

// The returning-user home, using each item's real last restock date.
export function computeHomeItems(rows: PantryRow[], today = todayISO()): { list: ComputedItem[]; firstOff: number } {
  const list: ComputedItem[] = rows
    .map((it) => {
      const daysSinceRestock = daysBetween(it.last_restock_date, today);
      return {
        id: it.id,
        name: itemName(it),
        cantWait: it.cant_wait,
        packLabel: LADDER[snapToLadder(it.estimated_days)].l,
        off: Math.round(it.estimated_days * 0.85) - daysSinceRestock,
        justOrdered: daysSinceRestock === 0,
      };
    })
    .sort((a, b) => a.off - b.off || a.name.localeCompare(b.name));
  const firstOff = list.length ? list[0].off : 1;
  return { list, firstOff };
}

export function waitWindowText(winKey: WaitWindowKey): string {
  if (winKey === "none") return "due that day";
  if (winKey === "2d") return "due within 2 days of the first";
  return "due within a week of the first";
}

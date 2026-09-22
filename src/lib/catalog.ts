// The everyday-item catalog and shared onboarding constants. Identical for
// every household, so this lives in code rather than a database table.

export type Category = "Dairy and eggs" | "Fresh" | "Staples" | "Home care" | "Pets";

export const CATS: Category[] = ["Dairy and eggs", "Fresh", "Staples", "Home care", "Pets"];

export type CatalogItem = {
  id: string;
  name: string;
  cat: Category;
  base: number; // days a pack lasts a 2-person household
  cw?: boolean; // defaults to "can't wait"
  pet?: boolean;
};

export const ITEMS: CatalogItem[] = [
  { id: "milk", name: "Milk", cat: "Dairy and eggs", base: 2, cw: true },
  { id: "curd", name: "Curd", cat: "Dairy and eggs", base: 4 },
  { id: "eggs", name: "Eggs", cat: "Dairy and eggs", base: 6 },
  { id: "butter", name: "Butter", cat: "Dairy and eggs", base: 20 },
  { id: "paneer", name: "Paneer", cat: "Dairy and eggs", base: 5 },
  { id: "bread", name: "Bread", cat: "Fresh", base: 3, cw: true },
  { id: "onions", name: "Onions", cat: "Fresh", base: 7 },
  { id: "potatoes", name: "Potatoes", cat: "Fresh", base: 7 },
  { id: "tomatoes", name: "Tomatoes", cat: "Fresh", base: 5 },
  { id: "atta", name: "Atta", cat: "Staples", base: 21 },
  { id: "rice", name: "Rice", cat: "Staples", base: 30 },
  { id: "dal", name: "Dal", cat: "Staples", base: 30 },
  { id: "oil", name: "Cooking oil", cat: "Staples", base: 30 },
  { id: "ghee", name: "Ghee", cat: "Staples", base: 45 },
  { id: "sugar", name: "Sugar", cat: "Staples", base: 30 },
  { id: "salt", name: "Salt", cat: "Staples", base: 60 },
  { id: "tea", name: "Tea", cat: "Staples", base: 30 },
  { id: "coffee", name: "Coffee", cat: "Staples", base: 30 },
  { id: "dishwash", name: "Dishwash liquid", cat: "Home care", base: 25 },
  { id: "detergent", name: "Laundry detergent", cat: "Home care", base: 30 },
  { id: "toothpaste", name: "Toothpaste", cat: "Home care", base: 45 },
  { id: "tissue", name: "Toilet paper", cat: "Home care", base: 30 },
  { id: "handwash", name: "Handwash", cat: "Home care", base: 25 },
  { id: "garbage", name: "Garbage bags", cat: "Home care", base: 30 },
  { id: "floor", name: "Floor cleaner", cat: "Home care", base: 30 },
  { id: "cat", name: "Cat food", cat: "Pets", base: 14, cw: true, pet: true },
  { id: "dog", name: "Dog food", cat: "Pets", base: 21, cw: true, pet: true },
];

export type SizeKey = "1" | "2" | "4" | "5";

export const SIZES: { k: SizeKey; num: string; cap: string; label: string; m: number }[] = [
  { k: "1", num: "1", cap: "Just me", label: "Just me", m: 1.6 },
  { k: "2", num: "2", cap: "Two of us", label: "Two of us", m: 1 },
  { k: "4", num: "3-4", cap: "A small crew", label: "3 to 4 people", m: 0.65 },
  { k: "5", num: "5+", cap: "A full house", label: "5 or more people", m: 0.45 },
];

// How long one pack lasts, offered as a ladder of round numbers rather than
// a free-form day count.
export const LADDER: { d: number; l: string }[] = [
  { d: 1, l: "1 day" },
  { d: 2, l: "2 days" },
  { d: 3, l: "3 days" },
  { d: 4, l: "4 days" },
  { d: 5, l: "5 days" },
  { d: 6, l: "6 days" },
  { d: 7, l: "1 week" },
  { d: 10, l: "10 days" },
  { d: 14, l: "2 weeks" },
  { d: 21, l: "3 weeks" },
  { d: 30, l: "1 month" },
  { d: 45, l: "6 weeks" },
  { d: 60, l: "2 months" },
  { d: 90, l: "3 months" },
];

export function snapToLadder(days: number): number {
  let best = 0;
  for (let i = 0; i < LADDER.length; i++) {
    if (Math.abs(LADDER[i].d - days) < Math.abs(LADDER[best].d - days)) best = i;
  }
  return best;
}

export type AppKey = "blinkit" | "zepto" | "instamart" | "bigbasket" | "other";

export const APPS: { k: AppKey; label: string }[] = [
  { k: "blinkit", label: "Blinkit" },
  { k: "zepto", label: "Zepto" },
  { k: "instamart", label: "Instamart" },
  { k: "bigbasket", label: "BigBasket" },
  { k: "other", label: "Other" },
];

export type WaitWindowKey = "none" | "2d" | "week";

export const WINS: { k: WaitWindowKey; label: string; desc: string; days: number }[] = [
  {
    k: "none",
    label: "Just tell me when I need it",
    desc: "One email for whatever is due that day.",
    days: 0,
  },
  {
    k: "2d",
    label: "2 days",
    desc: "Club anything due within 2 days of the first item.",
    days: 2,
  },
  {
    k: "week",
    label: "Up to a week",
    desc: "Fewer emails and bigger baskets, but a higher chance of running out first.",
    days: 7,
  },
];

export function nameForCatalogId(id: string | null): string | undefined {
  return ITEMS.find((it) => it.id === id)?.name;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

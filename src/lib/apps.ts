import type { AppKey } from "@/lib/catalog";

// Best-guess web search URLs for each grocery app, used as the "Order now"
// destination. The PRD calls for a real 30-minute phone test of each app's
// actual search/deep link before fully trusting these — these are a
// reasonable starting point, kept in one place so they're easy to correct.
export const APP_SEARCH_URL: Record<AppKey, (query: string) => string> = {
  blinkit: (q) => `https://blinkit.com/s/?q=${encodeURIComponent(q)}`,
  zepto: (q) => `https://www.zeptonow.com/search?query=${encodeURIComponent(q)}`,
  instamart: (q) => `https://www.swiggy.com/instamart/search?custom_back=true&query=${encodeURIComponent(q)}`,
  bigbasket: (q) => `https://www.bigbasket.com/ps/?q=${encodeURIComponent(q)}`,
  other: (q) => `https://www.google.com/search?q=${encodeURIComponent(q + " online grocery delivery")}`,
};

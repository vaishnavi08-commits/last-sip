"use server";

import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/dates";
import { computeOrderedUpdate } from "./restock";

export type ActionResult = { ok: true } | { ok: false; error: string };

// "I've ordered": restarts the item's clock and nudges the estimate toward
// the real gap since the last restock. Row-level security means this can
// only ever touch a row the signed-in user owns.
export async function markOrdered(itemId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: item } = await supabase
    .from("pantry_items")
    .select("estimated_days, last_restock_date")
    .eq("id", itemId)
    .single();
  if (!item) return { ok: false, error: "Item not found." };

  const update = computeOrderedUpdate(item, todayISO());
  const { error } = await supabase
    .from("pantry_items")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", itemId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

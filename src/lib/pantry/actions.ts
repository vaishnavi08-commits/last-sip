"use server";

import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/dates";

export type ActionResult = { ok: true } | { ok: false; error: string };

// "I've ordered": restarts the item's clock. Row-level security means this
// can only ever touch a row the signed-in user owns.
export async function markOrdered(itemId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("pantry_items")
    .update({ last_restock_date: todayISO(), updated_at: new Date().toISOString() })
    .eq("id", itemId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

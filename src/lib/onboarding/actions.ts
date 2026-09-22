"use server";

import { createClient } from "@/lib/supabase/server";
import { APPS, SIZES, WINS, type AppKey, type SizeKey, type WaitWindowKey } from "@/lib/catalog";

export type OnboardingItemInput = {
  catalogId: string | null;
  customName: string | null;
  category: string;
  estimatedDays: number;
  cantWait: boolean;
  petName: string | null;
};

export type OnboardingInput = {
  size: SizeKey;
  items: OnboardingItemInput[];
  main: AppKey;
  backup: AppKey | "none";
  win: WaitWindowKey;
};

function isValid(input: OnboardingInput): string | null {
  if (!SIZES.some((s) => s.k === input.size)) return "Invalid household size.";
  if (!input.items.length) return "Pick at least one item.";
  for (const it of input.items) {
    if (!it.catalogId && !it.customName?.trim()) return "Every item needs a name.";
    if (!Number.isFinite(it.estimatedDays) || it.estimatedDays < 1 || it.estimatedDays > 90) {
      return "Invalid pack length.";
    }
  }
  if (!APPS.some((a) => a.k === input.main)) return "Invalid main app.";
  if (input.backup !== "none" && !APPS.some((a) => a.k === input.backup)) {
    return "Invalid backup app.";
  }
  if (!WINS.some((w) => w.k === input.win)) return "Invalid wait window.";
  return null;
}

export async function completeOnboarding(input: OnboardingInput) {
  const error = isValid(input);
  if (error) throw new Error(error);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      household_size: input.size,
      main_app: input.main,
      backup_app: input.backup === "none" ? null : input.backup,
      wait_window: input.win,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (profileError) throw new Error(profileError.message);

  // Onboarding always writes the household's full item list fresh.
  const { error: deleteError } = await supabase.from("pantry_items").delete().eq("user_id", user.id);
  if (deleteError) throw new Error(deleteError.message);

  const { error: insertError } = await supabase.from("pantry_items").insert(
    input.items.map((it) => ({
      user_id: user.id,
      catalog_id: it.catalogId,
      custom_name: it.customName,
      category: it.category,
      estimated_days: it.estimatedDays,
      cant_wait: it.cantWait,
      pet_name: it.petName,
    })),
  );
  if (insertError) throw new Error(insertError.message);
}

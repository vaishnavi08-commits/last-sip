"use server";

import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { APPS, WINS, type AppKey, type WaitWindowKey } from "@/lib/catalog";
import { computeHomeItems, itemName, splitByWindow, type PantryRow } from "@/lib/pantry/compute";
import { signActionToken } from "./token";
import { basketEmailSubject, renderBasketEmailHtml, type BasketEmailItem } from "./render";

export type ActionResult = { ok: true } | { ok: false; error: string };

function appUrl(): string {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return host ? `https://${host}` : "http://localhost:3000";
}

export async function sendTestBasketEmail(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "Not signed in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("main_app, wait_window")
    .eq("id", user.id)
    .single();

  const { data: rows } = await supabase
    .from("pantry_items")
    .select("id, catalog_id, custom_name, category, estimated_days, cant_wait, pet_name, last_restock_date")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (!rows || rows.length === 0) {
    return { ok: false, error: "You don't have any items yet — finish onboarding first." };
  }

  const win = WINS.find((w) => w.k === (profile?.wait_window as WaitWindowKey)) ?? WINS[1];
  const { list, firstOff } = computeHomeItems(rows as PantryRow[]);
  const { within } = splitByWindow(list, firstOff, win.days);
  const offById = new Map(list.map((x) => [x.id, x.off]));
  const withinIds = new Set(within.map((x) => x.id));

  const base = appUrl();
  const basketItems: BasketEmailItem[] = rows
    .filter((r) => withinIds.has(r.id))
    .map((r) => ({
      name: itemName(r),
      catalogId: r.catalog_id,
      petName: r.pet_name,
      cantWait: r.cant_wait,
      off: offById.get(r.id)!,
      links: {
        order: `${base}/e/${signActionToken(r.id, user.id, "order")}`,
        ordered: `${base}/e/${signActionToken(r.id, user.id, "ordered")}`,
        plenty: `${base}/e/${signActionToken(r.id, user.id, "plenty")}`,
        basket: `${base}/e/${signActionToken(r.id, user.id, "basket")}`,
      },
    }))
    .sort((a, b) => a.off - b.off);

  const mainAppLabel = APPS.find((a) => a.k === (profile?.main_app as AppKey))?.label ?? "your grocery app";

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: "Last Sip <onboarding@resend.dev>",
    to: user.email,
    subject: basketEmailSubject(basketItems),
    html: renderBasketEmailHtml({ items: basketItems, mainAppLabel, manageUrl: `${base}/home` }),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

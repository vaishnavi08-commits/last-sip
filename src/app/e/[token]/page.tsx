import { APPS, nameForCatalogId, type AppKey } from "@/lib/catalog";
import { addDaysISO, todayISO } from "@/lib/dates";
import { APP_SEARCH_URL } from "@/lib/apps";
import { verifyActionToken, tokenHash } from "@/lib/email/token";
import { computeOrderedUpdate } from "@/lib/pantry/restock";
import { createAdminClient } from "@/lib/supabase/admin";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function Screen({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-6 py-10 text-center gap-4">
      <div className="bg-card border-[1.5px] border-card-border rounded-3xl p-6 max-w-sm w-full flex flex-col gap-3">
        <h1 className="m-0 font-heading font-bold text-2xl leading-tight">{title}</h1>
        <p className="m-0 text-base leading-snug text-body">{body}</p>
        <a
          href="/home"
          className="mt-2 min-h-11 flex items-center justify-center px-5 rounded-2xl border-[1.5px] border-green text-green font-semibold text-sm no-underline"
        >
          Manage my pantry
        </a>
      </div>
    </div>
  );
}

export default async function ActionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const payload = verifyActionToken(token);

  if (!payload) {
    return (
      <Screen
        title="This link isn't valid"
        body="It may have expired or been mistyped. You can still manage your pantry directly below."
      />
    );
  }

  const admin = createAdminClient();

  // "Order now" only reads data and redirects — nothing to protect against
  // replay, so it's exempt from the single-use check below.
  if (payload.action !== "order") {
    const { error: insertError } = await admin
      .from("used_email_links")
      .insert({ token_hash: tokenHash(token) });
    if (insertError) {
      return (
        <Screen
          title="Already done"
          body="This link has already been used. Manage your pantry directly if you need to change anything."
        />
      );
    }
  }

  const { data: item } = await admin
    .from("pantry_items")
    .select("id, catalog_id, custom_name, estimated_days, last_restock_date")
    .eq("id", payload.itemId)
    .eq("user_id", payload.userId)
    .single();

  if (!item) {
    return <Screen title="Item not found" body="This item may have already been removed from your pantry." />;
  }

  const displayName = (item.custom_name ?? nameForCatalogId(item.catalog_id) ?? "item") as string;
  const today = todayISO();

  if (payload.action === "order") {
    const { data: profile } = await admin.from("profiles").select("main_app").eq("id", payload.userId).single();
    const appKey = (profile?.main_app as AppKey) ?? "other";
    const appLabel = APPS.find((a) => a.k === appKey)?.label ?? "your grocery app";
    const searchUrl = APP_SEARCH_URL[appKey](displayName.toLowerCase());

    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-6 py-10 text-center gap-4">
        <div className="bg-card border-[1.5px] border-card-border rounded-3xl p-6 max-w-sm w-full flex flex-col gap-3">
          <h1 className="m-0 font-heading font-bold text-2xl leading-tight">Opening {appLabel}.</h1>
          <p className="m-0 text-base leading-snug text-body">
            Searching for &quot;{displayName.toLowerCase()}&quot;. If {appLabel} opens on its home screen, just
            search for {displayName.toLowerCase()} yourself.
          </p>
          <a
            href={searchUrl}
            className="mt-1 min-h-12 flex items-center justify-center px-5 rounded-2xl bg-green text-white font-bold text-base no-underline"
          >
            Open {appLabel} now
          </a>
          <a href="/home" className="min-h-11 flex items-center justify-center text-green font-semibold text-sm no-underline">
            Manage my pantry
          </a>
        </div>
      </div>
    );
  }

  if (payload.action === "ordered") {
    const update = computeOrderedUpdate(item, today);
    await admin
      .from("pantry_items")
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq("id", item.id);
    return (
      <Screen
        title={`Clock restarted for ${displayName.toLowerCase()}.`}
        body="Thanks. We'll time your next nudge from today's real restock date."
      />
    );
  }

  if (payload.action === "plenty") {
    const newEstimate = clamp(item.estimated_days + 2, 1, 90);
    const pushedOut = addDaysISO(item.last_restock_date, 3);
    const newRestockDate = pushedOut < today ? pushedOut : today;
    await admin
      .from("pantry_items")
      .update({ estimated_days: newEstimate, last_restock_date: newRestockDate, updated_at: new Date().toISOString() })
      .eq("id", item.id);
    return (
      <Screen title="No problem, still stocked." body="We'll check back in a few days, and guess a little longer next time." />
    );
  }

  // "basket"
  await admin
    .from("pantry_items")
    .update({ status: "parked_next_basket", updated_at: new Date().toISOString() })
    .eq("id", item.id);
  return (
    <Screen
      title="Parked for your next basket."
      body={`We'll put ${displayName.toLowerCase()} in your next basket email instead of ordering today.`}
    />
  );
}

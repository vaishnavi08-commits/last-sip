import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/supabase/actions";
import { APPS, LADDER, SIZES, WINS, snapToLadder, type AppKey, type SizeKey, type WaitWindowKey } from "@/lib/catalog";

export default async function HomePlaceholderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Row-level security means these can only ever return this signed-in
  // user's own rows, never anyone else's.
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, household_size, main_app, backup_app, wait_window, onboarding_completed_at")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed_at) {
    redirect("/onboarding");
  }

  const { data: items } = await supabase
    .from("pantry_items")
    .select("id, catalog_id, custom_name, category, estimated_days, cant_wait, pet_name")
    .eq("user_id", user.id)
    .order("category");

  const sizeLabel = SIZES.find((s) => s.k === (profile.household_size as SizeKey))?.label ?? profile.household_size;
  const mainLabel = APPS.find((a) => a.k === (profile.main_app as AppKey))?.label ?? profile.main_app;
  const backupLabel = APPS.find((a) => a.k === (profile.backup_app as AppKey))?.label;
  const winLabel = WINS.find((w) => w.k === (profile.wait_window as WaitWindowKey))?.label ?? profile.wait_window;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col px-5 pt-7 pb-8 gap-5">
      <div className="font-heading font-bold text-lg tracking-tight">Last Sip</div>
      <h1 className="m-0 font-heading font-bold text-[34px] leading-tight tracking-tight">
        You&apos;re signed in
      </h1>
      <p className="m-0 text-base leading-snug text-body">
        The real pantry screen isn&apos;t built yet (that&apos;s next) — this page just proves onboarding saved
        correctly and survives a refresh.
      </p>

      <div className="bg-card border-[1.5px] border-card-border rounded-2xl p-4 flex flex-col gap-2">
        <div className="text-xs font-bold tracking-wide uppercase text-muted">Signed in as</div>
        <div className="text-base font-semibold">{profile?.full_name ?? user.user_metadata?.full_name ?? "—"}</div>
        <div className="text-sm text-muted">{profile?.email ?? user.email}</div>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="text-xs font-bold tracking-wide uppercase text-muted">Your answers</div>
        <div className="bg-card border-[1.5px] border-card-border rounded-2xl divide-y divide-card-border">
          <AnswerRow label="Household" value={sizeLabel ?? "—"} />
          <AnswerRow label="Grocery apps" value={backupLabel ? `${mainLabel}, then ${backupLabel}` : `${mainLabel}`} />
          <AnswerRow label="Wait window" value={winLabel ?? "—"} />
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="text-xs font-bold tracking-wide uppercase text-muted">
          Your items ({items?.length ?? 0})
        </div>
        <div className="flex flex-col gap-2.5">
          {items?.map((it) => (
            <div
              key={it.id}
              className="bg-card border-[1.5px] border-card-border rounded-2xl p-3.5 flex items-center justify-between gap-2.5"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="text-base font-bold">
                  {it.pet_name ? `${it.pet_name}'s ${itemName(it).toLowerCase()}` : itemName(it)}
                </div>
                <div className="text-sm text-muted">
                  Lasts about {LADDER[snapToLadder(it.estimated_days)].l}
                </div>
              </div>
              {it.cant_wait && (
                <div className="flex-shrink-0 px-2.5 py-1 rounded-xl bg-red-light text-red text-xs font-bold">
                  Can&apos;t wait
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <form action={signOut}>
        <button
          type="submit"
          className="min-h-11 px-5 rounded-2xl border-[1.5px] border-card-border bg-card font-semibold text-sm"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

function itemName(it: { catalog_id: string | null; custom_name: string | null }) {
  if (it.custom_name) return it.custom_name;
  return CATALOG_NAME[it.catalog_id ?? ""] ?? it.catalog_id ?? "Item";
}

const CATALOG_NAME: Record<string, string> = {
  milk: "Milk",
  curd: "Curd",
  eggs: "Eggs",
  butter: "Butter",
  paneer: "Paneer",
  bread: "Bread",
  onions: "Onions",
  potatoes: "Potatoes",
  tomatoes: "Tomatoes",
  atta: "Atta",
  rice: "Rice",
  dal: "Dal",
  oil: "Cooking oil",
  ghee: "Ghee",
  sugar: "Sugar",
  salt: "Salt",
  tea: "Tea",
  coffee: "Coffee",
  dishwash: "Dishwash liquid",
  detergent: "Laundry detergent",
  toothpaste: "Toothpaste",
  tissue: "Toilet paper",
  handwash: "Handwash",
  garbage: "Garbage bags",
  floor: "Floor cleaner",
  cat: "Cat food",
  dog: "Dog food",
};

function AnswerRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-14 px-3.5 flex items-center justify-between gap-2.5">
      <span className="text-base font-bold">{label}</span>
      <span className="text-[15px] text-body">{value}</span>
    </div>
  );
}

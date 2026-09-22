import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WINS, capitalize, type WaitWindowKey } from "@/lib/catalog";
import { computePantryPreview, splitByWindow, waitWindowText, type PantryRow } from "@/lib/pantry/compute";
import { relativeDate } from "@/lib/dates";

export default async function PantryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("wait_window, onboarding_completed_at")
    .eq("id", user.id)
    .single();
  if (!profile?.onboarding_completed_at) redirect("/onboarding");

  const { data: rows } = await supabase
    .from("pantry_items")
    .select("id, catalog_id, custom_name, category, estimated_days, cant_wait, pet_name, last_restock_date")
    .eq("user_id", user.id);

  const win = WINS.find((w) => w.k === (profile.wait_window as WaitWindowKey)) ?? WINS[1];
  const { list, first } = computePantryPreview((rows ?? []) as PantryRow[]);
  const { within: basketRows, later: laterRows } = splitByWindow(list, first, win.days);
  const winText = waitWindowText(win.k);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col px-5 pt-7 pb-8 gap-5">
      <div className="flex flex-col gap-2">
        <div className="font-heading font-bold text-lg tracking-tight">Last Sip</div>
        <h1 className="m-0 font-heading font-bold text-[34px] leading-tight tracking-tight">Your pantry</h1>
        <p className="m-0 text-base leading-snug text-body">
          Here&apos;s what we&apos;re watching, and when your first basket email goes out.
        </p>
      </div>

      <div className="bg-yellow rounded-[22px] p-[18px] flex flex-col gap-1.5">
        <div className="text-[13px] font-bold tracking-wide uppercase">First basket email</div>
        <div className="font-heading font-bold text-[28px] leading-tight tracking-tight">
          {capitalize(relativeDate(first))}
        </div>
        <div className="text-base leading-snug">
          {basketRows.length} item{basketRows.length === 1 ? "" : "s"} {winText}.
        </div>
        <div className="text-sm leading-snug mt-1">One email a day at most, never at night.</div>
      </div>

      <Section title="In that basket" rows={basketRows} />
      {laterRows.length > 0 && <Section title="Coming up after" rows={laterRows} />}
    </div>
  );
}

function Section({
  title,
  rows,
}: {
  title: string;
  rows: { id: string; name: string; cantWait: boolean; packLabel: string; off: number }[];
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="text-xs font-bold tracking-wide uppercase text-muted">{title}</div>
      {rows.map((row) => (
        <div
          key={row.id}
          className="bg-card border-[1.5px] border-card-border rounded-2xl p-3.5 flex items-center justify-between gap-2.5"
        >
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="text-base font-bold">{row.name}</div>
            <div className="text-sm text-muted">
              Lasts about {row.packLabel} &middot; order by {relativeDate(row.off)}
            </div>
          </div>
          {row.cantWait && (
            <div className="flex-shrink-0 px-2.5 py-1 rounded-xl bg-red-light text-red text-xs font-bold">
              Can&apos;t wait
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

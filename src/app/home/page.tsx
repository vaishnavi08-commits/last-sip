import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/supabase/actions";
import { WINS, capitalize, type WaitWindowKey } from "@/lib/catalog";
import { computeHomeItems, itemName, waitWindowText, type PantryRow } from "@/lib/pantry/compute";
import { relativeDate } from "@/lib/dates";
import { OrderedButton } from "./ordered-button";

export default async function HomePage() {
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

  const { data: activeRows } = await supabase
    .from("pantry_items")
    .select("id, catalog_id, custom_name, category, estimated_days, cant_wait, pet_name, last_restock_date")
    .eq("user_id", user.id)
    .eq("status", "active");

  const { data: pausedRows } = await supabase
    .from("pantry_items")
    .select("id, catalog_id, custom_name, pet_name")
    .eq("user_id", user.id)
    .eq("status", "paused");

  const win = WINS.find((w) => w.k === (profile.wait_window as WaitWindowKey)) ?? WINS[1];
  const { list, firstOff } = computeHomeItems((activeRows ?? []) as PantryRow[]);
  const dueList = list.filter((x) => x.off <= 2 && !x.justOrdered);
  const stockedList = list.filter((x) => !(x.off <= 2 && !x.justOrdered));
  const noDue = dueList.length === 0;
  const winText = waitWindowText(win.k);
  const basketN = list.filter((x) => !x.justOrdered && x.off <= firstOff + win.days).length;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col px-5 pt-7 pb-8 gap-5">
      <div className="flex flex-col gap-2">
        <div className="font-heading font-bold text-lg tracking-tight">Last Sip</div>
        <h1 className="m-0 font-heading font-bold text-[34px] leading-tight tracking-tight">Welcome back</h1>
        <p className="m-0 text-base leading-snug text-body">Here&apos;s what we&apos;re watching for you.</p>
      </div>

      <div className="bg-yellow rounded-[22px] p-[18px] flex flex-col gap-1.5">
        <div className="text-[13px] font-bold tracking-wide uppercase">
          {noDue ? "Nothing due" : "Next basket email"}
        </div>
        <div className="font-heading font-bold text-[28px] leading-tight tracking-tight">
          {noDue ? "You're stocked up" : firstOff <= 0 ? "Today" : capitalize(relativeDate(firstOff))}
        </div>
        <div className="text-base leading-snug">
          {noDue
            ? `Next basket email goes out ${relativeDate(Math.max(1, firstOff))}.`
            : `${basketN} item${basketN === 1 ? "" : "s"} ${winText}.`}
        </div>
        <div className="text-sm leading-snug mt-1">One email a day at most, never at night.</div>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="text-xs font-bold tracking-wide uppercase text-muted">Due soon</div>
        {noDue && (
          <div className="bg-card border-[1.5px] border-card-border rounded-2xl p-3.5 text-[15px] leading-snug text-body">
            Nothing is due right now. You&apos;re stocked up.
          </div>
        )}
        {dueList.map((row) => {
          const pill = row.off <= 0 ? "Order today" : row.off === 1 ? "Order by tomorrow" : `Due in ${row.off} days`;
          const urgent = row.off <= 0;
          return (
            <div key={row.id} className="bg-card border-[1.5px] border-card-border rounded-2xl p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2.5">
                <div className="text-base font-bold min-w-0">{row.name}</div>
                <div
                  className={`flex-shrink-0 px-2.5 py-1 rounded-xl text-xs font-bold ${
                    urgent ? "bg-red-light text-red" : "bg-[#FCEFC9] text-[#5C4300]"
                  }`}
                >
                  {pill}
                </div>
              </div>
              <div className="flex items-center justify-between gap-2.5">
                <div className="text-sm text-muted min-w-0">
                  Lasts about {row.packLabel}
                  {row.cantWait ? " · can't wait" : ""}
                </div>
                <OrderedButton itemId={row.id} />
              </div>
            </div>
          );
        })}
      </div>

      {stockedList.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="text-xs font-bold tracking-wide uppercase text-muted">Stocked up</div>
          <div className="bg-card border-[1.5px] border-card-border rounded-2xl divide-y divide-card-border">
            {stockedList.map((row) => (
              <div key={row.id} className="min-h-12 px-3.5 flex items-center justify-between gap-2.5">
                <span className="text-base font-semibold">{row.name}</span>
                <span className="text-sm text-muted text-right">
                  {row.justOrdered ? "Restocked today" : `Order by ${relativeDate(row.off)}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(pausedRows?.length ?? 0) > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="text-xs font-bold tracking-wide uppercase text-muted">Paused</div>
          {pausedRows!.map((row) => (
            <div
              key={row.id}
              className="bg-card border-[1.5px] border-card-border rounded-2xl p-3.5 flex items-center justify-between gap-2.5"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="text-base font-bold">{itemName(row)}</div>
                <div className="text-sm text-muted">Paused after 2 nudges with no tap</div>
              </div>
            </div>
          ))}
        </div>
      )}

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

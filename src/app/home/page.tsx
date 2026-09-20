import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/supabase/actions";

export default async function HomePlaceholderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Row-level security means this can only ever return this signed-in
  // user's own profile row, never anyone else's.
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, created_at")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col px-5 pt-7 pb-8 gap-5">
      <div className="font-heading font-bold text-lg tracking-tight">Last Sip</div>
      <h1 className="m-0 font-heading font-bold text-[34px] leading-tight tracking-tight">
        You&apos;re signed in
      </h1>
      <p className="m-0 text-base leading-snug text-body">
        Onboarding isn&apos;t built yet — this page just proves sign-in works and that you only ever
        see your own data.
      </p>

      <div className="bg-card border-[1.5px] border-card-border rounded-2xl p-4 flex flex-col gap-2">
        <div className="text-xs font-bold tracking-wide uppercase text-muted">Signed in as</div>
        <div className="text-base font-semibold">{profile?.full_name ?? user.user_metadata?.full_name ?? "—"}</div>
        <div className="text-sm text-muted">{profile?.email ?? user.email}</div>
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

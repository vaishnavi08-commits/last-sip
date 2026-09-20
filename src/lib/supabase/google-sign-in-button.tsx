"use client";

import { createClient } from "@/lib/supabase/client";

export function GoogleSignInButton() {
  async function handleClick() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // Ask Google for name and email only. We never request access to
        // Gmail or any other inbox scope.
        scopes: "openid email profile",
      },
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="h-14 rounded-2xl border-[1.5px] border-ink bg-card text-[17px] font-semibold flex items-center justify-center gap-3 px-4"
    >
      <span
        aria-hidden="true"
        className="w-[26px] h-[26px] rounded-full bg-ink text-cream font-bold text-[15px] flex items-center justify-center"
      >
        G
      </span>
      Continue with Google
    </button>
  );
}

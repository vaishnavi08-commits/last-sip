import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GoogleSignInButton } from "@/lib/supabase/google-sign-in-button";

export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed_at")
      .eq("id", user.id)
      .single();
    redirect(profile?.onboarding_completed_at ? "/home" : "/onboarding");
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col px-6 pt-7 pb-8 gap-4">
      <div className="font-heading font-bold text-2xl tracking-tight">Last Sip</div>

      <div className="flex-1 min-h-0 flex items-center justify-center">
        <svg
          width="230"
          height="230"
          viewBox="0 0 220 220"
          role="img"
          aria-label="A glass with only a little milk left"
        >
          <circle cx="110" cy="116" r="92" fill="#F4B93E" />
          <polygon
            points="66,50 154,50 142,178 78,178"
            fill="#FFFDF8"
            fillOpacity="0.45"
            stroke="#1F2A24"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <polygon
            points="75.4,150 144.6,150 142,178 78,178"
            fill="#FFFDF8"
            stroke="#1F2A24"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <line x1="130" y1="26" x2="106" y2="142" stroke="#1F2A24" strokeWidth="5" strokeLinecap="round" />
          <circle cx="96" cy="166" r="3.5" fill="none" stroke="#1F2A24" strokeWidth="2" />
          <circle cx="118" cy="160" r="2.5" fill="none" stroke="#1F2A24" strokeWidth="2" />
          <line x1="166" y1="70" x2="180" y2="62" stroke="#1F2A24" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="170" y1="88" x2="186" y2="88" stroke="#1F2A24" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="166" y1="106" x2="180" y2="114" stroke="#1F2A24" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      </div>

      <div className="flex flex-col gap-3">
        <h1 className="m-0 font-heading font-bold text-[40px] leading-[1.02] tracking-tight text-balance">
          We&apos;ll tell you before the milk runs out.
        </h1>
        <p className="m-0 text-[17px] leading-snug text-body">
          One friendly email, whichever grocery app you order from.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <GoogleSignInButton />
        <p className="m-0 text-sm leading-snug text-muted text-center">
          We read only your name and email address. Never your inbox.
        </p>
      </div>
    </div>
  );
}

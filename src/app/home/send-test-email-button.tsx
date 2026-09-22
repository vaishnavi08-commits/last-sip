"use client";

import { useState, useTransition } from "react";
import { sendTestBasketEmail } from "@/lib/email/actions";

export function SendTestEmailButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<"sent" | string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setResult(null);
            const res = await sendTestBasketEmail();
            setResult(res.ok ? "sent" : res.error);
          })
        }
        className="min-h-11 px-5 rounded-2xl border-[1.5px] border-green bg-transparent text-green font-semibold text-sm disabled:opacity-60"
      >
        {isPending ? "Sending..." : "Send me a test email"}
      </button>
      {result === "sent" && (
        <div className="bg-green-light text-green rounded-xl px-3.5 py-2.5 text-sm font-semibold">
          Sent! Check your inbox (and Promotions/Spam).
        </div>
      )}
      {result && result !== "sent" && (
        <div className="bg-red-light text-red rounded-xl px-3.5 py-2.5 text-sm font-semibold">{result}</div>
      )}
    </div>
  );
}

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markOrdered } from "@/lib/pantry/actions";

export function OrderedButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await markOrdered(itemId);
          router.refresh();
        })
      }
      className="flex-shrink-0 min-h-11 px-3.5 rounded-xl border-[1.5px] border-input-border bg-cream text-sm font-bold disabled:opacity-60"
    >
      {isPending ? "..." : "I've ordered"}
    </button>
  );
}

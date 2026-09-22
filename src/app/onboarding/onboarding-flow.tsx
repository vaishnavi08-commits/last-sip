"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  APPS,
  CATS,
  ITEMS,
  LADDER,
  SIZES,
  WINS,
  capitalize,
  snapToLadder,
  type AppKey,
  type Category,
  type SizeKey,
  type WaitWindowKey,
} from "@/lib/catalog";
import { completeOnboarding, type OnboardingItemInput } from "@/lib/onboarding/actions";

type Screen = "household" | "items" | "packs" | "apps";

const STEP: Record<Screen, number> = { household: 1, items: 2, packs: 3, apps: 4 };
const NEXT: Record<Screen, Screen> = { household: "items", items: "packs", packs: "apps", apps: "apps" };
const BACK: Partial<Record<Screen, Screen>> = { items: "household", packs: "items", apps: "packs" };

type CustomItem = { id: string; name: string; cat: Category };

const ON = { bg: "bg-green", fg: "text-white", bd: "border-green" };
const OFF = { bg: "bg-card", fg: "text-ink", bd: "border-input-border" };

export function OnboardingFlow() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("household");
  const [size, setSize] = useState<SizeKey>("2");
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [idx, setIdx] = useState<Record<string, number>>({});
  const [cw, setCw] = useState<Record<string, boolean>>({});
  const [pets, setPets] = useState<Record<string, string>>({});
  const [main, setMain] = useState<AppKey>("blinkit");
  const [backup, setBackup] = useState<AppKey | "none">("none");
  const [win, setWin] = useState<WaitWindowKey>("2d");
  const [custom, setCustom] = useState<CustomItem[]>([]);
  const [adding, setAdding] = useState<Category | null>(null);
  const [draftText, setDraftText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sizeInfo = SIZES.find((s) => s.k === size) ?? SIZES[1];
  const allItems = useMemo(() => [...ITEMS, ...custom.map((c) => ({ ...c, base: 14 }))], [custom]);
  const pickedItems = allItems.filter((it) => picked[it.id]);

  const idxFor = (it: { id: string; base: number; pet?: boolean }) =>
    idx[it.id] ?? snapToLadder(Math.max(1, Math.round(it.base * (it.pet ? 1 : sizeInfo.m))));
  const isCw = (it: { id: string; cw?: boolean }) => cw[it.id] ?? !!it.cw;

  function goNext() {
    if (screen === "apps") {
      const items: OnboardingItemInput[] = pickedItems.map((it) => {
        const isCatalog = ITEMS.some((c) => c.id === it.id);
        return {
          catalogId: isCatalog ? it.id : null,
          customName: isCatalog ? null : it.name,
          category: it.cat,
          estimatedDays: LADDER[idxFor(it)].d,
          cantWait: isCw(it),
          petName: "pet" in it && it.pet ? pets[it.id]?.trim() || null : null,
        };
      });
      setFormError(null);
      startTransition(async () => {
        const result = await completeOnboarding({ size, items, main, backup, win });
        if (!result.ok) {
          setFormError(result.error);
          return;
        }
        router.push("/pantry");
      });
      return;
    }
    setScreen(NEXT[screen]);
  }

  function goBack() {
    const prev = BACK[screen];
    if (prev) setScreen(prev);
  }

  const segs = [1, 2, 3, 4].map((n) => n <= STEP[screen]);

  let ctaLabel = "Continue";
  let ctaDisabled = false;
  if (screen === "items") {
    ctaLabel = pickedItems.length ? `Continue with ${pickedItems.length} item${pickedItems.length === 1 ? "" : "s"}` : "Pick at least one";
    ctaDisabled = pickedItems.length === 0;
  } else if (screen === "apps") {
    ctaLabel = "Show my pantry";
  }
  if (isPending) ctaLabel = "Saving...";

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="px-5 pt-4 pb-2 flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          {BACK[screen] ? (
            <button
              type="button"
              aria-label="Back"
              onClick={goBack}
              className="w-11 h-11 rounded-full border-[1.5px] border-card-border bg-card flex items-center justify-center"
            >
              <BackIcon />
            </button>
          ) : (
            <span />
          )}
          <div className="text-sm font-semibold text-muted">Step {STEP[screen]} of 4</div>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {segs.map((on, i) => (
            <div key={i} className={`h-[5px] rounded-[3px] ${on ? "bg-green" : "bg-card-border"}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-3 pb-6 flex flex-col gap-5">
        {screen === "household" && (
          <HouseholdStep size={size} onPick={setSize} />
        )}
        {screen === "items" && (
          <ItemsStep
            allItems={allItems}
            picked={picked}
            setPicked={setPicked}
            custom={custom}
            setCustom={setCustom}
            adding={adding}
            setAdding={setAdding}
            draftText={draftText}
            setDraftText={setDraftText}
          />
        )}
        {screen === "packs" && (
          <PacksStep
            pickedItems={pickedItems}
            idxFor={idxFor}
            isCw={isCw}
            pets={pets}
            setPets={setPets}
            setIdx={setIdx}
            setCw={setCw}
          />
        )}
        {screen === "apps" && (
          <AppsStep main={main} setMain={setMain} backup={backup} setBackup={setBackup} win={win} setWin={setWin} />
        )}
        {formError && (
          <div className="bg-red-light text-red rounded-2xl p-3.5 text-sm font-semibold">{formError}</div>
        )}
      </div>

      <div className="px-5 pt-3 pb-6 border-t-[1.5px] border-card-border bg-cream">
        <button
          type="button"
          disabled={ctaDisabled || isPending}
          onClick={goNext}
          className={`w-full h-14 rounded-2xl border-none text-white text-[17px] font-bold ${
            ctaDisabled || isPending ? "bg-disabled" : "bg-green"
          }`}
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 5 8 12 15 19" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="5 12.5 10 17.5 19 7" />
    </svg>
  );
}

function HouseholdStep({ size, onPick }: { size: SizeKey; onPick: (k: SizeKey) => void }) {
  return (
    <>
      <div className="flex flex-col gap-2.5">
        <h1 className="m-0 font-heading font-bold text-[32px] leading-[1.08] tracking-tight">
          Who are we stocking up for?
        </h1>
        <p className="m-0 text-base leading-snug text-body">
          Bigger households run out faster. We use this to guess how long things last.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {SIZES.map((s) => {
          const on = s.k === size;
          const t = on ? ON : OFF;
          return (
            <button
              key={s.k}
              type="button"
              aria-pressed={on}
              onClick={() => onPick(s.k)}
              className={`h-[132px] rounded-[20px] border-[1.5px] ${t.bd} ${t.bg} ${t.fg} flex flex-col items-start justify-between p-4 text-left`}
            >
              <span className="font-heading font-bold text-[44px] leading-none tracking-tight">{s.num}</span>
              <span className="text-base font-semibold">{s.cap}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function ItemsStep({
  allItems,
  picked,
  setPicked,
  custom,
  setCustom,
  adding,
  setAdding,
  draftText,
  setDraftText,
}: {
  allItems: { id: string; name: string; cat: Category }[];
  picked: Record<string, boolean>;
  setPicked: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  custom: CustomItem[];
  setCustom: React.Dispatch<React.SetStateAction<CustomItem[]>>;
  adding: Category | null;
  setAdding: (c: Category | null) => void;
  draftText: string;
  setDraftText: (s: string) => void;
}) {
  function addItem(cat: Category) {
    const raw = draftText.trim();
    if (!raw) return;
    const name = capitalize(raw);
    const dupe = allItems.find((it) => it.name.toLowerCase() === name.toLowerCase());
    if (dupe) {
      setPicked((p) => ({ ...p, [dupe.id]: true }));
    } else {
      const id = "x" + (custom.length + 1) + "-" + Date.now();
      setCustom((c) => [...c, { id, name, cat }]);
      setPicked((p) => ({ ...p, [id]: true }));
    }
    setAdding(null);
    setDraftText("");
  }

  return (
    <>
      <div className="flex flex-col gap-2.5">
        <h1 className="m-0 font-heading font-bold text-[32px] leading-[1.08] tracking-tight">
          What do you keep running out of?
        </h1>
        <p className="m-0 text-base leading-snug text-body">
          Pick the everyday things you buy again and again. Rarely bought stuff isn&apos;t on this list.
        </p>
      </div>
      {CATS.map((cat) => (
        <div key={cat} className="flex flex-col gap-2.5">
          <div className="text-xs font-bold tracking-wide uppercase text-muted">{cat}</div>
          <div className="flex flex-wrap gap-2">
            {allItems
              .filter((it) => it.cat === cat)
              .map((it) => {
                const on = !!picked[it.id];
                const t = on ? ON : OFF;
                return (
                  <button
                    key={it.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setPicked((p) => ({ ...p, [it.id]: !on }))}
                    className={`min-h-11 px-4 rounded-full border-[1.5px] ${t.bd} ${t.bg} ${t.fg} text-[15px] font-semibold flex items-center gap-1.5`}
                  >
                    {on && <CheckIcon />}
                    {it.name}
                  </button>
                );
              })}
            {adding !== cat && (
              <button
                type="button"
                aria-label={`Add an item to ${cat}`}
                onClick={() => {
                  setAdding(cat);
                  setDraftText("");
                }}
                className="min-h-11 px-4 rounded-full border-[1.5px] border-dashed border-disabled bg-transparent text-green text-[15px] font-bold flex items-center gap-1.5"
              >
                <PlusIcon />
                Add item
              </button>
            )}
          </div>
          {adding === cat && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                aria-label={`Add an item to ${cat}`}
                placeholder="Item name"
                value={draftText}
                onChange={(e) => setDraftText(e.target.value.slice(0, 24))}
                onKeyDown={(e) => e.key === "Enter" && addItem(cat)}
                className="flex-1 min-w-0 h-11 rounded-xl border-[1.5px] border-input-border bg-card px-3.5 text-base box-border"
              />
              <button
                type="button"
                disabled={!draftText.trim()}
                onClick={() => addItem(cat)}
                className={`h-11 px-[18px] rounded-xl border-none text-white text-[15px] font-bold ${
                  draftText.trim() ? "bg-green" : "bg-disabled"
                }`}
              >
                Add
              </button>
              <button
                type="button"
                aria-label="Cancel"
                onClick={() => {
                  setAdding(null);
                  setDraftText("");
                }}
                className="w-11 h-11 rounded-full border-[1.5px] border-input-border bg-transparent flex items-center justify-center"
              >
                <XIcon />
              </button>
            </div>
          )}
        </div>
      ))}
    </>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <line x1="12" y1="5" x2="12" y2="19" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

function PacksStep({
  pickedItems,
  idxFor,
  isCw,
  pets,
  setPets,
  setIdx,
  setCw,
}: {
  pickedItems: { id: string; name: string; cat: Category; base: number; cw?: boolean; pet?: boolean }[];
  idxFor: (it: { id: string; base: number; pet?: boolean }) => number;
  isCw: (it: { id: string; cw?: boolean }) => boolean;
  pets: Record<string, string>;
  setPets: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setIdx: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setCw: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  return (
    <>
      <div className="flex flex-col gap-2.5">
        <h1 className="m-0 font-heading font-bold text-[32px] leading-[1.08] tracking-tight">
          How long does one pack last you?
        </h1>
        <p className="m-0 text-base leading-snug text-body">
          A rough guess is fine. We&apos;ll learn the real number from your taps. Can&apos;t wait items are marked
          urgent in your email.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {pickedItems.map((it) => {
          const i = idxFor(it);
          const cwOn = isCw(it);
          return (
            <div key={it.id} className="bg-card border-[1.5px] border-card-border rounded-[18px] p-3.5 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[17px] font-bold leading-tight min-w-0">{it.name}</div>
                <div className="flex items-center flex-shrink-0">
                  <button
                    type="button"
                    aria-label="Shorter"
                    disabled={i === 0}
                    onClick={() => setIdx((d) => ({ ...d, [it.id]: Math.max(0, i - 1) }))}
                    className="w-11 h-11 rounded-full border-[1.5px] border-input-border bg-cream flex items-center justify-center disabled:opacity-40"
                  >
                    <MinusIcon />
                  </button>
                  <div className="w-[84px] text-center text-base font-bold">{LADDER[i].l}</div>
                  <button
                    type="button"
                    aria-label="Longer"
                    disabled={i === LADDER.length - 1}
                    onClick={() => setIdx((d) => ({ ...d, [it.id]: Math.min(LADDER.length - 1, i + 1) }))}
                    className="w-11 h-11 rounded-full border-[1.5px] border-input-border bg-cream flex items-center justify-center disabled:opacity-40"
                  >
                    <PlusIconThin />
                  </button>
                </div>
              </div>
              {it.pet && (
                <input
                  type="text"
                  aria-label="Pet's name"
                  placeholder="Pet's name"
                  value={pets[it.id] ?? ""}
                  onChange={(e) => setPets((p) => ({ ...p, [it.id]: e.target.value }))}
                  className="h-11 rounded-xl border-[1.5px] border-input-border bg-cream px-3.5 text-base box-border w-full"
                />
              )}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  aria-pressed={cwOn}
                  onClick={() => setCw((c) => ({ ...c, [it.id]: !cwOn }))}
                  className={`min-h-11 px-4 rounded-full border-[1.5px] text-sm font-bold ${
                    cwOn ? "bg-red-light text-red border-red" : "bg-transparent text-body border-input-border"
                  }`}
                >
                  {cwOn ? "Can't wait" : "Can wait"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function MinusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <line x1="6" y1="12" x2="18" y2="12" />
    </svg>
  );
}

function PlusIconThin() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <line x1="6" y1="12" x2="18" y2="12" />
      <line x1="12" y1="6" x2="12" y2="18" />
    </svg>
  );
}

function AppsStep({
  main,
  setMain,
  backup,
  setBackup,
  win,
  setWin,
}: {
  main: AppKey;
  setMain: (k: AppKey) => void;
  backup: AppKey | "none";
  setBackup: (k: AppKey | "none") => void;
  win: WaitWindowKey;
  setWin: (k: WaitWindowKey) => void;
}) {
  const backupOptions: { k: AppKey | "none"; label: string }[] = [
    ...APPS.filter((a) => a.k !== main),
    { k: "none", label: "No backup" },
  ];

  return (
    <>
      <div className="flex flex-col gap-2.5">
        <h1 className="m-0 font-heading font-bold text-[32px] leading-[1.08] tracking-tight">
          Where do you usually order?
        </h1>
        <p className="m-0 text-base leading-snug text-body">Order now opens this app, searching for the item.</p>
      </div>
      <div className="flex flex-col gap-2.5">
        <div className="text-xs font-bold tracking-wide uppercase text-muted">Favorite app</div>
        <div className="flex flex-wrap gap-2">
          {APPS.map((a) => {
            const on = a.k === main;
            const t = on ? ON : OFF;
            return (
              <button
                key={a.k}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setMain(a.k);
                  if (backup === a.k) setBackup("none");
                }}
                className={`min-h-11 px-4 rounded-full border-[1.5px] ${t.bd} ${t.bg} ${t.fg} text-[15px] font-semibold`}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        <div className="text-xs font-bold tracking-wide uppercase text-muted">Backup app</div>
        <div className="flex flex-wrap gap-2">
          {backupOptions.map((a) => {
            const on = a.k === backup;
            const t = on ? ON : OFF;
            return (
              <button
                key={a.k}
                type="button"
                aria-pressed={on}
                onClick={() => setBackup(a.k)}
                className={`min-h-11 px-4 rounded-full border-[1.5px] ${t.bd} ${t.bg} ${t.fg} text-[15px] font-semibold`}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        <div className="text-xs font-bold tracking-wide uppercase text-muted">
          How long can you wait to club items together?
        </div>
        <div className="flex flex-col gap-2">
          {WINS.map((w) => {
            const on = w.k === win;
            return (
              <button
                key={w.k}
                type="button"
                aria-pressed={on}
                onClick={() => setWin(w.k)}
                className={`rounded-2xl border-[1.5px] ${
                  on ? "border-green bg-green-light" : "border-input-border bg-card"
                } px-3.5 py-3 flex items-center gap-3 text-left min-h-14`}
              >
                <span
                  aria-hidden="true"
                  className={`w-[22px] h-[22px] rounded-full border-2 ${on ? "border-green" : "border-disabled"} flex items-center justify-center flex-shrink-0`}
                >
                  {on && <span className="w-2.5 h-2.5 rounded-full bg-green block" />}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-base font-bold">{w.label}</span>
                  <span className="text-sm leading-snug text-body">{w.desc}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { CalendarOff, CalendarPlus, Milk } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, apiPost } from "@/lib/api";
import { STORE } from "@/lib/constants";
import type { MilkFamilyView } from "@/lib/types";

const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
const addDays = (d: string, n: number) => {
  const x = new Date(`${d}T00:00:00Z`);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
};
const errMsg = (e: unknown, fallback: string) =>
  e instanceof ApiError && typeof (e.body as { detail?: unknown })?.detail === "string" ? String((e.body as { detail: string }).detail) : fallback;

export default function MilkSkipPage() {
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get("code") ?? "");
  const [phone, setPhone] = useState("");
  const [fam, setFam] = useState<MilkFamilyView | null>(null);
  const [error, setError] = useState("");
  const [pickDate, setPickDate] = useState("");

  const lookup = useMutation({
    mutationFn: () => apiPost<MilkFamilyView>("/milk/lookup", { code, phone }),
    onMutate: () => setError(""),
    onSuccess: setFam,
    onError: (e) => setError(errMsg(e, "Could not find your subscription")),
  });
  const skip = useMutation({
    mutationFn: ({ date, on }: { date: string; on: boolean }) => apiPost<MilkFamilyView>("/milk/skip", { code, phone, date, skip: on }),
    onMutate: () => setError(""),
    onSuccess: (f) => { setFam(f); setPickDate(""); },
    onError: (e) => setError(errMsg(e, "Could not update — please call the store")),
  });

  const next7 = fam ? Array.from({ length: 7 }, (_, i) => addDays(fam.earliest_skip, i)) : [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12" data-testid="milk-skip-page">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-600">Daily Milk</p>
      <h1 className="mt-1 font-heading text-3xl font-extrabold text-purple-950 sm:text-4xl">Skip a Day</h1>
      <p className="mt-2 text-slate-600">Travelling or have extra milk at home? Skip any day and you won't be charged for it. Tomorrow can be skipped until 9 PM tonight.</p>

      {!fam ? (
        <form className="mt-6 space-y-4 rounded-3xl border border-purple-100 bg-white p-6 shadow-sm" onSubmit={(e) => { e.preventDefault(); lookup.mutate(); }} data-testid="milk-skip-lookup-form">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="sk-code">Subscription code</Label><Input id="sk-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. M-1234" className="h-11" data-testid="milk-skip-code-input" /></div>
            <div className="space-y-1.5"><Label htmlFor="sk-phone">Mobile number</Label><Input id="sk-phone" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit number" className="h-11" data-testid="milk-skip-phone-input" /></div>
          </div>
          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700" data-testid="milk-skip-error">{error}</p> : null}
          <Button type="submit" className="h-11 w-full" disabled={lookup.isPending || code.length < 3 || phone.replace(/\D/g, "").length < 10} data-testid="milk-skip-lookup-button">Find My Subscription</Button>
          <p className="text-xs text-slate-500">Your code was shown when you booked (it starts with M-). Lost it? Call {STORE.phoneDisplay}.</p>
        </form>
      ) : (
        <div className="mt-6 space-y-5">
          <div className="flex items-center gap-3 rounded-2xl bg-purple-950 p-5 text-white" data-testid="milk-skip-family">
            <Milk className="size-8 text-sky-300" />
            <div><p className="font-heading text-lg font-extrabold">{fam.name} <span className="text-sm font-semibold text-purple-300">{fam.code}</span></p><p className="text-sm text-purple-200">{fam.qty} × {fam.product_name} daily · {fam.mode === "delivery" ? "Home delivery" : "Counter pickup"}{fam.status !== "active" ? ` · ${fam.status.toUpperCase()}` : ""}</p></div>
          </div>

          <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm">
            <p className="font-bold text-slate-900">Tap a day to skip it</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {next7.map((d) => {
                const off = fam.skip_dates.includes(d);
                return (
                  <button key={d} type="button" disabled={skip.isPending} onClick={() => skip.mutate({ date: d, on: !off })} data-testid={`milk-skip-day-${d}`}
                    className={`rounded-xl border-2 px-3 py-3 text-left text-sm transition-colors ${off ? "border-amber-400 bg-amber-50" : "border-purple-100 hover:border-purple-300"}`}>
                    <span className="block font-bold text-slate-900">{fmt(d)}</span>
                    <span className={`text-xs font-semibold ${off ? "text-amber-700" : "text-emerald-700"}`}>{off ? "Skipped — tap to undo" : "Milk coming"}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-2">
              <div className="space-y-1"><Label className="text-xs">Another date (up to 30 days)</Label><Input type="date" min={fam.earliest_skip} value={pickDate} onChange={(e) => setPickDate(e.target.value)} className="h-10" data-testid="milk-skip-date-input" /></div>
              <Button variant="outline" className="gap-1.5" disabled={!pickDate || skip.isPending} onClick={() => skip.mutate({ date: pickDate, on: true })} data-testid="milk-skip-date-button"><CalendarOff className="size-4" /> Skip this date</Button>
            </div>
            {error ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700" data-testid="milk-skip-error">{error}</p> : null}
          </div>

          {fam.skip_dates.length ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5" data-testid="milk-skip-list">
              <p className="font-bold text-amber-900">Skipped days ({fam.skip_dates.length})</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {fam.skip_dates.map((d) => (
                  <button key={d} type="button" onClick={() => skip.mutate({ date: d, on: false })} disabled={skip.isPending || d < fam.earliest_skip} data-testid={`milk-unskip-${d}`}
                    className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-semibold text-amber-800 shadow-sm hover:bg-amber-100 disabled:opacity-60">
                    <CalendarPlus className="size-3.5" /> {fmt(d)} · undo
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

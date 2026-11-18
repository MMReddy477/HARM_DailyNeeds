import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calculator, Plus, Receipt, Trash2 } from "lucide-react";

import { useSettings } from "@/components/admin/PosSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inr, SERVICE_TYPE_LABELS, type BillLine } from "@/lib/types";

type Line = { service: string; qty: number };

/** Owner-only Xerox & printing estimator, priced from the rates saved in Settings. */
export default function RateCalculator() {
  const { data: settings } = useSettings();
  const rates = settings?.rates ?? {};
  const services = Object.keys(rates);
  const [svc, setSvc] = useState("xerox-bw");
  const [qty, setQty] = useState("10");
  const [lines, setLines] = useState<Line[]>([]);

  const rate = rates[svc] ?? 0;
  const qtyNum = Math.max(0, parseInt(qty, 10) || 0);
  const total = lines.reduce((s, l) => s + (rates[l.service] ?? 0) * l.qty, 0);
  const navigate = useNavigate();
  const toBill = () => {
    const merged = new Map<string, number>();
    lines.forEach((l) => merged.set(l.service, (merged.get(l.service) ?? 0) + l.qty));
    const billLines: BillLine[] = [...merged].map(([service, q]) => ({ product_id: "", service, name: SERVICE_TYPE_LABELS[service] ?? service, qty: q, price: rates[service] ?? 0, cost: 0 }));
    navigate("/admin/pos", { state: { lines: billLines } });
  };
  const addLine = () => qtyNum > 0 && setLines((ls) => [...ls, { service: svc, qty: qtyNum }]);

  return (
    <div className="grid gap-5 lg:grid-cols-5" data-testid="admin-rate-calculator-section">
      <div className="space-y-5 lg:col-span-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="flex items-center gap-2 text-lg font-bold text-[#111827]"><Calculator className="size-5 text-[#6D28D9]" /> Quick Rate Calculator</p>
          <p className="mt-0.5 text-sm text-slate-500">Estimate a print &amp; xerox bill instantly using your saved counter rates.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_120px]">
            <div className="space-y-1.5">
              <Label>Service</Label>
              <Select value={svc} onValueChange={setSvc}>
                <SelectTrigger className="h-11 w-full bg-white" data-testid="rate-calc-service-select"><SelectValue>{(v: string) => `${SERVICE_TYPE_LABELS[v] ?? v} — ${inr(rates[v] ?? 0)}`}</SelectValue></SelectTrigger>
                <SelectContent>{services.map((k) => <SelectItem key={k} value={k}>{SERVICE_TYPE_LABELS[k] ?? k} — {inr(rates[k])}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <Input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addLine()} className="h-11" data-testid="rate-calc-qty-input" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-violet-50 px-4 py-3">
            <p className="text-[15px] text-slate-700">{qtyNum} × {inr(rate)} = <b className="text-xl text-[#3B0764]" data-testid="rate-calc-line-total">{inr(rate * qtyNum)}</b></p>
            <Button className="gap-1.5 bg-[#6D28D9] hover:bg-[#5B21B6]" disabled={qtyNum <= 0} onClick={addLine} data-testid="rate-calc-add-button"><Plus className="size-4" /> Add to Estimate</Button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-base font-bold">Current Counter Rates</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {services.map((k) => (
              <button key={k} type="button" onClick={() => setSvc(k)} data-testid={`rate-calc-rate-${k}`} className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-left text-[15px] transition-colors ${svc === k ? "border-[#6D28D9] bg-violet-50" : "border-slate-200 hover:border-violet-300"}`}>
                <span className="font-semibold">{SERVICE_TYPE_LABELS[k] ?? k}</span><span className="font-bold text-[#6D28D9]">{inr(rates[k])}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">Change these rates in Settings — the calculator and Billing both use them.</p>
        </div>
      </div>

      <div className="h-fit rounded-2xl border-2 border-[#6D28D9]/20 bg-white p-5 lg:sticky lg:top-4 lg:col-span-2">
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold">Estimate</p>
          {lines.length ? <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setLines([])} data-testid="rate-calc-clear-button">Clear</Button> : null}
        </div>
        <div className="mt-3 space-y-2" data-testid="rate-calc-lines">
          {lines.length === 0 ? <p className="py-6 text-center text-slate-500">Add services to build a quote for the customer.</p> : lines.map((l, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5" data-testid={`rate-calc-line-${i}`}>
              <div className="min-w-0 flex-1"><p className="truncate font-semibold">{SERVICE_TYPE_LABELS[l.service] ?? l.service}</p><p className="text-sm text-slate-500">{l.qty} × {inr(rates[l.service] ?? 0)}</p></div>
              <span className="font-bold">{inr((rates[l.service] ?? 0) * l.qty)}</span>
              <Button size="icon-xs" variant="ghost" className="text-red-600" aria-label="Remove line" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} data-testid={`rate-calc-remove-${i}`}><Trash2 className="size-3" /></Button>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-[#3B0764] px-4 py-3.5">
          <span className="text-sm font-semibold text-purple-200">Estimated Total</span>
          <span className="text-2xl font-extrabold text-amber-300" data-testid="rate-calc-total">{inr(total)}</span>
        </div>
        <Button className="mt-3 h-11 w-full gap-1.5 bg-emerald-600 text-base font-bold hover:bg-emerald-700" disabled={!lines.length} onClick={toBill} data-testid="rate-calc-create-bill-button"><Receipt className="size-4" /> Create Bill from Estimate</Button>
        <p className="mt-2 text-xs text-slate-500">Opens Billing &amp; POS with these services already in the bill.</p>
      </div>
    </div>
  );
}

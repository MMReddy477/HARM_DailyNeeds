import { useState } from "react";
import { Calculator } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRINT_RATES } from "@/lib/constants";

export default function XeroxRates() {
  const [rateId, setRateId] = useState(PRINT_RATES[0].id);
  const [qty, setQty] = useState("10");

  const selected = PRINT_RATES.find((r) => r.id === rateId) ?? PRINT_RATES[0];
  const qtyNum = Math.max(0, parseInt(qty, 10) || 0);
  const total = qtyNum * selected.rate;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
        {PRINT_RATES.map((rate) => (
          <div
            key={rate.id}
            data-testid={`xerox-rate-card-${rate.id}`}
            className="flex items-start gap-3.5 rounded-2xl border border-purple-100 bg-white p-5 shadow-sm transition-[box-shadow,border-color,translate] duration-200 hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-lg"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
              <rate.icon className="size-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p className="font-heading text-xl font-extrabold text-purple-950">₹{rate.rate}+</p>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{rate.unit}</p>
              </div>
              <p className="mt-0.5 font-heading text-sm font-bold text-slate-900">{rate.service}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{rate.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="h-fit rounded-2xl border border-purple-200 bg-purple-50 p-6 shadow-sm lg:sticky lg:top-20">
        <p className="flex items-center gap-2 font-heading text-base font-extrabold text-purple-950">
          <Calculator className="size-4.5" /> Quick Rate Calculator
        </p>
        <p className="mt-1 text-[13px] text-purple-700">Estimate your print &amp; xerox bill instantly.</p>
        <div className="mt-4 space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="xerox-service" className="text-purple-900">Service</Label>
            <Select value={rateId} onValueChange={setRateId}>
              <SelectTrigger id="xerox-service" className="w-full bg-white" data-testid="xerox-calculator-service-select">
                <SelectValue>{(v: string) => PRINT_RATES.find((r) => r.id === v)?.service ?? "Select a service"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PRINT_RATES.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.service} — ₹{r.rate}+</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="xerox-qty" className="text-purple-900">Quantity ({selected.unit})</Label>
            <Input
              id="xerox-qty"
              type="number"
              min={0}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="bg-white"
              data-testid="xerox-calculator-quantity-input"
            />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-purple-900 px-4 py-3" data-testid="xerox-calculator-total">
            <span className="text-sm font-semibold text-purple-200">Estimated Total</span>
            <span className="font-heading text-2xl font-extrabold text-amber-300">₹{total}</span>
          </div>
          <p className="text-[11px] leading-relaxed text-purple-500">
            Final price at the counter may vary with paper size, double-siding and bulk quantity discounts.
          </p>
        </div>
      </div>
    </div>
  );
}

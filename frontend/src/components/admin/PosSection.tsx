import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, MessageCircle, Minus, Plus, Printer, Trash2 } from "lucide-react";

import { useAllProducts } from "@/components/admin/CatalogSections";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError, apiGet, apiPost } from "@/lib/api";
import { PLACEHOLDER_IMG } from "@/lib/constants";
import { inr, SERVICE_TYPE_LABELS, type Bill, type BillLine, type Customer, type StoreSettings } from "@/lib/types";

export const useSettings = () => useQuery({ queryKey: ["admin-settings"], queryFn: () => apiGet<StoreSettings>("/settings") });

export async function downloadFile(path: string, filename: string) {
  const res = await fetch(`/api${path}`);
  if (!res.ok) throw new Error("download failed");
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function receiptText(b: Bill) {
  const lines = b.items.map((i) => `${i.name} x${i.qty} = Rs.${i.price * i.qty}`).join("\n");
  return `H.A.R.M DAILY NEEDS\nBill ${b.number} (${b.recorded_date})\n${lines}\n${b.tax ? `Tax: Rs.${b.tax}\n` : ""}TOTAL: Rs.${b.total}\n${b.customer_phone && (b.points_earned || b.points_balance) ? `Loyalty points earned: ${b.points_earned} (balance ${b.points_balance})\n` : ""}Thank you! Visit again.`;
}

export default function PosSection() {
  const { data: products } = useAllProducts();
  const { data: settings } = useSettings();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const [cart, setCart] = useState<BillLine[]>(() => (location.state as { lines?: BillLine[] } | null)?.lines ?? []);
  const fromEstimate = Boolean((location.state as { lines?: BillLine[] } | null)?.lines?.length);
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [mode, setMode] = useState("cash");
  const [bill, setBill] = useState<Bill | null>(null);
  const [svc, setSvc] = useState("xerox-bw");
  const [svcQty, setSvcQty] = useState("1");

  const phoneDigits = phone.replace(/\D/g, "");
  const loyalty = useQuery({
    queryKey: ["customer-lookup", phoneDigits],
    queryFn: () => apiGet<Customer>(`/customers/lookup?phone=${phoneDigits}`),
    enabled: phoneDigits.length >= 10,
    retry: false,
  });
  const rates = settings?.rates ?? {};
  const matches = q ? (products ?? []).filter((p) => p.available && `${p.name} ${p.brand}`.toLowerCase().includes(q.toLowerCase())).slice(0, 8) : [];
  const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0);
  const tax = Math.round(subtotal * (settings?.tax_percent ?? 0)) / 100;

  const add = (line: BillLine) =>
    setCart((c) => {
      const key = line.product_id || line.service;
      const i = c.findIndex((x) => (x.product_id || x.service) === key);
      if (i < 0) return [...c, line];
      return c.map((x, j) => (j === i ? { ...x, qty: x.qty + line.qty } : x));
    });
  const setQty = (i: number, qty: number) => setCart((c) => (qty <= 0 ? c.filter((_, j) => j !== i) : c.map((x, j) => (j === i ? { ...x, qty } : x))));

  const checkout = useMutation({
    mutationFn: () => apiPost<Bill>("/bills", { items: cart, customer_name: customer, customer_phone: phone, payment_mode: mode }),
    onSuccess: (b) => {
      if (fromEstimate) navigate(location.pathname, { replace: true, state: null });
      setBill(b);
      setCart([]);
      setCustomer("");
      setPhone("");
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["admin-summary"] });
      qc.invalidateQueries({ queryKey: ["admin-revenue"] });
      qc.invalidateQueries({ queryKey: ["admin-customers"] });
      qc.invalidateQueries({ queryKey: ["customer-lookup"] });
      toast.success(`Bill ${b.number} saved`);
    },
    onError: (e) => toast.error(e instanceof ApiError && typeof (e.body as { detail?: unknown })?.detail === "string" ? String((e.body as { detail: string }).detail) : "Billing failed"),
  });

  return (
    <div className="grid gap-5 lg:grid-cols-5" data-testid="admin-pos-section">
      <div className="space-y-4 lg:col-span-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <Label className="text-base font-bold">Search Product</Label>
          <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type milk, pen, notebook…" className="mt-2 h-12 text-base" data-testid="pos-search-input" />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {matches.map((p) => (
              <button key={p.id} type="button" disabled={p.stock <= 0} onClick={() => { add({ product_id: p.id, service: "", name: p.name, qty: 1, price: p.price, cost: p.cost_price }); setQ(""); }} data-testid={`pos-add-${p.id}`} className="flex items-center gap-3 rounded-xl border border-slate-200 p-2.5 text-left transition-colors hover:border-[#6D28D9] hover:bg-violet-50 disabled:opacity-40">
                <img src={p.image || PLACEHOLDER_IMG} alt="" className="size-11 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-[#111827]">{p.name}</p>
                  <p className="text-sm text-slate-500">{inr(p.price)} · {p.stock} in stock</p>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-base font-bold">Add Xerox / Printing Service</p>
          <div className="mt-3 flex flex-wrap items-end gap-2.5">
            <Select value={svc} onValueChange={setSvc}>
              <SelectTrigger className="h-11 min-w-52 bg-white" data-testid="pos-service-select"><SelectValue>{(v: string) => `${SERVICE_TYPE_LABELS[v]} — ${inr(rates[v] ?? 0)}`}</SelectValue></SelectTrigger>
              <SelectContent>{Object.keys(rates).map((k) => <SelectItem key={k} value={k}>{SERVICE_TYPE_LABELS[k] ?? k} — {inr(rates[k])}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="number" min={1} value={svcQty} onChange={(e) => setSvcQty(e.target.value)} className="h-11 w-24" data-testid="pos-service-qty" />
            <span className="pb-2.5 text-lg font-bold" data-testid="pos-service-total">= {inr((rates[svc] ?? 0) * (parseInt(svcQty, 10) || 0))}</span>
            <Button className="h-11 bg-[#6D28D9] hover:bg-[#5B21B6]" onClick={() => add({ product_id: "", service: svc, name: SERVICE_TYPE_LABELS[svc] ?? svc, qty: Math.max(1, parseInt(svcQty, 10) || 1), price: rates[svc] ?? 0, cost: 0 })} data-testid="pos-service-add">Add to Bill</Button>
          </div>
        </div>
      </div>

      <div className="h-fit rounded-2xl border-2 border-[#6D28D9]/20 bg-white p-5 lg:col-span-2 lg:sticky lg:top-4">
        <p className="text-lg font-bold">Current Bill</p>
        <div className="mt-3 space-y-2" data-testid="pos-cart">
          {cart.length === 0 ? <p className="py-6 text-center text-slate-500">Cart is empty — search a product to begin.</p> : cart.map((l, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5" data-testid={`pos-cart-line-${i}`}>
              <div className="min-w-0 flex-1"><p className="truncate font-semibold">{l.name}</p><p className="text-sm text-slate-500">{inr(l.price)} each</p></div>
              <Button size="icon-xs" variant="outline" onClick={() => setQty(i, l.qty - 1)} aria-label="Less"><Minus className="size-3" /></Button>
              <span className="w-7 text-center font-bold">{l.qty}</span>
              <Button size="icon-xs" variant="outline" onClick={() => setQty(i, l.qty + 1)} aria-label="More"><Plus className="size-3" /></Button>
              <span className="w-16 text-right font-bold">{inr(l.price * l.qty)}</span>
              <Button size="icon-xs" variant="ghost" className="text-red-600" onClick={() => setQty(i, 0)} aria-label="Remove"><Trash2 className="size-3" /></Button>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Customer name (optional)" data-testid="pos-customer-name" />
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp no. (optional)" data-testid="pos-customer-phone" />
        </div>
        {phoneDigits.length >= 10 ? (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800" data-testid="pos-loyalty-info">
            {loyalty.data
              ? `⭐ ${loyalty.data.name || "Returning customer"} · ${loyalty.data.points} points · ${loyalty.data.visits} visits`
              : loyalty.isLoading ? "Checking loyalty…" : "New customer — will start earning points on this bill"}
            {subtotal >= 100 ? ` · +${Math.floor((subtotal + tax) / 100)} on this bill` : ""}
          </p>
        ) : null}
        <div className="mt-3 flex gap-1.5">
          {["cash", "upi", "card"].map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} data-testid={`pos-mode-${m}`} className={`flex-1 rounded-lg border py-2 text-sm font-bold uppercase ${mode === m ? "border-[#6D28D9] bg-[#6D28D9] text-white" : "border-slate-200 text-slate-600"}`}>{m}</button>
          ))}
        </div>
        <div className="mt-4 space-y-1 border-t pt-3 text-[15px]">
          <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{inr(subtotal)}</span></div>
          {tax ? <div className="flex justify-between text-slate-600"><span>Tax ({settings?.tax_percent}%)</span><span>₹{tax.toFixed(2)}</span></div> : null}
          <div className="flex justify-between text-2xl font-extrabold text-[#111827]"><span>Total</span><span data-testid="pos-total">{inr(subtotal + tax)}</span></div>
        </div>
        <Button className="mt-4 h-12 w-full bg-[#6D28D9] text-base font-bold hover:bg-[#5B21B6]" disabled={!cart.length || checkout.isPending} onClick={() => checkout.mutate()} data-testid="pos-checkout-button">
          {checkout.isPending ? "Saving…" : "Complete Sale"}
        </Button>
      </div>

      <Dialog open={!!bill} onOpenChange={(v) => !v && setBill(null)}>
        <DialogContent data-testid="pos-receipt-dialog">
          <DialogHeader><DialogTitle>Receipt {bill?.number}</DialogTitle></DialogHeader>
          {bill ? (
            <>
              <pre id="harm-receipt" className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 font-mono text-sm">{receiptText(bill)}</pre>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" className="gap-1.5" data-testid="receipt-print" onClick={() => { const w = window.open("", "_blank", "width=380,height=600"); if (w) { w.document.write(`<pre style="font:14px monospace">${receiptText(bill).replace(/</g, "&lt;")}</pre>`); w.print(); } }}><Printer className="size-4" /> Print</Button>
                <a className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700" data-testid="receipt-whatsapp" target="_blank" rel="noreferrer" href={`https://wa.me/${bill.customer_phone.replace(/\D/g, "").replace(/^(\d{10})$/, "91$1")}?text=${encodeURIComponent(receiptText(bill))}`}><MessageCircle className="size-4" /> WhatsApp</a>
                <Button variant="outline" className="gap-1.5" data-testid="receipt-pdf" onClick={() => downloadFile(`/bills/${bill.id}/pdf`, `${bill.number}.pdf`).catch(() => toast.error("PDF failed"))}><Download className="size-4" /> PDF</Button>
              </div>
              {bill.customer_phone && (bill.points_earned || bill.points_balance) ? <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800" data-testid="receipt-points">⭐ +{bill.points_earned} points earned · balance {bill.points_balance}</p> : null}
              <p className="text-sm text-slate-500">Profit on this bill: <b className="text-emerald-700">{inr(bill.profit)}</b></p>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

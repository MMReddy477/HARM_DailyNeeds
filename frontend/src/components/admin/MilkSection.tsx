import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarOff, Home as HomeIcon, Mail, MessageCircle, Printer, Store, Truck, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { inr, milkWhere, type MilkList, type MilkListLine, type MilkStatement, type MilkSubscriptionView } from "@/lib/types";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  paused: "bg-amber-100 text-amber-800",
  cancelled: "bg-slate-200 text-slate-600",
};

function ListBlock({ title, icon: Icon, lines, testid }: { title: string; icon: typeof Store; lines: MilkListLine[]; testid: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5" data-testid={testid}>
      <p className="flex items-center gap-2 text-base font-bold"><Icon className="size-4 text-[#6D28D9]" /> {title} ({lines.length})</p>
      <div className="mt-3 space-y-2">
        {lines.length === 0 ? <p className="text-sm text-slate-500">None for tomorrow.</p> : lines.map((l) => (
          <div key={l.subscription_id} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-[15px]">
            <div className="min-w-0"><p className="font-semibold">{l.name} <span className="text-xs text-slate-400">{l.code}</span></p>{milkWhere(l) ? <p className="text-sm text-slate-500">{milkWhere(l)}</p> : null}<p className="text-xs text-slate-400">+{l.phone}</p></div>
            <p className="shrink-0 text-right"><span className="text-sm text-slate-500">{l.product_name}</span><br /><b className="text-lg">× {l.qty}</b></p>
          </div>
        ))}
      </div>
    </div>
  );
}

const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);

function printRouteSheet(m: MilkList) {
  const groups = new Map<string, Map<string, MilkListLine[]>>();
  m.deliveries.forEach((l) => {
    const b = l.building || l.address || "Other";
    const f = l.floor || "—";
    if (!groups.has(b)) groups.set(b, new Map());
    const fl = groups.get(b)!;
    fl.set(f, [...(fl.get(f) ?? []), l]);
  });
  const body = [...groups].map(([b, floors]) => {
    const n = [...floors.values()].flat().reduce((s, l) => s + l.qty, 0);
    return `<h2>${esc(b)} <small>${n} packet${n === 1 ? "" : "s"}</small></h2>` + [...floors].map(([f, ls]) => `<h3>Floor ${esc(f)}</h3><table>${ls.map((l) =>
      `<tr><td class="box">☐</td><td><b>${esc(l.flat || "-")}</b></td><td>${esc(l.name)}<br><small>+${esc(l.phone)}${l.address ? " · " + esc(l.address) : ""}</small></td><td>${esc(l.product_name)}</td><td class="q">× ${l.qty}</td></tr>`).join("")}</table>`).join("");
  }).join("");
  const w = window.open("", "_blank", "width=820,height=900");
  if (!w) return;
  w.document.write(`<html><head><title>Milk Route Sheet ${m.date}</title><style>
    body{font:14px Arial,sans-serif;margin:24px;color:#111}h1{margin:0;color:#3B0764}h2{margin:22px 0 4px;border-bottom:2px solid #3B0764;padding-bottom:4px}h2 small{font-weight:normal;color:#666}
    h3{margin:12px 0 4px;color:#6D28D9}table{width:100%;border-collapse:collapse}td{border-bottom:1px solid #ddd;padding:7px 6px;vertical-align:top}.box{width:22px;font-size:18px}.q{text-align:right;font-weight:bold;font-size:16px;white-space:nowrap}
    .sum{margin-top:6px;color:#444}@media print{button{display:none}}</style></head><body>
    <h1>H.A.R.M DAILY NEEDS — Milk Delivery Route</h1><p class="sum">${esc(m.date)} · ${m.deliveries.length} homes · ${m.deliveries.reduce((s, l) => s + l.qty, 0)} packets</p>
    <button onclick="window.print()">Print</button>${body || "<p>No home deliveries for this day.</p>"}</body></html>`);
  w.document.close();
}

function statementText(st: MilkStatement, skipUrl: string) {
  const s = st.subscription;
  const monthName = new Date(`${st.month}-01T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  return [
    `*H.A.R.M DAILY NEEDS — Milk Statement*`,
    `${monthName} · ${s.name} (${s.code})`,
    ``,
    `Milk: ${s.qty} × ${s.product_name} daily`,
    `Days delivered: ${st.days.length}`,
    `Packets taken: ${st.packets}`,
    `Amount this month: ${inr(st.amount)}`,
    `Paid this month: ${inr(st.paid_in_month)}`,
    `*Balance due: ${inr(st.balance_due)}*`,
    ``,
    `Please pay at the counter. Travelling? Skip a day here: ${skipUrl}`,
    `Thank you!`,
  ].join("\n");
}

export default function MilkSection() {
  const qc = useQueryClient();
  const { data: list } = useQuery({ queryKey: ["milk-tomorrow"], queryFn: () => apiGet<MilkList>("/admin/milk/tomorrow") });
  const { data: subs } = useQuery({ queryKey: ["milk-subs"], queryFn: () => apiGet<MilkSubscriptionView[]>("/admin/milk/subscriptions") });
  const [paying, setPaying] = useState<MilkSubscriptionView | null>(null);
  const [amount, setAmount] = useState("");
  const refresh = () => { qc.invalidateQueries({ queryKey: ["milk-tomorrow"] }); qc.invalidateQueries({ queryKey: ["milk-subs"] }); };

  const sendNow = useMutation({ mutationFn: () => apiPost<MilkList>("/admin/milk/tomorrow/send"), onSuccess: (m) => { refresh(); toast.success(`Milk list for ${m.date} locked — email ${m.email_status}`); } });
  const setStatus = useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => apiPatch(`/admin/milk/subscriptions/${id}`, { status }), onSuccess: () => { refresh(); toast.success("Subscription updated"); } });
  const pay = useMutation({
    mutationFn: () => apiPost<MilkSubscriptionView>(`/admin/milk/subscriptions/${paying?.id}/payments`, { amount: Number(amount) }),
    onSuccess: (s) => { refresh(); setPaying(null); setAmount(""); toast.success(`Payment saved — ${s.name} now owes ${inr(s.balance_due)}`); },
    onError: () => toast.error("Enter a valid amount"),
  });
  const skipTomorrow = useMutation({
    mutationFn: ({ id, on }: { id: string; on: boolean }) => apiPost(`/admin/milk/subscriptions/${id}/skip`, { date: list?.date, skip: on }),
    onSuccess: (_, v) => { refresh(); toast.success(v.on ? "Skipped for tomorrow — no charge" : "Skip removed"); },
  });
  const sendStatement = async (s: MilkSubscriptionView) => {
    const w = window.open("", "_blank");
    try {
      const st = await apiGet<MilkStatement>(`/admin/milk/subscriptions/${s.id}/statement`);
      const text = statementText(st, `${window.location.origin}/milk-skip?code=${s.code}`);
      const url = `https://wa.me/${s.phone}?text=${encodeURIComponent(text)}`;
      if (w) w.location.href = url;
      else window.location.href = url;
    } catch {
      w?.close();
      toast.error("Could not build the statement");
    }
  };
  const totalDue = (subs ?? []).reduce((s, x) => s + Math.max(0, x.balance_due), 0);

  return (
    <div className="space-y-6" data-testid="admin-milk-section">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-br from-[#3B0764] to-[#6D28D9] p-5 text-white sm:col-span-1" data-testid="milk-tomorrow-total">
          <p className="text-sm font-semibold text-purple-200">Tomorrow · {list?.date}</p>
          <p className="mt-1 text-4xl font-extrabold">{list?.total_packets ?? 0} <span className="text-lg font-semibold">packets</span></p>
          <div className="mt-2 space-y-0.5 text-sm text-purple-100">{(list?.by_product ?? []).map((b) => <p key={b.product_name}>{b.product_name}: <b>{b.packets}</b></p>)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-slate-600">Active subscriptions</p>
          <p className="mt-1 text-3xl font-extrabold" data-testid="milk-active-count">{(subs ?? []).filter((s) => s.status === "active").length}</p>
          <p className="text-sm text-slate-500">{list?.deliveries.length ?? 0} delivery · {list?.pickups.length ?? 0} pickup tomorrow</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-slate-600">Total dues to collect</p>
          <p className="mt-1 text-3xl font-extrabold text-orange-600" data-testid="milk-total-due">{inr(totalDue)}</p>
          <Button variant="outline" size="sm" className="mt-2 gap-1.5" disabled={sendNow.isPending} onClick={() => sendNow.mutate()} data-testid="milk-send-now-button"><Mail className="size-4" /> Lock &amp; email list now</Button>
          <p className="mt-1 text-xs text-slate-500">Runs automatically every night at 9:00 PM.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-5" data-testid="milk-order-plan">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-lg font-bold"><Truck className="size-5 text-orange-600" /> Order from supplier for {list?.date}</p>
          <p className="text-xs text-slate-500">Booked packets + average daily counter sales (last 7 days) − stock in hand</p>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-[15px]">
            <thead className="text-left text-sm text-slate-600"><tr><th className="py-2">Milk</th><th className="py-2 text-right">Booked</th><th className="py-2 text-right">+ Walk-in</th><th className="py-2 text-right">− In stock</th><th className="py-2 text-right">Order</th></tr></thead>
            <tbody>
              {(list?.order_plan ?? []).length === 0 ? <tr><td colSpan={5} className="py-3 text-slate-500">No milk needed.</td></tr> : (list?.order_plan ?? []).map((o) => (
                <tr key={o.product_id} className="border-t border-orange-100" data-testid={`milk-order-row-${o.product_id}`}>
                  <td className="py-2 font-semibold">{o.product_name}</td><td className="py-2 text-right">{o.subscribed}</td><td className="py-2 text-right">{o.walk_in_avg}</td><td className="py-2 text-right">{o.in_stock}</td>
                  <td className="py-2 text-right text-xl font-extrabold text-orange-600" data-testid={`milk-order-qty-${o.product_id}`}>{o.to_order}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-sm font-semibold text-orange-800" data-testid="milk-order-total">Total to order: {(list?.order_plan ?? []).reduce((s, o) => s + o.to_order, 0)} packets</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button className="gap-1.5 bg-[#6D28D9] hover:bg-[#5B21B6]" disabled={!list?.deliveries.length} onClick={() => list && printRouteSheet(list)} data-testid="milk-route-sheet-button"><Printer className="size-4" /> Print Delivery Route Sheet</Button>
        <span className="text-sm text-slate-500">Grouped by building and floor, with tick boxes for the delivery person.</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ListBlock title="Home Delivery" icon={HomeIcon} lines={list?.deliveries ?? []} testid="milk-deliveries-list" />
        <ListBlock title="Counter Pickup" icon={Store} lines={list?.pickups ?? []} testid="milk-pickups-list" />
      </div>
      {list?.skipped.length ? <ListBlock title="Skipped Tomorrow (no charge)" icon={CalendarOff} lines={list.skipped} testid="milk-skipped-list" /> : null}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <p className="px-5 pt-5 text-lg font-bold">All Subscriptions &amp; Dues</p>
        <p className="px-5 text-xs text-slate-500">Each night's 9 PM list adds that day's milk to the family's dues. Record counter payments here.</p>
        <table className="mt-3 w-full text-[15px]">
          <thead className="bg-slate-50 text-left text-sm text-slate-600"><tr><th className="p-3">Family</th><th className="p-3">Milk</th><th className="p-3">Type</th><th className="p-3 text-right">This Month</th><th className="p-3 text-right">Balance Due</th><th className="p-3">Status</th><th className="p-3" /></tr></thead>
          <tbody>
            {(subs ?? []).length === 0 ? <tr><td colSpan={7} className="p-6 text-center text-slate-500" data-testid="milk-subs-empty">No subscriptions yet — share the Milk Subscription page with families.</td></tr> : (subs ?? []).map((s) => (
              <tr key={s.id} className="border-t align-top" data-testid={`milk-sub-row-${s.code}`}>
                <td className="p-3"><p className="font-semibold">{s.name} <span className="text-xs text-slate-400">{s.code}</span></p><p className="text-xs text-slate-500">+{s.phone} · from {s.start_date}</p></td>
                <td className="p-3">{s.qty} × {s.product_name}<p className="text-xs text-slate-500">{inr(s.unit_price * s.qty)}/day</p></td>
                <td className="p-3">{s.mode === "delivery" ? <span title={milkWhere(s)}>Delivery<p className="max-w-40 truncate text-xs text-slate-500">{milkWhere(s)}</p></span> : "Pickup"}</td>
                <td className="p-3 text-right">{s.month_packets} pkts<p className="text-xs text-slate-500">{inr(s.month_amount)}</p></td>
                <td className={`p-3 text-right font-extrabold ${s.balance_due > 0 ? "text-orange-600" : "text-emerald-700"}`} data-testid={`milk-sub-due-${s.code}`}>{inr(s.balance_due)}</td>
                <td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${STATUS_STYLE[s.status]}`} data-testid={`milk-sub-status-${s.code}`}>{s.status}</span></td>
                <td className="p-3">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => { setPaying(s); setAmount(s.balance_due > 0 ? String(s.balance_due) : ""); }} data-testid={`milk-sub-pay-${s.code}`}><Wallet className="size-3.5" /> Payment</Button>
                    <Button size="sm" variant="outline" className="gap-1 border-emerald-300 text-emerald-700" onClick={() => sendStatement(s)} data-testid={`milk-sub-statement-${s.code}`}><MessageCircle className="size-3.5" /> Statement</Button>
                    {s.status === "active" && list ? (s.skip_dates.includes(list.date)
                      ? <Button size="sm" variant="outline" className="border-amber-300 text-amber-700" onClick={() => skipTomorrow.mutate({ id: s.id, on: false })} data-testid={`milk-sub-unskip-${s.code}`}>Undo skip</Button>
                      : <Button size="sm" variant="outline" onClick={() => skipTomorrow.mutate({ id: s.id, on: true })} data-testid={`milk-sub-skip-${s.code}`}>Skip tomorrow</Button>) : null}
                    {s.status === "active" ? <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: s.id, status: "paused" })} data-testid={`milk-sub-pause-${s.code}`}>Pause</Button> : null}
                    {s.status === "paused" || s.status === "cancelled" ? <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: s.id, status: "active" })} data-testid={`milk-sub-resume-${s.code}`}>Resume</Button> : null}
                    {s.status !== "cancelled" ? <Button size="sm" variant="ghost" className="text-red-600" onClick={() => window.confirm(`Cancel ${s.name}'s milk subscription?`) && setStatus.mutate({ id: s.id, status: "cancelled" })} data-testid={`milk-sub-cancel-${s.code}`}>Cancel</Button> : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!paying} onOpenChange={(v) => !v && setPaying(null)}>
        <DialogContent data-testid="milk-payment-dialog">
          <DialogHeader><DialogTitle>Record payment — {paying?.name}</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">Balance due: <b>{inr(paying?.balance_due ?? 0)}</b></p>
          <div className="space-y-1.5"><Label>Amount received (₹)</Label><Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} className="h-11 text-lg" data-testid="milk-payment-amount-input" /></div>
          <Button className="h-11 bg-[#6D28D9] hover:bg-[#5B21B6]" disabled={!(Number(amount) > 0) || pay.isPending} onClick={() => pay.mutate()} data-testid="milk-payment-save-button">Save Payment</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

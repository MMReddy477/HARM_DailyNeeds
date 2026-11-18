import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, MessageCircle, Plus, Trash2 } from "lucide-react";

import { useAllProducts } from "@/components/admin/CatalogSections";
import { Kpi, useOverview } from "@/components/admin/DashboardHome";
import { downloadFile, useSettings } from "@/components/admin/PosSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import { inr, SERVICE_TYPE_LABELS, type KitView, type PrintOrder, type PrintStatusResult, type Purchase, type StoreSettings, type Transaction } from "@/lib/types";
import { Banknote, CalendarDays, Hash } from "lucide-react";

const STATUS_CLS: Record<string, string> = { received: "bg-sky-100 text-sky-800", printing: "bg-amber-100 text-amber-800", ready: "bg-emerald-100 text-emerald-800", collected: "bg-slate-200 text-slate-700" };

export function XeroxSection() {
  const qc = useQueryClient();
  const { data: settings } = useSettings();
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const shown = rates ?? settings?.rates ?? {};
  const { data: orders } = useQuery({ queryKey: ["admin-print-orders"], queryFn: () => apiGet<PrintOrder[]>("/print-orders") });

  const saveRates = useMutation({
    mutationFn: () => apiPut<StoreSettings>("/settings", { ...settings, rates: shown }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-settings"] }); setRates(null); toast.success("Rates saved"); },
  });
  const status = useMutation({
    mutationFn: ({ id, s }: { id: string; s: string }) => apiPatch<PrintStatusResult>(`/print-orders/${id}/status`, { status: s }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["admin-print-orders"] });
      if (r.order.status === "ready") {
        if (r.whatsapp_sent) toast.success("Customer notified automatically on WhatsApp");
        else window.open(r.whatsapp_link, "_blank");
      }
    },
  });

  return (
    <div className="space-y-5" data-testid="admin-xerox-section">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between"><p className="text-lg font-bold">Service Rates</p><Button disabled={!rates} onClick={() => saveRates.mutate()} className="bg-[#6D28D9] hover:bg-[#5B21B6]" data-testid="rates-save-button">Save Rates</Button></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(shown).map(([k, v]) => (
            <div key={k} className="space-y-1">
              <Label className="text-sm">{SERVICE_TYPE_LABELS[k] ?? k} (₹)</Label>
              <Input type="number" min={0} value={v} onChange={(e) => setRates({ ...shown, [k]: Number(e.target.value) })} className="h-10 text-base" data-testid={`rate-input-${k}`} />
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-500">These rates are used by Billing & POS to auto-calculate xerox and printing bills.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-lg font-bold">Online Print Orders</p>
        <p className="text-sm text-slate-500">{settings?.whatsapp_auto ? "Automatic WhatsApp is ON — customers are messaged when you mark Ready." : "Marking Ready opens WhatsApp with the message pre-filled (add Twilio keys for automatic sending)."}</p>
        <div className="mt-3 overflow-hidden rounded-xl border">
          <Table className="text-[15px]">
            <TableHeader><TableRow className="bg-slate-50"><TableHead>Code</TableHead><TableHead>Customer</TableHead><TableHead>Job</TableHead><TableHead>File</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {(orders ?? []).length === 0 ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-slate-500">No online orders yet.</TableCell></TableRow> : (orders ?? []).map((o) => (
                <TableRow key={o.id} data-testid={`print-order-row-${o.id}`}>
                  <TableCell className="font-bold">{o.code}</TableCell>
                  <TableCell>{o.name}<p className="text-xs text-slate-500">+{o.phone}</p></TableCell>
                  <TableCell className="text-sm">{o.copies} cop{o.copies > 1 ? "ies" : "y"} · {o.color ? "Colour" : "B&W"}{o.binding ? " · Binding" : ""}{o.notes ? <p className="text-xs text-slate-500">{o.notes}</p> : null}</TableCell>
                  <TableCell><Button size="sm" variant="outline" className="gap-1" onClick={() => downloadFile(`/print-orders/${o.id}/file`, o.file_name).catch(() => toast.error("Download failed"))} data-testid={`print-order-download-${o.id}`}><Download className="size-3.5" /> {o.file_name.slice(0, 18)}</Button></TableCell>
                  <TableCell><span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${STATUS_CLS[o.status]}`}>{o.status}</span></TableCell>
                  <TableCell className="space-x-1 text-right">
                    {o.status === "received" ? <Button size="sm" variant="outline" onClick={() => status.mutate({ id: o.id, s: "printing" })} data-testid={`print-order-printing-${o.id}`}>Start</Button> : null}
                    {o.status !== "ready" && o.status !== "collected" ? <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => status.mutate({ id: o.id, s: "ready" })} data-testid={`print-order-ready-${o.id}`}><MessageCircle className="size-3.5" /> Ready & Notify</Button> : null}
                    {o.status === "ready" ? <Button size="sm" variant="outline" onClick={() => status.mutate({ id: o.id, s: "collected" })} data-testid={`print-order-collected-${o.id}`}>Collected</Button> : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export function PurchasesSection() {
  const qc = useQueryClient();
  const { data: products } = useAllProducts();
  const { data: list } = useQuery({ queryKey: ["admin-purchases"], queryFn: () => apiGet<Purchase[]>("/purchases") });
  const [pid, setPid] = useState("");
  const [qty, setQty] = useState("");
  const [cost, setCost] = useState("");
  const [vendor, setVendor] = useState("");
  const add = useMutation({
    mutationFn: () => apiPost<Purchase>("/purchases", { product_id: pid, qty: Number(qty), cost_total: Number(cost), vendor }),
    onSuccess: (p) => { qc.invalidateQueries({ queryKey: ["admin-purchases"] }); qc.invalidateQueries({ queryKey: ["products"] }); qc.invalidateQueries({ queryKey: ["admin-summary"] }); setQty(""); setCost(""); toast.success(`Stock of ${p.product_name} increased by ${p.qty}`); },
    onError: () => toast.error("Could not save purchase"),
  });
  const vendors = Array.from(new Set((list ?? []).map((p) => p.vendor).filter(Boolean)));
  return (
    <div className="space-y-5" data-testid="admin-purchases-section">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="space-y-1"><Label>Product</Label>
          <Select value={pid} onValueChange={setPid}><SelectTrigger className="h-11 min-w-64 bg-white" data-testid="purchase-product-select"><SelectValue>{(v: string) => products?.find((p) => p.id === v)?.name ?? "Choose product…"}</SelectValue></SelectTrigger>
            <SelectContent>{(products ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.stock} in stock)</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1"><Label>Quantity Bought</Label><Input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} className="h-11 w-32" data-testid="purchase-qty-input" /></div>
        <div className="space-y-1"><Label>Total Cost (₹)</Label><Input type="number" min={1} value={cost} onChange={(e) => setCost(e.target.value)} className="h-11 w-36" data-testid="purchase-cost-input" /></div>
        <div className="space-y-1"><Label>Vendor</Label><Input list="harm-vendors" value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="e.g. Amul Distributor" className="h-11 w-56" data-testid="purchase-vendor-input" /><datalist id="harm-vendors">{vendors.map((v) => <option key={v} value={v} />)}</datalist></div>
        <Button className="h-11 gap-1.5 bg-[#6D28D9] hover:bg-[#5B21B6]" disabled={!pid || !(Number(qty) > 0) || !(Number(cost) > 0) || add.isPending} onClick={() => add.mutate()} data-testid="purchase-submit-button"><Plus className="size-4" /> Add Purchase</Button>
      </div>
      {Number(qty) > 0 && Number(cost) > 0 ? <p className="text-sm text-slate-600">Unit cost will be set to <b>{inr(Number(cost) / Number(qty))}</b> — stock increases automatically.</p> : null}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <Table className="text-[15px]">
          <TableHeader><TableRow className="bg-slate-50"><TableHead>Date</TableHead><TableHead>Product</TableHead><TableHead>Vendor</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Unit Cost</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
          <TableBody>{(list ?? []).length === 0 ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-slate-500">No purchases recorded yet.</TableCell></TableRow> : (list ?? []).map((p) => (
            <TableRow key={p.id} data-testid={`purchase-row-${p.id}`}><TableCell>{p.recorded_date}</TableCell><TableCell className="font-semibold">{p.product_name}</TableCell><TableCell>{p.vendor || "—"}</TableCell><TableCell className="text-right">{p.qty}</TableCell><TableCell className="text-right">{inr(p.unit_cost)}</TableCell><TableCell className="text-right font-bold">{inr(p.cost_total)}</TableCell></TableRow>
          ))}</TableBody>
        </Table>
      </div>
    </div>
  );
}

export function MoneySection() {
  const qc = useQueryClient();
  const { data: o } = useOverview();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [commission, setCommission] = useState("");
  const { data: list } = useQuery({ queryKey: ["admin-revenue", "money-transfer"], queryFn: () => apiGet<Transaction[]>("/revenue?type=money-transfer") });
  const add = useMutation({
    mutationFn: () => apiPost<Transaction>("/revenue", { type: "money-transfer", amount: Number(commission), transfer_amount: Number(amount), customer_name: name.trim(), description: `Transfer Rs.${amount}` }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-revenue"] }); qc.invalidateQueries({ queryKey: ["admin-summary"] }); setName(""); setAmount(""); setCommission(""); toast.success("Transfer recorded"); },
    onError: () => toast.error("Enter a commission greater than 0"),
  });
  return (
    <div className="space-y-5" data-testid="admin-money-section">
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Today's Commission" value={inr(o?.today_commission ?? 0)} icon={Banknote} tone="bg-emerald-100 text-emerald-700" testid="money-kpi-today" />
        <Kpi label="Monthly Commission" value={inr(o?.month_commission ?? 0)} icon={CalendarDays} tone="bg-violet-100 text-[#6D28D9]" testid="money-kpi-month" />
        <Kpi label="Total Transactions" value={String(o?.transfer_count ?? 0)} icon={Hash} tone="bg-sky-100 text-sky-700" testid="money-kpi-count" />
      </div>
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="space-y-1"><Label>Customer Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 w-56" data-testid="money-customer-input" /></div>
        <div className="space-y-1"><Label>Transfer Amount (₹)</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-11 w-40" data-testid="money-amount-input" /></div>
        <div className="space-y-1"><Label>Commission (₹)</Label><Input type="number" value={commission} onChange={(e) => setCommission(e.target.value)} className="h-11 w-32" data-testid="money-commission-input" /></div>
        <Button className="h-11 gap-1.5 bg-[#6D28D9] hover:bg-[#5B21B6]" disabled={!name.trim() || !(Number(commission) > 0) || add.isPending} onClick={() => add.mutate()} data-testid="money-submit-button"><Plus className="size-4" /> Record Transfer</Button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <Table className="text-[15px]">
          <TableHeader><TableRow className="bg-slate-50"><TableHead>Date</TableHead><TableHead>Customer</TableHead><TableHead className="text-right">Transfer Amount</TableHead><TableHead className="text-right">Commission</TableHead></TableRow></TableHeader>
          <TableBody>{(list ?? []).map((t) => (
            <TableRow key={t.id} data-testid={`money-row-${t.id}`}><TableCell>{t.recorded_date}</TableCell><TableCell className="font-semibold">{t.customer_name || "—"}</TableCell><TableCell className="text-right">{t.transfer_amount ? inr(t.transfer_amount) : t.description}</TableCell><TableCell className="text-right font-bold text-emerald-700">{inr(t.amount)}</TableCell></TableRow>
          ))}</TableBody>
        </Table>
      </div>
    </div>
  );
}

export function KitsEditor() {
  const qc = useQueryClient();
  const { data: kits } = useQuery({ queryKey: ["kits"], queryFn: () => apiGet<KitView[]>("/kits") });
  const { data: products } = useAllProducts();
  const save = useMutation({
    mutationFn: (k: KitView) => apiPut<KitView>(`/kits/${k.id}`, { name: k.name, class_range: k.class_range, description: k.description, sort: k.sort, items: k.items.map((i) => ({ product_id: i.product_id, qty: i.qty })) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kits"] }),
  });
  const create = useMutation({ mutationFn: () => apiPost<KitView>("/kits", { name: "New Kit", class_range: "Class —", description: "", items: [], sort: (kits?.length ?? 0) + 1 }), onSuccess: () => qc.invalidateQueries({ queryKey: ["kits"] }) });
  const remove = useMutation({ mutationFn: (id: string) => apiDelete<void>(`/kits/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["kits"] }) });

  return (
    <div className="space-y-4" data-testid="admin-kits-editor">
      <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Back-to-School Kits</h2><Button variant="outline" className="gap-1.5" onClick={() => create.mutate()} data-testid="kit-add-button"><Plus className="size-4" /> New Kit</Button></div>
      <div className="grid gap-4 lg:grid-cols-3">
        {(kits ?? []).map((k) => (
          <div key={k.id} className="space-y-2.5 rounded-2xl border border-slate-200 bg-white p-4" data-testid={`kit-card-${k.id}`}>
            <Input defaultValue={k.name} onBlur={(e) => e.target.value !== k.name && save.mutate({ ...k, name: e.target.value })} className="font-bold" data-testid={`kit-name-${k.id}`} />
            <Input defaultValue={k.class_range} onBlur={(e) => e.target.value !== k.class_range && save.mutate({ ...k, class_range: e.target.value })} data-testid={`kit-class-${k.id}`} />
            {k.items.map((it) => (
              <div key={it.product_id} className="flex items-center gap-2 text-sm">
                <span className="flex-1 truncate">{it.name}</span>
                <Input type="number" min={1} defaultValue={it.qty} className="h-8 w-16" onBlur={(e) => Number(e.target.value) !== it.qty && save.mutate({ ...k, items: k.items.map((x) => (x.product_id === it.product_id ? { ...x, qty: Math.max(1, Number(e.target.value)) } : x)) })} />
                <Button size="icon-xs" variant="ghost" className="text-red-600" onClick={() => save.mutate({ ...k, items: k.items.filter((x) => x.product_id !== it.product_id) })} aria-label="Remove item"><Trash2 className="size-3" /></Button>
              </div>
            ))}
            <Select value="" onValueChange={(v) => v && save.mutate({ ...k, items: [...k.items, { product_id: v, qty: 1, name: "", price: 0, image: "" }] })}>
              <SelectTrigger size="sm" className="w-full" data-testid={`kit-add-item-${k.id}`}><SelectValue>{() => "+ Add product"}</SelectValue></SelectTrigger>
              <SelectContent>{(products ?? []).filter((p) => !k.items.some((i) => i.product_id === p.id)).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
            <div className="flex items-center justify-between border-t pt-2"><span className="text-lg font-extrabold">{inr(k.total)}</span><Button size="sm" variant="ghost" className="text-red-600" onClick={() => window.confirm("Delete kit?") && remove.mutate(k.id)} data-testid={`kit-delete-${k.id}`}>Delete</Button></div>
          </div>
        ))}
      </div>
    </div>
  );
}

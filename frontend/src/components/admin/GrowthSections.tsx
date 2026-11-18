import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Award, CalendarDays } from "lucide-react";

import { useAllProducts } from "@/components/admin/CatalogSections";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, apiGet, apiPut } from "@/lib/api";
import { PLACEHOLDER_IMG } from "@/lib/constants";
import { inr, type Banner, type Customer } from "@/lib/types";

const STATUS_STYLE: Record<Banner["status"], [string, string]> = {
  live: ["LIVE ON HOMEPAGE", "bg-emerald-600 text-white"],
  scheduled: ["SCHEDULED", "bg-amber-400 text-purple-950"],
  ended: ["ENDED", "bg-slate-700 text-white"],
  off: ["HIDDEN", "bg-white/90 text-slate-700"],
};
const fmt = (d: string) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");

function BannerEditor({ banner }: { banner: Banner }) {
  const qc = useQueryClient();
  const { data: allProducts } = useAllProducts();
  const [form, setForm] = useState({
    title: banner.title, subtitle: banner.subtitle, cta_label: banner.cta_label,
    start_date: banner.start_date, end_date: banner.end_date, product_ids: banner.product_ids,
  });
  const [pickQ, setPickQ] = useState("");
  const save = useMutation({
    mutationFn: (enabled: boolean) => apiPut<Banner>(`/admin/banners/${banner.id}`, { ...form, enabled }),
    onSuccess: (b) => {
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
      qc.invalidateQueries({ queryKey: ["banners"] });
      qc.invalidateQueries({ queryKey: ["festival", b.id] });
      const msg = { live: "is live on the homepage", scheduled: `will go live on ${fmt(b.start_date)}`, ended: "has ended (end date passed)", off: "saved (hidden)" }[b.status];
      toast.success(`${b.festival} banner ${msg}`);
    },
    onError: (e) => toast.error(e instanceof ApiError && typeof (e.body as { detail?: unknown })?.detail === "string" ? String((e.body as { detail: string }).detail) : "Could not save banner"),
  });
  const [label, style] = STATUS_STYLE[banner.status];
  const picked = new Set(form.product_ids);
  const toggle = (id: string) => setForm({ ...form, product_ids: picked.has(id) ? form.product_ids.filter((x) => x !== id) : [...form.product_ids, id] });
  const list = (allProducts ?? [])
    .filter((p) => `${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(pickQ.toLowerCase()))
    .sort((a, b) => Number(picked.has(b.id)) - Number(picked.has(a.id)));

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white" data-testid={`banner-editor-${banner.id}`}>
      <div className="relative h-36">
        <img src={banner.image} alt="" className="size-full object-cover" />
        <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${style}`} data-testid={`banner-status-${banner.id}`}>{label}</span>
        {banner.live ? <a href={banner.link} target="_blank" rel="noreferrer" className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-purple-800 hover:bg-white" data-testid={`banner-view-page-${banner.id}`}>View page ↗</a> : null}
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold">{banner.festival}</p>
          <Button
            variant={banner.enabled ? "outline" : "default"}
            className={banner.enabled ? "border-red-200 text-red-700 hover:bg-red-50" : "bg-emerald-600 hover:bg-emerald-700"}
            disabled={save.isPending}
            onClick={() => save.mutate(!banner.enabled)}
            data-testid={`banner-toggle-${banner.id}`}
          >
            {banner.enabled ? "Turn Off" : "Turn On"}
          </Button>
        </div>
        <div className="space-y-1.5"><Label>Headline</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid={`banner-title-input-${banner.id}`} /></div>
        <div className="space-y-1.5"><Label>Sub-text</Label><Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} data-testid={`banner-subtitle-input-${banner.id}`} /></div>
        <div className="space-y-1.5"><Label>Button text</Label><Input value={form.cta_label} onChange={(e) => setForm({ ...form, cta_label: e.target.value })} data-testid={`banner-cta-input-${banner.id}`} /></div>

        <div className="rounded-xl bg-violet-50/70 p-3">
          <p className="flex items-center gap-1.5 text-sm font-bold text-[#3B0764]"><CalendarDays className="size-4" /> Schedule (optional)</p>
          <p className="mt-0.5 text-xs text-slate-600">When the banner is turned on, it shows only between these dates and hides itself after the end date. Leave blank to show until you turn it off.</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="space-y-1"><Label className="text-xs">Start date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="bg-white" data-testid={`banner-start-input-${banner.id}`} /></div>
            <div className="space-y-1"><Label className="text-xs">End date</Label><Input type="date" value={form.end_date} min={form.start_date || undefined} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="bg-white" data-testid={`banner-end-input-${banner.id}`} /></div>
          </div>
          {banner.start_date || banner.end_date ? <p className="mt-2 text-xs font-semibold text-violet-800" data-testid={`banner-schedule-summary-${banner.id}`}>Saved: {banner.start_date ? fmt(banner.start_date) : "now"} → {banner.end_date ? fmt(banner.end_date) : "no end"}</p> : null}
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold">Festival products <span className="font-semibold text-[#6D28D9]" data-testid={`banner-product-count-${banner.id}`}>({form.product_ids.length} selected)</span></p>
            <Input value={pickQ} onChange={(e) => setPickQ(e.target.value)} placeholder="Search products" className="h-8 max-w-44 text-sm" data-testid={`banner-product-search-${banner.id}`} />
          </div>
          <div className="mt-2 max-h-52 space-y-1 overflow-y-auto pr-1">
            {list.map((p) => (
              <label key={p.id} className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors ${picked.has(p.id) ? "bg-violet-50" : "hover:bg-slate-50"}`} data-testid={`banner-product-option-${banner.id}-${p.id}`}>
                <Checkbox checked={picked.has(p.id)} onCheckedChange={() => toggle(p.id)} data-testid={`banner-product-check-${banner.id}-${p.id}`} />
                <img src={p.image || PLACEHOLDER_IMG} alt="" className="size-8 rounded object-cover" />
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                <span className="text-xs text-slate-500">{inr(p.price)}</span>
              </label>
            ))}
          </div>
        </div>

        <Button className="bg-[#6D28D9] hover:bg-[#5B21B6]" disabled={save.isPending || !form.title.trim() || !form.cta_label.trim()} onClick={() => save.mutate(banner.enabled)} data-testid={`banner-save-${banner.id}`}>Save Changes</Button>
      </div>
    </div>
  );
}

export function BannersSection() {
  const { data } = useQuery({ queryKey: ["admin-banners"], queryFn: () => apiGet<Banner[]>("/admin/banners") });
  return (
    <div className="space-y-4" data-testid="admin-banners-section">
      <p className="text-slate-600">Turn a festival banner on and it appears at the top of the homepage, opening its own festival product page. Pick the products and, if you like, set dates so it switches itself on and off.</p>
      <div className="grid gap-5 lg:grid-cols-2">{(data ?? []).map((b) => <BannerEditor key={b.id} banner={b} />)}</div>
    </div>
  );
}

export function CustomersSection() {
  const { data } = useQuery({ queryKey: ["admin-customers"], queryFn: () => apiGet<Customer[]>("/customers") });
  const [q, setQ] = useState("");
  const rows = (data ?? []).filter((c) => `${c.name} ${c.phone}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4" data-testid="admin-customers-section">
      <div className="flex flex-wrap items-center gap-3">
        <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800"><Award className="size-4" /> 1 point for every ₹100 billed — added automatically when you enter the customer's phone at billing.</p>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or phone" className="h-10 max-w-xs" data-testid="customers-search-input" />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-[15px]">
          <thead className="bg-slate-50 text-left text-sm text-slate-600"><tr><th className="p-3">Customer</th><th className="p-3">Phone</th><th className="p-3 text-right">Points</th><th className="p-3 text-right">Visits</th><th className="p-3 text-right">Total Spent</th><th className="p-3">Last Visit</th></tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={6} className="p-6 text-center text-slate-500" data-testid="customers-empty">No loyalty customers yet — add a phone number on the next bill.</td></tr> : rows.map((c) => (
              <tr key={c.phone} className="border-t" data-testid={`customer-row-${c.phone}`}>
                <td className="p-3 font-semibold">{c.name || "—"}</td>
                <td className="p-3">+{c.phone}</td>
                <td className="p-3 text-right font-extrabold text-[#6D28D9]" data-testid={`customer-points-${c.phone}`}>{c.points}</td>
                <td className="p-3 text-right">{c.visits}</td>
                <td className="p-3 text-right">{inr(c.total_spent)}</td>
                <td className="p-3 text-sm text-slate-500">{new Date(c.last_visit).toLocaleDateString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

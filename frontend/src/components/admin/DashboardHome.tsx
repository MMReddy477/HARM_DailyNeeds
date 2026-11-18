import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Bell, Boxes, IndianRupee, PackageX, Star, TrendingUp, Wallet } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { apiGet } from "@/lib/api";
import { inr, stockState, type Overview, type Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export const useOverview = () =>
  useQuery({ queryKey: ["admin-summary", "overview"], queryFn: () => apiGet<Overview>("/admin/overview") });

export function Kpi({ label, value, icon: Icon, tone, testid, hint }: { label: string; value: string; icon: typeof Wallet; tone: string; testid: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" data-testid={testid}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-600">{label}</p>
        <span className={cn("flex size-10 items-center justify-center rounded-xl", tone)}>
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-[#111827]">{value}</p>
      {hint ? <p className="mt-1 text-xs font-medium text-slate-500">{hint}</p> : null}
    </div>
  );
}
const NOTICE_STYLE: Record<string, { icon: typeof Bell; cls: string }> = {
  "out-of-stock": { icon: PackageX, cls: "bg-red-50 text-red-700 border-red-200" },
  "low-stock": { icon: AlertTriangle, cls: "bg-orange-50 text-orange-700 border-orange-200" },
  expiry: { icon: AlertTriangle, cls: "bg-amber-50 text-amber-800 border-amber-200" },
  "price-change": { icon: IndianRupee, cls: "bg-sky-50 text-sky-700 border-sky-200" },
  review: { icon: Star, cls: "bg-violet-50 text-violet-700 border-violet-200" },
  summary: { icon: TrendingUp, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export default function DashboardHome({ onNavigate }: { onNavigate?: (section: string) => void }) {
  const { data: o } = useOverview();
  const { data: products } = useQuery({ queryKey: ["products", "admin-all"], queryFn: () => apiGet<Product[]>("/products?limit=200") });
  const lows = (products ?? []).filter((p) => stockState(p) !== "ok").sort((a, b) => a.stock - b.stock).slice(0, 6);
  const cashTotal = Object.values(o?.payments ?? {}).reduce((s, v) => s + v, 0);
  const UNIT_ICON: Record<string, string> = { school: "📚", dairy: "🥛", xerox: "🖨️", money: "💸" };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl bg-gradient-to-r from-[#6D28D9] to-[#4C1D95] px-5 py-3.5 text-white shadow-md" data-testid="dashboard-summary-strip">
        <span className="text-sm font-bold uppercase tracking-wider text-violet-200">Today</span>
        {[["Sales", inr(o?.today_sales ?? 0)], ["Profit", inr(o?.today_profit ?? 0)], ["Bills", String(o?.bills_today ?? 0)], ["Customers", String(o?.customers_served ?? 0)], ["Low Stock", String((o?.low_stock_count ?? 0) + (o?.out_of_stock_count ?? 0))]].map(([l, v]) => (
          <span key={l} className="text-[15px]"><span className="text-violet-200">{l}</span> <b className="text-lg">{v}</b></span>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <Kpi label="Today's Sales" value={inr(o?.today_sales ?? 0)} icon={Wallet} tone="bg-violet-100 text-[#6D28D9]" testid="kpi-today-sales" hint={`${o?.products_sold_today ?? 0} products sold`} />
        <Kpi label="Today's Profit" value={inr(o?.today_profit ?? 0)} icon={TrendingUp} tone="bg-emerald-100 text-emerald-700" testid="kpi-today-profit" />
        <Kpi label="Monthly Sales" value={inr(o?.month_revenue ?? 0)} icon={IndianRupee} tone="bg-sky-100 text-sky-700" testid="kpi-month-revenue" />
        <Kpi label="Monthly Profit" value={inr(o?.month_profit ?? 0)} icon={TrendingUp} tone="bg-emerald-100 text-emerald-700" testid="kpi-month-profit" />
        <Kpi label="Inventory Value" value={inr(o?.inventory_value ?? 0)} icon={Boxes} tone="bg-indigo-100 text-indigo-700" testid="kpi-inventory-value" hint={`${o?.total_products ?? 0} products · at cost`} />
        <Kpi label="Low Stock Products" value={String((o?.low_stock_count ?? 0) + (o?.out_of_stock_count ?? 0))} icon={AlertTriangle} tone="bg-orange-100 text-orange-700" testid="kpi-low-stock" hint={`${o?.out_of_stock_count ?? 0} out of stock`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="dashboard-business-units">
        {(o?.units ?? []).map((u) => (
          <div key={u.id} className="rounded-2xl border border-slate-200 bg-white p-5" data-testid={`unit-card-${u.id}`}>
            <p className="text-base font-bold text-[#111827]">{UNIT_ICON[u.id]} {u.label}</p>
            <p className="mt-2 text-3xl font-extrabold">{inr(u.today)}<span className="ml-1.5 text-sm font-semibold text-slate-500">today</span></p>
            <div className="mt-2 flex flex-wrap gap-x-4 text-sm text-slate-600">
              <span>Month <b className="text-[#111827]">{inr(u.month)}</b></span>
              <span>Profit <b className="text-emerald-700">{inr(u.month_profit)}</b></span>
              {u.id === "school" || u.id === "dairy" ? <span>Sold today <b>{u.sold_today}</b></span> : null}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5" data-testid="dashboard-cash-summary">
          <p className="text-lg font-bold">Cash In Hand (Today)</p>
          <p className="mt-2 text-3xl font-extrabold">{inr(cashTotal)}</p>
          <div className="mt-3 space-y-1.5 text-[15px]">
            {(["cash", "upi", "card"] as const).map((m) => <div key={m} className="flex justify-between"><span className="font-semibold uppercase text-slate-500">{m}</span><b>{inr(o?.payments?.[m] ?? 0)}</b></div>)}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5" data-testid="dashboard-inventory-snapshot">
          <p className="text-lg font-bold">Inventory Snapshot</p>
          <div className="mt-3 space-y-2 text-[15px]">
            {(o?.snapshot ?? []).map((s) => <div key={s.label} className="flex justify-between gap-2"><span className="text-slate-700">{s.label}</span><b>{s.items} items</b></div>)}
            <div className="flex justify-between border-t pt-2 font-extrabold"><span>Total Inventory</span><span>{(o?.snapshot ?? []).reduce((s, x) => s + x.items, 0)} items</span></div>
          </div>
        </div>
        <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-5" data-testid="dashboard-low-stock-panel">
          <p className="text-lg font-bold text-orange-800">⚠ Low Stock — Act Now</p>
          <div className="mt-3 space-y-1.5">
            {lows.length === 0 ? <p className="text-slate-500">All stocked up.</p> : lows.map((p) => <div key={p.id} className="flex justify-between text-[15px]"><span className="truncate font-semibold">{p.name}</span><span className="shrink-0 font-bold text-orange-700">{p.stock <= 0 ? "Out" : `${p.stock} left`}</span></div>)}
          </div>
          <button type="button" onClick={() => onNavigate?.("purchases")} className="mt-3 w-full rounded-xl bg-orange-600 py-2.5 text-sm font-bold text-white hover:bg-orange-700" data-testid="dashboard-restock-button">Restock Now</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2" data-testid="dashboard-revenue-trend">
          <p className="text-lg font-bold text-[#111827]">Revenue vs Profit — Last 30 Days</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={(o?.daily ?? []).map((d) => ({ ...d, label: d.date.slice(5) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDE9FE" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={4} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number, n: string) => [inr(v), n]} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6D28D9" fill="#6D28D9" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="profit" name="Profit" stroke="#059669" fill="#059669" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5" data-testid="dashboard-notifications">
          <p className="flex items-center gap-2 text-lg font-bold text-[#111827]"><Bell className="size-5 text-[#6D28D9]" /> Notifications</p>
          <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
            {(o?.notices ?? []).map((n, i) => {
              const s = NOTICE_STYLE[n.kind] ?? NOTICE_STYLE.summary;
              return (
                <div key={i} className={cn("flex items-start gap-2.5 rounded-xl border px-3 py-2.5", s.cls)} data-testid={`notice-${n.kind}-${i}`}>
                  <s.icon className="mt-0.5 size-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{n.title}</p>
                    <p className="text-[13px]">{n.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5" data-testid="dashboard-top-products">
          <p className="text-lg font-bold text-[#111827]">Top Products This Month</p>
          <ol className="mt-3 space-y-2.5">
            {(o?.top_products ?? []).map((p, i) => (
              <li key={p.name} className="flex items-center gap-3 text-[15px]">
                <span className="flex size-7 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-[#6D28D9]">{i + 1}</span>
                <span className="flex-1 truncate font-medium text-slate-800">{p.name}</span>
                <span className="text-sm text-slate-500">{p.qty} sold</span>
                <span className="w-20 text-right font-bold text-[#111827]">{inr(p.revenue)}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5" data-testid="dashboard-money-transfer">
          <p className="text-lg font-bold text-[#111827]">Today's Activity</p>
          <div className="mt-3 max-h-64 space-y-2 overflow-y-auto" data-testid="dashboard-activity-feed">
            {(o?.activity ?? []).length === 0 ? <p className="text-slate-500">No sales yet today.</p> : (o?.activity ?? []).map((a, i) => (
              <div key={i} className="flex items-center gap-3 text-[15px]"><span className="w-20 shrink-0 text-sm font-semibold text-slate-500">{a.time}</span><span className="flex-1 truncate">{a.label}</span><b>{inr(a.amount)}</b></div>
            ))}
          </div>
          <p className="mt-3 border-t pt-2 text-sm text-slate-500">Best seller: <b className="text-emerald-700">{o?.best_product || "—"}</b> · Slowest: <b className="text-orange-600">{o?.worst_product || "—"}</b></p>
        </div>
      </div>
    </div>
  );
}

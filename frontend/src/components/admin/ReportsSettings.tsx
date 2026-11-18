import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileSpreadsheet, FileText, Mail, Milk, Trash2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useOverview } from "@/components/admin/DashboardHome";
import { downloadFile, useSettings } from "@/components/admin/PosSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { inr, type ClosingReport, type Review, type StockEmailResult, type StoreSettings } from "@/lib/types";

const COLORS = ["#6D28D9", "#8B5CF6", "#A78BFA", "#F59E0B", "#059669", "#0EA5E9", "#EC4899"];

function Card({ title, children, testid }: { title: string; children: React.ReactNode; testid: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5" data-testid={testid}><p className="text-lg font-bold text-[#111827]">{title}</p><div className="mt-4">{children}</div></div>;
}

export function ReportsSection() {
  const { data: o } = useOverview();
  const qc = useQueryClient();
  const { data: reports } = useQuery({ queryKey: ["admin-reports"], queryFn: () => apiGet<ClosingReport[]>("/reports") });
  const runNow = useMutation({ mutationFn: () => apiPost<ClosingReport>("/reports/run"), onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["admin-reports"] }); toast.success(`Report saved — email ${r.email_status}`); } });
  const stockNow = useMutation({
    mutationFn: () => apiPost<StockEmailResult>("/reports/morning-stock/run"),
    onSuccess: (r) => toast.success(`${r.items.length} low dairy item(s) — email ${r.email_status}`),
    onError: () => toast.error("Could not build the reorder list"),
  });
  const daily = o?.daily ?? [];
  const sum = (n: number, k: "revenue" | "profit") => daily.slice(-n).reduce((s, d) => s + d[k], 0);
  const periods: [string, number][] = [["Today", 1], ["Last 7 Days", 7], ["Last 30 Days", 30]];

  return (
    <div className="space-y-5" data-testid="admin-reports-section">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" className="gap-1.5" onClick={() => downloadFile("/export/excel", "harm-report.xlsx").then(() => toast.success("Excel downloaded"))} data-testid="export-excel-button"><FileSpreadsheet className="size-4 text-emerald-600" /> Excel Export</Button>
        <Button variant="outline" className="gap-1.5" onClick={() => downloadFile("/export/pdf", "harm-report.pdf").then(() => toast.success("PDF downloaded"))} data-testid="export-pdf-button"><FileText className="size-4 text-red-600" /> PDF Export</Button>
        <Button className="gap-1.5 bg-[#6D28D9] hover:bg-[#5B21B6]" disabled={runNow.isPending} onClick={() => runNow.mutate()} data-testid="report-run-now-button"><Mail className="size-4" /> Send Closing Report Now</Button>
        <Button variant="outline" className="gap-1.5" disabled={stockNow.isPending} onClick={() => stockNow.mutate()} data-testid="stock-email-run-now-button"><Milk className="size-4 text-sky-600" /> Send Dairy Reorder List Now</Button>
        <span className="self-center text-xs text-slate-500" data-testid="stock-email-schedule-note">Dairy reorder list emails automatically at 7:00 AM</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {periods.map(([label, n]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5" data-testid={`report-period-${n}`}>
            <p className="text-sm font-semibold text-slate-600">{label}</p>
            <p className="mt-2 text-3xl font-extrabold">{inr(sum(n, "revenue"))}</p>
            <p className="mt-1 text-sm font-semibold text-emerald-700">Profit {inr(sum(n, "profit"))}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Sales Trend (30 days)" testid="chart-sales-trend">
          <div className="h-64"><ResponsiveContainer><LineChart data={daily.map((d) => ({ ...d, label: d.date.slice(5) }))}><CartesianGrid strokeDasharray="3 3" stroke="#EDE9FE" /><XAxis dataKey="label" interval={4} tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip formatter={(v: number) => inr(v)} /><Legend /><Line dataKey="revenue" name="Revenue" stroke="#6D28D9" strokeWidth={2} dot={false} /><Line dataKey="profit" name="Profit" stroke="#059669" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div>
        </Card>
        <Card title="Monthly Comparison" testid="chart-monthly">
          <div className="h-64"><ResponsiveContainer><BarChart data={o?.monthly ?? []}><CartesianGrid strokeDasharray="3 3" stroke="#EDE9FE" /><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip formatter={(v: number) => inr(v)} /><Legend /><Bar dataKey="revenue" name="Revenue" fill="#6D28D9" radius={[6, 6, 0, 0]} /><Bar dataKey="profit" name="Profit" fill="#059669" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </Card>
        <Card title="Top Categories (this month)" testid="chart-categories">
          <div className="h-64"><ResponsiveContainer><PieChart><Pie data={o?.categories ?? []} dataKey="revenue" nameKey="category" innerRadius={50} outerRadius={90} label>{(o?.categories ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v: number) => inr(v)} /></PieChart></ResponsiveContainer></div>
        </Card>
        <Card title="Top Products (this month)" testid="chart-top-products">
          <div className="h-64"><ResponsiveContainer><BarChart data={o?.top_products ?? []} layout="vertical"><XAxis type="number" tick={{ fontSize: 12 }} /><YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} /><Tooltip formatter={(v: number) => inr(v)} /><Bar dataKey="revenue" fill="#8B5CF6" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div>
        </Card>
      </div>
      <Card title="Nightly Closing Reports (auto at 11:00 PM)" testid="closing-reports-list">
        <div className="space-y-2">
          {(reports ?? []).length === 0 ? <p className="text-slate-500">No reports yet — the first one is generated tonight at 11 PM.</p> : (reports ?? []).map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl bg-slate-50 px-4 py-3 text-[15px]" data-testid={`closing-report-${r.date}`}>
              <span className="font-bold">{r.date}</span><span>Total <b>{inr(r.total)}</b></span><span>Sales {inr(r.sales)}</span><span>Xerox {inr(r.xerox)}</span><span>Printing {inr(r.printing)}</span><span>Money Transfer {inr(r.money_transfer)}</span>
              <span className="ml-auto text-xs text-slate-500">Email: {r.email_status}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function SettingsSection() {
  const { data } = useSettings();
  const qc = useQueryClient();
  const [form, setForm] = useState<StoreSettings | null>(null);
  const f = form ?? data;
  const save = useMutation({ mutationFn: () => apiPut<StoreSettings>("/settings", f), onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-settings"] }); setForm(null); toast.success("Settings saved"); }, onError: () => toast.error("Check the email address and try again") });
  if (!f) return <p className="text-slate-500">Loading…</p>;
  const field = (key: keyof StoreSettings, label: string, type = "text") => (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold">{label}</Label>
      <Input type={type} value={String(f[key] ?? "")} onChange={(e) => setForm({ ...f, [key]: type === "number" ? Number(e.target.value) : e.target.value })} className="h-11 text-base" data-testid={`settings-${key}-input`} />
    </div>
  );
  return (
    <div className="max-w-3xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6" data-testid="admin-settings-section">
      <div className="grid gap-4 sm:grid-cols-2">
        {field("business_name", "Business Name")}
        {field("phone", "Phone Number")}
        <div className="sm:col-span-2">{field("address", "Business Address")}</div>
        {field("store_hours", "Store Hours")}
        {field("tax_percent", "Tax / GST % on bills", "number")}
        <div className="sm:col-span-2">{field("google_review_link", "Google Review Link")}</div>
        <div className="sm:col-span-2">{field("report_email", "Report Email (11 PM closing + 7 AM dairy reorder list)", "email")}</div>
      </div>
      <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">Automatic WhatsApp (Twilio): <b className={f.whatsapp_auto ? "text-emerald-700" : "text-orange-600"}>{f.whatsapp_auto ? "Connected" : "Not connected — one-tap WhatsApp is used"}</b></p>
      <Button className="h-11 bg-[#6D28D9] px-6 text-base hover:bg-[#5B21B6]" disabled={!form || save.isPending} onClick={() => save.mutate()} data-testid="settings-save-button">Save Settings</Button>
    </div>
  );
}

export function ReviewsSection() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["reviews"], queryFn: () => apiGet<Review[]>("/reviews") });
  const remove = useMutation({ mutationFn: (id: string) => apiDelete<void>(`/reviews/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ["reviews"] }); toast.success("Review removed"); } });
  return (
    <div className="grid gap-3 md:grid-cols-2" data-testid="admin-reviews-section">
      {(data ?? []).map((r) => (
        <div key={r.id} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4" data-testid={`admin-review-${r.id}`}>
          <div className="flex-1"><p className="font-bold">{r.name} <span className="text-amber-500">{"★".repeat(r.rating)}</span></p><p className="mt-1 text-[15px] text-slate-600">{r.comment}</p><p className="mt-1 text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString("en-IN")}</p></div>
          <Button size="icon-sm" variant="ghost" className="text-red-600" aria-label="Delete review" onClick={() => window.confirm("Remove this review?") && remove.mutate(r.id)} data-testid={`admin-review-delete-${r.id}`}><Trash2 className="size-4" /></Button>
        </div>
      ))}
    </div>
  );
}

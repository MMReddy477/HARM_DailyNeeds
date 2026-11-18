import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Minus, Pencil, Plus, Trash2 } from "lucide-react";

import ProductFormDialog from "@/components/admin/ProductFormDialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { CATEGORIES, PLACEHOLDER_IMG } from "@/lib/constants";
import { inr, stockState, type Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export const useAllProducts = () =>
  useQuery({ queryKey: ["products", "admin-all"], queryFn: () => apiGet<Product[]>("/products?limit=200") });

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["admin-summary"] });
  };
}

const STATE_BADGE = {
  ok: ["In Stock", "bg-emerald-100 text-emerald-800"],
  low: ["Low Stock", "bg-orange-100 text-orange-800"],
  out: ["Out of Stock", "bg-red-100 text-red-800"],
} as const;

export function StockBadge({ p }: { p: Product }) {
  const [label, cls] = STATE_BADGE[stockState(p)];
  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", cls)}>{label}</span>;
}

/** Products table. `categories` restricts to those categories (Dairy / School Supplies sections). */
export function ProductsSection({ categories, title, match }: { categories?: string[]; title?: string; match?: (p: Product) => boolean }) {
  const { data, isLoading } = useAllProducts();
  const invalidate = useInvalidate();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);

  const scoped = (data ?? []).filter((p) => (match ? match(p) : !categories || categories.includes(p.category)));
  const rows = scoped.filter(
    (p) =>
      (cat === "all" || p.category === cat) &&
      (status === "all" || (status === "active" ? p.available : !p.available)) &&
      (!q || `${p.name} ${p.brand}`.toLowerCase().includes(q.toLowerCase()))
  );

  const del = useMutation({ mutationFn: (id: string) => apiDelete<void>(`/products/${id}`), onSuccess: () => { invalidate(); toast.success("Product deleted"); } });
  const toggle = useMutation({ mutationFn: (p: Product) => apiPatch<Product>(`/products/${p.id}`, { available: !p.available }), onSuccess: invalidate });
  const bulk = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiPost<{ affected: number }>("/products/bulk", { ids: selected, ...body }),
    onSuccess: (r) => { invalidate(); setSelected([]); toast.success(`${r.affected} products updated`); },
  });

  const open = (p: Product | null) => { setEditing(p); setFormKey((k) => k + 1); setFormOpen(true); };
  const allChecked = rows.length > 0 && rows.every((r) => selected.includes(r.id));

  return (
    <div className="space-y-4" data-testid="admin-products-section">
      <div className="flex flex-wrap items-center gap-2.5">
        {title ? <h2 className="mr-2 text-xl font-bold text-[#111827]">{title}</h2> : null}
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="h-10 w-full text-[15px] sm:w-64" data-testid="products-search-input" />
        {!categories ? (
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="h-10 bg-white" data-testid="products-category-filter"><SelectValue>{(v: string) => (v === "all" ? "All Categories" : v)}</SelectValue></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.values(CATEGORIES).map((c) => <SelectItem key={c.slug} value={c.name}>{c.displayName ?? c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : null}
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-10 bg-white" data-testid="products-status-filter"><SelectValue>{(v: string) => ({ all: "All Status", active: "Active", inactive: "Inactive" })[v]}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button className="ml-auto h-10 gap-1.5 bg-[#6D28D9] px-4 text-[15px] hover:bg-[#5B21B6]" onClick={() => open(null)} data-testid="products-add-button">
          <Plus className="size-4" /> Add Product
        </Button>
      </div>

      {selected.length ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5" data-testid="products-bulk-bar">
          <span className="text-sm font-bold text-[#6D28D9]">{selected.length} selected</span>
          <Button size="sm" variant="outline" onClick={() => bulk.mutate({ available: true })} data-testid="bulk-activate">Set Active</Button>
          <Button size="sm" variant="outline" onClick={() => bulk.mutate({ available: false })} data-testid="bulk-deactivate">Set Inactive</Button>
          <Button size="sm" variant="outline" onClick={() => bulk.mutate({ stock_delta: 10 })} data-testid="bulk-stock-add">+10 Stock</Button>
          <Select value="" onValueChange={(v) => v && bulk.mutate({ category: v })}>
            <SelectTrigger size="sm" className="bg-white" data-testid="bulk-category-select"><SelectValue>{() => "Move to category…"}</SelectValue></SelectTrigger>
            <SelectContent>{Object.values(CATEGORIES).map((c) => <SelectItem key={c.slug} value={c.name}>{c.displayName ?? c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button size="sm" variant="destructive" onClick={() => window.confirm(`Delete ${selected.length} products?`) && bulk.mutate({ delete: true })} data-testid="bulk-delete">Delete</Button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <Table className="text-[15px]">
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-10"><Checkbox checked={allChecked} onCheckedChange={(v) => setSelected(v ? rows.map((r) => r.id) : [])} data-testid="products-select-all" /></TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Buying</TableHead>
              <TableHead className="text-right">Selling</TableHead>
              <TableHead className="text-right">Profit / Margin</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="py-10 text-center text-slate-500">Loading…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="py-10 text-center text-slate-500" data-testid="products-empty">No products found</TableCell></TableRow>
            ) : rows.map((p) => {
              const margin = p.price > 0 ? ((p.price - p.cost_price) / p.price) * 100 : 0;
              return (
                <TableRow key={p.id} data-testid={`product-row-${p.id}`}>
                  <TableCell><Checkbox checked={selected.includes(p.id)} onCheckedChange={(v) => setSelected((s) => (v ? [...s, p.id] : s.filter((x) => x !== p.id)))} data-testid={`product-select-${p.id}`} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img src={p.image || PLACEHOLDER_IMG} alt="" loading="lazy" className="size-11 rounded-lg border object-cover" />
                      <div className="min-w-0">
                        <p className="max-w-[230px] truncate font-semibold text-[#111827]">{p.name}{p.is_best_seller ? <span className="ml-1.5 text-amber-500" title="Featured">★</span> : null}</p>
                        <p className="text-xs text-slate-500">{p.brand || "—"}{p.expiry_date ? ` · exp ${p.expiry_date}` : ""}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">{p.category}</TableCell>
                  <TableCell className="text-right"><span className="mr-2 font-bold">{p.stock}</span><StockBadge p={p} /></TableCell>
                  <TableCell className="text-right text-slate-600">{inr(p.cost_price)}</TableCell>
                  <TableCell className="text-right font-bold">{inr(p.price)}</TableCell>
                  <TableCell className={cn("text-right font-semibold", margin >= 20 ? "text-emerald-700" : "text-orange-600")}>{inr(p.price - p.cost_price)}<span className="block text-xs font-medium">{margin.toFixed(0)}%</span></TableCell>
                  <TableCell>
                    <button type="button" onClick={() => toggle.mutate(p)} data-testid={`product-status-toggle-${p.id}`} className={cn("rounded-full px-2.5 py-1 text-xs font-bold", p.available ? "bg-violet-100 text-[#6D28D9]" : "bg-slate-200 text-slate-600")}>
                      {p.available ? "Active" : "Inactive"}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon-sm" variant="ghost" onClick={() => open(p)} aria-label="Edit" data-testid={`product-edit-${p.id}`}><Pencil className="size-4" /></Button>
                    <Button size="icon-sm" variant="ghost" className="text-red-600" aria-label="Delete" onClick={() => window.confirm(`Delete "${p.name}"?`) && del.mutate(p.id)} data-testid={`product-delete-${p.id}`}><Trash2 className="size-4" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <ProductFormDialog key={formKey} open={formOpen} onOpenChange={setFormOpen} product={editing} />
    </div>
  );
}

export function CategoriesSection({ onOpen }: { onOpen: (category: string) => void }) {
  const { data } = useAllProducts();
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" data-testid="admin-categories-section">
      {Object.values(CATEGORIES).map((c) => {
        const items = (data ?? []).filter((p) => p.category === c.name);
        const value = items.reduce((s, p) => s + p.cost_price * Math.max(p.stock, 0), 0);
        const low = items.filter((p) => stockState(p) !== "ok").length;
        return (
          <button key={c.slug} type="button" onClick={() => onOpen(c.name)} data-testid={`category-card-${c.slug}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lg">
            <img src={c.image} alt="" loading="lazy" className="h-28 w-full object-cover" />
            <div className="p-4">
              <p className="text-lg font-bold text-[#111827]">{c.displayName ?? c.name}</p>
              <p className="mt-1 text-sm text-slate-600">{items.length} products · {inr(value)} stock value</p>
              {low ? <p className="mt-1 text-sm font-semibold text-orange-600">{low} need restocking</p> : <p className="mt-1 text-sm font-semibold text-emerald-600">All well stocked</p>}
              <p className="mt-2 text-xs text-slate-400">{c.subs.join(" · ")}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function InventorySection({ onlyAlerts }: { onlyAlerts?: boolean }) {
  const { data } = useAllProducts();
  const invalidate = useInvalidate();
  const adjust = useMutation({ mutationFn: ({ p, delta }: { p: Product; delta: number }) => apiPatch<Product>(`/products/${p.id}`, { stock: Math.max(0, p.stock + delta) }), onSuccess: invalidate });
  const rows = (data ?? [])
    .filter((p) => !onlyAlerts || stockState(p) !== "ok")
    .sort((a, b) => a.stock - a.reorder_level - (b.stock - b.reorder_level));

  return (
    <div className="space-y-4" data-testid={onlyAlerts ? "admin-low-stock-section" : "admin-inventory-section"}>
      {onlyAlerts ? (
        <div className="space-y-6">
        {([["🥛 Dairy & Beverages", (p: Product) => p.category === "Milk & Dairy" || ["Soft Drinks", "Water Bottles", "Juices", "Energy Drinks"].includes(p.subcategory)],
           ["📚 School & Office Supplies", (p: Product) => ["Stationery", "Note Books", "Office Supplies"].includes(p.category)],
           ["🎁 Gifts & Daily Needs", (p: Product) => ["Gift Shop", "Daily Needs"].includes(p.category) && !["Soft Drinks", "Water Bottles", "Juices", "Energy Drinks"].includes(p.subcategory)]] as const).map(([group, match]) => {
          const g = rows.filter(match);
          if (!g.length) return null;
          return (
          <div key={group} data-testid={`low-stock-group-${group.split(" ")[1].toLowerCase()}`}>
          <p className="mb-2 text-lg font-bold text-[#111827]">⚠ {group.slice(group.indexOf(" ") + 1)} <span className="text-sm font-semibold text-orange-600">({g.length})</span></p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {g.map((p) => (
            <div key={p.id} className={cn("flex items-center gap-3 rounded-2xl border p-4", stockState(p) === "out" ? "border-red-200 bg-red-50" : "border-orange-200 bg-orange-50")} data-testid={`low-stock-alert-${p.id}`}>
              <img src={p.image || PLACEHOLDER_IMG} alt="" className="size-12 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-[#111827]">⚠ {p.name}</p>
                <p className={cn("text-sm font-semibold", stockState(p) === "out" ? "text-red-700" : "text-orange-700")}>{p.stock <= 0 ? "Out of stock" : `Only ${p.stock} remaining`} · reorder at {p.reorder_level}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => adjust.mutate({ p, delta: 10 })} data-testid={`restock-${p.id}`}>+10</Button>
            </div>
          ))}
        </div>
          </div>
          );
        })}
          {rows.length === 0 ? <p className="text-slate-500">No alerts — everything is well stocked. 🎉</p> : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <Table className="text-[15px]">
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Product</TableHead>
                <TableHead className="text-center">Current Stock</TableHead>
                <TableHead className="text-right">Reorder Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Stock Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id} data-testid={`inventory-row-${p.id}`}>
                  <TableCell className="font-semibold text-[#111827]">{p.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1.5">
                      <Button size="icon-xs" variant="outline" onClick={() => adjust.mutate({ p, delta: -1 })} aria-label="Decrease" data-testid={`stock-dec-${p.id}`}><Minus className="size-3" /></Button>
                      <span className="w-10 text-center font-bold" data-testid={`stock-value-${p.id}`}>{p.stock}</span>
                      <Button size="icon-xs" variant="outline" onClick={() => adjust.mutate({ p, delta: 1 })} aria-label="Increase" data-testid={`stock-inc-${p.id}`}><Plus className="size-3" /></Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-slate-600">{p.reorder_level}</TableCell>
                  <TableCell><StockBadge p={p} /></TableCell>
                  <TableCell className="text-sm text-slate-500">{new Date(p.updated_at).toLocaleDateString("en-IN")}</TableCell>
                  <TableCell className="text-right font-semibold">{inr(p.cost_price * Math.max(p.stock, 0))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError, apiGet, apiPost } from "@/lib/api";
import { SERVICE_TYPE_LABELS, type Product, type Transaction } from "@/lib/types";

export default function RevenuePanel() {
  const [type, setType] = useState("xerox-bw");
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [description, setDescription] = useState("");
  const [productId, setProductId] = useState("");
  const [filter, setFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: txns, isLoading } = useQuery({
    queryKey: ["admin-revenue", filter],
    queryFn: () => apiGet<Transaction[]>(filter === "all" ? "/revenue" : `/revenue?type=${filter}`),
  });

  const { data: products } = useQuery({
    queryKey: ["products", "admin-all"],
    queryFn: () => apiGet<Product[]>("/products?limit=200"),
  });

  const record = useMutation({
    mutationFn: () =>
      apiPost<Transaction>("/revenue", {
        type,
        amount: Number(amount),
        quantity: Math.max(1, parseInt(quantity, 10) || 1),
        description: description.trim(),
        product_id: type === "sale" ? productId : "",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-revenue"] });
      queryClient.invalidateQueries({ queryKey: ["admin-summary"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Entry recorded");
      setAmount("");
      setQuantity("1");
      setDescription("");
    },
    onError: (err) => {
      const detail = err instanceof ApiError ? (err.body as { detail?: unknown })?.detail : null;
      toast.error(typeof detail === "string" ? detail : "Could not record entry");
    },
  });

  const selectedProduct = products?.find((p) => p.id === productId);
  const canSubmit = Number(amount) > 0 && (type !== "sale" || productId) && !record.isPending;

  return (
    <div className="grid gap-5 lg:grid-cols-3" data-testid="admin-revenue-panel">
      <form
        className="h-fit space-y-3.5 rounded-xl border border-purple-100 bg-white p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) record.mutate();
        }}
      >
        <p className="font-heading text-base font-extrabold text-purple-950">Record Daily Entry</p>
        <div className="space-y-1.5">
          <Label>Service / Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full" data-testid="revenue-type-select">
              <SelectValue>{(v: string) => SERVICE_TYPE_LABELS[v] ?? v}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SERVICE_TYPE_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {type === "sale" ? (
          <div className="space-y-1.5">
            <Label>Product Sold</Label>
            <Select
              value={productId}
              onValueChange={(v) => {
                setProductId(v);
                const p = products?.find((x) => x.id === v);
                if (p) setAmount(String(p.price * (parseInt(quantity, 10) || 1)));
              }}
            >
              <SelectTrigger className="w-full" data-testid="revenue-product-select">
                <SelectValue>{(v: string) => products?.find((p) => p.id === v)?.name ?? "Choose product…"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(products ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} ({p.stock} left)</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProduct ? <p className="text-[11px] text-slate-500">Stock will reduce automatically ({selectedProduct.stock} left).</p> : null}
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1.5">
            <Label htmlFor="rev-qty">Quantity</Label>
            <Input id="rev-qty" type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} data-testid="revenue-quantity-input" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rev-amount">Amount (₹)</Label>
            <Input id="rev-amount" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} data-testid="revenue-amount-input" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rev-desc">Note (optional)</Label>
          <Input id="rev-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={type === "money-transfer" ? "e.g. Transfer ₹5,000 — commission" : "e.g. 40 pages A4"} data-testid="revenue-description-input" />
        </div>
        <Button type="submit" className="w-full gap-1.5" disabled={!canSubmit} data-testid="revenue-submit-button">
          <Plus className="size-4" /> {record.isPending ? "Saving…" : "Record Entry"}
        </Button>
      </form>

      <div className="space-y-3 lg:col-span-2">
        <div className="flex items-center justify-between gap-2">
          <p className="font-heading text-base font-extrabold text-purple-950">Revenue Log</p>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="bg-white" data-testid="revenue-filter-select">
              <SelectValue>{(v: string) => (v === "all" ? "All Services" : SERVICE_TYPE_LABELS[v] ?? v)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {Object.entries(SERVICE_TYPE_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-xl border border-purple-100 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-slate-500">Loading…</TableCell></TableRow>
              ) : (txns ?? []).length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-slate-500" data-testid="revenue-empty-state">No entries yet.</TableCell></TableRow>
              ) : (
                (txns ?? []).map((t) => (
                  <TableRow key={t.id} data-testid={`revenue-row-${t.id}`}>
                    <TableCell className="text-[13px] text-slate-600">{t.recorded_date}</TableCell>
                    <TableCell className="text-[13px] font-semibold">{SERVICE_TYPE_LABELS[t.type] ?? t.type}</TableCell>
                    <TableCell className="max-w-[220px] truncate text-[13px] text-slate-600">{t.product_name || t.description || "—"}</TableCell>
                    <TableCell className="text-right text-[13px]">{t.quantity}</TableCell>
                    <TableCell className="text-right font-semibold text-purple-900">₹{t.amount}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

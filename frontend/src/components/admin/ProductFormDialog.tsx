import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiPatch, apiPost } from "@/lib/api";
import { CATEGORIES } from "@/lib/constants";
import type { Product } from "@/lib/types";

type Draft = Omit<Product, "id" | "created_at" | "updated_at">;

const EMPTY: Draft = {
  name: "",
  category: "Stationery",
  subcategory: "",
  brand: "",
  price: 0,
  unit: "per piece",
  image: "",
  description: "",
  stock: 0,
  is_best_seller: false,
  is_new: false,
  available: true,
  cost_price: 0,
  reorder_level: 5,
  expiry_date: "",
};

function toDraft(p: Product | null): Draft {
  if (!p) return { ...EMPTY };
  const { id: _id, created_at: _c, updated_at: _u, ...rest } = p;
  return rest;
}

const CATEGORY_OPTIONS = Object.values(CATEGORIES).map((c) => ({ value: c.name, label: c.displayName ?? c.name }));

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product: Product | null; // null => create
}

export default function ProductFormDialog({ open, onOpenChange, product }: Props) {
  // Parent remounts this dialog with a `key`, so initial state is enough.
  const [draft, setDraft] = useState<Draft>(() => toDraft(product));
  const queryClient = useQueryClient();
  const subs = Object.values(CATEGORIES).find((c) => c.name === draft.category)?.subs ?? [];

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const [uploading, setUploading] = useState(false);

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/uploads/product-image", { method: "POST", body: form });
      const body = (await res.json().catch(() => ({}))) as { url?: string; detail?: string };
      if (!res.ok || !body.url) throw new Error(body.detail || "Upload failed");
      set("image", body.url);
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = useMutation({
    mutationFn: () => {
      const body = { ...draft, price: Number(draft.price) || 0, stock: Math.max(0, Math.round(Number(draft.stock) || 0)) };
      return product ? apiPatch<Product>(`/products/${product.id}`, body) : apiPost<Product>("/products", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-summary"] });
      toast.success(product ? "Product updated" : "Product added");
      onOpenChange(false);
    },
    onError: () => toast.error("Could not save product — check the fields and try again."),
  });

  const describe = useMutation({
    mutationFn: () =>
      apiPost<{ description: string }>("/ai/describe", {
        name: draft.name,
        category: draft.category,
        subcategory: draft.subcategory,
        brand: draft.brand,
        price: Number(draft.price) || null,
      }),
    onSuccess: (res) => {
      set("description", res.description);
      toast.success("AI description ready");
    },
    onError: () => toast.error("AI description failed — please try again."),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl" data-testid="product-form-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-purple-950">{product ? "Edit Product" : "Add Product"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="pf-name">Product Name</Label>
            <Input id="pf-name" value={draft.name} onChange={(e) => set("name", e.target.value)} data-testid="product-form-name-input" />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={draft.category} onValueChange={(v) => setDraft((d) => ({ ...d, category: v, subcategory: "" }))}>
              <SelectTrigger className="w-full" data-testid="product-form-category-select">
                <SelectValue>{(v: string) => v}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Subcategory</Label>
            <Select value={draft.subcategory} onValueChange={(v) => set("subcategory", v)}>
              <SelectTrigger className="w-full" data-testid="product-form-subcategory-select">
                <SelectValue>{(v: string) => v || "Choose…"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {subs.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-brand">Brand</Label>
            <Input id="pf-brand" value={draft.brand} onChange={(e) => set("brand", e.target.value)} data-testid="product-form-brand-input" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-unit">Unit</Label>
            <Input id="pf-unit" value={draft.unit} onChange={(e) => set("unit", e.target.value)} data-testid="product-form-unit-input" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-price">Selling Price (₹)</Label>
            <Input id="pf-price" type="number" min={0} value={draft.price} onChange={(e) => set("price", Number(e.target.value))} data-testid="product-form-price-input" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-cost">Cost Price (₹)</Label>
            <Input id="pf-cost" type="number" min={0} value={draft.cost_price} onChange={(e) => set("cost_price", Number(e.target.value))} data-testid="product-form-cost-input" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-stock">Stock (units)</Label>
            <Input id="pf-stock" type="number" min={0} value={draft.stock} onChange={(e) => set("stock", Number(e.target.value))} data-testid="product-form-stock-input" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-reorder">Reorder Level</Label>
            <Input id="pf-reorder" type="number" min={0} value={draft.reorder_level} onChange={(e) => set("reorder_level", Number(e.target.value))} data-testid="product-form-reorder-input" />
          </div>
          {draft.category === "Milk & Dairy" ? (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pf-expiry">Expiry Date</Label>
              <Input id="pf-expiry" type="date" value={draft.expiry_date} onChange={(e) => set("expiry_date", e.target.value)} data-testid="product-form-expiry-input" />
            </div>
          ) : null}
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Product Photo</Label>
            <div className="flex items-center gap-3">
              {draft.image ? <img src={draft.image} alt="" className="size-16 rounded-lg border object-cover" data-testid="product-form-image-preview" /> : null}
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-purple-200 px-3 py-2 text-sm font-semibold text-purple-800 hover:bg-purple-50">
                <Camera className="size-4" /> {uploading ? "Uploading…" : draft.image ? "Change Photo" : "Upload / Take Photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  data-testid="product-form-image-upload"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadPhoto(f);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            <Input value={draft.image} onChange={(e) => set("image", e.target.value)} placeholder="…or paste an image link" data-testid="product-form-image-input" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="pf-desc">Description</Label>
              <Button
                type="button"
                size="xs"
                variant="outline"
                className="gap-1 border-purple-200 text-purple-700"
                disabled={!draft.name.trim() || describe.isPending}
                onClick={() => describe.mutate()}
                data-testid="product-form-ai-describe-button"
              >
                <Sparkles className="size-3" /> {describe.isPending ? "Writing…" : "Write with AI"}
              </Button>
            </div>
            <Textarea id="pf-desc" rows={2} value={draft.description} onChange={(e) => set("description", e.target.value)} data-testid="product-form-description-input" />
          </div>
          <div className="flex flex-wrap gap-4 sm:col-span-2">
            {([
              ["is_best_seller", "Best Seller"],
              ["is_new", "New Arrival"],
              ["available", "Available In Store"],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Checkbox checked={draft[key]} onCheckedChange={(v) => set(key, Boolean(v))} data-testid={`product-form-${key}-checkbox`} />
                {label}
              </label>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => save.mutate()}
            disabled={!draft.name.trim() || save.isPending}
            data-testid="product-form-save-button"
          >
            {save.isPending ? "Saving…" : product ? "Save Changes" : "Add Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

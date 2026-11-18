import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, SearchX } from "lucide-react";

import ProductCard from "@/components/ProductCard";
import QuickContact from "@/components/QuickContact";
import AiAssistant from "@/components/AiAssistant";
import { apiGet } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, whatsappLink } from "@/lib/constants";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const meta = CATEGORIES[slug ?? ""];
  const [searchParams, setSearchParams] = useSearchParams();
  const sub = searchParams.get("sub") ?? "";
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["products", "category", meta?.name],
    queryFn: () => apiGet<Product[]>(`/products?category=${encodeURIComponent(meta?.name ?? "")}&limit=200`),
    enabled: Boolean(meta),
  });

  if (!meta) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-heading text-2xl font-extrabold text-purple-950">Category not found</h1>
        <Link to="/" className={cn(buttonVariants(), "mt-6")} data-testid="category-notfound-home-button">
          Back to Home
        </Link>
      </div>
    );
  }

  const products = data ?? [];
  const brands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean))).sort();
  const filtered = products.filter((p) => {
    if (sub && p.subcategory !== sub) return false;
    if (brand !== "all" && p.brand !== brand) return false;
    if (q && !`${p.name} ${p.brand} ${p.subcategory}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const setSub = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("sub", value);
    else next.delete("sub");
    setSearchParams(next, { replace: true });
  };

  return (
    <>
      {/* Category hero */}
      <section className="relative overflow-hidden bg-[#3B0764]">
        <img
          src={meta.image}
          alt={`${meta.headline} at H.A.R.M DAILY NEEDS`}
          className="absolute inset-0 size-full object-cover opacity-25"
          decoding="async"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">H.A.R.M DAILY NEEDS</p>
          <h1 className="mt-1.5 font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{meta.headline}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-purple-200 sm:text-base">{meta.blurb}</p>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-30 border-b border-purple-100 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl space-y-2.5 px-4 py-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSub("")}
              data-testid="category-sub-chip-all"
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                sub === "" ? "bg-purple-800 text-white" : "bg-purple-50 text-purple-800 hover:bg-purple-100"
              )}
            >
              All
            </button>
            {meta.subs.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSub(s === sub ? "" : s)}
                data-testid={`category-sub-chip-${s.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                  sub === s ? "bg-purple-800 text-white" : "bg-purple-50 text-purple-800 hover:bg-purple-100"
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search in ${meta.name}…`}
              data-testid="category-search-input"
              className="h-8 w-full sm:w-64"
            />
            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger className="h-8 bg-white" data-testid="category-brand-select">
                <SelectValue>{(v: string) => (v === "all" ? "All Brands" : v)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="ml-auto text-xs font-medium text-slate-500" data-testid="category-result-count">
              {filtered.length} product{filtered.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl border border-purple-100 bg-purple-50/50" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-purple-100 bg-white p-10 text-center shadow-sm" data-testid="category-empty-state">
            <SearchX className="mx-auto size-10 text-purple-300" />
            <h2 className="mt-3 font-heading text-lg font-bold text-purple-950">No products match your filters</h2>
            <p className="mt-1.5 text-sm text-slate-600">
              We stock far more than listed online. WhatsApp us what you need — we&apos;ll confirm within minutes.
            </p>
            <a
              href={whatsappLink(`Products from ${meta.name}`)}
              target="_blank"
              rel="noreferrer"
              data-testid="category-empty-whatsapp-button"
              className={cn(buttonVariants(), "mx-auto mt-5 gap-2 bg-emerald-600 hover:bg-emerald-700")}
            >
              <MessageCircle className="size-4" /> Ask on WhatsApp
            </a>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <QuickContact />
      <AiAssistant />
    </>
  );
}

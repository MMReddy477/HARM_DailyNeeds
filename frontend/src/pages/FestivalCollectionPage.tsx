import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle, Sparkles } from "lucide-react";

import ProductCard from "@/components/ProductCard";
import { buttonVariants } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import { whatsappLink } from "@/lib/constants";
import type { FestivalPage } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function FestivalCollectionPage() {
  const { id = "" } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["festival", id],
    queryFn: () => apiGet<FestivalPage>(`/banners/${id}`),
    retry: false,
  });

  if (isError) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center" data-testid="festival-not-running">
        <h1 className="font-heading text-2xl font-extrabold text-purple-950">This festival collection isn't running right now</h1>
        <p className="mt-2 text-slate-600">Browse our Gift Shop for gifts all year round.</p>
        <Link to="/c/gifts" className={cn(buttonVariants(), "mt-6")} data-testid="festival-gift-shop-link">Visit Gift Shop</Link>
      </div>
    );
  }

  const b = data?.banner;
  return (
    <>
      <section className="relative overflow-hidden bg-purple-950" data-testid="festival-hero">
        {b ? <img src={b.image} alt={b.title} className="absolute inset-0 size-full object-cover opacity-80" /> : null}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-950 via-purple-900/80 to-purple-900/10" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:py-20">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-200 transition-colors hover:text-white" data-testid="festival-back-link"><ArrowLeft className="size-4" /> Home</Link>
          {b ? (
            <div className="mt-5 max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-purple-950"><Sparkles className="size-3.5" /> {b.festival} Special</span>
              <h1 className="mt-4 font-heading text-4xl font-extrabold text-white sm:text-5xl" data-testid="festival-title">{b.title}</h1>
              {b.subtitle ? <p className="mt-3 text-base leading-relaxed text-purple-100">{b.subtitle}</p> : null}
              {b.end_date ? <p className="mt-3 text-sm font-semibold text-amber-300" data-testid="festival-ends">Offer collection till {new Date(`${b.end_date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}</p> : null}
            </div>
          ) : <div className="mt-5 h-32 max-w-xl animate-pulse rounded-2xl bg-white/10" />}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="festival-products">
          {isLoading
            ? [0, 1, 2, 3].map((i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl border border-purple-100 bg-purple-50/50" />)
            : (data?.products ?? []).map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        {!isLoading && data && data.products.length === 0 ? <p className="py-10 text-center text-slate-500" data-testid="festival-empty">Festive products are being stocked — ask us on WhatsApp!</p> : null}
        <div className="mt-10 flex flex-wrap items-center gap-3 rounded-2xl border border-purple-100 bg-purple-50/60 p-5">
          <p className="flex-1 text-[15px] text-slate-700">Want gifts wrapped or a bulk festive order? Message us and we'll keep it ready.</p>
          <a href={whatsappLink(`${b?.festival ?? "Festival"} gift collection`)} target="_blank" rel="noreferrer" className={cn(buttonVariants(), "gap-1.5 bg-emerald-600 hover:bg-emerald-700")} data-testid="festival-whatsapp-button"><MessageCircle className="size-4" /> WhatsApp Us</a>
        </div>
      </section>
    </>
  );
}

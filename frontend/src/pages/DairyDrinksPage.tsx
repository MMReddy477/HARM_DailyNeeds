import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarCheck, CupSoda, MessageCircle, Milk, Snowflake } from "lucide-react";

import ProductCard from "@/components/ProductCard";
import QuickContact from "@/components/QuickContact";
import { buttonVariants } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import { CATEGORIES, whatsappLink } from "@/lib/constants";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "all", label: "Everything" },
  { id: "dairy", label: "Milk & Dairy" },
  { id: "drinks", label: "Cool Drinks & Beverages" },
] as const;

function Group({ title, icon: Icon, items, testid }: { title: string; icon: typeof Milk; items: Product[]; testid: string }) {
  if (!items.length) return null;
  return (
    <section className="mt-10 first:mt-0" data-testid={testid}>
      <h2 className="flex items-center gap-2 font-heading text-xl font-extrabold text-purple-950 sm:text-2xl">
        <span className="flex size-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700"><Icon className="size-5" /></span>
        {title} <span className="text-sm font-semibold text-slate-400">({items.length})</span>
      </h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{items.map((p) => <ProductCard key={p.id} product={p} />)}</div>
    </section>
  );
}

export default function DairyDrinksPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");
  const { data, isLoading } = useQuery({ queryKey: ["products", "dairy-drinks"], queryFn: () => apiGet<Product[]>("/products/dairy-drinks") });
  const dairy = (data ?? []).filter((p) => p.category === "Milk & Dairy");
  const drinks = (data ?? []).filter((p) => p.category !== "Milk & Dairy");

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-950 via-purple-900 to-sky-900" data-testid="dairy-drinks-hero">
        <img src={CATEGORIES.dairy.image} alt="Fresh milk and dairy products at H.A.R.M DAILY NEEDS" className="absolute inset-y-0 right-0 hidden h-full w-1/2 object-cover opacity-60 lg:block" />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-950 via-purple-950/85 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">Fresh Every Morning · Chilled All Day</p>
          <h1 className="mt-2 font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl" data-testid="dairy-drinks-title">Milk, Dairy &amp; Cool Drinks</h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-purple-100">
            Fresh milk packets from early morning, curd, paneer, butter, cheese, lassi and buttermilk — plus chilled soft drinks, juices, energy drinks and mineral water.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-[13px] font-semibold text-white">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5"><Milk className="size-4 text-sky-300" /> Always within expiry</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5"><Snowflake className="size-4 text-sky-300" /> Kept chilled</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5"><CupSoda className="size-4 text-sky-300" /> Cold drinks till 10 PM</span>
          </div>
          <Link to="/milk-subscription" className={cn(buttonVariants({ size: "lg" }), "mt-6 gap-2 bg-amber-400 text-purple-950 hover:bg-amber-300")} data-testid="dairy-milk-subscription-cta">
            <CalendarCheck className="size-4" /> Book Daily Milk Subscription <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-wrap gap-2" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              data-testid={`dairy-drinks-tab-${t.id}`}
              className={cn("rounded-full border px-4 py-2 text-sm font-semibold transition-colors", tab === t.id ? "border-purple-700 bg-purple-700 text-white" : "border-purple-200 bg-white text-purple-800 hover:bg-purple-50")}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl border border-sky-100 bg-sky-50/50" />)}</div>
          ) : (
            <>
              {tab !== "drinks" ? <Group title="Milk & Dairy" icon={Milk} items={dairy} testid="dairy-group" /> : null}
              {tab !== "dairy" ? <Group title="Cool Drinks & Beverages" icon={CupSoda} items={drinks} testid="drinks-group" /> : null}
            </>
          )}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 p-5">
          <p className="flex-1 text-[15px] text-slate-700">Need a daily milk packet kept aside, or a crate of cold drinks for a party? Message us on WhatsApp.</p>
          <a href={whatsappLink("milk / cold drinks")} target="_blank" rel="noreferrer" className={cn(buttonVariants(), "gap-1.5 bg-emerald-600 hover:bg-emerald-700")} data-testid="dairy-drinks-whatsapp-button">
            <MessageCircle className="size-4" /> WhatsApp Us
          </a>
        </div>
      </div>
      <QuickContact />
    </>
  );
}

import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, Clock, MessageCircle, Milk, Phone, Star } from "lucide-react";

import ProductCard from "@/components/ProductCard";
import QuickContact from "@/components/QuickContact";
import ReviewSection from "@/components/ReviewSection";
import SectionHeader from "@/components/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import AiAssistant from "@/components/AiAssistant";
import FestivalBanners from "@/components/FestivalBanners";
import { apiGet } from "@/lib/api";
import { BRANDS, HERO_IMAGES, SERVICES, STORE, whatsappLink } from "@/lib/constants";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

function ProductRail({ title, eyebrow, flag }: { title: string; eyebrow: string; flag: "best" | "new" }) {
  const { data, isLoading } = useQuery({
    queryKey: ["products", flag],
    queryFn: () => apiGet<Product[]>(`/products?flag=${flag}&limit=200`),
  });
  const products = [...(data ?? [])]
    .sort((a, b) => {
      const priority = (product: Product) => {
        if (flag === "best" && product.category === "Milk & Dairy" && product.subcategory === "Buttermilk") return 0;
        if (flag === "new" && product.category === "Daily Needs" && product.subcategory === "Energy Drinks") return 0;
        if (flag === "new" && product.category === "Milk & Dairy" && product.subcategory === "Flavoured Milk") return 1;
        return 2;
      };
      return priority(a) - priority(b);
    })
    .slice(0, 8);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex items-end justify-between gap-4">
        <SectionHeader eyebrow={eyebrow} title={title} />
        <Link
          to="/c/stationery"
          className="hidden items-center gap-1 text-sm font-semibold text-purple-700 transition-colors hover:text-purple-900 sm:inline-flex"
        >
          Browse Catalog <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? [0, 1, 2, 3].map((i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl border border-purple-100 bg-purple-50/50" />)
          : products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

function DairyDrinksRail() {
  const { data, isLoading } = useQuery({
    queryKey: ["products", "dairy-drinks"],
    queryFn: () => apiGet<Product[]>("/products/dairy-drinks"),
  });
  const featuredProducts: Product[] = [];
  const addBySubcategory = (category: string, subcategory: string, count = 1) => {
    const matches = (data ?? [])
      .filter((product) => product.category === category && product.subcategory === subcategory && !featuredProducts.some((featured) => featured.id === product.id))
      .sort((a, b) => Number(b.is_new) - Number(a.is_new) || a.name.localeCompare(b.name))
      .slice(0, count);
    featuredProducts.push(...matches);
  };
  addBySubcategory("Milk & Dairy", "Buttermilk");
  addBySubcategory("Milk & Dairy", "Milk");
  addBySubcategory("Milk & Dairy", "Cheese");
  addBySubcategory("Milk & Dairy", "Flavoured Milk", 2);
  addBySubcategory("Daily Needs", "Soft Drinks");
  addBySubcategory("Daily Needs", "Energy Drinks");
  addBySubcategory("Daily Needs", "Juices");
  const dairyDrinks = [
    ...featuredProducts,
    ...(data ?? []).filter((product) => !featuredProducts.some((featured) => featured.id === product.id)),
  ].slice(0, 8);
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/70 via-white to-white" data-testid="home-dairy-drinks-section">
      <div aria-hidden className="pointer-events-none absolute -right-24 top-6 size-72 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 py-14">
        <div className="flex items-end justify-between gap-4">
          <SectionHeader eyebrow="Fresh Every Morning · Chilled All Day" title="Milk, Dairy & Cool Drinks" subtitle="Fresh milk, curd, paneer, lassi and buttermilk — plus chilled soft drinks, juices and water." />
          <Link to="/dairy-drinks" data-testid="home-dairy-drinks-view-all" className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-purple-700 transition-colors hover:text-purple-900 sm:inline-flex">
            See All Dairy &amp; Drinks <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? [0, 1, 2, 3].map((i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl border border-sky-100 bg-sky-50/50" />)
            : dairyDrinks.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        <Link to="/milk-subscription" data-testid="home-milk-subscription-cta" className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-sky-200 bg-white/80 p-4 shadow-sm backdrop-blur transition-[border-color,box-shadow] hover:border-purple-300 hover:shadow-md">
          <span className="flex size-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700"><Milk className="size-5" /></span>
          <span className="min-w-0 flex-1"><span className="block font-heading font-extrabold text-purple-950">Daily Milk Subscription</span><span className="text-sm text-slate-600">Book once — pickup at the counter or home delivery in the colony. Pay at the counter.</span></span>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-purple-700">Book Now <ArrowRight className="size-4" /></span>
        </Link>
        <Link to="/dairy-drinks" data-testid="home-dairy-drinks-view-all-mobile" className={cn(buttonVariants({ variant: "outline" }), "mt-6 w-full justify-center gap-1.5 sm:hidden")}>
          See All Dairy &amp; Drinks <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-purple-100/70 via-purple-50 to-white">
        <div aria-hidden className="pointer-events-none absolute -left-24 top-10 size-72 rounded-full bg-purple-200/40 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-16 bottom-0 size-80 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 lg:grid-cols-2 lg:py-20">
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="gap-1.5 border border-purple-200 bg-white px-3 py-1.5 text-purple-800" data-testid="hero-open-daily-badge">
                <Clock className="size-3.5 text-emerald-600" /> Open Daily 8 AM – 10 PM
              </Badge>
              <Badge className="gap-1.5 border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-800" data-testid="hero-rating-badge">
                <Star className="size-3.5 fill-amber-500 text-amber-500" /> Top Rated by Customers
              </Badge>
            </div>
            <h1 className="mt-5 font-heading text-4xl font-extrabold tracking-tight text-purple-950 sm:text-5xl">
              H.A.R.M DAILY NEEDS
            </h1>
            <p className="mt-2 font-heading text-lg font-bold text-purple-700 sm:text-xl">
              Trusted by Families, Students &amp; Offices Since Day One
            </p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
              Your one-stop neighbourhood superstore in Bandlaguda Jagir — stationery, note books, office
              supplies, fast Xerox &amp; printing, gifts, money transfer and daily needs. Everything under one
              friendly roof.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link to="/c/stationery" data-testid="hero-explore-button" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
                Explore Products <ArrowRight className="size-4" />
              </Link>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noreferrer"
                data-testid="hero-whatsapp-button"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50")}
              >
                <MessageCircle className="size-4" /> WhatsApp Us
              </a>
              <a href={STORE.phoneTel} data-testid="hero-call-button" className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "gap-2 text-purple-800")}>
                <Phone className="size-4" /> {STORE.phoneDisplay}
              </a>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] font-medium text-slate-600">
              <span className="inline-flex items-center gap-1.5"><BadgeCheck className="size-4 text-emerald-600" /> 100% genuine brands</span>
              <span className="inline-flex items-center gap-1.5"><BadgeCheck className="size-4 text-emerald-600" /> Xerox from ₹2</span>
              <span className="inline-flex items-center gap-1.5"><BadgeCheck className="size-4 text-emerald-600" /> Open till 10 PM</span>
            </div>
          </div>

          <div className="relative">
            <img
              src={HERO_IMAGES.main}
              alt="Real stationery products at H.A.R.M DAILY NEEDS — notebooks, pens and school supplies"
              className="aspect-[4/3] w-full rounded-3xl border border-purple-100 object-cover shadow-xl"
              decoding="async"
              fetchPriority="high"
            />
            <img
              src={HERO_IMAGES.flatlay}
              alt="Art and craft essentials flatlay"
              loading="lazy"
              decoding="async"
              className="absolute -bottom-8 -right-3 hidden w-44 rotate-2 rounded-2xl border-4 border-white object-cover shadow-xl sm:block"
            />
            <div className="absolute -left-3 top-8 rounded-2xl border border-purple-100 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-md sm:-left-6" data-testid="hero-xerox-chip">
              <p className="font-heading text-xl font-extrabold text-purple-900" data-testid="hero-xerox-price">₹2<span className="text-sm font-semibold text-purple-500">/page</span> <span className="text-sm font-semibold text-purple-400">&amp;</span> ₹2.5<span className="text-sm font-semibold text-purple-500">/2 sides</span></p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">B&amp;W Xerox · Ready in minutes</p>
            </div>
          </div>
        </div>
      </section>

      <FestivalBanners />

      {/* ---------- BRAND STRIP ---------- */}
      <section className="border-y border-purple-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-7">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            India&apos;s trusted brands always in stock
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            {BRANDS.map((brand) => (
              <span
                key={brand}
                className="rounded-full border border-purple-100 bg-purple-50 px-4 py-1.5 font-heading text-sm font-bold text-purple-900"
                data-testid={`brand-chip-${brand.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FEATURED SERVICES ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <SectionHeader
          eyebrow="What We Do"
          title="More Than a Store — A Complete Hub"
          subtitle="Eight services, one roof. Tap any card to explore what's in stock or check counter rates."
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service) => (
            <div
              key={service.id}
              data-testid={`service-card-${service.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-purple-300 hover:shadow-xl"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={service.image}
                  alt={`${service.title} at H.A.R.M DAILY NEEDS`}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 rounded-full bg-purple-950/85 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  {service.badge}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <p className="flex items-center gap-2 font-heading text-base font-extrabold text-purple-950">
                  <service.icon className="size-4.5 text-purple-600" /> {service.title}
                </p>
                <p className="flex-1 text-[13px] leading-relaxed text-slate-600">{service.description}</p>
                {service.note ? (
                  <p className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-800">{service.note}</p>
                ) : null}
                <Link
                  to={service.href}
                  data-testid={`service-explore-${service.id}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-1 w-full justify-center gap-1.5 border-purple-200 text-purple-800 hover:bg-purple-50")}
                >
                  {service.cta} <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- PRODUCT SHOWCASE RAILS ---------- */}
      <ProductRail title="Best Selling Products" eyebrow="Customer Favourites" flag="best" />
      <ProductRail title="New Arrivals" eyebrow="Just Landed" flag="new" />

      {/* ---------- MILK, DAIRY & COOL DRINKS ---------- */}
      <DairyDrinksRail />

      {/* ---------- REVIEWS ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <ReviewSection limit={3} />
        <div className="mt-6">
          <Link to="/reviews" data-testid="reviews-view-all-link" className="text-sm font-semibold text-purple-700 hover:text-purple-900">
            Read all customer reviews →
          </Link>
        </div>
      </section>

      <QuickContact />
      <AiAssistant />
    </>
  );
}

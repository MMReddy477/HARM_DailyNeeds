import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, BookOpen, Clock, MessageCircle, Milk, Phone, Star } from "lucide-react";

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
import { HOME_PRODUCT_FALLBACKS } from "@/lib/home-product-fallbacks";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

function ProductRail({ title, eyebrow, flag }: { title: string; eyebrow: string; flag: "best" | "new" }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["products", flag],
    queryFn: () => apiGet<Product[]>(`/products?flag=${flag}&limit=200`),
    retry: 1,
  });
  const usingFallback = isError && !data?.length;
  const products = [...(data ?? (usingFallback ? HOME_PRODUCT_FALLBACKS[flag] : []))]
    .sort((a, b) => {
      const priority = (product: Product) => {
        if (flag === "best" && product.category === "Milk & Dairy" && product.subcategory === "Buttermilk") return 0;
        if (flag === "new" && product.category === "Daily Needs" && product.subcategory === "Energy Drinks") return 0;
        if (flag === "new" && product.category === "Milk & Dairy" && product.subcategory === "Flavoured Milk") return 1;
        return 2;
      };
      return priority(a) - priority(b);
    });

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
      {usingFallback ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" role="status" data-testid={`product-rail-error-${flag}`}>
          Live catalog connection failed. Showing guide prices only; stock and current prices need confirmation.
          <button type="button" className="ml-2 font-bold underline underline-offset-2" onClick={() => void refetch()}>Retry live catalog</button>
        </p>
      ) : null}
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          [0, 1, 2, 3].map((i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl border border-purple-100 bg-purple-50/50" />)
        ) : products.length > 0 ? (
          products.map((p) => <ProductCard key={p.id} product={p} availabilityVerified={!usingFallback} />)
        ) : (
          <p className="rounded-xl border border-purple-100 bg-purple-50/70 p-4 text-sm text-slate-600 sm:col-span-2 lg:col-span-4" data-testid={`product-rail-empty-${flag}`}>
            No featured products are available yet. Browse the catalog to see current stock.
          </p>
        )}
      </div>
    </section>
  );
}

function DairyDrinksRail() {
  const { data, isLoading, isError, refetch } = useQuery({
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
  ];
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
          {isLoading ? (
            [0, 1, 2, 3].map((i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl border border-sky-100 bg-sky-50/50" />)
          ) : isError ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 sm:col-span-2 lg:col-span-4" role="alert" data-testid="dairy-drinks-error">
              Dairy and beverage products could not load right now. Check the connection and try again.
              <button type="button" className="ml-2 font-bold underline underline-offset-2" onClick={() => void refetch()}>Retry</button>
            </div>
          ) : dairyDrinks.length > 0 ? (
            dairyDrinks.map((p) => <ProductCard key={p.id} product={p} />)
          ) : (
            <p className="rounded-xl border border-sky-100 bg-sky-50/70 p-4 text-sm text-slate-600 sm:col-span-2 lg:col-span-4" data-testid="dairy-drinks-empty">
              Dairy and beverage products are being updated. Please check back soon.
            </p>
          )}
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
          <div
            className="brand-marquee mt-4"
            role="region"
            aria-label="Trusted stationery brands"
            data-testid="brand-marquee"
          >
            <div className="brand-track">
              {[0, 1].map((copy) => (
                <div
                  key={copy}
                  className="flex shrink-0 items-center gap-5 px-2"
                  aria-hidden={copy === 1}
                >
                  {BRANDS.map(({ name, logoDomain }) => (
                    <span
                      key={name}
                      className="flex h-16 min-w-36 items-center gap-3 rounded-xl border border-purple-100 bg-white px-4 shadow-sm"
                      data-testid={`brand-logo-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    >
                      <img
                        src={`https://www.google.com/s2/favicons?domain_url=https%3A%2F%2F${logoDomain}&sz=128`}
                        alt={`${name} logo`}
                        width="40"
                        height="40"
                        loading="lazy"
                        decoding="async"
                        className="size-10 shrink-0 object-contain"
                        onError={(event) => {
                          event.currentTarget.hidden = true;
                        }}
                      />
                      <span aria-hidden="true" className="whitespace-nowrap font-heading text-sm font-extrabold text-purple-950">
                        {name}
                      </span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
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

      <section className="mx-auto max-w-7xl px-4 pt-12" data-testid="home-school-kits-promo">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#3B0764] via-purple-900 to-purple-800 px-6 py-8 shadow-lg sm:px-10 sm:py-10">
          <div aria-hidden className="pointer-events-none absolute -right-10 -top-16 size-56 rounded-full bg-amber-300/15 blur-2xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Back to School</p>
              <h2 className="mt-2 font-heading text-2xl font-extrabold text-white sm:text-3xl">Ready-Made School Kits</h2>
              <p className="mt-2 text-sm leading-relaxed text-purple-100 sm:text-base">
                Pick your class, order on WhatsApp, and collect a packed kit — no list-checking, no running around.
              </p>
            </div>
            <Link
              to="/school-kits"
              data-testid="home-school-kits-cta"
              className={cn(buttonVariants({ size: "lg" }), "shrink-0 gap-2 bg-amber-300 text-purple-950 hover:bg-amber-200")}
            >
              <BookOpen className="size-4" /> Explore School Kits <ArrowRight className="size-4" />
            </Link>
          </div>
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

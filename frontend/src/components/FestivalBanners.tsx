import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles } from "lucide-react";

import { apiGet } from "@/lib/api";
import type { Banner } from "@/lib/types";

export default function FestivalBanners() {
  const { data } = useQuery({ queryKey: ["banners"], queryFn: () => apiGet<Banner[]>("/banners") });
  if (!data?.length) return null;
  return (
    <section className="mx-auto max-w-7xl space-y-4 px-4 py-8" data-testid="festival-banners">
      {data.map((b) => (
        <Link
          key={b.id}
          to={b.link}
          data-testid={`festival-banner-${b.id}`}
          className="group relative block overflow-hidden rounded-3xl bg-purple-950 shadow-lg shadow-purple-900/20 transition-transform duration-300 hover:-translate-y-0.5"
        >
          <img src={b.image} alt={b.title} loading="lazy" className="absolute inset-0 size-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-950/95 via-purple-900/70 to-transparent" />
          <div className="relative max-w-xl px-6 py-10 sm:px-10 sm:py-14">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-purple-950" data-testid={`festival-banner-${b.id}-badge`}>
              <Sparkles className="size-3.5" /> {b.festival} Special
            </span>
            <h2 className="mt-4 font-heading text-3xl font-extrabold text-white sm:text-4xl" data-testid={`festival-banner-${b.id}-title`}>{b.title}</h2>
            {b.subtitle ? <p className="mt-3 text-[15px] leading-relaxed text-purple-100" data-testid={`festival-banner-${b.id}-subtitle`}>{b.subtitle}</p> : null}
            <span className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-purple-900 transition-colors group-hover:bg-amber-300" data-testid={`festival-banner-${b.id}-cta`}>
              {b.cta_label} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </Link>
      ))}
    </section>
  );
}

import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";

import QuickContact from "@/components/QuickContact";
import { buttonVariants } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import { PLACEHOLDER_IMG, STORE } from "@/lib/constants";
import { inr, type KitView } from "@/lib/types";
import { cn } from "@/lib/utils";

function orderLink(k: KitView) {
  const lines = k.items.map((i) => `- ${i.name} x${i.qty}`).join("\n");
  return `https://wa.me/${STORE.whatsappNumber}?text=${encodeURIComponent(`Hi ${STORE.name}! I'd like to order the ${k.name} (${k.class_range}) for ${inr(k.total)}:\n${lines}`)}`;
}

export default function SchoolKitsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["kits"], queryFn: () => apiGet<KitView[]>("/kits") });
  return (
    <>
      <section className="bg-[#3B0764]">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Back to School</p>
          <h1 className="mt-1.5 font-heading text-3xl font-extrabold text-white sm:text-4xl">Ready-Made School Kits</h1>
          <p className="mt-2 max-w-2xl text-purple-200">Pick your class, order on WhatsApp, and collect a packed kit — no list-checking, no running around.</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-10 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? [0, 1, 2].map((i) => <div key={i} className="h-96 animate-pulse rounded-2xl bg-purple-50" />) : (data ?? []).map((k) => (
          <div key={k.id} className="flex flex-col rounded-2xl border border-purple-100 bg-white p-5 shadow-sm" data-testid={`school-kit-${k.id}`}>
            <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase text-amber-800">{k.class_range}</span>
            <h2 className="mt-3 font-heading text-xl font-extrabold text-purple-950">{k.name}</h2>
            <p className="mt-1 text-sm text-slate-600">{k.description}</p>
            <ul className="mt-4 flex-1 space-y-2">
              {k.items.map((i) => (
                <li key={i.product_id} className="flex items-center gap-3 text-sm">
                  <img src={i.image || PLACEHOLDER_IMG} alt="" loading="lazy" className="size-10 rounded-lg border object-cover" />
                  <span className="flex-1 text-slate-800">{i.name}</span>
                  <span className="text-slate-500">×{i.qty}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-center justify-between border-t pt-4">
              <div><p className="text-xs text-slate-500">Kit total</p><p className="font-heading text-2xl font-extrabold text-purple-900" data-testid={`school-kit-total-${k.id}`}>{inr(k.total)}</p></div>
              <a href={orderLink(k)} target="_blank" rel="noreferrer" className={cn(buttonVariants(), "gap-1.5 bg-emerald-600 hover:bg-emerald-700")} data-testid={`school-kit-order-${k.id}`}><MessageCircle className="size-4" /> Order on WhatsApp</a>
            </div>
          </div>
        ))}
      </section>
      <QuickContact />
    </>
  );
}

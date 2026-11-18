import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Home as HomeIcon, MessageCircle, Milk, Store } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, apiGet, apiPost } from "@/lib/api";
import { PLACEHOLDER_IMG, STORE, whatsappLink } from "@/lib/constants";
import { inr, milkWhere, type MilkSubscription, type Product } from "@/lib/types";
import { cn } from "@/lib/utils";

// IST "tomorrow" as the earliest start; the server re-validates against its own clock.
const istTomorrow = () => new Date(Date.now() + 5.5 * 3600e3 + 86400e3).toISOString().slice(0, 10);

export default function MilkSubscriptionPage() {
  const { data: milks } = useQuery({ queryKey: ["milk-products"], queryFn: () => apiGet<Product[]>("/milk/products") });
  const minDate = istTomorrow();
  const [form, setForm] = useState({ name: "", phone: "", product_id: "", qty: 1, mode: "pickup" as "pickup" | "delivery", building: "", floor: "", flat: "", address: "", start_date: minDate });
  const [error, setError] = useState("");
  const productId = form.product_id || milks?.[0]?.id || "";
  const product = milks?.find((m) => m.id === productId);

  const book = useMutation({
    mutationFn: () => apiPost<MilkSubscription>("/milk/subscriptions", { ...form, product_id: productId }),
    onError: (e) => setError(e instanceof ApiError && typeof (e.body as { detail?: unknown })?.detail === "string" ? String((e.body as { detail: string }).detail) : "Please check your details and try again"),
    onMutate: () => setError(""),
  });

  if (book.data) {
    const s = book.data;
    return (
      <div className="mx-auto max-w-xl px-4 py-16" data-testid="milk-success">
        <div className="rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-lg">
          <CheckCircle2 className="mx-auto size-14 text-emerald-600" />
          <h1 className="mt-4 font-heading text-2xl font-extrabold text-purple-950">Milk subscription booked!</h1>
          <p className="mt-2 text-slate-600">Your code is <b className="text-purple-800" data-testid="milk-success-code">{s.code}</b></p>
          <div className="mt-5 space-y-1 rounded-2xl bg-purple-50 p-4 text-left text-[15px] text-slate-700">
            <p><b>{s.qty} × {s.product_name}</b> every day</p>
            <p>Starting <b>{new Date(`${s.start_date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long" })}</b></p>
            <p>{s.mode === "delivery" ? <>Home delivery to <b>{milkWhere(s)}</b></> : <>Collect at the counter from 8 AM</>}</p>
            <p>Pay at the counter — {inr(s.unit_price * s.qty)} per day, daily or monthly.</p>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <a href={whatsappLink(`milk subscription ${s.code}`)} target="_blank" rel="noreferrer" className={cn(buttonVariants(), "gap-1.5 bg-emerald-600 hover:bg-emerald-700")} data-testid="milk-success-whatsapp"><MessageCircle className="size-4" /> Change on WhatsApp</a>
            <Link to={`/milk-skip?code=${s.code}`} className={cn(buttonVariants({ variant: "outline" }))} data-testid="milk-success-skip-link">Skip a Day</Link>
            <Link to="/dairy-drinks" className={cn(buttonVariants({ variant: "ghost" }))} data-testid="milk-success-back">Back to Dairy &amp; Drinks</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="bg-gradient-to-br from-purple-950 via-purple-900 to-sky-900">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">Daily Milk Subscription</p>
          <h1 className="mt-2 font-heading text-4xl font-extrabold text-white sm:text-5xl">Fresh milk, every single morning</h1>
          <Link to="/milk-skip" className="mt-4 inline-flex rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-white/20" data-testid="milk-hero-skip-link">Already subscribed? Skip a day →</Link>
          <p className="mt-3 max-w-xl text-base text-purple-100">Book once — we keep your packets ready at the counter or deliver within the colony. No online payment: pay at the counter daily or monthly.</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-5">
        <form
          className="space-y-5 rounded-3xl border border-purple-100 bg-white p-6 shadow-sm lg:col-span-3"
          onSubmit={(e) => { e.preventDefault(); book.mutate(); }}
          data-testid="milk-form"
        >
          <div>
            <Label className="text-base font-bold">1. Choose your milk</Label>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {(milks ?? []).map((m) => (
                <button key={m.id} type="button" onClick={() => setForm({ ...form, product_id: m.id })} data-testid={`milk-product-${m.id}`}
                  className={cn("rounded-2xl border-2 p-3 text-left transition-[border-color,box-shadow]", productId === m.id ? "border-purple-600 shadow-md" : "border-purple-100 hover:border-purple-300")}>
                  <img src={m.image || PLACEHOLDER_IMG} alt={m.name} loading="lazy" className="aspect-square w-full rounded-xl object-cover" />
                  <p className="mt-2 text-sm font-bold text-slate-900">{m.name}</p>
                  <p className="text-sm font-semibold text-purple-700">{inr(m.price)} <span className="font-normal text-slate-500">{m.unit}</span></p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>2. Packets per day</Label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setForm({ ...form, qty: Math.max(1, form.qty - 1) })} data-testid="milk-qty-minus">−</Button>
                <span className="w-10 text-center text-xl font-extrabold" data-testid="milk-qty">{form.qty}</span>
                <Button type="button" variant="outline" onClick={() => setForm({ ...form, qty: Math.min(10, form.qty + 1) })} data-testid="milk-qty-plus">+</Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="milk-start">3. Start from</Label>
              <Input id="milk-start" type="date" min={minDate} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="h-11" data-testid="milk-start-date" />
            </div>
          </div>

          <div>
            <Label>4. How will you get it?</Label>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {([["pickup", "Pickup at store", "Collect from 8 AM at the counter", Store], ["delivery", "Home delivery", "Within Suryodhaya Colony & nearby", HomeIcon]] as const).map(([id, title, sub, Icon]) => (
                <button key={id} type="button" onClick={() => setForm({ ...form, mode: id })} data-testid={`milk-mode-${id}`}
                  className={cn("flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-colors", form.mode === id ? "border-purple-600 bg-purple-50" : "border-purple-100 hover:border-purple-300")}>
                  <Icon className="mt-0.5 size-5 text-purple-700" />
                  <span><span className="block font-bold text-slate-900">{title}</span><span className="text-sm text-slate-500">{sub}</span></span>
                </button>
              ))}
            </div>
            {form.mode === "delivery" ? (
              <div className="mt-3 space-y-3 rounded-2xl bg-purple-50/60 p-4">
                <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
                  <div className="space-y-1"><Label className="text-xs">Building / Block *</Label><Input value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} placeholder="e.g. Sirius Block B" className="bg-white" data-testid="milk-building-input" /></div>
                  <div className="space-y-1"><Label className="text-xs">Floor</Label><Input value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} placeholder="e.g. 3" className="bg-white" data-testid="milk-floor-input" /></div>
                  <div className="space-y-1"><Label className="text-xs">Flat no. *</Label><Input value={form.flat} onChange={(e) => setForm({ ...form, flat: e.target.value })} placeholder="e.g. 304" className="bg-white" data-testid="milk-flat-input" /></div>
                </div>
                <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Landmark / directions (optional)" className="bg-white" data-testid="milk-address-input" />
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="milk-name">Your name</Label><Input id="milk-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11" data-testid="milk-name-input" /></div>
            <div className="space-y-1.5"><Label htmlFor="milk-phone">Mobile (WhatsApp)</Label><Input id="milk-phone" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="10-digit number" className="h-11" data-testid="milk-phone-input" /></div>
          </div>

          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700" data-testid="milk-error">{error}</p> : null}
          <Button type="submit" className="h-12 w-full text-base font-bold" disabled={book.isPending || !productId || form.name.trim().length < 2 || form.phone.replace(/\D/g, "").length < 10} data-testid="milk-submit-button">
            {book.isPending ? "Booking…" : "Book Daily Milk"}
          </Button>
        </form>

        <aside className="h-fit space-y-4 rounded-3xl bg-purple-950 p-6 text-white lg:sticky lg:top-24 lg:col-span-2" data-testid="milk-summary">
          <p className="flex items-center gap-2 font-heading text-lg font-extrabold"><Milk className="size-5 text-sky-300" /> Your daily order</p>
          <p className="text-3xl font-extrabold text-amber-300" data-testid="milk-summary-daily">{inr((product?.price ?? 0) * form.qty)}<span className="text-base font-semibold text-purple-200"> / day</span></p>
          <p className="text-sm text-purple-200">{form.qty} × {product?.name ?? "—"} · about {inr((product?.price ?? 0) * form.qty * 30)} a month</p>
          <ul className="space-y-1.5 text-sm text-purple-100">
            <li>✓ Pay at the counter — daily or monthly</li>
            <li>✓ Travelling? <Link to="/milk-skip" className="font-semibold text-amber-300 underline" data-testid="milk-summary-skip-link">Skip a day</Link> — no charge</li>
            <li>✓ Questions? Call {STORE.phoneDisplay}</li>
          </ul>
        </aside>
      </div>
    </>
  );
}

import { Link } from "react-router-dom";
import { FileCheck, MessageCircle, RefreshCw, Upload } from "lucide-react";

import QuickContact from "@/components/QuickContact";
import AiAssistant from "@/components/AiAssistant";
import SectionHeader from "@/components/SectionHeader";
import XeroxRates from "@/components/XeroxRates";
import { buttonVariants } from "@/components/ui/button";
import { PRINTER_PHOTOS, whatsappLink } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: Upload,
    title: "1. Send your files",
    desc: "WhatsApp your PDFs, photos or documents to +91 83747 78183 — or bring a USB drive / email them at the counter.",
  },
  {
    icon: RefreshCw,
    title: "2. We print & finish",
    desc: "B&W or colour, single or bulk, plus lamination, scanning and spiral binding while you wait.",
  },
  {
    icon: FileCheck,
    title: "3. Collect in minutes",
    desc: "Pay at the counter when you collect. Open daily 8 AM – 10 PM, Sundays included.",
  },
];

export default function PrintXeroxPage() {
  return (
    <>
      <section className="bg-[#3B0764]">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Xerox · Printing · Scanning · Binding</p>
          <h1 className="mt-1.5 font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Print &amp; Xerox Centre
          </h1>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-purple-200">
            The fastest Xerox counter in Bandlaguda Jagir — B&amp;W copies ₹2 per page (₹2.5 both sides), colour from ₹5. Bulk
            student projects, office documents, passport photos, lamination and spiral binding, all done
            while you wait.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <a
              href={whatsappLink("Print / Xerox job — sending files")}
              target="_blank"
              rel="noreferrer"
              data-testid="printxerox-whatsapp-files-button"
              className={cn(buttonVariants({ size: "lg" }), "gap-2 bg-emerald-500 text-white hover:bg-emerald-600")}
            >
              <MessageCircle className="size-4" /> Send Files on WhatsApp
            </a>
            <a href="tel:+918374778183" data-testid="printxerox-call-button" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "gap-2 border-purple-300 text-white hover:bg-purple-800")}>
              Call the Counter
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <SectionHeader
          eyebrow="Transparent Rates"
          title="Xerox & Printing Price List"
          subtitle="Starting prices — bulk discounts at the counter for school and office orders."
        />
        <div className="mt-8">
          <XeroxRates />
        </div>
      </section>

      <section className="border-y border-purple-100 bg-purple-50/60">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <SectionHeader eyebrow="Our Machines" title="Professional Machines, Crisp Output" />
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {PRINTER_PHOTOS.map((photo) => (
              <figure key={photo.url} className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">
                <img src={photo.url} alt={photo.caption} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
                <figcaption className="px-4 py-3 font-heading text-sm font-bold text-purple-950">{photo.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <SectionHeader eyebrow="How It Works" title="Print From Your Phone in 3 Steps" />
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.title} className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
              <span className="flex size-11 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                <step.icon className="size-5" />
              </span>
              <p className="mt-3.5 font-heading text-base font-extrabold text-purple-950">{step.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{step.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
          <strong className="font-heading">Also at the counter:</strong> document scanning straight to your
          email or WhatsApp, photocopies on A4/A3, ID &amp; certificate lamination, and same-hour spiral
          binding for project submissions.
        </div>
      </section>

      <QuickContact />
      <AiAssistant />
    </>
  );
}

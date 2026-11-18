import QuickContact from "@/components/QuickContact";
import AiAssistant from "@/components/AiAssistant";
import SectionHeader from "@/components/SectionHeader";
import StoreLocation from "@/components/StoreLocation";
import { SERVICE_AREAS, STORE } from "@/lib/constants";

export default function LocationPage() {
  return (
    <>
      <section className="bg-[#3B0764]">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Store Location &amp; Directions</p>
          <h1 className="mt-1.5 font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Visit {STORE.name}
          </h1>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-purple-200">
            {STORE.timings} · Walk in for stationery, xerox, printing, gifts, money transfer and daily
            essentials — we are right around the corner.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <StoreLocation />

        <div className="mt-10 rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
          <p className="font-heading text-base font-extrabold text-purple-950">Serving your neighbourhood</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Looking for a <strong>stationery store near you</strong>, a <strong>xerox shop near you</strong>,
            or reliable <strong>printing services</strong>, <strong>office supplies</strong>,{" "}
            <strong>money transfer services</strong> and a convenient <strong>daily needs store</strong> in
            Hyderabad? H.A.R.M DAILY NEEDS at My Abode The Sirius, Suryodhaya Colony, Bandlaguda Jagir is
            your trusted one-stop local shop — open every day 8 AM to 10 PM.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {SERVICE_AREAS.map((area) => (
              <span key={area} className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-800" data-testid={`service-area-${area.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                {area}
              </span>
            ))}
          </div>
        </div>
      </section>

      <QuickContact />
      <AiAssistant />
    </>
  );
}

import { Link } from "react-router-dom";
import { Clock, MapPin, MessageCircle, Phone, Star } from "lucide-react";

import { CATEGORIES, STORE, whatsappLink } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="bg-[#1E1B4B] text-slate-200">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <img src="/brand/harm-daily-needs-mark.svg" alt="" className="size-10 shrink-0" />
            <span className="font-heading text-base font-extrabold text-white">H.A.R.M DAILY NEEDS</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">{STORE.tagline}</p>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-amber-300">
            <Star className="size-3.5 fill-amber-300" /> Loved by local customers
          </p>
        </div>

        <div>
          <p className="font-heading text-sm font-bold uppercase tracking-wider text-amber-300">Shop Categories</p>
          <ul className="mt-3 space-y-2 text-sm">
            {Object.values(CATEGORIES).map((c) => (
              <li key={c.slug}>
                <Link to={`/c/${c.slug}`} data-testid={`footer-category-${c.slug}`} className="transition-colors hover:text-amber-300">
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/print-xerox" data-testid="footer-print-xerox" className="transition-colors hover:text-amber-300">
                Print &amp; Xerox
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-heading text-sm font-bold uppercase tracking-wider text-amber-300">Store Hours</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Clock className="mt-0.5 size-4 text-amber-300" />
              <span>Open Daily<br />8:00 AM – 10:00 PM</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 text-amber-300" />
              <span>
                {STORE.addressLines.map((line) => (
                  <span key={line} className="block">{line}</span>
                ))}
              </span>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-heading text-sm font-bold uppercase tracking-wider text-amber-300">Contact Us</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href={STORE.phoneTel} data-testid="footer-call-button" className="flex items-center gap-2 transition-colors hover:text-amber-300">
                <Phone className="size-4" /> {STORE.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={whatsappLink()} target="_blank" rel="noreferrer" data-testid="footer-whatsapp-button" className="flex items-center gap-2 transition-colors hover:text-amber-300">
                <MessageCircle className="size-4" /> WhatsApp Us
              </a>
            </li>
            <li>
              <a href={STORE.mapsDirections} target="_blank" rel="noreferrer" data-testid="footer-directions-button" className="flex items-center gap-2 transition-colors hover:text-amber-300">
                <MapPin className="size-4" /> Get Directions
              </a>
            </li>
            <li>
              <Link to="/reviews" data-testid="footer-reviews-link" className="transition-colors hover:text-amber-300">
                Customer Reviews
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} H.A.R.M DAILY NEEDS · Bandlaguda Jagir, Hyderabad</p>
          <Link to="/admin/login" data-testid="footer-owner-login-link" className="inline-flex items-center gap-1 transition-colors hover:text-amber-300">
            Owner Login
          </Link>
        </div>
      </div>
    </footer>
  );
}

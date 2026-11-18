import { toast } from "sonner";
import { Clock, MapPin, MessageCircle, Navigation, Phone, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { STORE, whatsappLink } from "@/lib/constants";

export default function StoreLocation() {
  const shareLocation = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: STORE.name, text: `Visit ${STORE.name}`, url: STORE.mapsDirections });
      } else {
        await navigator.clipboard.writeText(STORE.mapsDirections);
        toast.success("Store location link copied to clipboard");
      }
    } catch {
      // dismissed
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="overflow-hidden rounded-2xl border border-purple-100 shadow-sm lg:col-span-3">
        <iframe
          title="H.A.R.M DAILY NEEDS store location on Google Maps"
          src={STORE.mapsEmbed}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-full min-h-[320px] w-full"
          data-testid="store-map-embed"
        />
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-purple-100 bg-white p-6 shadow-sm lg:col-span-2">
        <div>
          <span
            data-testid="open-daily-badge"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            Open Daily 8:00 AM – 10:00 PM
          </span>
        </div>

        <div>
          <p className="font-heading text-lg font-extrabold text-purple-950">{STORE.name}</p>
          <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-slate-600">
            <MapPin className="mt-0.5 size-4 shrink-0 text-purple-600" />
            <span>
              {STORE.addressLines.map((line) => (
                <span key={line} className="block">{line}</span>
              ))}
            </span>
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
            <Clock className="size-4 text-purple-600" /> Monday to Sunday — never closed
          </p>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2">
          <a
            href={STORE.phoneTel}
            data-testid="location-call-button"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-purple-700 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-purple-800"
          >
            <Phone className="size-4" /> Call Now
          </a>
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noreferrer"
            data-testid="location-whatsapp-button"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            <MessageCircle className="size-4" /> WhatsApp
          </a>
          <a
            href={STORE.mapsDirections}
            target="_blank"
            rel="noreferrer"
            data-testid="google-btn-directions"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
          >
            <Navigation className="size-4" /> Get Directions
          </a>
          <Button variant="outline" onClick={shareLocation} className="gap-1.5" data-testid="share-location-button">
            <Share2 className="size-4" /> Share Location
          </Button>
        </div>
      </div>
    </div>
  );
}

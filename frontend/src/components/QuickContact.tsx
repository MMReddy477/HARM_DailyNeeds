import { useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Navigation, Phone, Share2 } from "lucide-react";

import { STORE, whatsappLink } from "@/lib/constants";

// Floating quick-contact dock (Google Business actions). Bottom-left keeps it clear of
// the AI assistant launcher and the toast stack, which own the bottom-right corner.
export default function QuickContact() {
  const [sharing, setSharing] = useState(false);

  const shareLocation = async () => {
    if (sharing) return;
    setSharing(true);
    const url = STORE.mapsDirections;
    try {
      if (navigator.share) {
        await navigator.share({ title: STORE.name, text: `Visit ${STORE.name}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Store location link copied to clipboard");
      }
    } catch {
      // user dismissed the share sheet — nothing to do
    } finally {
      setSharing(false);
    }
  };

  const items = [
    {
      id: "call",
      label: "Call Now",
      href: STORE.phoneTel,
      icon: Phone,
      className: "bg-purple-700 hover:bg-purple-800",
      testid: "google-btn-call",
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      href: whatsappLink(),
      icon: MessageCircle,
      className: "bg-emerald-600 hover:bg-emerald-700",
      testid: "google-btn-whatsapp",
    },
    {
      id: "directions",
      label: "Get Directions",
      href: STORE.mapsDirections,
      icon: Navigation,
      className: "bg-amber-500 hover:bg-amber-600",
      testid: "google-btn-directions",
    },
  ];

  return (
    <div className="fixed bottom-4 left-4 z-40 flex flex-col gap-2">
      {items.map((item) => (
        <a
          key={item.id}
          href={item.href}
          target={item.href.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
          aria-label={item.label}
          data-testid={item.testid}
          className={`group flex size-10 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-200 hover:scale-110 sm:size-11 ${item.className}`}
        >
          <item.icon className="size-5" />
          <span className="pointer-events-none absolute left-14 rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {item.label}
          </span>
        </a>
      ))}
      <button
        type="button"
        onClick={shareLocation}
        aria-label="Share Location"
        data-testid="google-btn-share"
        className="group flex size-10 items-center justify-center rounded-full bg-slate-800 text-white shadow-lg transition-transform duration-200 hover:scale-110 sm:size-11"
      >
        <Share2 className="size-5" />
        <span className="pointer-events-none absolute left-14 rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          Share Location
        </span>
      </button>
    </div>
  );
}

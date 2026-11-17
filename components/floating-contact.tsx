"use client";

import { useState } from "react";
import { MessageCircle, Navigation, Phone, Share2, X } from "lucide-react";

export function FloatingContact({ address }: { address: string }) {
  const [status, setStatus] = useState("");
  const [showLink, setShowLink] = useState(false);
  const location = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`H.A.R.M DAILY NEEDS, ${address}`)}`;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  async function shareLocation() {
    setStatus("");
    setShowLink(false);
    if (navigator.share) {
      try { await navigator.share({ title: "H.A.R.M DAILY NEEDS", text: address, url: location }); return; }
      catch (error) { if (error instanceof Error && error.name === "AbortError") return; }
    }
    try { await navigator.clipboard.writeText(location); setStatus("Location link copied. Share it with friends and family."); }
    catch { setStatus("Copy this location link to share:"); setShowLink(true); }
  }
  return <>
    <nav className="floating-contact" aria-label="Quick contact and location">
      <a className="quick-call" href="tel:+918374778183" aria-label="Call Now"><Phone size={22}/><span>Call Now</span></a>
      <a className="quick-whatsapp" href="https://wa.me/918374778183" target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp"><MessageCircle size={23}/><span>Chat on WhatsApp</span></a>
      <a className="quick-directions" href={directions} target="_blank" rel="noreferrer" aria-label="Get Directions"><Navigation size={22}/><span>Get Directions</span></a>
      <button className="quick-share" type="button" onClick={shareLocation} aria-label="Share Location"><Share2 size={22}/><span>Share Location</span></button>
    </nav>
    {status && <div className="quick-share-status"><p role="status">{status}</p>{showLink && <input aria-label="Shop location link" readOnly value={location} onFocus={event=>event.currentTarget.select()}/>}<button type="button" aria-label="Dismiss location message" onClick={()=>setStatus("")}><X size={16}/></button></div>}
  </>;
}

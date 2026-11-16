"use client";
import { useEffect, useState } from "react";
import { Download, ExternalLink, QrCode } from "lucide-react";
import { googleReviewTarget } from "@/lib/google-reviews";

export function GoogleReviewQR({ kind = "google" }: { kind?: "google" | "shop" }) {
  const target = googleReviewTarget();
  const [reviewUrl, setReviewUrl] = useState("/reviews#write-review");
  const [local, setLocal] = useState(false);
  useEffect(() => {
    if (kind !== "shop") return;
    setLocal(/^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(window.location.hostname));
    let active = true;
    void fetch("/api/review-qr?kind=shop&format=json").then(r => r.json()).then(data => { if (active && data.url) setReviewUrl(data.url); }).catch(() => {});
    return () => { active = false; };
  }, [kind]);
  if (kind === "shop") return <aside className="google-qr-card" aria-label="Shop review QR code"><a className="google-qr-image" href={reviewUrl}><img src="/api/review-qr?kind=shop" alt="Scan to write a review for H.A.R DAILY NEEDS on our website" width={220} height={220} loading="lazy"/></a><div><span className="eyebrow"><QrCode size={15}/>SCAN &amp; REVIEW</span><h3>Scan to Write a Shop Review</h3><p>Open your phone camera, scan this QR and submit your name, star rating and review directly to our website. No Google link is needed.</p><p className="google-qr-note">Reviews appear after approval. Website submissions are separate from Google reviews.</p>{local && <p className="google-qr-note">Local preview: your phone must be on the same Wi-Fi as this computer, and this computer must allow local network access to port 3000. Keep the website running. Use a public website address for customers outside your Wi-Fi.</p>}<div className="google-qr-actions"><a href={reviewUrl}>Write a Shop Review<ExternalLink size={14}/></a><a href="/api/review-qr?kind=shop&download=1" download="harm-shop-review-qr.png"><Download size={14}/>Download Review QR</a></div></div></aside>;
  return <aside className="google-qr-card" aria-label="Google Maps QR code">
    <a className="google-qr-image" href={target.url} target="_blank" rel="noreferrer"><img src="/api/review-qr" alt={target.direct ? "Scan to open our Google review link" : "Scan to find H.A.R DAILY NEEDS on Google Maps"} width={220} height={220} loading="lazy"/></a>
    <div><span className="eyebrow"><QrCode size={15}/>SCAN &amp; CONNECT</span><h3>{target.direct ? "Share your experience on Google" : "Scan to find us on Google Maps"}</h3><p>{target.direct ? "Scan with your phone camera, open the Google link and submit your honest review." : "Scan with your phone camera to search for H.A.R DAILY NEEDS at our Bandlaguda Jagir address."}</p>
    {!target.direct && <p className="google-qr-note">This QR opens a Maps search. Once our shop listing is available, select it and choose Write a review.</p>}
    <div className="google-qr-actions"><a href={target.url} target="_blank" rel="noreferrer">{target.direct ? "Open Google review link" : "Open Google Maps"}<ExternalLink size={14}/></a><a href="/api/review-qr?download=1" download="harm-google-maps-qr.png"><Download size={14}/>Download QR</a></div></div>
  </aside>;
}

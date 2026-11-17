"use client";
import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Star } from "lucide-react";
import { googleReviewTarget } from "@/lib/google-reviews";
export function GoogleReviewQR() {
  const { url, direct } = googleReviewTarget();
  const [shareUrl, setShareUrl] = useState(direct ? url : "");
  const [status, setStatus] = useState("");
  const [manualCopy, setManualCopy] = useState(false);
  useEffect(() => {
    if (direct) return;
    let active = true;
    void fetch("/api/review-qr?format=json").then(response => response.json()).then(data => { if (active && data.url) setShareUrl(data.url); }).catch(() => {});
    return () => { active = false; };
  }, [direct]);
  async function copyLink() {
    setManualCopy(false);
    const value = shareUrl || new URL(url, window.location.origin).href;
    setShareUrl(value);
    try {
      if (!navigator.clipboard?.writeText) throw Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
      setStatus("Review link copied. Thank you for spreading the word!");
    } catch {
      setManualCopy(true);
      setStatus("Select and copy the review link below.");
    }
  }
  return <aside className="google-qr-card premium-review-qr" aria-labelledby="google-review-qr-title">
    <a className="google-qr-image" href={url} target={direct ? "_blank" : undefined} rel={direct ? "noreferrer" : undefined} aria-label={direct ? "Open our Google review link" : "Open the shop review form"}><img src="/api/review-qr" alt={direct ? "QR code for the H.A.R.M Daily Needs Google review link" : "QR code to write a review on the H.A.R.M Daily Needs website"} width={220} height={220} loading="lazy"/></a>
    <div className="premium-review-qr-copy"><span className="eyebrow">YOUR FEEDBACK MAKES A DIFFERENCE</span><h3 id="google-review-qr-title"><Star size={23} fill="currentColor" aria-hidden="true"/>{direct ? "Scan to Review Us on Google" : "Scan to Review Our Shop"}</h3><p>{direct ? "Love our service? Scan this QR code and leave a Google Review. Your feedback helps our local business grow." : "Love our service? Scan this QR code and share your experience on our website. Your feedback helps our local business grow."}</p>
      <div className="google-qr-actions"><a className="review-primary-cta" href={url} target={direct ? "_blank" : undefined} rel={direct ? "noreferrer" : undefined}>{direct ? "Leave Google Review" : "Leave a Shop Review"}<ExternalLink size={16}/></a><button type="button" onClick={copyLink}><Copy size={16}/>Copy Review Link</button></div>
      {status && <p className="review-copy-status" role="status">{manualCopy ? <Copy size={15} aria-hidden="true"/> : <Check size={15} aria-hidden="true"/>}{status}</p>}
      {manualCopy && <input className="google-review-copy-input" aria-label="Review link to copy" value={shareUrl} readOnly onFocus={event => event.currentTarget.select()}/>}
    </div>
  </aside>;
}

"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Star } from "lucide-react";
import { GoogleReviewQR } from "@/components/google-review-qr";
import { googleReviewTarget } from "@/lib/google-reviews";

type Review = { id: string; name: string; rating: number; text: string; createdAt?: string };
const supplied: Review[] = [
  { id: "shop-1", name: "Srilatha Reddy", rating: 5, text: "Best stationery shop in Bandlaguda Jagir! Got all my daughter's school books - Classmate, Navneet, everything under one roof at reasonable prices." },
  { id: "shop-2", name: "Mohammed Abdul", rating: 5, text: "Very convenient. Xerox and spiral binding done in minutes. The owner is polite and helpful." },
  { id: "shop-3", name: "Kavitha S", rating: 5, text: "Bought geometry boxes, pens and art supplies for my kids. Good quality products and affordable prices." }
];
export function CustomerReviews({ formInitiallyOpen = false }: { formInitiallyOpen?: boolean }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const open = formInitiallyOpen;
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState(false);
  const google = googleReviewTarget();
  useEffect(() => {
    let active = true;
    const refresh = () => { void fetch("/api/reviews", { cache: "no-store" }).then(r => { if (!r.ok) throw Error(); return r.json(); }).then(data => { if (active) setReviews(data.reviews || []); }).catch(() => {}); };
    refresh();
    window.addEventListener("focus", refresh);
    const timer = window.setInterval(refresh, 30000);
    return () => { active = false; window.removeEventListener("focus", refresh); window.clearInterval(timer); };
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(false); setStatus("");
    if (!rating) { setError(true); setStatus("Please choose a star rating."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, rating, text, consent, website }) });
      const result = await response.json();
      if (!response.ok) throw Error(result.message || "Your review could not be saved.");
      setStatus(result.message); setName(""); setRating(0); setText(""); setConsent(false);
    } catch (e) { setError(true); setStatus(e instanceof Error ? e.message : "Please try again."); }
    finally { setBusy(false); }
  }
  return <section id="customer-reviews" className="google-review-section"><div className="google-review-card">
    <div className="customer-review-header"><div className="google-review-heading"><span className="eyebrow">CUSTOMER REVIEWS</span><h2 className="section-title">What Our Customers Say</h2><div className="customer-review-summary"><span aria-hidden="true">{[1,2,3,4,5].map(n => <Star key={n} size={17} fill="currentColor"/>)}</span><strong>4.9 / 5</strong><span>Shop customer rating</span></div></div><div className="customer-review-buttons"><a className="write-shop-review-link" href="/reviews#write-review">Write a Shop Review</a><a href={google.url} target="_blank" rel="noreferrer"><Star size={17} fill="currentColor"/>{google.direct ? "Write a Google Review" : "Find us on Google Maps"}</a></div></div>
    <div className="customer-feedback-grid">{[...reviews, ...supplied].map(review => <article key={review.id}><div className="customer-feedback-stars" role="img" aria-label={`${review.rating} out of 5 stars`}>{[1,2,3,4,5].map(n => <Star key={n} size={17} fill={n <= review.rating ? "currentColor" : "none"} aria-hidden="true"/>)}</div><blockquote>{review.text}</blockquote><div><strong>{review.name}</strong><span>{review.id.startsWith("shop-") ? "Shop-supplied feedback" : "Website customer review"}</span></div></article>)}</div>
    <p className="customer-feedback-source">Shop-supplied testimonials and approved website reviews. The shop's stated 4.9 rating is separate from new website submissions.</p>
    <GoogleReviewQR kind="shop"/><GoogleReviewQR/>
    {open && <form id="write-review" className="google-review-form shop-review-form" onSubmit={submit}>
      <h3>Write a Shop Review</h3><p>Share your honest experience. Your name, rating and review will be public after approval. This submits to our website, not Google.</p>
      <label htmlFor="review-name">Your name<input id="review-name" value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={80} autoComplete="name" enterKeyHint="next" required disabled={busy}/></label>
      <fieldset className="review-rating"><legend>Your rating</legend><div role="group" aria-label="Choose a star rating">{[1,2,3,4,5].map(n => <button key={n} type="button" aria-label={`${n} stars`} aria-pressed={rating===n} onClick={() => setRating(n)} disabled={busy}><Star size={27} fill={rating>=n ? "currentColor" : "none"}/></button>)}</div></fieldset>
      <label htmlFor="shop-review-text">Your review</label><textarea id="shop-review-text" value={text} onChange={e => setText(e.target.value)} minLength={10} maxLength={1500} rows={4} required disabled={busy} placeholder="Tell us about your visit, products or service..."/>
      <label className="review-honeypot" aria-hidden="true">Website<input value={website} onChange={e => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off"/></label>
      <label className="review-consent"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} required disabled={busy}/>I agree to publish my name, rating and review on this website.</label>
      <div className="google-review-actions"><button className="button-primary" type="submit" disabled={busy}>{busy ? "Submitting..." : "Submit Review"}</button>{google.direct && <a href={google.url} target="_blank" rel="noreferrer">Review on Google separately</a>}</div>
      {status && <p role={error ? "alert" : "status"} className={error ? "shop-review-error" : "shop-review-success"}>{status}</p>}
    </form>}
  </div></section>;
}

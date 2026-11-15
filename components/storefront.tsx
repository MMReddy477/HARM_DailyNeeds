"use client";

import { motion, type Variants } from "framer-motion";
import {
  ArrowRight, Clock3, Heart, MapPin, Menu, MessageCircle, Phone, ShieldCheck, Star, X
} from "lucide-react";
import Link from "next/link";
import { ShopNavigation } from "@/components/shop-navigation";
import { SchoolSlideshow } from "@/components/school-slideshow";
import { useState, type FormEvent, type ReactNode } from "react";

const shopAddress = "2-2/30/201 My Abode the Sirius, Suryohayacolony, Bandlaguda Jagir 500086";
const shopArea = "Bandlaguda Jagir, Hyderabad";



const products = [
  { name: "Everyday notebooks", category: "Books & paper", image: "/product-images/notebook.svg", tone: "lilac" },
  { name: "Pens & writing", category: "Writing essentials", image: "/product-images/blue-pens.svg", tone: "peach" },
  { name: "Colour pencils", category: "Art supplies", image: "/product-images/colour-pencils.svg", tone: "yellow" },
  { name: "School essentials", category: "Learning favourites", image: "/banners/school-stationery-kit.jpg", tone: "mint" },
  { name: "Milk & dairy", category: "Fresh everyday needs", image: "/product-images/milk.svg", tone: "peach" },
  { name: "Curd & dairy favourites", category: "Chilled essentials", image: "/product-images/curd.svg", tone: "lilac" }
];

const reveal: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: .48, ease: [0.2, 0.8, 0.2, 1] as const } }
};
const revealWithDelay = (delay: number): Variants => ({
  ...reveal,
  show: { opacity: 1, y: 0, transition: { duration: .48, ease: [0.2, 0.8, 0.2, 1], delay } }
});

function WhatsAppLink({ className, children }: { className: string; children: ReactNode }) {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");
  const href = number ? `https://wa.me/${number}?text=${encodeURIComponent("Hi H.A.R.M Daily Needs, I have an enquiry.")}` : "https://wa.me/918374778183";
  return <a className={className} href={href} target="_blank" rel="noreferrer">{children}</a>;
}

export function Storefront() {
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewStatus, setReviewStatus] = useState("");
  const closeMenu = () => setMenuOpen(false);
  const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`H.A.R.M Daily Needs, ${shopAddress}, Hyderabad`)}`;

  const copyReview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reviewRating) {
      setReviewStatus("Please choose a star rating before continuing.");
      return;
    }

    const review = `${reviewText.trim()}\n\nRating: ${reviewRating}/5`;
    if (!navigator.clipboard?.writeText) {
      setReviewStatus("Copy is unavailable in this browser. Copy your review manually, then open Google Maps.");
      return;
    }

    void navigator.clipboard.writeText(review)
      .then(() => setReviewStatus("Review copied. Open Google Maps and paste it into your review."))
      .catch(() => setReviewStatus("Could not copy your review. Copy it manually, then open Google Maps."));
  };

  return (
    <main className={darkMode ? "public-dark" : undefined}>
      <div className="topline">
        <div className="section-shell topline-inner">
          <span><MapPin size={14} /> {shopArea}</span>
          <a href="tel:+918374778183"><Phone size={14}/> Call Us</a><a href="https://wa.me/918374778183" target="_blank" rel="noreferrer"><MessageCircle size={14}/> WhatsApp</a><span><Clock3 size={14} /> Open daily · Visit us today</span>
          <a href="mailto:harmdailyneeds@gmail.com"><MessageCircle size={14} /> We’re happy to help</a>
        </div>
      </div>
      <header className="site-header">
        <div className="section-shell nav-shell">
          <Link className="logo-lockup" href="/" aria-label="H.A.R.M Daily Needs home">
            <span className="logo-mark">H<span>.</span></span>
            <span className="header-brand-copy"><strong>H.A.R.M DAILY NEEDS</strong><small>Trusted by Families, Students &amp; Offices Since Day One</small></span>
          </Link>
          <button className="mobile-menu-toggle" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
          <ShopNavigation mobileOpen={menuOpen} onNavigate={closeMenu} />
          <div className="nav-actions"><button type="button" className="theme-toggle" onClick={() => setDarkMode(!darkMode)} aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"} aria-pressed={darkMode}>{darkMode ? "Light" : "Dark"}</button>
            <WhatsAppLink className="nav-whatsapp"><MessageCircle size={16} /> WhatsApp</WhatsAppLink>
            <Link className="owner-link" href="/owner-login">Owner login</Link>
          </div>
        </div>
      </header>

      <SchoolSlideshow />

      <section id="products" className="section-shell section-pad product-section">
        <div className="section-heading-row"><div><span className="eyebrow">A FEW EVERYDAY FAVOURITES</span><h2 className="section-title">Good things for <span className="gradient-text">big ideas.</span></h2><p className="section-lead">A peek at the kinds of essentials waiting on our shelves. Drop in to explore what’s available.</p></div><a className="button-outline" href="#contact">Ask what’s in store <ArrowRight size={16} /></a></div>
        <div className="product-grid">
          {products.map((product, index) => <motion.article className="product-card" key={product.name} initial="hidden" whileInView="show" viewport={{ once: true, amount: .2 }} variants={revealWithDelay(index * .06)}><div className={`product-image ${product.tone}`}><span className="product-badge">H.A.R.M PICK</span><img src={product.image} alt={product.name} loading="lazy" /></div><div className="product-info"><small>{product.category}</small><h3>{product.name}</h3><span className="available-pill"><i /> Ask for availability</span></div></motion.article>)}
        </div>
        <p className="no-price-note"><ShieldCheck size={15} /> Product choices change often. Visit or message us for today’s availability.</p>
        <div className="brands-row"><span className="eyebrow">FAMILIAR NAMES ON OUR SHELVES</span><div><strong className="brand-doms">DOMS</strong><strong className="brand-classmate">Classmate</strong><strong className="brand-harm">H.A.R.M</strong></div></div>
      </section>

      <section className="google-review-section">
        <div className="google-review-card">
          <div className="google-review-heading">
            <span className="eyebrow">YOUR FEEDBACK MATTERS</span>
            <h2 className="section-title">Enjoyed your visit?</h2>
            <p className="section-lead">Choose a rating and write a review. We’ll copy it for you to paste into Google Maps.</p>
          </div>
          <form className="google-review-form" onSubmit={copyReview}>
            <fieldset className="review-rating">
              <legend>Your rating</legend>
              <div role="group" aria-label="Choose a star rating">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    aria-label={`${rating} ${rating === 1 ? "star" : "stars"}`}
                    aria-pressed={reviewRating === rating}
                    onClick={() => {
                      setReviewRating(rating);
                      setReviewStatus("");
                    }}
                  >
                    <Star size={27} fill={reviewRating >= rating ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="google-review-label" htmlFor="google-review-text">Your review</label>
            <textarea
              id="google-review-text"
              value={reviewText}
              onChange={(event) => {
                setReviewText(event.target.value);
                setReviewStatus("");
              }}
              maxLength={1000}
              required
              rows={4}
              placeholder="Tell others about your experience at H.A.R.M Daily Needs"
            />
            <div className="google-review-actions">
              <button type="submit" className="button-primary">Copy review <ArrowRight size={16} /></button>
              <a className="button-outline" href={googleMapsSearchUrl} target="_blank" rel="noreferrer">Open Google Maps</a>
            </div>
            <p className="google-review-note" role="status">Your review is not submitted automatically. Paste it into Google Maps and submit it there.</p>
            {reviewStatus && <p className="google-review-status" role="status">{reviewStatus}</p>}
          </form>
        </div>
      </section>

      <section id="contact" className="section-shell section-pad contact-section">
        <div className="contact-copy"><span className="eyebrow">COME ON OVER</span><h2 className="section-title">Your neighbourhood<br /><span className="gradient-text">shop is right here.</span></h2><p className="section-lead">Stop by for your everyday needs. We’re looking forward to seeing you.</p>
          <div className="contact-details"><div><span className="contact-icon"><MapPin /></span><span><small>FIND OUR SHOP</small><strong>{shopAddress}</strong></span></div><div><span className="contact-icon"><Phone /></span><span><small>GIVE US A CALL</small><a className="contact-phone" href="tel:+918374778183">8374778183</a></span></div><div><span className="contact-icon"><MessageCircle /></span><span><small>SEND AN EMAIL</small><strong>harmdailyneeds@gmail.com</strong></span></div><div><span className="contact-icon"><Clock3 /></span><span><small>WHEN TO VISIT</small><strong>Open daily</strong></span></div></div>
          <a className="button-primary contact-email" href="mailto:harmdailyneeds@gmail.com">Send us an email <ArrowRight size={17} /></a>
        </div>
        <div className="map-card"><iframe title={`Map showing ${shopAddress}`} src={`https://maps.google.com/maps?q=${encodeURIComponent(shopAddress)}&t=&z=16&ie=UTF8&iwloc=&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /><div className="map-label"><MapPin size={18} /><span><strong>H.A.R.M DAILY NEEDS</strong><small>{shopAddress}</small></span></div></div>
      </section>

      <footer className="site-footer">
        <div className="section-shell footer-main"><div className="footer-brand"><Link className="logo-lockup" href="/"><span className="logo-mark footer-logo-mark">H<span>.</span></span><span><strong>H.A.R.M</strong><small>DAILY NEEDS</small></span></Link><p>Your friendly neighbourhood shop for everyday needs in {shopArea}.</p><WhatsAppLink className="footer-social"><MessageCircle size={17} /> Chat with us</WhatsAppLink></div><div className="footer-links"><h3>Explore</h3><a href="#home">Home</a><a href="/shop">Shop all</a><a href="/shop?department=school-supplies">Stationery</a></div><div className="footer-links"><h3>Everyday help</h3><a href="/shop?department=print-xerox">Print & Xerox</a><a href="/shop?department=gift-items">Gifts & toys</a><a href="/shop?department=money-transfer">Money transfer</a><a href="#contact">Contact us</a></div><div className="footer-contact"><h3>Drop by</h3><p><MapPin size={15} /> {shopAddress}</p><p><MessageCircle size={15} /> harmdailyneeds@gmail.com</p><p><Clock3 size={15} /> Open daily</p></div></div>
        <div className="section-shell footer-bottom"><span>© {new Date().getFullYear()} H.A.R.M Daily Needs. All rights reserved.</span><span>Made for everyday moments <Heart size={13} fill="currentColor" /></span></div>
      </footer>
    </main>
  );
}

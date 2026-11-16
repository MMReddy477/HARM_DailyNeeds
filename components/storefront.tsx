"use client";

import { motion, type Variants } from "framer-motion";
import {
  ArrowRight, Clock3, Heart, MapPin, Menu, MessageCircle, Phone, ShieldCheck, Star, X
} from "lucide-react";
import Link from "next/link";
import { ShopNavigation } from "@/components/shop-navigation";
import { CustomerReviews } from "@/components/customer-reviews";
import { FloatingContact } from "@/components/floating-contact";
import { OpeningHours } from "@/components/opening-hours";
import { HomeProducts } from "@/components/home-products";
import { ReferenceHeroServices, ReferencePrintTrust } from "@/components/reference-home";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

const shopAddress = "2-2/30/201 My Abode the Sirius, Suryohayacolony, Bandlaguda Jagir 500086";
const mapsQuery = `H.A.R DAILY NEEDS, ${shopAddress}`;
const shopArea = "Bandlaguda Jagir, Hyderabad";






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
  const href = number ? `https://wa.me/${number}?text=${encodeURIComponent("Hi H.A.R Daily Needs, I have an enquiry.")}` : "https://wa.me/918374778183";
  return <a className={className} href={href} target="_blank" rel="noreferrer">{children}</a>;
}

export function Storefront() {
  const contactBar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const bar = contactBar.current;
    if (!bar) return;
    const update = () => bar.parentElement?.style.setProperty("--contact-bar-height", `${bar.getBoundingClientRect().height}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <main className={`reference-storefront ${darkMode ? "public-dark" : ""}`}>
      <div className="topline" ref={contactBar}>
        <div className="section-shell topline-inner">
          <span><MapPin size={14} /> {shopArea}</span>
          <a href="tel:+918374778183"><Phone size={14}/> Call Us</a><a href="https://wa.me/918374778183" target="_blank" rel="noreferrer"><MessageCircle size={14}/> WhatsApp</a><OpeningHours /><a className="topline-customer-rating" href="#customer-reviews"><Star size={14} fill="currentColor"/>4.9 Rated by Customers</a>
          <a href="mailto:harmdailyneeds@gmail.com"><MessageCircle size={14} /> We’re happy to help</a>
        </div>
      </div>
      <header className="site-header">
        <div className="section-shell nav-shell">
          <Link className="logo-lockup" href="/" aria-label="H.A.R Daily Needs home">
            <span className="logo-mark">H<span>.</span></span>
            <span className="header-brand-copy"><strong>H.A.R DAILY NEEDS</strong><em className="header-brand-tagline">Stationery, Dairy &amp; Refreshing Drinks Under One Roof</em><small>Trusted by Families, Students &amp; Offices Since Day One</small></span>
          </Link>
          <button className="mobile-menu-toggle" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
          <ShopNavigation mobileOpen={menuOpen} onNavigate={closeMenu} />
          <div className="nav-actions"><button type="button" className="theme-toggle" onClick={() => setDarkMode(!darkMode)} aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"} aria-pressed={darkMode}>{darkMode ? "Light" : "Dark"}</button>
            <WhatsAppLink className="nav-whatsapp"><MessageCircle size={16} /> WhatsApp</WhatsAppLink>
            <Link className="owner-link" href="/owner-login">Owner login</Link>
          </div>
        </div>
      </header>

      <ReferenceHeroServices />

      <HomeProducts />

      <ReferencePrintTrust />

      <CustomerReviews />



      <FloatingContact address={shopAddress} />

      <footer id="contact" className="site-footer">
        <div className="section-shell footer-main"><div className="footer-brand"><Link className="logo-lockup" href="/"><span className="logo-mark footer-logo-mark">H<span>.</span></span><span><strong>H.A.R</strong><small>DAILY NEEDS</small></span></Link><p>Your friendly neighbourhood shop for everyday needs in {shopArea}.</p><WhatsAppLink className="footer-social"><MessageCircle size={17} /> Chat with us</WhatsAppLink></div><div className="footer-links"><h3>Explore</h3><a href="#home">Home</a><a href="/shop">Shop all</a><a href="/shop?department=school-supplies">Stationery</a></div><div className="footer-links"><h3>Everyday help</h3><a href="/shop?department=print-xerox">Print & Xerox</a><a href="/shop?department=gift-items">Gifts & toys</a><a href="/shop?department=money-transfer">Money transfer</a><a href="#contact">Contact us</a></div><div className="footer-contact"><h3>Drop by</h3><p><MapPin size={15} /> {shopAddress}</p><p><MessageCircle size={15} /> harmdailyneeds@gmail.com</p><p><Clock3 size={15} /> Open daily</p></div></div>
        <div className="section-shell footer-bottom"><span>© {new Date().getFullYear()} H.A.R Daily Needs. All rights reserved.</span><span>Made for everyday moments <Heart size={13} fill="currentColor" /></span></div>
      </footer>
    </main>
  );
}

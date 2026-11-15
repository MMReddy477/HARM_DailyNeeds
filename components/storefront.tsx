"use client";

import { motion, type Variants } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowDown, ArrowRight, BookOpen, Check, Clock3, FileText, Gift, GraduationCap,
  Heart, MapPin, Menu, MessageCircle, Phone, Printer, ScanLine, ShieldCheck, ShoppingBag,
  Sparkles, Star, Wallet, X, Zap
} from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(80),
  phone: z.string().trim().max(20),
  message: z.string().trim().min(5, "Please add a short message.").max(1000)
});
type ContactValues = z.infer<typeof contactSchema>;

const shopAddress = "2-2/30/201, My ABode The Sirius, Suryodhaya Colony, Bandlaguda Jagir, Hyderabad";
const shopArea = "Bandlaguda Jagir, Hyderabad";

const services = [
  { icon: BookOpen, title: "Stationery", copy: "School and office essentials, books, pens, files and art supplies.", tag: "For every idea", color: "lavender" },
  { icon: Printer, title: "Print & Xerox", copy: "Black-and-white and color copies, printouts, scanning and lamination.", tag: "Quick turnaround", color: "peach" },
  { icon: ShoppingBag, title: "Milk & dairy", copy: "Everyday milk, curd and dairy favourites for your home.", tag: "Fresh everyday", color: "mint" },
  { icon: Gift, title: "Gifts & toys", copy: "Thoughtful gift articles, greeting cards, birthday picks and toys.", tag: "Little surprises", color: "gold" },
  { icon: Wallet, title: "Everyday services", copy: "Domestic money transfer, AEPS, mobile and DTH recharge, bill payments.", tag: "Helpful, nearby", color: "mint" }
];

const products = [
  { name: "Everyday notebooks", category: "Books & paper", image: "/product-images/notebook.svg", tone: "lilac" },
  { name: "Pens & writing", category: "Writing essentials", image: "/product-images/blue-pens.svg", tone: "peach" },
  { name: "Colour pencils", category: "Art supplies", image: "/product-images/colour-pencils.svg", tone: "yellow" },
  { name: "School essentials", category: "Learning favourites", image: "/product-images/hb-pencils.svg", tone: "mint" },
  { name: "Milk & dairy", category: "Fresh everyday needs", image: "/product-images/milk.svg", tone: "peach" },
  { name: "Curd & dairy favourites", category: "Chilled essentials", image: "/product-images/curd.svg", tone: "lilac" }
];

const reasons = [
  { icon: Zap, title: "Quick, helpful service", copy: "Get the everyday essentials and print jobs you need without the long wait." },
  { icon: Heart, title: "A familiar local shop", copy: "Friendly neighbourhood service for families, students and nearby businesses." },
  { icon: ShieldCheck, title: "Care you can count on", copy: "Thoughtful attention to each order, from a quick copy to a special gift." },
  { icon: Sparkles, title: "Everyday needs together", copy: "Stationery, printing, gifts and useful local services in one convenient stop." }
];

const gallery = [
  { title: "Ideas start here", sub: "Stationery for study, work & play", image: "/product-images/notebook.svg", tone: "gallery-lilac" },
  { title: "Print it your way", sub: "Copies, colour & finishing", image: "/product-images/a4-paper.svg", tone: "gallery-peach" },
  { title: "A little something", sub: "Gifts for everyday occasions", image: "/product-images/envelope.svg", tone: "gallery-gold" }
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
  const href = number ? `https://wa.me/${number}?text=${encodeURIComponent("Hi H.A.R.M Daily Needs, I have an enquiry.")}` : "https://wa.me/";
  return <a className={className} href={href} target="_blank" rel="noreferrer">{children}</a>;
}

export function Storefront() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const contactForm = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", phone: "", message: "" }
  });
  const closeMenu = () => setMenuOpen(false);
  const sendContact = contactForm.handleSubmit((values) => {
    const subject = encodeURIComponent(`H.A.R.M website enquiry from ${values.name}`);
    const body = encodeURIComponent(`${values.message}\n\nName: ${values.name}\nPhone: ${values.phone || "Not provided"}`);
    window.location.href = `mailto:harmdailyneeds@gmail.com?subject=${subject}&body=${body}`;
    setContactSent(true);
  });

  return (
    <main>
      <div className="topline">
        <div className="section-shell topline-inner">
          <span><MapPin size={14} /> {shopArea}</span>
          <span><Clock3 size={14} /> Open daily · Visit us today</span>
          <a href="mailto:harmdailyneeds@gmail.com"><MessageCircle size={14} /> We’re happy to help</a>
        </div>
      </div>
      <header className="site-header">
        <div className="section-shell nav-shell">
          <Link className="logo-lockup" href="/" aria-label="H.A.R.M Daily Needs home">
            <span className="logo-mark">H<span>.</span></span>
            <span><strong>H.A.R.M</strong><small>DAILY NEEDS</small></span>
          </Link>
          <button className="mobile-menu-toggle" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
          <nav className={`main-nav ${menuOpen ? "nav-open" : ""}`}>
            {[["Home", "#home"], ["Services", "#services"], ["Stationery", "#products"], ["Milk & Dairy", "#products"], ["Print & Xerox", "#services"], ["Gift Items", "#gallery"], ["Money Transfer", "#services"], ["Gallery", "#gallery"], ["Contact", "#contact"]].map(([label, href]) => (
              <a key={`${label}-${href}`} href={href} onClick={closeMenu}>{label}</a>
            ))}
          </nav>
          <div className="nav-actions">
            <WhatsAppLink className="nav-whatsapp"><MessageCircle size={16} /> WhatsApp</WhatsAppLink>
            <Link className="owner-link" href="/owner-login">Owner login</Link>
          </div>
        </div>
      </header>

      <section id="home" className="hero-section">
        <div className="hero-orb hero-orb-one" /><div className="hero-orb hero-orb-two" />
        <div className="section-shell hero-grid">
          <motion.div className="hero-copy" initial="hidden" animate="show" variants={reveal}>
            <span className="hero-kicker"><span className="kicker-star">✦</span> YOUR FRIENDLY NEIGHBOURHOOD SHOP</span>
            <h1>H.A.R.M DAILY NEEDS<span className="hero-period">.</span></h1>
            <h2>Everything you need <span className="gradient-text">under one roof.</span></h2>
            <p>From stationery and printing to gifts and everyday services, we’re here for families, students, offices and local businesses in Bandlaguda Jagir.</p>
            <div className="hero-buttons">
              <a className="button-primary" href="#services">Explore our services <ArrowRight size={17} /></a>
              <a className="button-quiet" href="#contact"><Phone size={16} /> Get in touch</a>
            </div>
            <div className="hero-promises">
              {["Fast service", "Affordable prices", "Trusted locally", "Everyday essentials"].map((item) => <span key={item}><Check size={14} />{item}</span>)}
            </div>
          </motion.div>
          <motion.div className="hero-visual" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .7, delay: .12 }}>
            <div className="hero-image-frame">
              <img src="/family-welcome.jpeg" alt="A happy family moment shared by H.A.R.M Daily Needs" />
              <div className="hero-image-wash" />
              <div className="hero-photo-caption"><span className="caption-sparkle">✦</span><span><strong>For your everyday</strong><small>Little things. Happier days.</small></span></div>
            </div>
            <div className="floating-service-card floating-print"><span className="float-icon float-orange"><Printer size={18} /></span><span><strong>Print & Xerox</strong><small>Ready when you are</small></span><Check className="float-check" size={17} /></div>
            <div className="floating-service-card floating-stationery"><span className="float-icon float-purple"><GraduationCap size={19} /></span><span><strong>School essentials</strong><small>Ideas start here</small></span></div>
            <div className="hero-sticker"><Star size={15} fill="currentColor" /><span>LOCAL<br />& LOVELY</span></div>
          </motion.div>
        </div>
        <a className="scroll-cue" href="#services">Discover H.A.R.M <ArrowDown size={14} /></a>
      </section>

      <section className="service-strip">
        <div className="section-shell service-strip-inner">
          <span><BookOpen />Stationery</span><i /><span><ShoppingBag />Milk & dairy</span><i /><span><Printer />Print & Xerox</span><i /><span><Gift />Gifts & toys</span><i /><span><Wallet />Money services</span>
        </div>
      </section>

      <section id="services" className="section-shell section-pad services-section">
        <div className="section-heading-block"><span className="eyebrow">HOW CAN WE HELP?</span><h2 className="section-title">Many little needs.<br /><span className="gradient-text">One friendly stop.</span></h2><p className="section-lead">The useful things for your day, handled with a smile and a neighbourly touch.</p></div>
        <div className="service-grid">
          {services.map((service, index) => {
            const Icon = service.icon;
            return <motion.article key={service.title} className="service-card" initial="hidden" whileInView="show" viewport={{ once: true, amount: .2 }} variants={revealWithDelay(index * .07)}>
              <div className={`service-icon ${service.color}`}><Icon size={24} /></div><span className="service-tag">{service.tag}</span><h3>{service.title}</h3><p>{service.copy}</p><a href={service.title === "Stationery" ? "#products" : "#contact"} aria-label={`Learn about ${service.title}`}><ArrowRight size={18} /></a>
            </motion.article>;
          })}
        </div>
        <div className="extra-services"><span><ScanLine />Scanning</span><span><FileText />Lamination</span><span><BookOpen />Spiral binding</span><span><Wallet />Utility bill payments</span><span><Phone />Mobile & DTH recharge</span></div>
      </section>

      <section className="why-section">
        <div className="section-shell section-pad why-grid">
          <div className="why-copy"><span className="eyebrow">THE H.A.R.M DIFFERENCE</span><h2 className="section-title">A little more helpful.<br /><span className="gradient-text">A lot closer to home.</span></h2><p className="section-lead">We believe everyday errands should feel easy. That’s why we bring useful products and local services together in one welcoming place.</p><a className="text-link" href="#contact">Come say hello <ArrowRight size={17} /></a></div>
          <div className="why-list">{reasons.map((item, index) => { const Icon = item.icon; return <motion.article className="why-item" key={item.title} initial="hidden" whileInView="show" viewport={{ once: true }} variants={revealWithDelay(index * .08)}><span className="why-icon"><Icon size={21} /></span><div><h3>{item.title}</h3><p>{item.copy}</p></div><Check className="why-check" size={17} /></motion.article>; })}</div>
        </div>
      </section>

      <section id="products" className="section-shell section-pad product-section">
        <div className="section-heading-row"><div><span className="eyebrow">A FEW EVERYDAY FAVOURITES</span><h2 className="section-title">Good things for <span className="gradient-text">big ideas.</span></h2><p className="section-lead">A peek at the kinds of essentials waiting on our shelves. Drop in to explore what’s available.</p></div><a className="button-outline" href="#contact">Ask what’s in store <ArrowRight size={16} /></a></div>
        <div className="product-grid">
          {products.map((product, index) => <motion.article className="product-card" key={product.name} initial="hidden" whileInView="show" viewport={{ once: true, amount: .2 }} variants={revealWithDelay(index * .06)}><div className={`product-image ${product.tone}`}><span className="product-badge">H.A.R.M PICK</span><img src={product.image} alt={product.name} loading="lazy" /></div><div className="product-info"><small>{product.category}</small><h3>{product.name}</h3><span className="available-pill"><i /> Available in store</span></div></motion.article>)}
        </div>
        <p className="no-price-note"><ShieldCheck size={15} /> Product choices change often. Visit or message us for today’s availability.</p>
        <div className="brands-row"><span className="eyebrow">FAMILIAR NAMES ON OUR SHELVES</span><div><strong className="brand-doms">DOMS</strong><strong className="brand-classmate">Classmate</strong><strong className="brand-harm">H.A.R.M</strong></div></div>
      </section>

      <section id="gallery" className="gallery-section">
        <div className="section-shell section-pad">
          <div className="section-heading-block gallery-heading"><span className="eyebrow">A LITTLE LOOK AROUND</span><h2 className="section-title">Everyday things, <span className="gradient-text">thoughtfully chosen.</span></h2><p className="section-lead">From a fresh notebook to a last-minute printout, we’re here to make the little errands easier.</p></div>
          <div className="gallery-grid">{gallery.map((item, index) => <motion.article className={`gallery-card ${item.tone}`} key={item.title} initial="hidden" whileInView="show" viewport={{ once: true, amount: .2 }} variants={revealWithDelay(index * .08)}><div className="gallery-art"><img src={item.image} alt="" loading="lazy" /></div><div className="gallery-caption"><span>H.A.R.M DAILY NEEDS</span><h3>{item.title}</h3><p>{item.sub}</p></div><span className="gallery-arrow"><ArrowRight size={18} /></span></motion.article>)}</div>
        </div>
      </section>

      <section className="review-section">
        <div className="section-shell review-panel"><div className="review-stars" aria-label="Share your feedback"><Star /><Star /><Star /><Star /><Star /></div><span className="eyebrow">YOUR WORDS MATTER</span><h2>Have a H.A.R.M moment<br /><span className="gradient-text">to share?</span></h2><p>We’re building our neighbourhood story one helpful visit at a time. Tell us how we did—we’d love to hear from you.</p><WhatsAppLink className="button-primary">Share your feedback <MessageCircle size={17} /></WhatsAppLink><span className="review-footnote">We only feature genuine customer feedback, shared with permission.</span><div className="review-decoration">“</div></div>
      </section>

      <section className="whatsapp-band">
        <div className="section-shell whatsapp-inner"><div className="whatsapp-icon"><MessageCircle size={29} /></div><div><span className="eyebrow">WE’RE JUST A MESSAGE AWAY</span><h2>Need Xerox, printouts, stationery<br className="desktop-break" /> or a little help with a service?</h2><p>Message H.A.R.M Daily Needs and we’ll be happy to help.</p></div><WhatsAppLink className="whatsapp-cta">Chat on WhatsApp <ArrowRight size={17} /></WhatsAppLink><div className="whatsapp-decoration">H.A.R.M</div></div>
      </section>

      <section id="contact" className="section-shell section-pad contact-section">
        <div className="contact-copy"><span className="eyebrow">COME ON OVER</span><h2 className="section-title">Your neighbourhood<br /><span className="gradient-text">shop is right here.</span></h2><p className="section-lead">Stop by for your everyday needs. We’re looking forward to seeing you.</p>
          <div className="contact-details"><div><span className="contact-icon"><MapPin /></span><span><small>FIND OUR SHOP</small><strong>{shopAddress}</strong></span></div><div><span className="contact-icon"><Phone /></span><span><small>GIVE US A CALL</small><a className="contact-phone" href="tel:+918374778183">8374778183</a></span></div><div><span className="contact-icon"><MessageCircle /></span><span><small>SEND AN EMAIL</small><strong>harmdailyneeds@gmail.com</strong></span></div><div><span className="contact-icon"><Clock3 /></span><span><small>WHEN TO VISIT</small><strong>Open daily</strong></span></div></div>
          <a className="button-primary contact-email" href="mailto:harmdailyneeds@gmail.com">Send us an email <ArrowRight size={17} /></a>
        </div>
        <div className="map-card"><iframe title={`Map showing ${shopAddress}`} src={`https://maps.google.com/maps?q=${encodeURIComponent(shopAddress)}&t=&z=16&ie=UTF8&iwloc=&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /><div className="map-label"><MapPin size={18} /><span><strong>H.A.R.M DAILY NEEDS</strong><small>{shopAddress}</small></span></div></div>
        <form className="contact-form" onSubmit={sendContact}>
          <div><span className="eyebrow">SEND A QUICK ENQUIRY</span><h3>How can we help?</h3><p>Your email app will open with your message ready to send.</p></div>
          <div className="contact-form-fields"><label>Your name<input {...contactForm.register("name")} placeholder="Name" />{contactForm.formState.errors.name && <small>{contactForm.formState.errors.name.message}</small>}</label><label>Phone (optional)<input {...contactForm.register("phone")} placeholder="Phone number" /></label><label className="contact-message-field">What do you need?<textarea {...contactForm.register("message")} rows={3} placeholder="Stationery, printing, or another enquiry..." />{contactForm.formState.errors.message && <small>{contactForm.formState.errors.message.message}</small>}</label><button className="button-primary" type="submit">Prepare email <ArrowRight size={16} /></button>{contactSent && <span className="contact-form-note">Email draft prepared. Send it from your email app.</span>}</div>
        </form>
      </section>

      <footer className="site-footer">
        <div className="section-shell footer-main"><div className="footer-brand"><Link className="logo-lockup" href="/"><span className="logo-mark footer-logo-mark">H<span>.</span></span><span><strong>H.A.R.M</strong><small>DAILY NEEDS</small></span></Link><p>Your friendly neighbourhood shop for everyday needs in {shopArea}.</p><WhatsAppLink className="footer-social"><MessageCircle size={17} /> Chat with us</WhatsAppLink></div><div className="footer-links"><h3>Explore</h3><a href="#home">Home</a><a href="#services">Our services</a><a href="#products">Stationery</a><a href="#gallery">Gallery</a></div><div className="footer-links"><h3>Everyday help</h3><a href="#services">Print & Xerox</a><a href="#services">Gifts & toys</a><a href="#services">Money transfer</a><a href="#contact">Contact us</a></div><div className="footer-contact"><h3>Drop by</h3><p><MapPin size={15} /> {shopArea}</p><p><MessageCircle size={15} /> harmdailyneeds@gmail.com</p><p><Clock3 size={15} /> Open daily</p></div></div>
        <div className="section-shell footer-bottom"><span>© {new Date().getFullYear()} H.A.R.M Daily Needs. All rights reserved.</span><span>Made for everyday moments <Heart size={13} fill="currentColor" /></span></div>
      </footer>
    </main>
  );
}

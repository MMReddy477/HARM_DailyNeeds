"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BookOpen, Milk, CupSoda, Printer, Files, Wallet, MapPin, Phone, Clock3, Star, Store, X, Layers, Gift, PackageCheck, CalendarDays, type LucideIcon } from "lucide-react";
import { googleReviewTarget, googleMapsUrl, shopDirectionsUrl } from "@/lib/google-reviews";

const services = [
  { title: "SCHOOL & OFFICE ESSENTIALS", icon: BookOpen, image: "/images/home/notebook-desk.webp", href: "/stationery", copy: "Pens, writing tools, art materials and everyday school and office supplies.", action: "View Products" },
  { title: "Notebooks", icon: BookOpen, image: "/images/notebooks/long-172.webp", href: "/notebooks", copy: "Long notebooks, ruled and unruled books, graph books, practical records and drawing books.", action: "Shop Now" },
  { title: "Milk & Dairy", icon: Milk, image: "/images/daily-needs/milk.webp", href: "/milk-dairy", copy: "Fresh milk, curd, paneer and dairy essentials for your household.", action: "Shop Now" },
  { title: "Cool Drinks", icon: CupSoda, image: "/images/daily-needs/soft-drinks.webp", href: "/cool-drinks", copy: "Soft drinks, fruit juices, energy drinks and packaged drinking water.", action: "Shop Now" },
  { title: "Xerox Center", icon: Files, image: "/images/home/xerox-service.webp", href: "/shop?department=print-xerox", copy: "Black-and-white and colour photocopying for single and bulk documents.", action: "Explore Services" },
  { title: "Printing Services", icon: Printer, image: "/images/home/print-service.webp", href: "/shop?department=print-xerox", copy: "Document printouts, school projects, reports and photo-printing enquiries.", action: "Explore Services" },
  { title: "Binding & Lamination", icon: Layers, image: "/images/home/binding-service.webp", href: "/shop?department=print-xerox&q=binding", copy: "Protect important documents and bring projects together with binding and lamination.", action: "Explore Services", badge: "PROFESSIONAL FINISH" },
  { title: "Gift Shop", icon: Gift, image: "/images/gifts/couple-mugs.webp", href: "/gift-shop", copy: "Birthday surprises, wedding gifts, housewarming favourites, return gifts and party decorations.", action: "Shop Now", badge: "CELEBRATE EVERY OCCASION" },
  { title: "Money Transfer", icon: Wallet, image: "/images/home/money-transfer-service.webp", href: "/shop?department=money-transfer", copy: "Domestic bank transfer assistance and useful services at our store counter.", action: "Explore Services" }
];

const hero = {
  title: "School Supplies & Dairy\nUnder One Roof",
  description: "Your trusted neighborhood store in Bandlaguda Jagir for notebooks, stationery, milk, curd, paneer, cool drinks, Xerox, printing and money transfer services.",
  badges: [
    { label: "4.9 Google Rating", icon: Star },
    { label: "Bandlaguda Jagir", icon: MapPin },
    { label: "Open Daily", icon: Clock3 },
    { label: "Fresh Dairy Daily", icon: Milk }
  ],
  photos: [
    { className: "daily-hero-stationery", image: "/images/notebooks/long-172.webp", alt: "Notebook for school and office", label: "School Supplies", description: "Notebooks · Pens · Office Supplies", icon: BookOpen },
    { className: "daily-hero-dairy", image: "/images/daily-needs/milk.webp", alt: "Fresh milk", label: "Milk & Dairy", description: "Milk · Curd · Paneer", icon: Milk },
    { className: "daily-hero-drinks", image: "/images/daily-needs/soft-drinks.webp", alt: "Cool drinks", label: "Cool Drinks", description: "Soft Drinks · Juices · Water", icon: CupSoda },
    { className: "daily-hero-hours", label: "Open Daily", description: "8 AM – 10 PM", icon: Clock3 }
  ] satisfies {
    className: string;
    image?: string;
    alt?: string;
    label: string;
    description: string;
    icon: LucideIcon;
  }[]
};

export function DailyStoreHero() {
  return <section id="home" className="daily-store-hero" aria-label="H.A.R.M Daily Needs highlights">
    <div className="section-shell daily-hero-grid">
      <div className="daily-hero-copy">
        <span className="daily-store-eyebrow"><Store size={16}/>H.A.R.M DAILY NEEDS</span>
        <h1>{hero.title}</h1>
        <p>{hero.description}</p>
        <div className="daily-hero-actions"><Link className="daily-primary-button" href="#products">Explore Products<ArrowRight size={17}/></Link><a className="daily-secondary-button" href={shopDirectionsUrl} target="_blank" rel="noreferrer"><MapPin size={17}/>Visit Store Today</a></div>
        <ul className="daily-hero-badges" aria-label="Store highlights">{hero.badges.map(({ label, icon: Icon }) => <li key={label}><Icon size={16}/>{label}</li>)}</ul>
      </div>
      <div className="daily-hero-visual" aria-label="Featured H.A.R.M Daily Needs products">
        {hero.photos.map(photo => { const Icon = photo.icon; return <div key={photo.className} className={`daily-hero-photo ${photo.className}`}>
          {photo.image
            ? <img src={photo.image} alt={photo.alt} width={720} height={720} loading={photo.className === "daily-hero-stationery" ? "eager" : "lazy"}/>
            : <div className="daily-hero-hours-content"><Icon size={56}/></div>}
          <span><Icon size={16}/><span>{photo.label}{photo.description && <small>{photo.description}</small>}</span></span>
        </div>; })}
      </div>
    </div>
  </section>;
}

const trustHighlights = [
  { label: "500+ Products", icon: PackageCheck },
  { label: "Fresh Dairy Available Daily", icon: Milk },
  { label: "Xerox & Printing Services", icon: Printer },
  { label: "Money Transfer", icon: Wallet },
  { label: "Open Daily · 8 AM–10 PM", icon: CalendarDays },
  { label: "Customer Rating · 4.9/5", icon: Star }
];

export function StoreTrustBar() {
  return <section className="store-trust-bar" aria-label="Why shop at H.A.R.M Daily Needs">
    <div className="section-shell store-trust-items">
      {trustHighlights.map(({ label, icon: Icon }) => <div className="store-trust-item" key={label}><Icon size={20} strokeWidth={2}/><span>{label}</span></div>)}
    </div>
  </section>;
}

export function StoreServices() { return <section id="services" className="section-shell daily-services"><div className="daily-section-heading"><div><h2>Explore Our Products &amp; Services</h2><p>From your morning milk to school supplies and helpful counter services.</p></div></div><div className="daily-service-grid">{services.map(service => {const Icon=service.icon;const printing=/Xerox|Printing/.test(service.title);return <article key={service.title}><Link href={service.href} className={`daily-service-image ${service.title==='Milk & Dairy'||service.title==='Cool Drinks'?'daily-service-product':''}`}><img src={service.image} alt={`${service.title} representative image`} loading="lazy" width={720} height={480}/>{service.badge&&<span className="daily-service-label">{service.badge}</span>}{service.title==='Xerox Center'&&<span className="daily-service-label">STARTS ₹2/-</span>}{printing&&<div className={`hub-print-preview ${service.title==='Printing Services'?'hub-colour-preview':''}`} aria-hidden="true"><div className="hub-paper-slot"/><div className="hub-print-paper"><div className="hub-paper-heading"/><div className="hub-paper-lines"/><div className="hub-paper-chart"><i/><i/><i/><i/></div></div><small>Print preview</small></div>}</Link><div className="daily-service-copy"><h3><Icon size={19}/>{service.title}</h3><p>{service.copy}</p>{service.title==='Money Transfer'&&<small>In-store counter service only.</small>}<Link href={service.href}>{service.action}<ArrowRight size={15}/></Link></div></article>;})}</div></section>; }

const gallery = [
  { title: "Notebooks & Stationery", image: "/images/notebooks/long-172.webp", label: "Product photo" },
  { title: "Milk & Dairy", image: "/images/daily-needs/milk.webp", label: "Product photo" },
  { title: "Xerox & Printing", image: "/images/home/xerox-service.webp", label: "Service photo" },
  { title: "Gift Ideas", image: "/images/gifts/couple-mugs.webp", label: "Product photo" }
];
export function StoreGallery() { const [selected,setSelected]=useState<(typeof gallery)[number]|null>(null);return <section id="store-gallery" className="daily-gallery-section"><div className="section-shell"><div className="daily-section-heading"><div><span className="eyebrow">PRODUCTS &amp; SERVICES</span><h2>Inside H.A.R.M DAILY NEEDS</h2><p>Browse representative product and service photos. Share your shop photos to add real views of the store.</p></div></div><div className="daily-gallery-grid">{gallery.map(item => <button type="button" key={item.title} onClick={()=>setSelected(item)}><img src={item.image} alt={`${item.title} ${item.label.toLowerCase()}`} loading="lazy" width={720} height={540}/><span><strong>{item.title}</strong><small>{item.label}</small></span></button>)}</div></div>{selected&&<dialog className="daily-gallery-dialog" aria-labelledby="gallery-dialog-title" ref={element=>{if(element&&!element.open)element.showModal();}} onCancel={()=>setSelected(null)} onClick={event=>{if(event.target===event.currentTarget)setSelected(null);}}><button type="button" aria-label="Close gallery preview" onClick={()=>setSelected(null)}><X/></button><img src={selected.image} alt={`${selected.title} preview`}/><h3 id="gallery-dialog-title">{selected.title}</h3><p>{selected.label}</p></dialog>}</section>; }

export function StoreFooter() { const review=googleReviewTarget();return <footer id="contact" className="daily-store-footer"><div className="section-shell"><div className="daily-footer-heading"><Link href="/" className="daily-footer-brand"><span><img src="/brand/harm-icon.svg" alt="HM monogram" width={64} height={64}/></span><strong>H.A.R.M DAILY NEEDS<small>Stationery, Dairy &amp; Refreshing Drinks Under One Roof</small></strong></Link><a href={shopDirectionsUrl} target="_blank" rel="noreferrer">Visit Store Today<ArrowRight size={16}/></a></div><nav aria-label="Footer quick links">{[["Home","/#home"],["Stationery","/stationery"],["Milk & Dairy","/milk-dairy"],["Cool Drinks","/cool-drinks"],["Services","/#services"],["Reviews","/#customer-reviews"],["Contact","/#contact"]].map(([name,href])=><Link key={name} href={href}>{name}</Link>)}</nav><div className="daily-footer-contact"><a href={googleMapsUrl} target="_blank" rel="noreferrer"><MapPin size={17}/>Bandlaguda Jagir, Hyderabad</a><a href="tel:+918374778183"><Phone size={17}/>Call Now: 83747 78183</a><span><Clock3 size={17}/>Business Hours · Open Daily · 8:00 AM–10:00 PM</span><a href={review.url} target={review.direct?"_blank":undefined} rel={review.direct?"noreferrer":undefined}><Star size={17}/>{review.direct?"Google Reviews":"Shop Reviews"}</a><span><Star size={17}/>Google Rating · 4.9/5</span></div><p className="daily-footer-address">2-2/30/201 My Abode the Sirius, Suryohayacolony, Bandlaguda Jagir 500086</p><div className="daily-footer-bottom"><span>© {new Date().getFullYear()} H.A.R.M DAILY NEEDS</span><span>Trusted by Families, Students &amp; Offices Since Day One</span></div></div></footer>; }

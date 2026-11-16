"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
const slides = [

  { image: "/banners/stationery-collection.jpg", title: "Everything You Need Under One Roof", caption: "School stationery, notebooks and writing essentials. Everything you need under one roof.", alt: "Pink school backpack filled with stationery and notebooks", href: "/shop?department=school-supplies" },
  { image: "/images/home/notebook-desk.webp", title: "Ideas start here.", caption: "Stationery for every new chapter. Discover notebooks, pens and supplies for study, work and everyday ideas.", alt: "Real open notebook and pen on a wooden desk", href: "/notebooks" },
  { image: "/banners/stationery-showroom.jpg", title: "A world of colourful possibilities.", caption: "Discover stationery for families, students and offices, close to home.", alt: "Stationery inspiration showing colourful pencils and notebooks on shelves", href: "/shop" },
  { image: "/banners/creative-school-supplies.webp", title: "Big ideas start with little things.", caption: "Find school supplies, art materials and everyday learning essentials.", alt: "Colourful illustrated school and stationery supplies", href: "/shop?department=school-supplies" },
  { image: "/banners/school-stationery-kit.jpg", title: "Make school days more colourful.", caption: "Explore stationery sets and creative supplies. Ask us about current options and availability.", alt: "Yellow character-themed stationery set with pencils and school accessories", href: "/shop?department=school-supplies" }
];
export function SchoolSlideshow() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const touchStart = useRef(0);
  useEffect(() => { const preference = window.matchMedia("(prefers-reduced-motion: reduce)"); const update = () => setReducedMotion(preference.matches); update(); preference.addEventListener("change", update); return () => preference.removeEventListener("change", update); }, []);
  useEffect(() => { if (paused || hovered || reducedMotion) return; const timer = window.setInterval(() => setIndex((value) => (value+1)%slides.length), 6000); return () => window.clearInterval(timer); }, [paused, hovered, reducedMotion]);
  const move = (direction:number) => setIndex((value) => (value+direction+slides.length)%slides.length);
  return <section id="home" className="school-slideshow" aria-label="School and stationery highlights" aria-roledescription="carousel" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setHovered(true)} onBlurCapture={(event) => {if (!event.currentTarget.contains(event.relatedTarget))setHovered(false);}} onTouchStart={(event) => {touchStart.current=event.touches[0].clientX;}} onTouchEnd={(event) => {const distance=event.changedTouches[0].clientX-touchStart.current;if(Math.abs(distance)>50)move(distance>0 ? -1 : 1);}}>
    <h1 className="sr-only">H.A.R DAILY NEEDS - Everything You Need Under One Roof</h1>
    <div id="slideshow0" className="school-slides">{slides.map((slide,i) => <div className={`school-slide ${i===index ? "active-slide" : ""} ${slide.image.includes("notebook-desk") ? "notebook-photo-slide" : ""}`} key={slide.image} aria-hidden={i!==index} aria-roledescription="slide" aria-label={`${i+1} of ${slides.length}: ${slide.title}`}><Link href={slide.href} tabIndex={i===index ? 0 : -1} aria-label={`${slide.title} - View more`}><img src={slide.image} alt={slide.alt} width={1903} height={750} loading={i===0 ? "eager" : "lazy"} fetchPriority={i===0 ? "high" : "auto"}/>{slide.image.includes("notebook-desk") && <img className="slideshow-notebook-inset" src="/images/home/notebook-flatlay.webp" alt="Notebook and desk essentials" width={300} height={400} loading="lazy"/>}<span className="family-slide-copy"><span className="family-slide-eyebrow">H.A.R DAILY NEEDS</span><span className="family-main-tagline">Stationery, Dairy &amp; Refreshing Drinks Under One Roof</span><strong>{slide.title}</strong><span className="family-slide-caption">{slide.caption}</span><span className="family-slide-button">Explore Services</span></span></Link></div>)}</div>
    <button className="slideshow-arrow slideshow-previous" aria-label="Previous slide" onClick={() => move(-1)}><ChevronLeft/></button><button className="slideshow-arrow slideshow-next" aria-label="Next slide" onClick={() => move(1)}><ChevronRight/></button>
    <div className="slideshow-controls">{slides.map((slide,i) => <button className={i===index ? "active-dot" : ""} key={slide.image} aria-label={`Show slide ${i+1}: ${slide.title}`} aria-pressed={i===index} onClick={() => setIndex(i)}/>)}<button className="slideshow-pause" aria-label={paused ? "Play slideshow" : "Pause slideshow"} aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? <Play size={13}/> : <Pause size={13}/>}</button></div>
  <Link className="slideshow-contact" href="/#contact">Contact Us</Link></section>;
}

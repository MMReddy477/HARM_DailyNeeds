"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { ChevronRight, Pencil, Compass, Ruler, Palette, FolderOpen, Files, Briefcase, ArrowUpRight, type LucideIcon } from "lucide-react";
import { notebookNavigation } from "@/lib/print-services";
import { ProductSearch } from "@/components/product-search";
import { schoolCategories, navigationSlug } from "@/lib/school-navigation";
const icons:LucideIcon[]=[Pencil,Pencil,Pencil,Palette,FolderOpen,Files,Briefcase];
const navigationIconPaths = {
  home: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
  school: "M12 3 1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm5 13.99-5 2.73-5-2.73v-4.72l5 2.73 5-2.73v4.72z",
  book: "M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.61 4.9 1.5 5.25v14.65c0 .4.4.7.8.6 1.1-.35 2.4-.5 3.7-.5 2 0 4.1.4 5.5 1.5 1.4-1.1 3.5-1.5 5.5-1.5 1.3 0 2.6.15 3.7.5.4.1.8-.2.8-.6V5zM17.5 17c-1.4 0-2.75.15-4 .5V8c1.25-.35 2.6-.5 4-.5s2.7.15 3.5.5v9.5c-1.1-.35-2.3-.5-3.5-.5zM4 17.5V6c1.1-.35 2.3-.5 3.5-.5s2.75.15 4 .5v9.5c-1.25-.35-2.6-.5-4-.5s-2.4.15-3.5.5z",
  dairy: "M12 2.69 17.66 9.5C19.12 11.25 20 13.5 20 16a8 8 0 1 1-16 0c0-2.5.88-4.75 2.34-6.5L12 2.69z",
  drinks: "M18 3H4c-1.1 0-2 .9-2 2v12c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4v-3h1c2.21 0 4-1.79 4-4V7c0-2.21-1.79-4-4-4zm0 9V5h1c1.1 0 2 .9 2 2v3c0 1.1-.9 2-2 2h-1zM6 5h2v3H6zm4 0h2v3h-2zm4 0h2v3h-2z",
  print: "M19 8H5c-1.66 0-3 1.34-3 3v5h4v4h12v-4h4v-5c0-1.66-1.34-3-3-3zm-3 10H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM18 3H6v4h12V3z",
  wallet: "M21 18V6c0-1.1-.9-2-2-2H5C3.9 4 3 4.9 3 6v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zm-2 0H5V6h14v12zm-1-5h-5v-2h5v2z",
  contact: "M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.56 3.58.56.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.61 21 3 13.39 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.19 2.46.56 3.58a1 1 0 0 1-.25 1.01l-2.19 2.2z"
} as const;
type NavigationIconName = keyof typeof navigationIconPaths;
function NavigationIcon({ name }: { name: NavigationIconName }) {
  return <svg className="daily-nav-material-icon" viewBox="0 0 24 24" aria-hidden="true"><path d={navigationIconPaths[name]}/></svg>;
}
function SchoolCategoryIcon({index}:{index:number}) {
  if(index===0)return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m14.5 3.5 6 6L9 21H3l.5-6.5 11-11Z"/><path d="m12.5 5.5 6 6M3.5 14.5l6 6M7 16l2-2"/></svg>;
  if(index===2)return <span className="school-geometry-icon" aria-hidden="true"><Compass size={22} strokeWidth={2.2}/><Ruler size={14} strokeWidth={2.2}/></span>;
  const Icon=icons[index];
  return <Icon size={22} strokeWidth={2.2} aria-hidden="true"/>;
}
export function ShopNavigation({mobileOpen=false,onNavigate}:{mobileOpen?:boolean;onNavigate?:()=>void}){
  const pathname=usePathname();const params=useSearchParams();
  const currentDepartment=params.get('department');
  const activePage=(id:string)=>id==='home'?pathname==='/':id==='school'?pathname==='/stationery'||pathname.startsWith('/category/')||pathname.startsWith('/products/')||currentDepartment==='school-supplies':id==='notebooks'?pathname==='/notebooks'||currentDepartment==='notebooks':id==='milk-dairy'?pathname==='/milk-dairy'||currentDepartment===id:id==='cool-drinks'?pathname==='/cool-drinks'||currentDepartment===id:currentDepartment===id;
  const navClass=(id:string)=>'shop-home-link '+(activePage(id)?'nav-page-active':'');
  const [open,setOpen]=useState(false);
  const [booksOpen,setBooksOpen]=useState(false);
  const [active,setActive]=useState(0);
  const trigger=useRef<HTMLButtonElement>(null);
  const group=schoolCategories[active];
  const close=()=>{setBooksOpen(false);setOpen(false);onNavigate?.();};
  return <nav className={"shop-navigation premium-navigation daily-main-navigation "+(mobileOpen?"mobile-expanded":"")} aria-label="Shop departments" onKeyDown={event=>{if(event.key==='Escape'&&(open||booksOpen)){setBooksOpen(false);setOpen(false);trigger.current?.focus();}}}>
    <Link className={navClass("home")} aria-current={activePage("home")?"page":undefined} href="/#home" onClick={close}><NavigationIcon name="home"/>Home</Link>
    <div className={"school-office-menu "+(activePage("school")?"nav-page-active ":"")+(open?"school-menu-open":"")} onPointerEnter={event=>{if(event.pointerType==='mouse'){setBooksOpen(false);setOpen(true);}}} onPointerLeave={event=>{if(event.pointerType==='mouse')setOpen(false);}} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false);}}>
      <div className="school-menu-label"><Link href="/stationery" onClick={close}><NavigationIcon name="school"/>School &amp; Office Supplies</Link><button type="button" ref={trigger} aria-label="Browse School & Office Supplies categories" aria-expanded={open} aria-controls="school-office-panel" onClick={()=>{setBooksOpen(false);setOpen(!open);}}><svg className="daily-nav-dropdown-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5z"/></svg></button></div>
      <div id="school-office-panel" className="school-office-panel" hidden={!open}>
        <div className="school-category-list" aria-label="School and office categories">{schoolCategories.map((category,index)=><div key={category.slug} className={active===index?"school-category-active":""} onPointerEnter={event=>{if(event.pointerType==='mouse')setActive(index);}}><Link href={"/category/"+category.slug} onFocus={()=>setActive(index)} onClick={close}><span className="school-category-icon"><SchoolCategoryIcon index={index}/></span>{category.title}</Link><button type="button" aria-label={"Show "+category.title+" items"} aria-expanded={active===index} aria-controls="school-related-items" onClick={()=>setActive(index)}><ChevronRight size={16}/></button></div>)}</div>
        <div className="school-related-panel" id="school-related-items" key={group.slug}><div><span className="eyebrow">SCHOOL &amp; OFFICE ESSENTIALS</span><h3>{group.title}</h3><Link href={"/category/"+group.slug} onClick={close}>View category<ArrowUpRight size={14}/></Link></div><div className="school-subcategory-grid">{group.items.map(name=><Link key={name} href={"/products/"+navigationSlug(name)} onClick={close}>{name}<ChevronRight size={14}/></Link>)}</div><Link className="school-browse-all" href="/stationery" onClick={close}>Browse all school &amp; office supplies<ArrowUpRight size={15}/></Link></div>
      </div>
    </div>
    <div className={"notebook-nav-menu "+(activePage("notebooks")?"nav-page-active":"")} onPointerEnter={event=>{if(event.pointerType==='mouse'){setOpen(false);setBooksOpen(true);}}} onPointerLeave={event=>{if(event.pointerType==='mouse')setBooksOpen(false);}} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setBooksOpen(false);}}><div className="school-menu-label"><Link href="/notebooks" onClick={close}><NavigationIcon name="book"/>Note Books</Link><button type="button" aria-label="Browse Note Books" aria-expanded={booksOpen} aria-controls="notebook-nav-panel" onClick={()=>{setOpen(false);setBooksOpen(!booksOpen);}}><svg className="daily-nav-dropdown-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5z"/></svg></button></div><div id="notebook-nav-panel" className="notebook-nav-panel" hidden={!booksOpen}>{notebookNavigation.map(item=><Link key={item.slug} href={'/shop?department=notebooks&q='+encodeURIComponent(item.query)} onClick={close}>{item.name}<ChevronRight size={14}/></Link>)}<Link href="/notebooks" onClick={close}>View all Note Books<ArrowUpRight size={14}/></Link></div></div>
    <Link className={navClass("milk-dairy")} aria-current={activePage("milk-dairy")?"page":undefined} href="/milk-dairy" onClick={close}><NavigationIcon name="dairy"/>Milk &amp; Dairy</Link>
    <Link className={navClass("cool-drinks")} aria-current={activePage("cool-drinks")?"page":undefined} href="/cool-drinks" onClick={close}><NavigationIcon name="drinks"/>Cool Drinks</Link>
    <Link className={navClass("print-xerox")} aria-current={activePage("print-xerox")?"page":undefined} href="/shop?department=print-xerox" onClick={close}><NavigationIcon name="print"/>Print &amp; Xerox</Link>
    <Link className={navClass("money-transfer")} aria-current={activePage("money-transfer")?"page":undefined} href="/shop?department=money-transfer" onClick={close}><NavigationIcon name="wallet"/>Money Transfer</Link>
    <Link className="shop-home-link" href="/#contact" onClick={close}><NavigationIcon name="contact"/>Contact</Link>
    <ProductSearch/>
  </nav>;
}

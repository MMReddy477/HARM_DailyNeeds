"use client";
import Link from "next/link";
import { ProductSearch } from "@/components/product-search";
import { useState } from "react";
import { BookOpen, ChevronDown, Search, ShoppingBag, Gift, Printer, Wallet, Home, Phone } from "lucide-react";
import { retailDepartments } from "@/lib/retail-departments";
import { notebookGroups } from "@/lib/stationery";
import { departmentDirectory, stationeryGroups } from "@/lib/catalog";
const menuDepartments = [
  { id: "school-supplies", label: "Stationery", icon: BookOpen },
  { id: "notebooks", label: "Note Books", icon: BookOpen },
  { id: "office-supplies", label: "Office Supplies", icon: BookOpen },
  { id: "print-xerox", label: "Print & Xerox", icon: Printer },
  { id: "gift-items", label: "Gift Shop", icon: Gift },
  { id: "money-transfer", label: "Money Transfer", icon: Wallet },
  { id: "daily-needs", label: "Daily Needs", icon: ShoppingBag }
];
export function ShopNavigation({ mobileOpen = false, onNavigate }: { mobileOpen?: boolean; onNavigate?: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const close = () => { setOpen(null); onNavigate?.(); };
  return <nav className={`shop-navigation premium-navigation ${mobileOpen ? "mobile-expanded" : ""}`} aria-label="Shop departments" onKeyDown={(event) => {if(event.key === "Escape") {setOpen(null);(event.target as HTMLElement).closest('.shop-nav-department')?.querySelector('button')?.focus();}}}>
    <Link className="shop-home-link" href="/#home" onClick={close}><Home size={15}/>Home</Link>
    {menuDepartments.map((menu) => {
      const department = departmentDirectory.find((item) => item.id === menu.id)!;
      const Icon = menu.icon;
      const groups = menu.id === "school-supplies" ? stationeryGroups : menu.id === "notebooks" ? notebookGroups : menu.id === "office-supplies" || menu.id === "daily-needs" || menu.id === "gift-items" ? retailDepartments[menu.id].groups.map(group=>({title:group.title,items:group.items.map(item=>item.name)})) : Array.from({length:3},(_,i) => ({title: i===0 ? menu.label : i===1 ? "More services & products" : "Everyday essentials",items:department.items.slice(i*Math.ceil(department.items.length/3),(i+1)*Math.ceil(department.items.length/3))}));
      return <div key={menu.id} className={`shop-nav-department ${menu.id === "school-supplies" ? "stationery-mega" : ""} ${open===menu.id ? "is-open" : ""}`} onPointerEnter={(event) => {if(event.pointerType === "mouse")setOpen(menu.id);}} onPointerLeave={(event) => {if(event.pointerType === "mouse")setOpen(null);}} onBlur={(event) => {if(!event.currentTarget.contains(event.relatedTarget))setOpen(null);}}>
        <div className="shop-nav-label"><Link href={menu.id === "school-supplies" ? "/stationery" : menu.id === "notebooks" ? "/notebooks" : menu.id === "office-supplies" ? "/office-supplies" : menu.id === "daily-needs" ? "/daily-needs" : menu.id === "gift-items" ? "/gift-shop" : `/shop?department=${menu.id}`} onClick={close}><Icon size={15}/>{menu.label}</Link><button type="button" aria-label={`Show ${menu.label} products`} aria-expanded={open===menu.id} aria-controls={`menu-${menu.id}`} onClick={() => setOpen(open===menu.id ? null : menu.id)}><ChevronDown size={13}/></button></div>
        <div className="shop-mega-panel" id={`menu-${menu.id}`} hidden={open!==menu.id}>
          <div className="premium-mega-heading"><span>{menu.label}</span><Link href={menu.id === "school-supplies" ? "/stationery" : menu.id === "notebooks" ? "/notebooks" : menu.id === "office-supplies" ? "/office-supplies" : menu.id === "daily-needs" ? "/daily-needs" : menu.id === "gift-items" ? "/gift-shop" : `/shop?department=${menu.id}`} onClick={close}>View all <span aria-hidden="true">&rarr;</span></Link></div>
          <div className="shop-mega-columns">{groups.map((group) => <section key={group.title}><h3>{group.title}</h3>{group.items.map((item) => <Link key={item} href={`/shop?department=${menu.id}&item=${encodeURIComponent(item)}`} onClick={close}>{item}</Link>)}</section>)}</div>
          {menu.id === "school-supplies" && <div className="menu-product-previews">{[["Notebooks","/product-images/notebook.svg"],["Pens","/product-images/blue-pens.svg"],["School essentials","/banners/school-stationery-kit.jpg"]].map(([name,image]) => <Link key={name} href={`/shop?department=school-supplies${name==='School essentials' ? '' : `&item=${encodeURIComponent(name)}`}`} onClick={close}><img src={image} alt={`${name} example`}/><strong>{name}</strong><span>Explore the collection &rarr;</span></Link>)}</div>}
          <Link className="shop-view-all" href={menu.id === "school-supplies" ? "/stationery" : menu.id === "notebooks" ? "/notebooks" : menu.id === "office-supplies" ? "/office-supplies" : menu.id === "daily-needs" ? "/daily-needs" : menu.id === "gift-items" ? "/gift-shop" : `/shop?department=${menu.id}`} onClick={close}>Explore all {menu.label.toLowerCase()} &rarr;</Link>
        </div>
      </div>;
    })}
    <Link className="shop-home-link" href="/#contact" onClick={close}><Phone size={15}/>Contact</Link>
    <ProductSearch />
  </nav>;
}

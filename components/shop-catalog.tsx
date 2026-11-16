"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Grid2X2, List, Menu, X, ArrowRight, Search } from "lucide-react";
import { departmentDirectory, serviceLabels } from "@/lib/catalog";
import { matchesProduct, priceLabel, type PublicProduct } from "@/lib/product-search";
import { usePublicProducts } from "@/components/use-public-products";
import { ShopNavigation } from "@/components/shop-navigation";
function imageFor(name: string, department: string) {
  if (/pencil|crayon|pastel|paint|colou?r|craft|sketch/i.test(name)) return "/product-images/colour-pencils.svg";
  if (/pen|marker|highlighter/i.test(name)) return "/product-images/blue-pens.svg";
  if (/envelope|gift|card|wrapping/i.test(name) || department === "gift-items") return "/product-images/envelope.svg";
  if (/book|register|ledger|record/i.test(name)) return "/product-images/notebook.svg";
  if (/milk/i.test(name)) return "/product-images/milk.svg";
  return "/product-images/a4-paper.svg";
}
export function ShopCatalog() {
  const params = useSearchParams();
  const { products: publicProducts, notice: priceNotice } = usePublicProducts();
  const departmentId = params.get("department") || "";
  const selectedItem = params.get("item") || "";
  const query = params.get("q")?.trim() || "";
  const department = departmentDirectory.find((entry) => entry.id === departmentId);
  const [sort, setSort] = useState("featured");
  const [pageSize, setPageSize] = useState(9);
  const [page, setPage] = useState(1);
  const [view, setView] = useState("grid");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detail, setDetail] = useState<PublicProduct|null>(null);
  useEffect(() => { setPage(1); setDetail(null); }, [departmentId, selectedItem, query]);
  const all = publicProducts;
  let results = all.filter((item) => (!department || (item.id === department.id || item.departmentIds?.includes(department.id))) && (!selectedItem || matchesProduct(item, selectedItem)) && (!query || matchesProduct(item,query)));
  if (sort !== "featured") results = [...results].sort((a,b) => { if(sort.startsWith("price")) { if(a.price===null)return b.price===null ? 0 : 1; if(b.price===null)return -1; return sort==="price-low" ? a.price-b.price : b.price-a.price; } return sort === "az" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name); });
  const totalPages = Math.max(1, Math.ceil(results.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = results.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const heading = selectedItem || (query ? `Search: ${query}` : department?.title || "All products & services");
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") || "918374778183";
  return <main className="catalog-site">
    <div className="topline"><div className="section-shell topline-inner"><span>Bandlaguda Jagir, Hyderabad</span><a href="tel:+918374778183">Call 8374778183</a></div></div>
    <header className="site-header"><div className="section-shell nav-shell"><Link href="/" className="logo-lockup"><span className="logo-mark">H</span><span className="header-brand-copy"><strong>H.A.R DAILY NEEDS</strong><em className="header-brand-tagline">Stationery, Dairy &amp; Refreshing Drinks Under One Roof</em><small>Trusted by Families, Students &amp; Offices Since Day One</small><span className="header-services">{serviceLabels.map((service) => <span key={service}>{service}</span>)}</span></span></Link><button className="mobile-menu-toggle" aria-label="Toggle department menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X /> : <Menu />}</button><div className="nav-actions"><Link className="nav-whatsapp" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer">WhatsApp</Link><Link className="owner-link" href="/owner-login">Owner login</Link></div><ShopNavigation mobileOpen={mobileOpen} onNavigate={() => {setMobileOpen(false);setPage(1);setDetail(null);}} /></div></header>
    <div className="catalog-page-banner"><div className="section-shell"><nav aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/shop">Shop</Link>{department && <><span>/</span><Link href={`/shop?department=${department.id}`}>{department.title}</Link></>}{selectedItem && <><span>/</span><span>{selectedItem}</span></>}</nav><h1>{heading}</h1><p>Find everyday essentials and helpful services, all in one place.</p></div></div>
    <div className="section-shell shop-page-layout">
      <button className="catalog-filter-toggle" onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen}>Browse categories <span>{filtersOpen ? "-" : "+"}</span></button>
      <aside className={`shop-page-sidebar ${filtersOpen ? "filters-open" : ""}`} aria-label="Product categories"><h2>Categories</h2><Link className={!department ? "selected" : ""} href="/shop" onClick={() => setPage(1)}>All departments <span>{all.length}</span></Link>{departmentDirectory.map((entry) => <div key={entry.id}><Link className={department?.id === entry.id ? "selected" : ""} href={`/shop?department=${entry.id}`} onClick={() => {setPage(1);setDetail(null);}}>{entry.title}<span>{entry.items.length}</span></Link>{department?.id === entry.id && <div className="shop-sidebar-subcategories">{entry.items.map((name) => <Link className={name === selectedItem ? "selected" : ""} key={name} href={`/shop?department=${entry.id}&item=${encodeURIComponent(name)}`} onClick={() => {setPage(1);setDetail(null);}}>{name}</Link>)}</div>}</div>)}<div className="catalog-side-promo"><img src="/product-images/notebook.svg" alt="Illustrated notebook" /><h3>Small supplies.<br />Big possibilities.</h3><p>School, work and everyday life.</p><Link href="https://wa.me/918374778183">Ask our team <ArrowRight size={15} /></Link></div></aside>
      <section className="shop-page-results" aria-label="Catalog results"><div className="catalog-results-heading"><h2>{heading}</h2><span>{results.length} {results.length === 1 ? "result" : "results"}</span></div>
        <div className="shop-catalog-toolbar"><div className="catalog-view-buttons"><button aria-label="Grid view" aria-pressed={view === "grid"} onClick={() => setView("grid")}><Grid2X2 size={20}/></button><button aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")}><List size={20}/></button></div><label>Sort by <select value={sort} onChange={(event) => {setSort(event.target.value);setPage(1);}}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="az">Name: A to Z</option><option value="za">Name: Z to A</option></select></label><label>Show <select value={pageSize} onChange={(event) => {setPageSize(Number(event.target.value));setPage(1);}}><option value={9}>9</option><option value={18}>18</option><option value={36}>36</option></select></label></div>
        {(department || selectedItem || query) && <div className="catalog-active-filters"><span>{selectedItem || department?.title || query}</span><Link href="/shop">Clear filters <X size={13}/></Link></div>}
        <div className={`shop-catalog-products ${view === "list" ? "catalog-list-view" : ""}`} aria-live="polite">{visible.map((item) => <article key={item.key} className="shop-catalog-card"><button className="shop-catalog-image" onClick={() => setDetail(item)} aria-label={`View ${item.name}`}><img src={item.image || imageFor(item.name,item.id)} alt={`${item.name} category illustration`} loading="lazy"/><span>Explore</span></button><div className="shop-catalog-card-copy"><small>{item.department}</small><h3><button onClick={() => setDetail(item)}>{item.name}</button></h3><strong className="public-product-price">{priceLabel(item)}</strong><p>{item.description}</p>{item.available !== undefined && <p>{item.available ? "In stock" : "Currently out of stock"}</p>}<a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi H.A.R DAILY NEEDS, I would like to enquire about ${item.name}.`)}`} target="_blank" rel="noreferrer">Enquire now <ArrowRight size={14}/></a></div></article>)}</div>
        {!results.length && <div className="catalog-no-results"><Search size={32}/><h3>No matching products or services</h3><p>Try another search or browse all departments.</p><Link href="/shop">Browse all departments</Link></div>}
        <div className="catalog-pagination"><span>{results.length ? `Showing ${(currentPage-1)*pageSize+1} to ${Math.min(currentPage*pageSize,results.length)} of ${results.length}` : "0 results"}</span><div><button disabled={currentPage===1} onClick={() => setPage(currentPage-1)}>Previous</button>{Array.from({length:totalPages},(_,i) => <button key={i} aria-current={currentPage===i+1 ? "page" : undefined} onClick={() => setPage(i+1)}>{i+1}</button>)}<button disabled={currentPage===totalPages} onClick={() => setPage(currentPage+1)}>Next</button></div></div>
        <p className="catalog-price-notice" role="status">{priceNotice}</p><p className="catalog-illustration-note">Images illustrate product categories. Contact the shop for exact brands, specifications and current availability.</p>
      </section>
    </div>
    <footer className="catalog-page-footer"><div className="section-shell"><strong>H.A.R DAILY NEEDS</strong><p>Trusted by Families, Students &amp; Offices Since Day One</p><p>2-2/30/201 My Abode the Sirius, Suryohayacolony, Bandlaguda Jagir 500086</p><Link href="https://wa.me/918374778183">Contact our shop</Link></div></footer>
    {detail && <dialog className="catalog-detail" aria-labelledby="catalog-detail-title" ref={(element) => {if(element && !element.open) element.showModal();}} onCancel={() => setDetail(null)} onClick={(event) => {if(event.target===event.currentTarget)setDetail(null);}}><button className="catalog-detail-close" aria-label="Close product details" onClick={() => setDetail(null)}><X/></button><img src={detail.image || imageFor(detail.name,detail.id)} alt={`${detail.name} illustration`}/><small>{detail.department}</small><h2 id="catalog-detail-title">{detail.name}</h2><strong className="public-product-price">{priceLabel(detail)}</strong><p>{detail.description}</p><p>Visit H.A.R DAILY NEEDS or message our team for current options, availability and pricing.</p><a className="button-primary" target="_blank" rel="noreferrer" href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi, I would like to enquire about ${detail.name}.`)}`}>Enquire on WhatsApp <ArrowRight size={16}/></a></dialog>}
  </main>;
}

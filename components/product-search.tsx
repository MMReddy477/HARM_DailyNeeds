"use client";
import Link from "next/link";
import { Search } from "lucide-react";
import { useState } from "react";
import { matchesProduct, priceLabel } from "@/lib/product-search";
import { usePublicProducts } from "@/components/use-public-products";
export function ProductSearch() {
  const [query,setQuery]=useState("");const [open,setOpen]=useState(false);
  const {products,notice}=usePublicProducts();
  const matches=query.trim()?products.filter(product=>matchesProduct(product,query)):[];
  return <div className="live-product-search" onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false);}} onKeyDown={event=>{if(event.key==='Escape')setOpen(false);}}><form className="shop-nav-search" action="/shop" role="search"><label className="sr-only" htmlFor="shop-nav-query">Search by product, pages or ink colour</label><input id="shop-nav-query" name="q" type="search" value={query} onChange={event=>{setQuery(event.target.value);setOpen(true);}} onFocus={()=>setOpen(true)} placeholder="100 pages, long note, blue pen..." autoComplete="off" aria-expanded={open&&!!query.trim()} aria-controls="live-product-matches"/><button aria-label="Search"><Search size={19}/></button></form>{open&&query.trim()&&<div className="live-product-matches" id="live-product-matches"><span className="live-search-count" role="status">{matches.length} matching products &amp; services</span>{matches.slice(0,10).map(item=><Link key={item.key} href={`/shop?q=${encodeURIComponent(item.name)}`} onClick={()=>setOpen(false)}><span><strong>{item.name}</strong><small>{item.description}</small></span><b>{priceLabel(item)}</b></Link>)}{!matches.length&&<p>No matches. Try “100”, “long note”, “short note”, “blue pen” or “black pen”.</p>}<Link className="live-search-all" href={`/shop?q=${encodeURIComponent(query)}`} onClick={()=>setOpen(false)}>View all results for “{query}” &rarr;</Link><small className="live-search-notice">{notice}</small></div>}</div>;
}

"use client";

import { useMemo, useState } from "react";
import { Calculator, Plus, Trash2 } from "lucide-react";
import { mergePublicProducts, matchesProduct, type PublicProduct } from "@/lib/product-search";
import { calculateQuote } from "@/lib/rate-calculator";

type InventoryItem = { id: string; name: string; category: string; price: number; unit: string; image: string; stock: number };
type Line = { id: number; key: string; quantity: string; override: string };
const money = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);

export function AdminRateCalculator({ inventory }: { inventory: InventoryItem[] }) {
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [discount, setDiscount] = useState("0");
  const products = useMemo(() => mergePublicProducts(inventory.map(item => ({ key: item.id, name: item.name, department: item.category, id: "saved-inventory", price: item.price, unit: item.unit, image: item.image, description: item.name, aliases: item.category, available: item.stock > 0 }))), [inventory]);
  const savedNames = useMemo(() => new Set(inventory.map(item => item.id)), [inventory]);
  const lookup = new Map(products.map(product => [product.key, product]));
  const matches = products.filter(product => matchesProduct(product, query));
  const resolved = lines.map(line => {
    const product = lookup.get(line.key);
    return { line, product, price: line.override.trim() ? Number(line.override) : product?.price ?? null };
  });
  const quote = calculateQuote(resolved.map(({ line, price }) => ({ quantity: Number(line.quantity), price })), discount.trim() ? Number(discount) : NaN);
  function add(product: PublicProduct) {
    setLines(current => {
      const existing = current.find(line => line.key === product.key);
      if (existing) return current.map(line => line.key === product.key ? { ...line, quantity: String(Math.min(10000, (Number(line.quantity) || 0) + 1)) } : line);
      return [...current, { id: Date.now(), key: product.key, quantity: "1", override: "" }];
    });
  }
  function update(id: number, changes: Partial<Line>) { setLines(current => current.map(line => line.id === id ? { ...line, ...changes } : line)); }
  return <section className="dashboard-panel admin-rate-calculator">
    <h2><Calculator size={22}/>Quick Rate Calculator</h2>
    <p>Calculate any product or service, or combine several items. Saved inventory prices update automatically. Catalog starting prices are estimates until confirmed.</p>
    <label className="rate-search-label">Find a product or service<input type="search" placeholder="Search 100 pages, blue pen, gifts, Xerox..." value={query} onChange={event => setQuery(event.target.value)}/></label>
    <div className="rate-picker" aria-label="Products and services">{matches.map(product => <button type="button" key={product.key} onClick={() => add(product)}><span><strong>{product.name}</strong><small>{savedNames.has(product.key) ? "Saved inventory price" : product.price === null ? "Enter a confirmed rate" : "Catalog starting price · estimate"}</small></span><span>{product.price === null ? "Set rate" : money(product.price)} <Plus size={14}/></span></button>)}{!matches.length && <p>No products found. Try another name or add the product in Inventory.</p>}</div>
    <div className="rate-basket-heading"><h3>Calculation ({lines.length} items)</h3><button type="button" onClick={() => { setLines([]); setDiscount("0"); }}>Clear calculation</button></div>
    {!lines.length && <p>Select products above to start a calculation.</p>}
    {resolved.map(({ line, product, price }) => <article className="rate-quote-line" key={line.id}>
      <div><strong>{product?.name || "Product no longer available"}</strong><small>{product?.unit || "unit"} · {line.override.trim() ? "Rate for this calculation only" : savedNames.has(line.key) ? "Saved price" : "Starting price · confirm final rate"}</small></div>
      <label>Quantity<input type="number" min="1" max="10000" step="1" value={line.quantity} onChange={event => update(line.id, { quantity: event.target.value })}/></label>
      <label>Rate (₹)<input type="number" min="0" step="0.01" placeholder={product?.price === null ? "Required" : String(product?.price ?? "")} value={line.override} onChange={event => update(line.id, { override: event.target.value })}/></label>
      <strong>{calculateQuote([{ price, quantity: Number(line.quantity) }]) ? money(calculateQuote([{ price, quantity: Number(line.quantity) }])!.total) : "Enter valid values"}</strong>
      <button type="button" aria-label={`Remove ${product?.name || "item"}`} onClick={() => setLines(current => current.filter(item => item.id !== line.id))}><Trash2 size={17}/></button>
    </article>)}
    <div className="rate-quote-summary"><label>Discount (%)<input type="number" min="0" max="100" step="0.01" value={discount} onChange={event => setDiscount(event.target.value)}/></label><div aria-live="polite">{quote && lines.length ? <><p>Subtotal <strong>{money(quote.subtotal)}</strong></p><p>Discount <strong>{money(quote.discountAmount)}</strong></p><p className="rate-grand-total">Total <strong>{money(quote.total)}</strong></p></> : <p>{lines.length ? "Enter valid rates, whole quantities (1–10,000) and a discount from 0–100%." : "Total: ₹0"}</p>}</div></div>
    <p className="rate-calculator-note">This is a quote only. It does not record a sale, change stock or save prices. To change public prices, edit the product in Inventory. Money transfer amounts and service fees must be confirmed separately.</p>
  </section>;
}

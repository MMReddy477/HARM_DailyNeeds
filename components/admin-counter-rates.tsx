"use client";
import { useMemo, useState } from "react";
import { BookOpen, Calculator, Printer } from "lucide-react";
import { calculateQuote } from "@/lib/rate-calculator";
import { counterRateGroups } from "@/lib/counter-rates";

type InventoryItem = { id: string; name: string; category: string; price: number; unit: string; image: string; stock: number };
const money = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
export function AdminCounterRates({ inventory }: { inventory: InventoryItem[] }) {
  const [mode, setMode] = useState<"print" | "stationery">("print");
  const [selection, setSelection] = useState(0);
  const [quantity, setQuantity] = useState("10");
  const [override, setOverride] = useState("");
  const groups = useMemo(() => counterRateGroups(inventory), [inventory]);
  const rates = groups[mode];
  const selected = rates[Math.min(selection, rates.length - 1)];
  const price = override.trim() ? Number(override) : selected?.price ?? null;
  const total = calculateQuote([{ price, quantity: Number(quantity) }]);
  const choose = (index: number) => { setSelection(index); setOverride(""); };
  return <section className="dashboard-panel admin-counter-rates">
    <h2><Calculator size={22}/>Print &amp; Stationery Counter</h2><p>Quick reference rates and estimates for the owner. Saved inventory prices take priority.</p>
    <div className="counter-rate-tabs" role="group" aria-label="Counter rate category"><button type="button" aria-pressed={mode === "print"} onClick={() => { setMode("print"); choose(0); }}><Printer size={17}/>Print &amp; Xerox</button><button type="button" aria-pressed={mode === "stationery"} onClick={() => { setMode("stationery"); choose(0); }}><BookOpen size={17}/>Stationery &amp; Books</button></div>
    <div className="admin-counter-layout"><div className="admin-counter-cards">{rates.map((rate, index) => <button type="button" key={rate.name} aria-pressed={index === selection} onClick={() => choose(index)}><strong>{money(rate.price)} <small>/ {rate.unit}</small></strong><h3>{rate.name}</h3><p>{rate.description}</p><small>{rate.saved ? "Saved inventory rate" : "Starting rate · estimate"}</small></button>)}</div>
    <div className="admin-counter-calculator"><h3>Quick {mode === "print" ? "Print" : "Stationery"} Calculator</h3><label>{mode === "print" ? "Service" : "Product"}<select value={selection} onChange={event => choose(Number(event.target.value))}>{rates.map((rate, index) => <option value={index} key={rate.name}>{rate.name}</option>)}</select></label><label>Quantity ({selected?.unit || "units"})<input type="number" min="1" max="10000" step="1" value={quantity} onChange={event => setQuantity(event.target.value)}/></label><label>Rate for this quote (₹)<input type="number" min="0" step="0.01" value={override} placeholder={String(selected?.price ?? "")} onChange={event => setOverride(event.target.value)}/></label><div className="admin-counter-total" role="status"><span>Estimated Total</span><strong>{total ? money(total.total) : "Enter valid values"}</strong></div>{!total && <p role="alert">Enter a whole quantity from 1 to 10,000 and a non-negative rate.</p>}<p>Quote only. Confirm sizes, brands, packs and finishing. To save a rate, edit the matching product in Inventory.</p></div></div>
  </section>;
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Activity, ArrowDownToLine, ArrowUpRight, BarChart3, BookOpen, Boxes, Check,
  ChevronDown, CircleDollarSign, CreditCard, FileSpreadsheet, FileText, Gift,
  LayoutDashboard, LogOut, Menu, Moon, PackagePlus, Printer, Search, Settings2,
  ShieldCheck, ShoppingBag, Sparkles, Sun, TrendingDown, TrendingUp, Wallet, X
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from "recharts";

type Product = { id: string; name: string; category: string; price: number; stock: number; reorderLevel: number; unit: string; image: string };
type Sale = { id: string; type: string; productId: string; amount: number; quantity: number; note: string; occurredAt: string };
type Transfer = { id: string; customerName: string; mobileNumber: string; amount: number; transactionId: string; serviceCharge: number; status: "Pending" | "Completed" | "Failed"; occurredAt: string };
type StoreData = { inventory: Product[]; sales: Sale[]; transfers: Transfer[] };
type Tab = "Overview" | "Inventory" | "Sales" | "Money transfer" | "Xerox counter" | "Analytics";

const emptyData: StoreData = { inventory: [], sales: [], transfers: [] };
const tabs: { name: Tab; icon: typeof LayoutDashboard }[] = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Inventory", icon: Boxes },
  { name: "Sales", icon: CircleDollarSign },
  { name: "Money transfer", icon: Wallet },
  { name: "Xerox counter", icon: Printer },
  { name: "Analytics", icon: BarChart3 }
];
const chartColors = ["#5b2d90", "#ff6b35", "#e7b73c", "#38a878"];
const productSchema = z.object({
  name: z.string().trim().min(1, "Enter a product name.").max(100),
  category: z.string().trim().min(1, "Choose a category.").max(50),
  price: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0),
  reorderLevel: z.coerce.number().int().min(0),
  unit: z.string().trim().min(1).max(24)
});
const transferSchema = z.object({
  customerName: z.string().trim().min(1, "Enter the customer name."),
  mobileNumber: z.string().trim().min(5, "Enter a valid mobile number.").max(20),
  amount: z.coerce.number().positive(),
  transactionId: z.string().trim().min(1, "Enter the transaction ID."),
  serviceCharge: z.coerce.number().min(0),
  status: z.enum(["Pending", "Completed", "Failed"])
});
type ProductValues = z.infer<typeof productSchema>;
type TransferValues = z.infer<typeof transferSchema>;
const formatMoney = (value: number) => `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const today = () => new Date().toLocaleDateString("en-CA");
const isToday = (value: string) => new Date(value).toLocaleDateString("en-CA") === today();
const isThisMonth = (value: string) => {
  const date = new Date(value);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function OwnerDashboard() {
  const [data, setData] = useState<StoreData>(emptyData);
  const [tab, setTab] = useState<Tab>("Overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saleType, setSaleType] = useState("Stationery");
  const [saleProductId, setSaleProductId] = useState("");
  const [saleQuantity, setSaleQuantity] = useState(1);
  const [saleAmount, setSaleAmount] = useState("");
  const [serviceType, setServiceType] = useState("B/W Xerox");
  const [serviceAmount, setServiceAmount] = useState("");
  const [transferFormOpen, setTransferFormOpen] = useState(false);
  const [imageData, setImageData] = useState("");
  const imageInput = useRef<HTMLInputElement>(null);

  const productForm = useForm<z.input<typeof productSchema>, unknown, ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", category: "Stationery", price: 0, stock: 0, reorderLevel: 5, unit: "piece" }
  });
  const transferForm = useForm<z.input<typeof transferSchema>, unknown, TransferValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: { customerName: "", mobileNumber: "", amount: 0, transactionId: "", serviceCharge: 0, status: "Completed" }
  });

  const persist = useCallback(async (next: StoreData) => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const currentInventory = new Map(data.inventory.map((item) => [item.id, item]));
      const nextInventoryIds = new Set(next.inventory.map((item) => item.id));
      const currentSaleIds = new Set(data.sales.map((item) => item.id));
      const currentTransferIds = new Set(data.transfers.map((item) => item.id));
      const changes = {
        inventoryUpserts: next.inventory.filter((item) => JSON.stringify(currentInventory.get(item.id)) !== JSON.stringify(item)),
        inventoryDeleteIds: data.inventory.filter((item) => !nextInventoryIds.has(item.id)).map((item) => item.id),
        salesToAdd: next.sales.filter((item) => !currentSaleIds.has(item.id)),
        transfersToAdd: next.transfers.filter((item) => !currentTransferIds.has(item.id))
      };
      const response = await fetch("/api/admin/data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes)
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "Could not save your changes.");
      setData(next);
      setMessage("Saved successfully.");
      return true;
    } catch (saveError) {
      const text = saveError instanceof Error ? saveError.message : "Could not save your changes.";
      setError(text);
      return false;
    } finally {
      setSaving(false);
    }
  }, [data]);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/data", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as StoreData & { message?: string };
        if (!response.ok) throw new Error(result.message || "Could not load saved shop data.");
        if (active) setData({ inventory: result.inventory, sales: result.sales, transfers: result.transfers });
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load saved shop data.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const totals = useMemo(() => {
    const dailySales = data.sales.filter((item) => isToday(item.occurredAt));
    const monthlySales = data.sales.filter((item) => isThisMonth(item.occurredAt));
    const transferToday = data.transfers.filter((item) => item.status === "Completed" && isToday(item.occurredAt));
    const lowStock = data.inventory.filter((item) => item.stock <= item.reorderLevel);
    const todayRevenue = dailySales.reduce((sum, item) => sum + item.amount, 0);
    const xeroxRevenue = dailySales.filter((item) => ["B/W Xerox", "Color Xerox", "Lamination", "Spiral binding", "Scanning"].includes(item.type)).reduce((sum, item) => sum + item.amount, 0);
    const printingRevenue = dailySales.filter((item) => item.type === "Printouts").reduce((sum, item) => sum + item.amount, 0);
    const transferRevenue = transferToday.reduce((sum, item) => sum + item.serviceCharge, 0);
    const monthRevenue = monthlySales.reduce((sum, item) => sum + item.amount, 0)
      + data.transfers.filter((item) => item.status === "Completed" && isThisMonth(item.occurredAt)).reduce((sum, item) => sum + item.serviceCharge, 0);
    const stockValue = data.inventory.reduce((sum, item) => sum + item.stock * item.price, 0);
    const customers = new Set(data.transfers.map((item) => item.mobileNumber)).size;
    return { dailySales, todayRevenue, xeroxRevenue, printingRevenue, transferRevenue, monthRevenue, stockValue, lowStock, customers, totalItems: data.inventory.reduce((sum, item) => sum + item.stock, 0) };
  }, [data]);

  const filteredProducts = data.inventory.filter((product) =>
    (categoryFilter === "All categories" || product.category === categoryFilter)
    && `${product.name} ${product.category}`.toLowerCase().includes(query.toLowerCase())
  );
  const availableProducts = data.inventory.filter((product) => product.stock > 0);
  const chartData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const key = date.toLocaleDateString("en-CA");
      const sales = data.sales.filter((item) => new Date(item.occurredAt).toLocaleDateString("en-CA") === key);
      const transfers = data.transfers.filter((item) => item.status === "Completed" && new Date(item.occurredAt).toLocaleDateString("en-CA") === key);
      return {
        day: date.toLocaleDateString("en-IN", { weekday: "short" }),
        revenue: sales.reduce((sum, sale) => sum + sale.amount, 0) + transfers.reduce((sum, item) => sum + item.serviceCharge, 0),
        sales: sales.length + transfers.length
      };
    });
    return days;
  }, [data]);
  const categoryData = useMemo(() => {
    const totalsByCategory = data.inventory.reduce<Record<string, number>>((accumulator, product) => {
      accumulator[product.category] = (accumulator[product.category] || 0) + product.stock;
      return accumulator;
    }, {});
    return Object.entries(totalsByCategory).map(([name, value]) => ({ name, value }));
  }, [data.inventory]);
  const topProducts = useMemo(() => {
    const values = new Map<string, number>();
    data.sales.forEach((sale) => {
      if (sale.productId) values.set(sale.productId, (values.get(sale.productId) || 0) + sale.quantity);
    });
    return [...values.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, quantity]) => ({
      name: data.inventory.find((item) => item.id === id)?.name || "Removed product", quantity
    }));
  }, [data.inventory, data.sales]);

  const resetProductForm = () => {
    setEditingProduct(null);
    setShowProductForm(false);
    setImageData("");
    productForm.reset({ name: "", category: "Stationery", price: 0, stock: 0, reorderLevel: 5, unit: "piece" });
    if (imageInput.current) imageInput.current.value = "";
  };

  const startAddProduct = () => {
    resetProductForm();
    setShowProductForm(true);
    setTab("Inventory");
  };

  const editProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
    setImageData(product.image);
    productForm.reset(product);
  };

  const saveProduct = productForm.handleSubmit(async (values) => {
    const product: Product = {
      ...values,
      id: editingProduct?.id || crypto.randomUUID(),
      image: imageData || editingProduct?.image || ""
    };
    const inventory = editingProduct
      ? data.inventory.map((item) => item.id === editingProduct.id ? product : item)
      : [product, ...data.inventory];
    if (await persist({ ...data, inventory })) resetProductForm();
  });

  const removeProduct = async (id: string) => {
    if (!window.confirm("Delete this product from inventory?")) return;
    await persist({ ...data, inventory: data.inventory.filter((item) => item.id !== id) });
  };

  const recordSale = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(saleAmount);
    if (!Number.isFinite(amount) || amount <= 0) { setError("Enter a valid sale amount."); return; }
    const selectedProduct = ["Stationery", "Dairy"].includes(saleType)
      ? data.inventory.find((item) => item.id === saleProductId && item.category === saleType)
      : undefined;
    if (["Stationery", "Dairy"].includes(saleType) && (!selectedProduct || selectedProduct.stock < saleQuantity)) {
      setError("Select an available product and quantity within current stock.");
      return;
    }
    const sale: Sale = {
      id: crypto.randomUUID(), type: selectedProduct ? selectedProduct.category : saleType, productId: selectedProduct?.id || "",
      amount, quantity: Math.max(1, saleQuantity), note: selectedProduct?.name || saleType,
      occurredAt: new Date().toISOString()
    };
    const inventory = selectedProduct
      ? data.inventory.map((item) => item.id === selectedProduct.id ? { ...item, stock: item.stock - saleQuantity } : item)
      : data.inventory;
    if (await persist({ ...data, inventory, sales: [sale, ...data.sales] })) {
      setSaleAmount("");
      setSaleQuantity(1);
    }
  };

  const recordService = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(serviceAmount);
    if (!Number.isFinite(amount) || amount <= 0) { setError("Enter a valid service amount."); return; }
    const sale: Sale = { id: crypto.randomUUID(), type: serviceType, productId: "", amount, quantity: 1, note: serviceType, occurredAt: new Date().toISOString() };
    if (await persist({ ...data, sales: [sale, ...data.sales] })) setServiceAmount("");
  };

  const saveTransfer = transferForm.handleSubmit(async (values) => {
    const transfer: Transfer = { ...values, id: crypto.randomUUID(), occurredAt: new Date().toISOString() };
    if (await persist({ ...data, transfers: [transfer, ...data.transfers] })) {
      transferForm.reset({ customerName: "", mobileNumber: "", amount: 0, transactionId: "", serviceCharge: 0, status: "Completed" });
      setTransferFormOpen(false);
    }
  });

  const exportCsv = () => {
    const lines = [
      ["Product", "Category", "Price", "In stock", "Reorder at"],
      ...data.inventory.map((product) => [product.name, product.category, product.price, product.stock, product.reorderLevel])
    ];
    const blob = new Blob([lines.map((row) => row.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "harm-inventory.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const title = tab === "Overview" ? "Shop overview" : tab;

  return <main className={`owner-app ${darkMode ? "owner-dark" : ""}`}>
    <aside className={`owner-sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
      <a className="owner-logo" href="/"><span className="owner-logo-mark">H<span>.</span></span><span><strong>H.A.R.M</strong><small>OWNER STUDIO</small></span></a>
      <div className="sidebar-shop-card"><span className="shop-avatar">H</span><span><strong>Daily Needs</strong><small>Bandlaguda Jagir, Hyderabad</small></span><ChevronDown size={15} /></div>
      <span className="sidebar-label">WORKSPACE</span>
      <nav className="dashboard-nav" aria-label="Owner dashboard">
        {tabs.map(({ name, icon: Icon }) => <button key={name} className={tab === name ? "dashboard-nav-active" : ""} onClick={() => { setTab(name); setSidebarOpen(false); }}><Icon size={17} />{name}{name === "Inventory" && totals.lowStock.length > 0 && <span className="nav-alert-count">{totals.lowStock.length}</span>}</button>)}
      </nav>
      <div className="sidebar-bottom"><div className="help-card"><span className="help-sparkle"><Sparkles size={16} /></span><strong>Need a hand?</strong><small>Your shop dashboard, all in one place.</small><a href="/">Visit public website <ArrowUpRight size={14} /></a></div><div className="sidebar-user"><span className="user-avatar">H</span><span><strong>Shop owner</strong><small>H.A.R.M Daily Needs</small></span><ShieldCheck size={16} /></div></div>
    </aside>
    {sidebarOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
    <section className="owner-main">
      <header className="owner-topbar"><div className="owner-breadcrumb"><button className="sidebar-menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open dashboard menu"><Menu size={19} /></button><span>Workspace</span><i>/</i><strong>{title}</strong></div><div className="owner-top-actions"><span className="secure-session"><span /> Secure session</span><button className="icon-action" aria-label="Toggle dark mode" onClick={() => setDarkMode(!darkMode)}>{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button><form action="/api/auth/logout" method="post"><button className="logout-button"><LogOut size={15} /><span>Sign out</span></button></form></div></header>
      <div className="owner-content">
        <div className="dashboard-heading"><div><span className="eyebrow">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</span><h1>{title}<span>.</span></h1><p>Your shop, neatly in view. Here’s what’s happening today.</p></div><div className="dashboard-heading-actions"><button className="dashboard-secondary-button" onClick={() => window.print()}><FileText size={15} /> Export PDF</button><button className="dashboard-primary-button" onClick={startAddProduct}><PackagePlus size={16} /> Add product</button></div></div>
        {(error || message) && <div className={`dashboard-notice ${error ? "notice-error" : "notice-success"}`} role={error ? "alert" : "status"}>{error || message}{error && error.includes("MONGODB_URI") && <span> Add your MongoDB connection details to <code>.env.local</code>, then restart the app.</span>}<button onClick={() => { setError(""); setMessage(""); }} aria-label="Dismiss message"><X size={15} /></button></div>}
        {loading && <div className="dashboard-loading">Loading your saved shop records…</div>}

        {tab === "Overview" && <div className="dashboard-view">
          <div className="metric-grid">
            <Metric icon={CircleDollarSign} label="Today's sales" value={formatMoney(totals.todayRevenue)} sub={`${totals.dailySales.length} recorded sales`} tone="purple" />
            <Metric icon={Printer} label="Today's Xerox revenue" value={formatMoney(totals.xeroxRevenue)} sub="Copies, print & finishing" tone="orange" />
            <Metric icon={FileText} label="Today's printing revenue" value={formatMoney(totals.printingRevenue)} sub="Printouts today" tone="blue" />
            <Metric icon={Wallet} label="Money transfer charges" value={formatMoney(totals.transferRevenue)} sub="Service charges today" tone="green" />
            <Metric icon={Boxes} label="Total inventory" value={data.inventory.length.toLocaleString("en-IN")} sub={`${totals.totalItems} total units on hand`} tone="blue" />
            <Metric icon={TrendingDown} label="Low stock products" value={totals.lowStock.length.toLocaleString("en-IN")} sub={totals.lowStock.length ? "Review and replenish" : "Everything looks stocked"} tone="red" />
            <Metric icon={TrendingUp} label="Monthly revenue" value={formatMoney(totals.monthRevenue)} sub="This month to date" tone="gold" />
            <Metric icon={ShoppingBag} label="Customers served" value={totals.customers.toLocaleString("en-IN")} sub="Unique transfer customers" tone="pink" />
            <Metric icon={CreditCard} label="Inventory value" value={formatMoney(totals.stockValue)} sub="At your selling price" tone="mint" />
          </div>
          <div className="dashboard-chart-grid"><article className="dashboard-panel revenue-panel"><PanelHeading title="Revenue overview" subtitle="Your recorded revenue · last 7 days" action="Last 7 days" /><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}><defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7541a5" stopOpacity={.2} /><stop offset="100%" stopColor="#7541a5" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#eeeaf2" strokeDasharray="4 5" vertical={false} /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#928a99" }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#928a99" }} tickFormatter={(value: number) => `₹${value}`} /><Tooltip formatter={(value) => [formatMoney(Number(value)), "Revenue"]} contentStyle={{ borderRadius: 10, border: "1px solid #eee8f2", fontSize: 11 }} /><Area type="monotone" dataKey="revenue" stroke="#7541a5" strokeWidth={2.5} fill="url(#revenueFill)" /></AreaChart></ResponsiveContainer></div></article>
            <article className="dashboard-panel category-panel"><PanelHeading title="Inventory by category" subtitle="Current units on hand" /><div className="category-chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={78} paddingAngle={4}>{categoryData.map((item, index) => <Cell key={item.name} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="chart-total"><strong>{totals.totalItems}</strong><small>units</small></div></div><div className="category-legend">{categoryData.slice(0, 4).map((item, index) => <span key={item.name}><i style={{ background: chartColors[index % chartColors.length] }} />{item.name}<strong>{item.value}</strong></span>)}{categoryData.length === 0 && <p>Add products to see your inventory mix.</p>}</div></article></div>
          <div className="dashboard-bottom-grid"><article className="dashboard-panel"><PanelHeading title="Stock needs attention" subtitle="Products at or below reorder level" action="View inventory" onAction={() => setTab("Inventory")} /><div className="attention-list">{totals.lowStock.length ? totals.lowStock.slice(0, 5).map((item) => <div key={item.id}><span className={item.stock === 0 ? "stock-dot stock-empty" : "stock-dot"} /><span><strong>{item.name}</strong><small>{item.stock === 0 ? "Out of stock" : `${item.stock} ${item.unit} remaining`}</small></span><b>{item.stock === 0 ? "Order now" : "Low"}</b></div>) : <div className="dashboard-empty-inline"><Check size={17} />No low-stock products to review.</div>}</div></article>
            <article className="dashboard-panel"><PanelHeading title="Recent activity" subtitle="Latest recorded transactions" action="See sales" onAction={() => setTab("Sales")} /><div className="activity-list">{data.sales.slice(0, 5).map((sale) => <div key={sale.id}><span className="activity-icon"><Activity size={15} /></span><span><strong>{sale.note || sale.type}</strong><small>{new Date(sale.occurredAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</small></span><b>{formatMoney(sale.amount)}</b></div>)}{data.sales.length === 0 && <div className="dashboard-empty-inline">Your recorded sales will appear here.</div>}</div></article></div>
        </div>}

        {tab === "Inventory" && <section className="dashboard-panel full-panel"><PanelHeading title="Product inventory" subtitle={`${data.inventory.length} products · ${totals.totalItems} units available`} action="Export CSV" onAction={exportCsv} /><div className="table-toolbar"><label className="dashboard-search"><Search size={16} /><input placeholder="Search products..." value={query} onChange={(event) => setQuery(event.target.value)} /></label><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option>All categories</option>{[...new Set(data.inventory.map((item) => item.category))].map((category) => <option key={category}>{category}</option>)}</select><button className="dashboard-primary-button" onClick={startAddProduct}><PackagePlus size={15} /> Add product</button></div>
          {showProductForm && <form className="record-form product-record-form" onSubmit={saveProduct}><div className="record-form-heading"><div><strong>{editingProduct ? "Edit product" : "Add a product"}</strong><small>Product details and current stock</small></div><button type="button" className="icon-action" onClick={resetProductForm} aria-label="Close form"><X size={17} /></button></div>
            <div className="form-grid"><label>Product name<input {...productForm.register("name")} placeholder="e.g. Ruled notebook" />{productForm.formState.errors.name && <small className="field-error">{productForm.formState.errors.name.message}</small>}</label><label>Category<input {...productForm.register("category")} placeholder="e.g. Stationery" />{productForm.formState.errors.category && <small className="field-error">{productForm.formState.errors.category.message}</small>}</label><label>Price (₹)<input type="number" step="0.01" min="0" {...productForm.register("price")} /></label><label>Quantity in stock<input type="number" min="0" step="1" {...productForm.register("stock")} /></label><label>Reorder alert at<input type="number" min="0" step="1" {...productForm.register("reorderLevel")} /></label><label>Stock unit<input {...productForm.register("unit")} placeholder="piece, pack, litre" /></label><label className="upload-field">Product image<input ref={imageInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 900_000) { setError("Choose an image smaller than 900 KB."); event.target.value = ""; return; } const reader = new FileReader(); reader.onload = () => setImageData(String(reader.result)); reader.onerror = () => setError("Could not read the selected image."); reader.readAsDataURL(file); }} />{imageData && <span>Image selected</span>}</label></div><div className="form-actions"><button className="dashboard-secondary-button" type="button" onClick={resetProductForm}>Cancel</button><button className="dashboard-primary-button" type="submit" disabled={saving}>{saving ? "Saving…" : editingProduct ? "Save changes" : "Add product"}</button></div></form>}
          <div className="table-scroll"><table className="owner-table"><thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>PRICE</th><th>IN STOCK</th><th>STATUS</th><th></th></tr></thead><tbody>{filteredProducts.map((item) => <tr key={item.id}><td><div className="product-cell">{item.image ? <img src={item.image} alt="" /> : <span className="table-product-placeholder"><BookOpen size={16} /></span>}<span><strong>{item.name}</strong><small>{item.unit}</small></span></div></td><td>{item.category}</td><td>{formatMoney(item.price)}</td><td>{item.stock} {item.unit}</td><td><span className={`inventory-status ${item.stock === 0 ? "status-out" : item.stock <= item.reorderLevel ? "status-low" : "status-good"}`}><i />{item.stock === 0 ? "Out of stock" : item.stock <= item.reorderLevel ? "Low stock" : "In stock"}</span></td><td><button className="table-action" onClick={() => editProduct(item)}>Edit</button><button className="table-action table-delete" onClick={() => removeProduct(item.id)}>Delete</button></td></tr>)}{filteredProducts.length === 0 && <tr><td colSpan={6} className="table-empty">{data.inventory.length ? "No products match your search." : "No inventory yet. Add your first product to begin."}</td></tr>}</tbody></table></div>
        </section>}

        {tab === "Sales" && <div className="recording-grid">        <section className="dashboard-panel"><PanelHeading title="Record a sale" subtitle="Stationery, dairy, gifts and other shop sales" /><form className="record-form" onSubmit={recordSale}><label>Sale category<select value={saleType} onChange={(event) => setSaleType(event.target.value)}><option>Stationery</option><option>Dairy</option><option>Gift Items</option><option>School Supplies</option><option>Other</option></select></label>{["Stationery", "Dairy"].includes(saleType) && <><label>Product<select value={saleProductId} onChange={(event) => { setSaleProductId(event.target.value); const item = data.inventory.find((product) => product.id === event.target.value); if (item) setSaleAmount(String(item.price)); }}><option value="">Choose a product</option>{availableProducts.filter((product) => product.category === saleType || (saleType === "Stationery" && product.category === "Stationery")).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.stock} in stock</option>)}</select></label><label>Quantity<input type="number" min="1" max={data.inventory.find((item) => item.id === saleProductId)?.stock || undefined} value={saleQuantity} onChange={(event) => { const quantity = Number(event.target.value); setSaleQuantity(quantity); const item = data.inventory.find((product) => product.id === saleProductId); if (item) setSaleAmount(String(item.price * quantity)); }} /></label></>}<label>Total amount (₹)<input type="number" min="0.01" step="0.01" value={saleAmount} onChange={(event) => setSaleAmount(event.target.value)} required /></label><button className="dashboard-primary-button" disabled={saving}><Check size={15} /> Record sale</button></form></section>
          <section className="dashboard-panel"><PanelHeading title="Today’s sales" subtitle="Recorded transactions for today" /><div className="sale-summary"><strong>{formatMoney(totals.todayRevenue)}</strong><span>{totals.dailySales.length} transactions · Today</span></div><div className="activity-list">{totals.dailySales.slice(0, 8).map((sale) => <div key={sale.id}><span className="activity-icon"><CircleDollarSign size={15} /></span><span><strong>{sale.note || sale.type}</strong><small>{new Date(sale.occurredAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</small></span><b>{formatMoney(sale.amount)}</b></div>)}{totals.dailySales.length === 0 && <div className="dashboard-empty-inline">Record a sale to start today’s report.</div>}</div></section>
          <section className="dashboard-panel full-span"><PanelHeading title="Xerox & service counter" subtitle="Capture print, finishing and local-service earnings" /><form className="service-record-form" onSubmit={recordService}><label>Service<select value={serviceType} onChange={(event) => setServiceType(event.target.value)}><option>B/W Xerox</option><option>Color Xerox</option><option>Printouts</option><option>Lamination</option><option>Spiral binding</option><option>Scanning</option><option>Mobile recharge</option><option>DTH recharge</option><option>Utility bill payment</option><option>AEPS service</option></select></label><label>Collected amount (₹)<input type="number" min="0.01" step="0.01" required value={serviceAmount} onChange={(event) => setServiceAmount(event.target.value)} placeholder="Enter amount" /></label><button className="dashboard-primary-button"><Printer size={15} /> Record service</button></form></section>
          <section className="dashboard-panel full-span"><PanelHeading title="Daily report" subtitle="Export a spreadsheet or print this page as a PDF" action="Export CSV" onAction={() => { const rows = [["Date", "Type", "Description", "Amount"], ...data.sales.filter((sale) => isToday(sale.occurredAt)).map((sale) => [sale.occurredAt, sale.type, sale.note, sale.amount])]; const blob = new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "harm-daily-sales.csv"; link.click(); URL.revokeObjectURL(url); }} /><div className="report-total"><span>Today’s recorded sales</span><strong>{formatMoney(totals.todayRevenue)}</strong><button className="dashboard-secondary-button" onClick={() => window.print()}><FileText size={15} /> Print / Save PDF</button></div></section>
        </div>}

        {tab === "Money transfer" && <section className="dashboard-panel full-panel"><PanelHeading title="Money transfer records" subtitle={`${data.transfers.length} recorded transactions`} action={transferFormOpen ? "Close form" : "New transfer"} onAction={() => setTransferFormOpen(!transferFormOpen)} />
          {transferFormOpen && <form className="record-form product-record-form" onSubmit={saveTransfer}><div className="form-grid"><label>Customer name<input {...transferForm.register("customerName")} />{transferForm.formState.errors.customerName && <small className="field-error">{transferForm.formState.errors.customerName.message}</small>}</label><label>Mobile number<input {...transferForm.register("mobileNumber")} />{transferForm.formState.errors.mobileNumber && <small className="field-error">{transferForm.formState.errors.mobileNumber.message}</small>}</label><label>Transfer amount (₹)<input type="number" min="0" step="0.01" {...transferForm.register("amount")} /></label><label>Transaction ID<input {...transferForm.register("transactionId")} />{transferForm.formState.errors.transactionId && <small className="field-error">{transferForm.formState.errors.transactionId.message}</small>}</label><label>Service charge (₹)<input type="number" min="0" step="0.01" {...transferForm.register("serviceCharge")} /></label><label>Status<select {...transferForm.register("status")}><option>Completed</option><option>Pending</option><option>Failed</option></select></label></div><div className="form-actions"><button className="dashboard-primary-button" disabled={saving}>Save transfer record</button></div></form>}
          <div className="table-scroll"><table className="owner-table"><thead><tr><th>CUSTOMER</th><th>MOBILE</th><th>AMOUNT</th><th>CHARGE</th><th>TRANSACTION ID</th><th>STATUS</th><th>DATE</th></tr></thead><tbody>{data.transfers.map((item) => <tr key={item.id}><td><strong>{item.customerName}</strong></td><td>{item.mobileNumber}</td><td>{formatMoney(item.amount)}</td><td>{formatMoney(item.serviceCharge)}</td><td>{item.transactionId}</td><td><span className={`inventory-status ${item.status === "Completed" ? "status-good" : item.status === "Pending" ? "status-low" : "status-out"}`}><i />{item.status}</span></td><td>{new Date(item.occurredAt).toLocaleDateString("en-IN")}</td></tr>)}{data.transfers.length === 0 && <tr><td colSpan={7} className="table-empty">No transfers recorded yet.</td></tr>}</tbody></table></div>
          <p className="privacy-note"><ShieldCheck size={15} /> Transfer records contain customer details. Keep owner access private and follow applicable privacy and financial-service rules.</p>
        </section>}

        {tab === "Xerox counter" && <div className="recording-grid"><section className="dashboard-panel"><PanelHeading title="Counter entry" subtitle="Record copies, print jobs and finishing" /><form className="record-form" onSubmit={recordService}><label>Service<select value={serviceType} onChange={(event) => setServiceType(event.target.value)}><option>B/W Xerox</option><option>Color Xerox</option><option>Printouts</option><option>Lamination</option><option>Spiral binding</option><option>Scanning</option></select></label><label>Amount collected (₹)<input type="number" min="0.01" step="0.01" required value={serviceAmount} onChange={(event) => setServiceAmount(event.target.value)} placeholder="Enter amount" /></label><button className="dashboard-primary-button"><Printer size={15} /> Record counter sale</button></form></section><section className="dashboard-panel"><PanelHeading title="Today at the counter" subtitle="Print and finishing services" /><div className="sale-summary"><strong>{formatMoney(totals.xeroxRevenue)}</strong><span>Recorded service revenue today</span></div><div className="activity-list">{totals.dailySales.filter((sale) => ["B/W Xerox", "Color Xerox", "Printouts", "Lamination", "Spiral binding", "Scanning"].includes(sale.type)).map((sale) => <div key={sale.id}><span className="activity-icon"><Printer size={15} /></span><span><strong>{sale.type}</strong><small>{new Date(sale.occurredAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</small></span><b>{formatMoney(sale.amount)}</b></div>)}</div></section><section className="dashboard-panel full-span"><PanelHeading title="Counter services" subtitle="Track each service separately in the daily report" /><div className="counter-service-grid">{["B/W Xerox", "Color Xerox", "Printouts", "Lamination", "Spiral binding", "Scanning"].map((item, index) => <button key={item} className={serviceType === item ? "counter-service-active" : ""} onClick={() => setServiceType(item)}><span className="counter-service-icon">{index === 0 ? <Printer /> : index === 1 ? <Sparkles /> : index === 2 ? <FileText /> : index === 3 ? <ShieldCheck /> : index === 4 ? <BookOpen /> : <Search />}</span><strong>{item}</strong><span>Select service <ArrowUpRight size={13} /></span></button>)}</div></section></div>}

        {tab === "Analytics" && <div className="dashboard-view"><div className="dashboard-chart-grid"><article className="dashboard-panel revenue-panel"><PanelHeading title="Revenue trend" subtitle="Daily recorded revenue · past week" /><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}><defs><linearGradient id="analyticsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff6b35" stopOpacity={.2} /><stop offset="100%" stopColor="#ff6b35" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#eeeaf2" strokeDasharray="4 5" vertical={false} /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#928a99" }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#928a99" }} tickFormatter={(value: number) => `₹${value}`} /><Tooltip formatter={(value) => [formatMoney(Number(value)), "Revenue"]} /><Area type="monotone" dataKey="revenue" stroke="#ff6b35" strokeWidth={2.5} fill="url(#analyticsFill)" /></AreaChart></ResponsiveContainer></div></article><article className="dashboard-panel"><PanelHeading title="Service-wise earnings" subtitle="Recorded sales by service" /><div className="service-earnings">{[...new Set(data.sales.map((sale) => sale.type))].map((type, index) => { const amount = data.sales.filter((sale) => sale.type === type).reduce((sum, item) => sum + item.amount, 0); const all = data.sales.reduce((sum, item) => sum + item.amount, 0); return <div key={type}><span className="earnings-color" style={{ background: chartColors[index % chartColors.length] }} /><span>{type}</span><strong>{formatMoney(amount)}</strong><i><b style={{ width: `${all ? (amount / all) * 100 : 0}%`, background: chartColors[index % chartColors.length] }} /></i></div>; })}{data.sales.length === 0 && <div className="dashboard-empty-inline">Add sales to see service earnings.</div>}</div></article></div>
          <div className="dashboard-bottom-grid"><article className="dashboard-panel"><PanelHeading title="Top selling products" subtitle="Based on recorded quantities" /><div className="top-products-list">{topProducts.map((item, index) => <div key={item.name}><span className="top-product-rank">{String(index + 1).padStart(2, "0")}</span><strong>{item.name}</strong><span>{item.quantity} sold</span></div>)}{topProducts.length === 0 && <div className="dashboard-empty-inline">Product sales appear after a sale is recorded against inventory.</div>}</div></article><article className="dashboard-panel"><PanelHeading title="Monthly summary" subtitle={new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })} /><div className="monthly-summary"><span><TrendingUp size={17} />Recorded sales<strong>{formatMoney(data.sales.filter((sale) => isThisMonth(sale.occurredAt)).reduce((sum, item) => sum + item.amount, 0))}</strong></span><span><Wallet size={17} />Transfer charges<strong>{formatMoney(data.transfers.filter((item) => item.status === "Completed" && isThisMonth(item.occurredAt)).reduce((sum, item) => sum + item.serviceCharge, 0))}</strong></span><span><FileSpreadsheet size={17} />Transactions<strong>{data.sales.filter((sale) => isThisMonth(sale.occurredAt)).length + data.transfers.filter((item) => isThisMonth(item.occurredAt)).length}</strong></span></div></article></div>
        </div>}
      </div>
    </section>
  </main>;
}

function Metric({ icon: Icon, label, value, sub, tone }: { icon: typeof Boxes; label: string; value: string; sub: string; tone: string }) {
  return <article className="metric-card"><span className={`metric-icon metric-${tone}`}><Icon size={18} /></span><div className="metric-label">{label}</div><strong className="metric-value">{value}</strong><span className="metric-sub">{sub}</span></article>;
}

function PanelHeading({ title, subtitle, action, onAction }: { title: string; subtitle: string; action?: string; onAction?: () => void }) {
  return <div className="panel-heading"><div><h2>{title}</h2><p>{subtitle}</p></div>{action && <button className="panel-heading-action" onClick={onAction}>{action}<ArrowUpRight size={14} /></button>}</div>;
}

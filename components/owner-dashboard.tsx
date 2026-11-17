"use client";
import { AdminReviews } from "@/components/admin-reviews";
import { AdminCounterRates } from "@/components/admin-counter-rates";
import { AdminRateCalculator } from "@/components/admin-rate-calculator";
import { mergePublicProducts, normalizeSearch, canonicalProductName } from "@/lib/product-search";


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

type Product = { id: string; name: string; category: string; price: number; costPrice?: number; stock: number; reorderLevel: number; unit: string; image: string; brand?: string; description?: string; status?: "Active" | "Inactive"; featured?: boolean; expiryDate?: string | null; updatedAt?: string };
type Sale = { id: string; type: string; productId: string; amount: number; quantity: number; note: string; costAmount?: number; profit?: number; transactionId?: string; customerName?: string; occurredAt: string };
type Transfer = { id: string; customerName: string; mobileNumber: string; amount: number; transactionId: string; serviceCharge: number; status: "Pending" | "Completed" | "Failed"; occurredAt: string };
type Expense = { id: string; description: string; category: string; amount: number; occurredAt: string };
type StoreData = { inventory: Product[]; sales: Sale[]; transfers: Transfer[]; expenses: Expense[] };
type ShopSettings = { businessName: string; address: string; phone: string; googleReviewLink: string; storeHours: string; taxRate: number; serviceRates: Record<string, number> };
type Tab = "Dashboard" | "Products" | "Categories" | "Inventory" | "Low Stock Alerts" | "Sales" | "Billing & POS" | "Milk & Dairy" | "School Supplies" | "Money Transfer" | "Xerox & Printing" | "Quick Rate Calculator" | "Customer Reviews" | "Reports & Analytics" | "Analytics" | "Settings";

const emptyData: StoreData = { inventory: [], sales: [], transfers: [], expenses: [] };
const defaultSettings: ShopSettings = {
  businessName: "H.A.R.M DAILY NEEDS",
  address: "Bandlaguda Jagir, Hyderabad",
  phone: "+91 83747 78183",
  googleReviewLink: "",
  storeHours: "Open daily · 8 AM–10 PM",
  taxRate: 0,
  serviceRates: { "B/W Xerox": 2, "Color Xerox": 10, Printouts: 3, Lamination: 20, "Spiral binding": 30, Scanning: 10, "Mobile recharge": 0, "DTH recharge": 0, "Utility bill payment": 0, "AEPS service": 0 }
};
const tabs: { name: Tab; icon: typeof LayoutDashboard }[] = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Products", icon: ShoppingBag },
  { name: "Categories", icon: BookOpen },
  { name: "Inventory", icon: Boxes },
  { name: "Low Stock Alerts", icon: TrendingDown },
  { name: "Sales", icon: CircleDollarSign },
  { name: "Billing & POS", icon: CreditCard },
  { name: "Milk & Dairy", icon: BookOpen },
  { name: "School Supplies", icon: Gift },
  { name: "Money Transfer", icon: Wallet },
  { name: "Xerox & Printing", icon: Printer },
  { name: "Quick Rate Calculator", icon: CircleDollarSign },
  { name: "Customer Reviews", icon: BookOpen },
  { name: "Reports & Analytics", icon: BarChart3 },
  { name: "Settings", icon: Settings2 }
];
const chartColors = ["#5b2d90", "#ff6b35", "#e7b73c", "#38a878"];
const productSchema = z.object({
  name: z.string().trim().min(1, "Enter a product name.").max(100),
  category: z.string().trim().min(1, "Choose a category.").max(50),
  price: z.coerce.number().min(0),
  costPrice: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0),
  reorderLevel: z.coerce.number().int().min(0),
  unit: z.string().trim().min(1).max(24),
  brand: z.string().trim().max(80),
  description: z.string().trim().max(500),
  status: z.enum(["Active", "Inactive"]),
  featured: z.boolean(),
  expiryDate: z.string()
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
const expiresWithinWeek = (value?: string | null) => {
  if (!value) return false;
  const expiry = new Date(value).getTime();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return Number.isFinite(expiry) && expiry < todayStart.getTime() + 8 * 24 * 60 * 60 * 1000;
};

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function OwnerDashboard() {
  const [data, setData] = useState<StoreData>(emptyData);
  const [settings, setSettings] = useState<ShopSettings>(defaultSettings);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("Dashboard");
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
  const [saleProductId, setSaleProductId] = useState("");
  const [saleQuantity, setSaleQuantity] = useState(1);
  const [saleAmount, setSaleAmount] = useState("");
  const [saleCustomer, setSaleCustomer] = useState("");
  const [cart, setCart] = useState<{ productId: string; quantity: number }[]>([]);
  const [cartProductId, setCartProductId] = useState("");
  const [cartQuantity, setCartQuantity] = useState(1);
  const [cartQuery, setCartQuery] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkStockDelta, setBulkStockDelta] = useState(1);
  const [bulkStatus, setBulkStatus] = useState<"Active" | "Inactive">("Active");
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Supplies");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [serviceType, setServiceType] = useState("B/W Xerox");
  const [serviceQuantity, setServiceQuantity] = useState(1);
  const [serviceAmount, setServiceAmount] = useState("");
  const [receiptSales, setReceiptSales] = useState<Sale[]>([]);
  const [transferFormOpen, setTransferFormOpen] = useState(false);
  const [imageData, setImageData] = useState("");
  const imageInput = useRef<HTMLInputElement>(null);

  const productForm = useForm<z.input<typeof productSchema>, unknown, ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", category: "Stationery", price: 0, costPrice: 0, stock: 0, reorderLevel: 5, unit: "piece", brand: "", description: "", status: "Active", featured: false, expiryDate: "" }
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
      const currentExpenseIds = new Set(data.expenses.map((item) => item.id));
      const changes = {
        inventoryUpserts: next.inventory.filter((item) => JSON.stringify(currentInventory.get(item.id)) !== JSON.stringify(item)),
        inventoryDeleteIds: data.inventory.filter((item) => !nextInventoryIds.has(item.id)).map((item) => item.id),
        salesToAdd: next.sales.filter((item) => !currentSaleIds.has(item.id)),
        transfersToAdd: next.transfers.filter((item) => !currentTransferIds.has(item.id)),
        expensesToAdd: next.expenses.filter((item) => !currentExpenseIds.has(item.id))
      };
      const response = await fetch("/api/admin/data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes)
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "Could not save your changes.");
      setData(next);
      window.dispatchEvent(new Event("harm-products-updated"));
      try { localStorage.setItem("harm-products-updated",String(Date.now())); } catch {}
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
        if (active) setData({ inventory: result.inventory, sales: result.sales, transfers: result.transfers, expenses: result.expenses || [] });
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load saved shop data.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/settings", { cache: "no-store" })
      .then(async response => {
        const result = await response.json() as { settings?: Partial<ShopSettings> | null; message?: string };
        if (!response.ok) throw new Error(result.message || "Could not load store settings.");
        if (active && result.settings) setSettings({ ...defaultSettings, ...result.settings, serviceRates: { ...defaultSettings.serviceRates, ...result.settings.serviceRates } });
      })
      .catch(loadError => { if (active) setError(loadError instanceof Error ? loadError.message : "Could not load store settings."); });
    return () => { active = false; };
  }, []);

  const totals = useMemo(() => {
    const dailySales = data.sales.filter((item) => isToday(item.occurredAt));
    const monthlySales = data.sales.filter((item) => isThisMonth(item.occurredAt));
    const transferToday = data.transfers.filter((item) => item.status === "Completed" && isToday(item.occurredAt));
    const lowStock = data.inventory.filter((item) => item.stock <= item.reorderLevel || expiresWithinWeek(item.expiryDate));
    const todayRevenue = dailySales.reduce((sum, item) => sum + item.amount, 0);
    const xeroxRevenue = dailySales.filter((item) => ["B/W Xerox", "Color Xerox", "Lamination", "Spiral binding", "Scanning"].includes(item.type)).reduce((sum, item) => sum + item.amount, 0);
    const printingRevenue = dailySales.filter((item) => item.type === "Printouts").reduce((sum, item) => sum + item.amount, 0);
    const transferRevenue = transferToday.reduce((sum, item) => sum + item.serviceCharge, 0);
    const monthRevenue = monthlySales.reduce((sum, item) => sum + item.amount, 0)
      + data.transfers.filter((item) => item.status === "Completed" && isThisMonth(item.occurredAt)).reduce((sum, item) => sum + item.serviceCharge, 0);
    const stockValue = data.inventory.reduce((sum, item) => sum + item.stock * (item.costPrice ?? 0), 0);
    const todayProfit = dailySales.filter(item => item.profit !== undefined).reduce((sum, item) => sum + (item.profit ?? 0), 0) + transferRevenue;
    const customers = new Set([
      ...dailySales.map((item) => item.transactionId || item.id),
      ...transferToday.map((item) => item.mobileNumber)
    ]).size;
    const productsSoldToday = dailySales.reduce((sum, item) => sum + (item.productId ? item.quantity : 0), 0);
    const monthlyExpenses = data.expenses.filter((item) => isThisMonth(item.occurredAt)).reduce((sum, item) => sum + item.amount, 0);
    const todayExpenses = data.expenses.filter((item) => isToday(item.occurredAt)).reduce((sum, item) => sum + item.amount, 0);
    const monthProfit = monthlySales.filter(item => item.profit !== undefined).reduce((sum, item) => sum + (item.profit ?? 0), 0)
      + data.transfers.filter((item) => item.status === "Completed" && isThisMonth(item.occurredAt)).reduce((sum, item) => sum + item.serviceCharge, 0)
      - monthlyExpenses;
    return { dailySales, todayRevenue, todayProfit: todayProfit - todayExpenses, xeroxRevenue, printingRevenue, transferRevenue, monthRevenue, monthProfit, monthlyExpenses, stockValue, lowStock, customers, productsSoldToday, totalItems: data.inventory.reduce((sum, item) => sum + item.stock, 0) };
  }, [data]);

  const filteredProducts = data.inventory.filter((product) =>
    (categoryFilter === "All categories" || product.category === categoryFilter)
    && (tab !== "Milk & Dairy" || /milk|dairy|curd|paneer|butter|cheese/i.test(`${product.category} ${product.name}`))
    && (tab !== "School Supplies" || /school|stationery|notebook|office|pen|paper/i.test(`${product.category} ${product.name}`))
    && (tab !== "Low Stock Alerts" || product.stock <= product.reorderLevel || expiresWithinWeek(product.expiryDate))
    && `${product.name} ${product.category}`.toLowerCase().includes(query.toLowerCase())
  );
  const availableProducts = data.inventory.filter((product) =>
    product.stock > 0 && product.status !== "Inactive"
    && (tab !== "Billing & POS" || !cartQuery || `${product.name} ${product.category} ${product.brand || ""}`.toLowerCase().includes(cartQuery.toLowerCase()))
  );
  const activeCategories = [...new Set(data.inventory.map((item) => item.category))].sort((a, b) => a.localeCompare(b));
  const expiringProducts = data.inventory.filter(item => expiresWithinWeek(item.expiryDate)).sort((a, b) => new Date(a.expiryDate || "").getTime() - new Date(b.expiryDate || "").getTime());
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
    productForm.reset({ name: "", category: "Stationery", price: 0, costPrice: 0, stock: 0, reorderLevel: 5, unit: "piece", brand: "", description: "", status: "Active", featured: false, expiryDate: "" });
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
    productForm.reset({
      ...product,
      costPrice: product.costPrice ?? 0,
      brand: product.brand ?? "",
      description: product.description ?? "",
      status: product.status ?? "Active",
      featured: product.featured ?? false,
      expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().slice(0, 10) : ""
    });
  };

  const saveProduct = productForm.handleSubmit(async (values) => {
    const product: Product = {
      ...values,
      id: editingProduct?.id || crypto.randomUUID(),
      image: imageData || editingProduct?.image || "",
      expiryDate: values.expiryDate ? new Date(`${values.expiryDate}T00:00:00`).toISOString() : null
    };
    const inventory = editingProduct
      ? data.inventory.map((item) => item.id === editingProduct.id ? product : item)
      : [product, ...data.inventory];
    if (await persist({ ...data, inventory })) resetProductForm();
  });

  const applyBulkUpdate = async () => {
    if (!selectedProductIds.length) return;
    if (!Number.isInteger(bulkStockDelta)) { setError("Enter a whole number for the stock adjustment."); return; }
    const inventory = data.inventory.map((item) => selectedProductIds.includes(item.id)
      ? { ...item, stock: Math.max(0, item.stock + bulkStockDelta), status: bulkStatus }
      : item);
    if (await persist({ ...data, inventory })) setSelectedProductIds([]);
  };

  const addToCart = () => {
    const item = data.inventory.find((product) => product.id === cartProductId);
    if (!item || item.status === "Inactive" || !Number.isInteger(cartQuantity) || cartQuantity < 1) { setError("Choose an active product and enter a whole-number quantity."); return; }
    setCart((current) => {
      const currentQuantity = current.find((line) => line.productId === item.id)?.quantity ?? 0;
      if (currentQuantity + cartQuantity > item.stock) {
        setError(`Only ${item.stock} ${item.unit} of ${item.name} are in stock.`);
        return current;
      }
      setError("");
      return currentQuantity
        ? current.map((line) => line.productId === item.id ? { ...line, quantity: line.quantity + cartQuantity } : line)
        : [...current, { productId: item.id, quantity: cartQuantity }];
    });
    setCartProductId("");
    setCartQuantity(1);
    setCartQuery("");
  };

  const cartTotal = cart.reduce((sum, line) => {
    const item = data.inventory.find((product) => product.id === line.productId);
    return sum + (item?.price ?? 0) * line.quantity;
  }, 0);
  const cartTax = Math.round(cartTotal * settings.taxRate) / 100;
  const cartGrandTotal = cartTotal + cartTax;

  const printReceipt = (sales: Sale[]) => {
    if (!sales.length) { setError("Record a sale or add products to the cart before printing a receipt."); return; }
    const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
    const subtotal = sales.reduce((sum, sale) => sum + sale.amount, 0);
    const tax = Math.round(subtotal * settings.taxRate) / 100;
    const total = subtotal + tax;
    const receiptWindow = window.open("", "_blank", "width=420,height=700");
    if (!receiptWindow) { setError("Allow pop-ups to print or save a receipt as PDF."); return; }
    receiptWindow.opener = null;
    const rows = sales.map(sale => `<tr><td>${escapeHtml(sale.note || sale.type)} × ${sale.quantity}</td><td>${formatMoney(sale.amount)}</td></tr>`).join("");
    receiptWindow.document.write(`<!doctype html><html><head><title>Receipt</title><style>body{font:14px Arial,sans-serif;max-width:360px;margin:32px auto;color:#111}h1{font-size:20px;text-align:center}p{text-align:center;color:#555}table{width:100%;border-collapse:collapse;margin:22px 0}td{padding:9px 0;border-bottom:1px dashed #bbb}td:last-child{text-align:right}strong{display:block;text-align:right;font-size:18px}</style></head><body><h1>${escapeHtml(settings.businessName)}</h1><p>${escapeHtml(settings.address)} · ${escapeHtml(settings.phone)}</p><table>${rows}</table><p>Subtotal: ${formatMoney(subtotal)}${tax ? `<br>Tax (${settings.taxRate}%): ${formatMoney(tax)}` : ""}</p><strong>Total: ${formatMoney(total)}</strong><p>Thank you for shopping with us!</p></body></html>`);
    receiptWindow.document.close();
    receiptWindow.focus();
    window.setTimeout(() => receiptWindow.print(), 250);
  };

  const checkoutCart = async () => {
    if (!cart.length) return;
    const transactionId = crypto.randomUUID();
    const occurredAt = new Date().toISOString();
    const lines = cart.map((line) => {
      const item = data.inventory.find((product) => product.id === line.productId);
      if (!item || item.stock < line.quantity || item.status === "Inactive") return null;
      const amount = item.price * line.quantity;
      const costAmount = (item.costPrice ?? 0) * line.quantity;
      return {
        id: crypto.randomUUID(), transactionId, customerName: saleCustomer.trim(),
        type: item.category, productId: item.id, amount, costAmount, profit: amount - costAmount,
        quantity: line.quantity, note: item.name, occurredAt
      } satisfies Sale;
    });
    if (lines.some((line) => line === null)) {
      setError("Cart contains an unavailable item or quantity. Review stock and try again.");
      return;
    }
    const sales = lines as Sale[];
    const sold = new Map(sales.map((sale) => [sale.productId, sale.quantity]));
    const inventory = data.inventory.map((item) => sold.has(item.id)
      ? { ...item, stock: item.stock - (sold.get(item.id) ?? 0) }
      : item);
    if (await persist({ ...data, inventory, sales: [...sales, ...data.sales] })) {
      setCart([]);
      setSaleCustomer("");
      setReceiptSales(sales);
      setTab("Sales");
      setMessage(`Sale completed. Receipt ${transactionId.slice(0, 8)} · ${formatMoney(cartGrandTotal)}.`);
    }
  };

  const sendCartReceipt = () => {
    const lines = cart.map((line) => {
      const item = data.inventory.find((product) => product.id === line.productId);
      return item ? `${item.name} x${line.quantity}: ${formatMoney(item.price * line.quantity)}` : "";
    }).filter(Boolean);
    const text = `H.A.R.M DAILY NEEDS\n${lines.join("\n")}\nTotal: ${formatMoney(cartGrandTotal)}\nThank you!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const recordExpense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(expenseAmount);
    if (!expenseDescription.trim() || !Number.isFinite(amount) || amount <= 0) {
      setError("Enter an expense description and a valid amount.");
      return;
    }
    const expense: Expense = {
      id: crypto.randomUUID(), description: expenseDescription.trim(), category: expenseCategory,
      amount, occurredAt: new Date().toISOString()
    };
    if (await persist({ ...data, expenses: [expense, ...data.expenses] })) {
      setExpenseDescription("");
      setExpenseAmount("");
      setExpenseFormOpen(false);
    }
  };

  const removeProduct = async (id: string) => {
    if (!window.confirm("Delete this product from inventory?")) return;
    await persist({ ...data, inventory: data.inventory.filter((item) => item.id !== id) });
  };

  const recordSale = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(saleAmount);
    if (!Number.isFinite(amount) || amount <= 0) { setError("Enter a valid sale amount."); return; }
    const selectedProduct = data.inventory.find((item) => item.id === saleProductId);
    if (!selectedProduct || !Number.isInteger(saleQuantity) || selectedProduct.stock < saleQuantity || selectedProduct.status === "Inactive") {
      setError("Select an available product and quantity within current stock.");
      return;
    }
    const costAmount = (selectedProduct.costPrice ?? 0) * saleQuantity;
    const sale: Sale = {
      id: crypto.randomUUID(), transactionId: crypto.randomUUID(), customerName: saleCustomer.trim(),
      type: selectedProduct.category, productId: selectedProduct.id,
      amount, costAmount, profit: amount - costAmount, quantity: Math.max(1, saleQuantity), note: selectedProduct.name,
      occurredAt: new Date().toISOString()
    };
    const inventory = data.inventory.map((item) => item.id === selectedProduct.id ? { ...item, stock: item.stock - saleQuantity } : item);
    if (await persist({ ...data, inventory, sales: [sale, ...data.sales] })) {
      setReceiptSales([sale]);
      setSaleAmount("");
      setSaleQuantity(1);
      setSaleProductId("");
      setSaleCustomer("");
    }
  };

  const recordService = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(serviceAmount);
    if (!Number.isInteger(serviceQuantity) || serviceQuantity < 1 || !Number.isFinite(amount) || amount <= 0) { setError("Enter a valid service quantity and amount."); return; }
    const sale: Sale = { id: crypto.randomUUID(), transactionId: crypto.randomUUID(), type: serviceType, productId: "", amount, quantity: serviceQuantity, note: serviceType, occurredAt: new Date().toISOString() };
    if (await persist({ ...data, sales: [sale, ...data.sales] })) setServiceAmount("");
  };

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSettingsSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "Could not save store settings.");
      setMessage("Store settings saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save store settings.");
    } finally {
      setSettingsSaving(false);
    }
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

  const importPublicCatalog = async () => {
    const names=new Set(data.inventory.map(p=>canonicalProductName(p.name)));
    const additions=mergePublicProducts([]).filter(p=>p.price!==null&&!names.has(canonicalProductName(p.name))).map(p=>({id:p.key,name:p.name,category:p.id==='notebooks'?'Note Books':p.id==='office-supplies'?'Office supplies':p.id==='milk-dairy'?'Milk & Dairy':p.id==='cool-drinks'?'Cool Drinks & Beverages':p.id==='daily-needs'?'Daily needs':p.id==='gift-items'?'Gift Items':'Stationery',price:p.price!,stock:0,reorderLevel:5,unit:p.unit||'piece',image:p.image||''}));
    if(!additions.length){setMessage('Public catalog products are already in inventory. Edit a product to update its public price.');return;}
    setSaving(true);setError('');setMessage('');let imported=0;
    try {
      for(let offset=0;offset<additions.length;offset+=100){const batch=additions.slice(offset,offset+100);const response=await fetch('/api/admin/data',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({inventoryUpserts:batch,inventoryDeleteIds:[],salesToAdd:[],transfersToAdd:[]})});const result=await response.json();if(!response.ok)throw Error(result.message||'Could not import catalog prices.');imported+=batch.length;setData(current=>({...current,inventory:[...current.inventory,...batch]}));}
      setMessage('Imported '+imported+' public price entries. Review amounts and set actual stock quantities.');
    }catch(error){setError((imported?imported+' entries were saved. ':'')+(error instanceof Error?error.message:'Import failed.'));}
    finally {setSaving(false);if(imported){window.dispatchEvent(new Event('harm-products-updated'));try{localStorage.setItem('harm-products-updated',String(Date.now()));}catch{}}}
  };

  const title = tab === "Dashboard" ? "Shop overview" : tab;

  return <main className={`owner-app ${darkMode ? "owner-dark" : ""}`}>
    <aside className={`owner-sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
      <a className="owner-logo" href="/"><span className="owner-logo-mark"><img src="/brand/harm-icon.svg" alt="HM monogram" width={48} height={48}/></span><span><strong>{settings.businessName}</strong><small>OWNER STUDIO</small></span></a>
      <div className="sidebar-shop-card"><span className="shop-avatar"><img src="/brand/harm-icon.svg" width={36} height={36} alt="HM monogram"/></span><span><strong>{settings.businessName}</strong><small>{settings.address}</small></span><ChevronDown size={15} /></div>
      <span className="sidebar-label">WORKSPACE</span>
      <nav className="dashboard-nav" aria-label="Owner dashboard">
        {tabs.map(({ name, icon: Icon }) => <button key={name} className={tab === name ? "dashboard-nav-active" : ""} onClick={() => { setTab(name); setSidebarOpen(false); }}><Icon size={17} />{name}{name === "Low Stock Alerts" && totals.lowStock.length > 0 && <span className="nav-alert-count">{totals.lowStock.length}</span>}</button>)}
      </nav>
      <div className="sidebar-bottom"><div className="help-card"><span className="help-sparkle"><Sparkles size={16} /></span><strong>Need a hand?</strong><small>Your shop dashboard, all in one place.</small><a href="/">Visit public website <ArrowUpRight size={14} /></a></div><div className="sidebar-user"><span className="user-avatar">H</span><span><strong>Shop owner</strong><small>H.A.R.M Daily Needs</small></span><ShieldCheck size={16} /></div></div>
    </aside>
    {sidebarOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
    <section className="owner-main">
      <header className="owner-topbar"><div className="owner-breadcrumb"><button className="sidebar-menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open dashboard menu"><Menu size={19} /></button><span>Workspace</span><i>/</i><strong>{title}</strong></div><div className="owner-top-actions"><span className="secure-session"><span /> Secure session</span><button className="icon-action" aria-label="Toggle dark mode" onClick={() => setDarkMode(!darkMode)}>{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button><form action="/api/auth/logout" method="post"><button className="logout-button"><LogOut size={15} /><span>Sign out</span></button></form></div></header>
      <div className="owner-content"><div className="print-brand-header"><img src="/brand/harm-horizontal.svg" width={480} height={90} alt={`${settings.businessName} — Stationery, Dairy & Refreshing Drinks Under One Roof`}/><p>{settings.address} · {settings.phone} · {settings.storeHours}</p></div>
        <div className="dashboard-heading"><div><span className="eyebrow">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</span><h1>{title}<span>.</span></h1><p>Your shop, neatly in view. Here’s what’s happening today.</p></div><div className="dashboard-heading-actions"><button className="dashboard-secondary-button" onClick={() => window.print()}><FileText size={15} /> Export PDF</button><button className="dashboard-secondary-button" disabled={saving||loading} onClick={importPublicCatalog}>Import public prices</button><button className="dashboard-primary-button" onClick={startAddProduct}><PackagePlus size={16} /> Add product</button></div></div>
        {(error || message) && <div className={`dashboard-notice ${error ? "notice-error" : "notice-success"}`} role={error ? "alert" : "status"}>{error || message}{error && error.includes("MONGODB_URI") && <span> Add your MongoDB connection details to <code>.env.local</code>, then restart the app.</span>}<button onClick={() => { setError(""); setMessage(""); }} aria-label="Dismiss message"><X size={15} /></button></div>}
        {loading && <div className="dashboard-loading">Loading your saved shop records…</div>}
        {tab === "Billing & POS" && <label className="pos-search-field"><Search size={16} /><input type="search" value={cartQuery} onChange={event => setCartQuery(event.target.value)} placeholder="Search products by name, brand, or category..." aria-label="Search POS products" /></label>}

        {tab === "Dashboard" && <div className="dashboard-view">
          <div className="metric-grid">
            <Metric icon={CircleDollarSign} label="Today's sales" value={formatMoney(totals.todayRevenue)} sub={`${totals.dailySales.length} transactions`} tone="purple" />
            <Metric icon={TrendingUp} label="Today's profit" value={formatMoney(totals.todayProfit)} sub="After recorded expenses" tone="green" />
            <Metric icon={TrendingUp} label="Monthly revenue" value={formatMoney(totals.monthRevenue)} sub={`Profit ${formatMoney(totals.monthProfit)}`} tone="gold" />
            <Metric icon={ShoppingBag} label="Total products" value={data.inventory.length.toLocaleString("en-IN")} sub={`${totals.totalItems} units on hand`} tone="blue" />
            <Metric icon={CreditCard} label="Inventory value" value={formatMoney(totals.stockValue)} sub="At recorded buying cost" tone="mint" />
            <Metric icon={Boxes} label="Products sold today" value={totals.productsSoldToday.toLocaleString("en-IN")} sub="Inventory units sold" tone="orange" />
            <Metric icon={TrendingDown} label="Stock & expiry alerts" value={totals.lowStock.length.toLocaleString("en-IN")} sub={totals.lowStock.length ? "Review stock and dairy dates" : "Everything looks stocked"} tone="red" />
            <Metric icon={ShoppingBag} label="Customers served" value={totals.customers.toLocaleString("en-IN")} sub="Recorded sales and transfers" tone="pink" />
          </div>
          {expiringProducts.length > 0 && <section className="dashboard-panel expiry-alert-panel"><PanelHeading title="Dairy expiry watch" subtitle="Expired or expiring within 7 days" action="Review inventory" onAction={() => setTab("Milk & Dairy")} /><div className="attention-list">{expiringProducts.slice(0, 6).map(item => <div key={item.id}><span className="stock-dot stock-empty" /><span><strong>{item.name}</strong><small>{item.stock} {item.unit} · Expires {new Date(item.expiryDate!).toLocaleDateString("en-IN")}</small></span><b>{new Date(item.expiryDate!).getTime() < Date.now() ? "Expired" : "Soon"}</b></div>)}</div></section>}
          <div className="dashboard-chart-grid"><article className="dashboard-panel revenue-panel"><PanelHeading title="Revenue overview" subtitle="Your recorded revenue · last 7 days" action="Last 7 days" /><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}><defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7541a5" stopOpacity={.2} /><stop offset="100%" stopColor="#7541a5" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#eeeaf2" strokeDasharray="4 5" vertical={false} /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#928a99" }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#928a99" }} tickFormatter={(value: number) => `₹${value}`} /><Tooltip formatter={(value) => [formatMoney(Number(value)), "Revenue"]} contentStyle={{ borderRadius: 10, border: "1px solid #eee8f2", fontSize: 11 }} /><Area type="monotone" dataKey="revenue" stroke="#7541a5" strokeWidth={2.5} fill="url(#revenueFill)" /></AreaChart></ResponsiveContainer></div></article>
            <article className="dashboard-panel category-panel"><PanelHeading title="Inventory by category" subtitle="Current units on hand" /><div className="category-chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={78} paddingAngle={4}>{categoryData.map((item, index) => <Cell key={item.name} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="chart-total"><strong>{totals.totalItems}</strong><small>units</small></div></div><div className="category-legend">{categoryData.slice(0, 4).map((item, index) => <span key={item.name}><i style={{ background: chartColors[index % chartColors.length] }} />{item.name}<strong>{item.value}</strong></span>)}{categoryData.length === 0 && <p>Add products to see your inventory mix.</p>}</div></article></div>
          <div className="dashboard-bottom-grid"><article className="dashboard-panel"><PanelHeading title="Stock needs attention" subtitle="Products at or below reorder level" action="View inventory" onAction={() => setTab("Inventory")} /><div className="attention-list">{totals.lowStock.length ? totals.lowStock.slice(0, 5).map((item) => <div key={item.id}><span className={item.stock === 0 ? "stock-dot stock-empty" : "stock-dot"} /><span><strong>{item.name}</strong><small>{item.stock === 0 ? "Out of stock" : `${item.stock} ${item.unit} remaining`}</small></span><b>{item.stock === 0 ? "Order now" : "Low"}</b></div>) : <div className="dashboard-empty-inline"><Check size={17} />No low-stock products to review.</div>}</div></article>
            <article className="dashboard-panel"><PanelHeading title="Recent activity" subtitle="Latest recorded transactions" action="See sales" onAction={() => setTab("Sales")} /><div className="activity-list">{data.sales.slice(0, 5).map((sale) => <div key={sale.id}><span className="activity-icon"><Activity size={15} /></span><span><strong>{sale.note || sale.type}</strong><small>{new Date(sale.occurredAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</small></span><b>{formatMoney(sale.amount)}</b></div>)}{data.sales.length === 0 && <div className="dashboard-empty-inline">Your recorded sales will appear here.</div>}</div></article></div>
        </div>}

        {tab === "Categories" && <section className="dashboard-panel full-panel"><PanelHeading title="Product categories" subtitle={`${activeCategories.length} categories in use`} /><div className="category-card-grid">{activeCategories.map(category => { const products = data.inventory.filter(item => item.category === category); return <button key={category} className="category-admin-card" onClick={() => { setCategoryFilter(category); setTab("Products"); }}><span><BookOpen size={19} /></span><strong>{category}</strong><small>{products.length} products · {products.reduce((sum, product) => sum + product.stock, 0)} units</small></button>; })}{activeCategories.length === 0 && <div className="dashboard-empty-inline">Categories appear here when you add products.</div>}</div></section>}

        {tab === "Settings" && <section className="dashboard-panel full-panel"><PanelHeading title="Store settings" subtitle="Business details, tax, and counter service rates" /><form className="record-form product-record-form" onSubmit={saveSettings}><div className="form-grid"><label>Business name<input required maxLength={120} value={settings.businessName} onChange={event => setSettings(current => ({ ...current, businessName: event.target.value }))} /></label><label>Business address<input required maxLength={240} value={settings.address} onChange={event => setSettings(current => ({ ...current, address: event.target.value }))} /></label><label>Phone number<input required maxLength={32} value={settings.phone} onChange={event => setSettings(current => ({ ...current, phone: event.target.value }))} /></label><label>Google review link<input type="url" value={settings.googleReviewLink} onChange={event => setSettings(current => ({ ...current, googleReviewLink: event.target.value }))} placeholder="https://..." /></label><label>Store hours<input required value={settings.storeHours} onChange={event => setSettings(current => ({ ...current, storeHours: event.target.value }))} /></label><label>Tax rate (%)<input type="number" min="0" max="100" step="0.01" value={settings.taxRate} onChange={event => setSettings(current => ({ ...current, taxRate: Number(event.target.value) }))} /></label>{Object.entries(settings.serviceRates).map(([name, rate]) => <label key={name}>{name} rate (₹ / unit)<input type="number" min="0" step="0.01" value={rate} onChange={event => setSettings(current => ({ ...current, serviceRates: { ...current.serviceRates, [name]: Number(event.target.value) } }))} /></label>)}</div><div className="form-actions"><button className="dashboard-primary-button" disabled={settingsSaving}>{settingsSaving ? "Saving…" : "Save settings"}</button></div></form></section>}

        {tab === "Billing & POS" && <div className="recording-grid"><section className="dashboard-panel"><PanelHeading title="Point of sale" subtitle="Add products, review totals, and complete the sale" /><form className="record-form" onSubmit={event => { event.preventDefault(); addToCart(); }}><label>Search / select product<select required value={cartProductId} onChange={event => setCartProductId(event.target.value)}><option value="">Choose product</option>{availableProducts.map(item => <option key={item.id} value={item.id}>{item.name} · {formatMoney(item.price)} · {item.stock} in stock</option>)}</select></label><label>Quantity<input type="number" min="1" step="1" value={cartQuantity} onChange={event => setCartQuantity(Number(event.target.value))} /></label><button className="dashboard-secondary-button" type="submit">Add to bill</button></form><label className="pos-customer-field">Customer name (optional)<input value={saleCustomer} onChange={event => setSaleCustomer(event.target.value)} /></label><div className="activity-list">{cart.map(line => { const product = data.inventory.find(item => item.id === line.productId); return product ? <div key={line.productId}><span className="activity-icon"><ShoppingBag size={15} /></span><span><strong>{product.name}</strong><small>{line.quantity} × {formatMoney(product.price)}</small></span><b>{formatMoney(product.price * line.quantity)}</b><button className="table-action table-delete" onClick={() => setCart(current => current.filter(item => item.productId !== line.productId))}>Remove</button></div> : null; })}{cart.length === 0 && <div className="dashboard-empty-inline">Your bill is empty. Add a product to get started.</div>}</div><div className="sale-summary"><span>Subtotal {formatMoney(cartTotal)} · Tax {formatMoney(cartTax)}</span><strong>{formatMoney(cartGrandTotal)}</strong><span>Including configured tax ({settings.taxRate}%)</span></div><div className="form-actions"><button className="dashboard-secondary-button" disabled={!cart.length} onClick={sendCartReceipt}>WhatsApp receipt</button><button className="dashboard-secondary-button" disabled={!cart.length} onClick={() => printReceipt(cart.map(line => { const item = data.inventory.find(product => product.id === line.productId)!; return { id: crypto.randomUUID(), type: item.category, productId: item.id, amount: item.price * line.quantity, quantity: line.quantity, note: item.name, occurredAt: new Date().toISOString() }; }))}>Print / Save PDF</button><button className="dashboard-primary-button" disabled={!cart.length || saving} onClick={checkoutCart}>Complete sale</button></div></section><section className="dashboard-panel"><PanelHeading title="Last receipt" subtitle="Reprint the most recently completed sale" /><div className="sale-summary"><strong>{formatMoney(receiptSales.reduce((sum, sale) => sum + sale.amount, 0))}</strong><span>{receiptSales.length ? `${receiptSales.length} items recorded` : "No completed sale this session"}</span></div><button className="dashboard-secondary-button" disabled={!receiptSales.length} onClick={() => printReceipt(receiptSales)}>Print last receipt</button></section></div>}

        {tab === "Customer Reviews" && <AdminReviews />}

        {tab === "Reports & Analytics" && <div className="dashboard-view"><div className="metric-grid"><Metric icon={TrendingUp} label="Revenue this month" value={formatMoney(totals.monthRevenue)} sub="Product and completed service sales" tone="purple" /><Metric icon={CircleDollarSign} label="Recorded profit" value={formatMoney(totals.monthProfit)} sub="Known margins less tracked expenses" tone="green" /><Metric icon={TrendingDown} label="Expenses this month" value={formatMoney(totals.monthlyExpenses)} sub="Recorded operating costs" tone="orange" /><Metric icon={Activity} label="Sales transactions" value={data.sales.filter(sale => isThisMonth(sale.occurredAt)).length.toLocaleString("en-IN")} sub="Recorded this month" tone="blue" /></div><div className="dashboard-chart-grid"><article className="dashboard-panel revenue-panel"><PanelHeading title="Revenue trend" subtitle="Recorded revenue · past 7 days" /><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}><defs><linearGradient id="reportFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6d28d9" stopOpacity={.2} /><stop offset="100%" stopColor="#6d28d9" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#eeeaf2" strokeDasharray="4 5" vertical={false} /><XAxis dataKey="day" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} tickFormatter={(value: number) => `₹${value}`} /><Tooltip formatter={(value) => [formatMoney(Number(value)), "Revenue"]} /><Area type="monotone" dataKey="revenue" stroke="#6d28d9" strokeWidth={2.5} fill="url(#reportFill)" /></AreaChart></ResponsiveContainer></div></article><article className="dashboard-panel"><PanelHeading title="Top products" subtitle="Units sold this month" /><div className="top-products-list">{topProducts.map((item, index) => <div key={item.name}><span className="top-product-rank">{String(index + 1).padStart(2, "0")}</span><strong>{item.name}</strong><span>{item.quantity} sold</span></div>)}{topProducts.length === 0 && <div className="dashboard-empty-inline">Product sales appear after inventory sales are recorded.</div>}</div></article></div><section className="dashboard-panel full-panel"><PanelHeading title="Revenue by category" subtitle="Sales totals from recorded transactions" /><div className="service-earnings">{[...new Set(data.sales.map(sale => sale.type))].map((type, index) => { const sales = data.sales.filter(sale => sale.type === type); const amount = sales.reduce((sum, sale) => sum + sale.amount, 0); const profit = sales.filter(sale => sale.profit !== undefined).reduce((sum, sale) => sum + (sale.profit ?? 0), 0); return <div key={type}><span className="earnings-color" style={{ background: chartColors[index % chartColors.length] }} /><span>{type}</span><strong>{formatMoney(amount)}</strong><small>Known profit {formatMoney(profit)}</small></div>; })}{data.sales.length === 0 && <div className="dashboard-empty-inline">Sales by category will appear when transactions are recorded.</div>}</div></section></div>}

        {tab === "Quick Rate Calculator" && <div className="dashboard-view"><AdminCounterRates inventory={data.inventory} /><AdminRateCalculator inventory={data.inventory} /></div>}

        {["Inventory", "Products", "Milk & Dairy", "School Supplies", "Low Stock Alerts"].includes(tab) && <section className="dashboard-panel full-panel"><PanelHeading title={tab === "Low Stock Alerts" ? "Low stock alerts" : tab === "Milk & Dairy" ? "Milk & dairy inventory" : tab === "School Supplies" ? "School & office inventory" : "Product inventory"} subtitle={`${filteredProducts.length} products · ${totals.totalItems} units available`} action="Export CSV" onAction={exportCsv} /><div className="table-toolbar"><label className="dashboard-search"><Search size={16} /><input placeholder="Search products..." value={query} onChange={(event) => setQuery(event.target.value)} /></label><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option>All categories</option>{[...new Set(data.inventory.map((item) => item.category))].map((category) => <option key={category}>{category}</option>)}</select><button className="dashboard-primary-button" onClick={startAddProduct}><PackagePlus size={15} /> Add product</button></div>
          {showProductForm && <form className="record-form product-record-form" onSubmit={saveProduct}><div className="record-form-heading"><div><strong>{editingProduct ? "Edit product" : "Add a product"}</strong><small>Product details and current stock</small></div><button type="button" className="icon-action" onClick={resetProductForm} aria-label="Close form"><X size={17} /></button></div>
            <div className="form-grid"><label>Product name<input {...productForm.register("name")} placeholder="e.g. Ruled notebook" />{productForm.formState.errors.name && <small className="field-error">{productForm.formState.errors.name.message}</small>}</label><label>Category<input list="inventory-categories" {...productForm.register("category")} placeholder="e.g. Stationery" />{productForm.formState.errors.category && <small className="field-error">{productForm.formState.errors.category.message}</small>}<datalist id="inventory-categories">{["School Supplies", "Office Supplies", "Note Books", "Milk & Dairy", "Cool Drinks", "Gift Items", "Print & Xerox", "Money Transfer"].map(category => <option key={category} value={category}/>)}</datalist></label><label>Brand<input {...productForm.register("brand")} placeholder="Brand name" /></label><label>Buying price (₹)<input type="number" step="0.01" min="0" {...productForm.register("costPrice")} /></label><label>Selling price (₹)<input type="number" step="0.01" min="0" {...productForm.register("price")} /></label><label>Quantity in stock<input type="number" min="0" step="1" {...productForm.register("stock")} /></label><label>Reorder alert at<input type="number" min="0" step="1" {...productForm.register("reorderLevel")} /></label><label>Stock unit<input {...productForm.register("unit")} placeholder="piece, pack, litre" /></label><label>Status<select {...productForm.register("status")}><option>Active</option><option>Inactive</option></select></label><label>Expiry date (dairy)<input type="date" {...productForm.register("expiryDate")} /></label><label className="form-checkbox"><input type="checkbox" {...productForm.register("featured")} /> Featured product</label><label className="form-span-all">Description<textarea rows={2} {...productForm.register("description")} placeholder="Product details"/></label><label className="upload-field">Product image<input ref={imageInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 900_000) { setError("Choose an image smaller than 900 KB."); event.target.value = ""; return; } const reader = new FileReader(); reader.onload = () => setImageData(String(reader.result)); reader.onerror = () => setError("Could not read the selected image."); reader.readAsDataURL(file); }} />{imageData && <span>Image selected</span>}</label></div><div className="form-actions"><button className="dashboard-secondary-button" type="button" onClick={resetProductForm}>Cancel</button><button className="dashboard-primary-button" type="submit" disabled={saving}>{saving ? "Saving…" : editingProduct ? "Save changes" : "Add product"}</button></div></form>}
          {selectedProductIds.length > 0 && <div className="bulk-toolbar"><strong>{selectedProductIds.length} selected</strong><label>Adjust stock<input aria-label="Stock adjustment" type="number" step="1" value={bulkStockDelta} onChange={event => setBulkStockDelta(Number(event.target.value))}/></label><select aria-label="Bulk product status" value={bulkStatus} onChange={event => setBulkStatus(event.target.value as "Active" | "Inactive")}><option>Active</option><option>Inactive</option></select><button className="dashboard-primary-button" disabled={saving} onClick={applyBulkUpdate}>Apply bulk update</button><button className="dashboard-secondary-button" onClick={() => setSelectedProductIds([])}>Clear</button></div>}
          <div className="table-scroll"><table className="owner-table"><thead><tr><th><input type="checkbox" aria-label="Select all filtered products" checked={filteredProducts.length > 0 && filteredProducts.every(item => selectedProductIds.includes(item.id))} onChange={event => setSelectedProductIds(event.target.checked ? [...new Set([...selectedProductIds, ...filteredProducts.map(item => item.id)])] : selectedProductIds.filter(id => !filteredProducts.some(item => item.id === id)))}/></th><th>PRODUCT</th><th>CATEGORY</th><th>STOCK</th><th>BUYING PRICE</th><th>SELLING PRICE</th><th>MARGIN</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{filteredProducts.map((item) => <tr key={item.id}><td><input type="checkbox" aria-label={`Select ${item.name}`} checked={selectedProductIds.includes(item.id)} onChange={event => setSelectedProductIds(event.target.checked ? [...selectedProductIds, item.id] : selectedProductIds.filter(id => id !== item.id))}/></td><td><div className="product-cell">{item.image ? <img src={item.image} alt="" /> : <span className="table-product-placeholder"><BookOpen size={16} /></span>}<span><strong>{item.name}{item.featured && " ★"}</strong><small>{item.brand || item.unit}</small></span></div></td><td>{item.category}</td><td><strong>{item.stock}</strong> {item.unit}<small className="table-subtext">Reorder at {item.reorderLevel}</small></td><td>{formatMoney(item.costPrice ?? 0)}</td><td>{formatMoney(item.price)}</td><td>{formatMoney(item.price - (item.costPrice ?? 0))}</td><td><span className={`inventory-status ${item.status === "Inactive" ? "status-out" : item.stock === 0 ? "status-out" : item.stock <= item.reorderLevel ? "status-low" : "status-good"}`}><i />{item.status === "Inactive" ? "Inactive" : item.stock === 0 ? "Out of stock" : item.stock <= item.reorderLevel ? "Low stock" : "In stock"}</span></td><td><button className="table-action" onClick={() => editProduct(item)}>Edit</button><button className="table-action table-delete" onClick={() => removeProduct(item.id)}>Delete</button></td></tr>)}{filteredProducts.length === 0 && <tr><td colSpan={9} className="table-empty">{data.inventory.length ? "No products match your search." : "No inventory yet. Add your first product to begin."}</td></tr>}</tbody></table></div>
        </section>}

        {tab === "Sales" && <div className="recording-grid"><section className="dashboard-panel"><PanelHeading title="Record a sale" subtitle="Select any active product to record a sale and deduct stock" /><form className="record-form" onSubmit={recordSale}><label>Product<select required value={saleProductId} onChange={event => { setSaleProductId(event.target.value); const item = data.inventory.find(product => product.id === event.target.value); if (item) setSaleAmount(String(item.price * saleQuantity)); }}><option value="">Choose a product</option>{availableProducts.map(item => <option key={item.id} value={item.id}>{item.name} · {item.stock} in stock</option>)}</select></label><label>Quantity<input type="number" min="1" max={data.inventory.find(item => item.id === saleProductId)?.stock || 1} step="1" value={saleQuantity} onChange={event => { const quantity = Number(event.target.value); setSaleQuantity(quantity); const item = data.inventory.find(product => product.id === saleProductId); if (item) setSaleAmount(String(item.price * quantity)); }} /></label><label>Customer name (optional)<input value={saleCustomer} onChange={event => setSaleCustomer(event.target.value)} /></label><label>Total amount (₹)<input type="number" min="0.01" step="0.01" value={saleAmount} onChange={event => setSaleAmount(event.target.value)} required /></label><button className="dashboard-primary-button" disabled={saving || !saleProductId}><Check size={15} /> Record sale</button></form>{receiptSales.length > 0 && <button className="dashboard-secondary-button" onClick={() => printReceipt(receiptSales)}>Print last receipt</button>}</section>
          <section className="dashboard-panel"><PanelHeading title="Today’s sales" subtitle="Recorded transactions for today" /><div className="sale-summary"><strong>{formatMoney(totals.todayRevenue)}</strong><span>{totals.dailySales.length} transactions · Today</span></div><div className="activity-list">{totals.dailySales.slice(0, 8).map((sale) => <div key={sale.id}><span className="activity-icon"><CircleDollarSign size={15} /></span><span><strong>{sale.note || sale.type}</strong><small>{new Date(sale.occurredAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</small></span><b>{formatMoney(sale.amount)}</b></div>)}{totals.dailySales.length === 0 && <div className="dashboard-empty-inline">Record a sale to start today’s report.</div>}</div></section>
          <section className="dashboard-panel full-span"><PanelHeading title="Xerox & service counter" subtitle="Capture print, finishing and local-service earnings" /><form className="service-record-form" onSubmit={recordService}><label>Service<select value={serviceType} onChange={(event) => setServiceType(event.target.value)}><option>B/W Xerox</option><option>Color Xerox</option><option>Printouts</option><option>Lamination</option><option>Spiral binding</option><option>Scanning</option><option>Mobile recharge</option><option>DTH recharge</option><option>Utility bill payment</option><option>AEPS service</option></select></label><label>Collected amount (₹)<input type="number" min="0.01" step="0.01" required value={serviceAmount} onChange={(event) => setServiceAmount(event.target.value)} placeholder="Enter amount" /></label><button className="dashboard-primary-button"><Printer size={15} /> Record service</button></form></section>
          <section className="dashboard-panel full-span"><PanelHeading title="Shop expenses" subtitle={`${data.expenses.filter(item => isThisMonth(item.occurredAt)).length} expenses recorded this month`} action={expenseFormOpen ? "Close form" : "Add expense"} onAction={() => setExpenseFormOpen(!expenseFormOpen)} />{expenseFormOpen && <form className="form-grid expense-form" onSubmit={recordExpense}><label>Description<input value={expenseDescription} onChange={event => setExpenseDescription(event.target.value)} required /></label><label>Category<select value={expenseCategory} onChange={event => setExpenseCategory(event.target.value)}><option>Supplies</option><option>Utilities</option><option>Rent</option><option>Transport</option><option>Other</option></select></label><label>Amount (₹)<input type="number" min="0.01" step="0.01" value={expenseAmount} onChange={event => setExpenseAmount(event.target.value)} required /></label><button className="dashboard-primary-button" disabled={saving}>Record expense</button></form>}<div className="report-total"><span>Expenses today</span><strong>{formatMoney(data.expenses.filter(item => isToday(item.occurredAt)).reduce((sum, item) => sum + item.amount, 0))}</strong><span>Expenses this month</span><strong>{formatMoney(totals.monthlyExpenses)}</strong></div><div className="activity-list">{data.expenses.slice(0, 5).map(item => <div key={item.id}><span className="activity-icon"><TrendingDown size={15} /></span><span><strong>{item.description}</strong><small>{item.category} · {new Date(item.occurredAt).toLocaleDateString("en-IN")}</small></span><b>{formatMoney(item.amount)}</b></div>)}</div></section>
          <section className="dashboard-panel full-span"><PanelHeading title="Daily report" subtitle="Export a spreadsheet or print this page as a PDF" action="Export CSV" onAction={() => { const rows = [["Date", "Type", "Description", "Amount", "Cost", "Profit"], ...data.sales.filter(sale => isToday(sale.occurredAt)).map(sale => [sale.occurredAt, sale.type, sale.note, sale.amount, sale.costAmount ?? "", sale.profit ?? ""]), ...data.expenses.filter(item => isToday(item.occurredAt)).map(item => [item.occurredAt, "Expense: " + item.category, item.description, -item.amount, "", ""])]; const blob = new Blob([rows.map(row => row.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "harm-daily-report.csv"; link.click(); URL.revokeObjectURL(url); }} /><div className="report-total"><span>Today’s recorded sales</span><strong>{formatMoney(totals.todayRevenue)}</strong><button className="dashboard-secondary-button" onClick={() => window.print()}><FileText size={15} /> Print / Save PDF</button></div></section>
        </div>}

        {tab === "Money Transfer" && <section className="dashboard-panel full-panel"><PanelHeading title="Money transfer records" subtitle={`${data.transfers.length} recorded transactions`} action={transferFormOpen ? "Close form" : "New transfer"} onAction={() => setTransferFormOpen(!transferFormOpen)} />
          <div className="metric-grid"><Metric icon={CircleDollarSign} label="Today's commission" value={formatMoney(totals.transferRevenue)} sub="Completed transfers today" tone="green" /><Metric icon={TrendingUp} label="Monthly commission" value={formatMoney(data.transfers.filter(item => item.status === "Completed" && isThisMonth(item.occurredAt)).reduce((sum, item) => sum + item.serviceCharge, 0))} sub="Completed transfers this month" tone="purple" /><Metric icon={Activity} label="Total transactions" value={data.transfers.length.toLocaleString("en-IN")} sub={`${data.transfers.filter(item => item.status === "Completed").length} completed`} tone="blue" /></div>
          {transferFormOpen && <form className="record-form product-record-form" onSubmit={saveTransfer}><div className="form-grid"><label>Customer name<input {...transferForm.register("customerName")} />{transferForm.formState.errors.customerName && <small className="field-error">{transferForm.formState.errors.customerName.message}</small>}</label><label>Mobile number<input {...transferForm.register("mobileNumber")} />{transferForm.formState.errors.mobileNumber && <small className="field-error">{transferForm.formState.errors.mobileNumber.message}</small>}</label><label>Transfer amount (₹)<input type="number" min="0" step="0.01" {...transferForm.register("amount")} /></label><label>Transaction ID<input {...transferForm.register("transactionId")} />{transferForm.formState.errors.transactionId && <small className="field-error">{transferForm.formState.errors.transactionId.message}</small>}</label><label>Service charge (₹)<input type="number" min="0" step="0.01" {...transferForm.register("serviceCharge")} /></label><label>Status<select {...transferForm.register("status")}><option>Completed</option><option>Pending</option><option>Failed</option></select></label></div><div className="form-actions"><button className="dashboard-primary-button" disabled={saving}>Save transfer record</button></div></form>}
          <div className="table-scroll"><table className="owner-table"><thead><tr><th>CUSTOMER</th><th>MOBILE</th><th>AMOUNT</th><th>CHARGE</th><th>TRANSACTION ID</th><th>STATUS</th><th>DATE</th></tr></thead><tbody>{data.transfers.map((item) => <tr key={item.id}><td><strong>{item.customerName}</strong></td><td>{item.mobileNumber}</td><td>{formatMoney(item.amount)}</td><td>{formatMoney(item.serviceCharge)}</td><td>{item.transactionId}</td><td><span className={`inventory-status ${item.status === "Completed" ? "status-good" : item.status === "Pending" ? "status-low" : "status-out"}`}><i />{item.status}</span></td><td>{new Date(item.occurredAt).toLocaleDateString("en-IN")}</td></tr>)}{data.transfers.length === 0 && <tr><td colSpan={7} className="table-empty">No transfers recorded yet.</td></tr>}</tbody></table></div>
          <p className="privacy-note"><ShieldCheck size={15} /> Transfer records contain customer details. Keep owner access private and follow applicable privacy and financial-service rules.</p>
        </section>}

        {tab === "Xerox & Printing" && <div className="recording-grid"><section className="dashboard-panel"><PanelHeading title="Counter entry" subtitle="Service rates are editable in Settings" /><form className="record-form" onSubmit={recordService}><label>Service<select value={serviceType} onChange={event => { setServiceType(event.target.value); setServiceAmount(String((settings.serviceRates[event.target.value] ?? 0) * serviceQuantity)); }}><option>B/W Xerox</option><option>Color Xerox</option><option>Printouts</option><option>Lamination</option><option>Spiral binding</option><option>Scanning</option><option>Mobile recharge</option><option>DTH recharge</option><option>Utility bill payment</option><option>AEPS service</option></select></label><label>Quantity<input type="number" min="1" step="1" value={serviceQuantity} onChange={event => { const quantity = Number(event.target.value); setServiceQuantity(quantity); setServiceAmount(String((settings.serviceRates[serviceType] ?? 0) * quantity)); }} /></label><label>Collected amount (₹)<input type="number" min="0.01" step="0.01" required value={serviceAmount} onChange={event => setServiceAmount(event.target.value)} placeholder="Calculated from rate" /></label><button className="dashboard-primary-button"><Printer size={15} /> Record service</button></form></section><section className="dashboard-panel"><PanelHeading title="Today at the counter" subtitle="Print and finishing services" /><div className="sale-summary"><strong>{formatMoney(totals.xeroxRevenue + totals.printingRevenue)}</strong><span>Recorded service revenue today</span></div><div className="activity-list">{totals.dailySales.filter(sale => sale.type in settings.serviceRates).map(sale => <div key={sale.id}><span className="activity-icon"><Printer size={15} /></span><span><strong>{sale.type}</strong><small>{new Date(sale.occurredAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} · {sale.quantity} units</small></span><b>{formatMoney(sale.amount)}</b></div>)}</div></section><section className="dashboard-panel full-span"><PanelHeading title="Configured service rates" subtitle="Update rates under Settings" /><div className="counter-service-grid">{Object.entries(settings.serviceRates).map(([name, rate]) => <button key={name} onClick={() => { setServiceType(name); setServiceAmount(String(rate * serviceQuantity)); }}><strong>{name}</strong><span>{formatMoney(rate)} / unit</span></button>)}</div></section></div>}

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

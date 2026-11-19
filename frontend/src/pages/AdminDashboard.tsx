import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle, Banknote, BarChart3, Boxes, Calculator, CalendarCheck, ClipboardList, FolderTree, LayoutDashboard, LogOut, Menu, Milk,
  Package, Printer, Receipt, School, Settings, ShoppingCart, Sparkles, Star, Store, Truck, Users,
} from "lucide-react";

import { CategoriesSection, InventorySection, ProductsSection } from "@/components/admin/CatalogSections";
import DashboardHome, { useOverview } from "@/components/admin/DashboardHome";
import PosSection from "@/components/admin/PosSection";
import RateCalculator from "@/components/admin/RateCalculator";
import MilkSection from "@/components/admin/MilkSection";
import { BEVERAGE_SUBS } from "@/lib/constants";
import { BannersSection, CustomersSection } from "@/components/admin/GrowthSections";
import RevenuePanel from "@/components/admin/RevenuePanel";
import { ReportsSection, ReviewsSection, SettingsSection } from "@/components/admin/ReportsSettings";
import { KitsEditor, MoneySection, PurchasesSection, XeroxSection } from "@/components/admin/ServiceSections";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ApiError, apiGet } from "@/lib/api";
import { endSession } from "@/lib/session";
import type { OwnerInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "categories", label: "Categories", icon: FolderTree },
  { id: "inventory", label: "Inventory", icon: Boxes },
  { id: "low-stock", label: "Low Stock Alerts", icon: AlertTriangle },
  { id: "purchases", label: "Purchases", icon: Truck },
  { id: "sales", label: "Sales", icon: ShoppingCart },
  { id: "pos", label: "Billing & POS", icon: Receipt },
  { id: "dairy", label: "Milk, Dairy & Drinks", icon: Milk },
  { id: "milk-subs", label: "Milk Subscriptions", icon: CalendarCheck },
  { id: "school", label: "School Supplies", icon: School },
  { id: "xerox", label: "Xerox & Printing", icon: Printer },
  { id: "rate-calculator", label: "Rate Calculator", icon: Calculator },
  { id: "money", label: "Money Transfer", icon: Banknote },
  { id: "customers", label: "Loyalty Customers", icon: Users },
  { id: "banners", label: "Festival Banners", icon: Sparkles },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "reports", label: "Reports & Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

function SidebarNav({ active, alerts, onPick }: { active: string; alerts: number; onPick: (id: string) => void }) {
  return (
    <nav className="space-y-1 px-3">
      {NAV.map((n) => (
        <button key={n.id} type="button" onClick={() => onPick(n.id)} data-testid={`sidebar-${n.id}`}
          className={cn("flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-semibold transition-colors", active === n.id ? "bg-[#6D28D9] text-white shadow-md" : "text-slate-700 hover:bg-violet-50 hover:text-[#6D28D9]")}>
          <n.icon className="size-5 shrink-0" />
          <span className="flex-1 text-left">{n.label}</span>
          {n.id === "low-stock" && alerts > 0 ? <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white" data-testid="sidebar-low-stock-badge">{alerts}</span> : null}
        </button>
      ))}
    </nav>
  );
}

export default function AdminDashboard() {
  const { section = "dashboard" } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const [mobileNav, setMobileNav] = useState(false);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const me = useQuery({ queryKey: ["auth-me"], queryFn: () => apiGet<OwnerInfo>("/auth/me"), retry: false });
  const { data: o } = useOverview();

  if (me.isError && me.error instanceof ApiError && me.error.status === 401) return <Navigate to="/admin/login" replace />;
  const alerts = (o?.low_stock_count ?? 0) + (o?.out_of_stock_count ?? 0);
  const current = NAV.find((n) => n.id === section) ?? NAV[0];
  const pick = (id: string) => { setMobileNav(false); setCatFilter(null); navigate(`/admin/${id}`); };

  const body = (() => {
    switch (current.id) {
      case "products": return <ProductsSection categories={catFilter ? [catFilter] : undefined} title={catFilter ?? undefined} />;
      case "categories": return <CategoriesSection onOpen={(c) => { navigate("/admin/products"); setCatFilter(c); }} />;
      case "inventory": return <InventorySection />;
      case "low-stock": return <InventorySection onlyAlerts />;
      case "sales": return <RevenuePanel />;
      case "pos": return <PosSection />;
      case "dairy": return <ProductsSection match={(p) => p.category === "Milk & Dairy" || (p.category === "Daily Needs" && BEVERAGE_SUBS.includes(p.subcategory))} title="Milk, Dairy & Drinks" />;
      case "milk-subs": return <MilkSection />;
      case "school": return <div className="space-y-8"><ProductsSection categories={["Stationery", "Note Books"]} title="School Supplies" /><KitsEditor /></div>;
      case "xerox": return <XeroxSection />;
      case "rate-calculator": return <RateCalculator />;
      case "purchases": return <PurchasesSection />;
      case "money": return <MoneySection />;
      case "customers": return <CustomersSection />;
      case "banners": return <BannersSection />;
      case "reviews": return <ReviewsSection />;
      case "reports": return <ReportsSection />;
      case "settings": return <SettingsSection />;
      default: return <DashboardHome onNavigate={pick} />;
    }
  })();

  const brand = (
    <div className="flex items-center gap-3 px-6 py-5">
      <img src="/brand/harm-daily-needs-mark.svg" alt="" className="size-11 shrink-0" />
      <div className="leading-tight"><p className="font-extrabold text-[#111827]">H.A.R.M DAILY NEEDS</p><p className="text-xs font-semibold uppercase tracking-wider text-[#6D28D9]">Owner Admin</p></div>
    </div>
  );

  return (
    <div className="min-h-svh bg-[#F8FAFC] font-['Inter_Variable',sans-serif] text-[#111827]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[280px] flex-col overflow-y-auto border-r border-slate-200 bg-white lg:flex">
        {brand}
        <SidebarNav active={current.id} alerts={alerts} onPick={pick} />
        <div className="mt-auto space-y-1 border-t p-3">
          <Link to="/" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-semibold text-slate-600 hover:bg-slate-100" data-testid="admin-view-store-link"><Store className="size-5" /> View Store</Link>
          <button type="button" onClick={() => endSession("/admin/login")} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-semibold text-red-600 hover:bg-red-50" data-testid="admin-logout-button"><LogOut className="size-5" /> Logout</button>
        </div>
      </aside>

      <Sheet open={mobileNav} onOpenChange={setMobileNav}>
        <SheetContent side="left" className="w-[280px] overflow-y-auto p-0">
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          {brand}
          <SidebarNav active={current.id} alerts={alerts} onPick={pick} />
          <button type="button" onClick={() => endSession("/admin/login")} className="m-3 flex items-center gap-3 rounded-xl px-3.5 py-2.5 font-semibold text-red-600" data-testid="admin-mobile-logout-button"><LogOut className="size-5" /> Logout</button>
        </SheetContent>
      </Sheet>

      <div className="lg:pl-[280px]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <button type="button" className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={() => setMobileNav(true)} aria-label="Open menu" data-testid="admin-mobile-menu-button"><Menu className="size-5" /></button>
          <current.icon className="hidden size-6 text-[#6D28D9] sm:block" />
          <h1 className="text-xl font-extrabold sm:text-2xl" data-testid="admin-section-title">{current.label}</h1>
          <div className="ml-auto flex items-center gap-3">
            {alerts ? <button type="button" onClick={() => pick("low-stock")} className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-sm font-bold text-red-700" data-testid="header-alerts-button"><AlertTriangle className="size-4" /> {alerts}</button> : null}
            <button type="button" onClick={() => pick("pos")} className="hidden items-center gap-1.5 rounded-xl bg-[#6D28D9] px-4 py-2 text-sm font-bold text-white hover:bg-[#5B21B6] sm:flex" data-testid="header-new-bill-button"><ClipboardList className="size-4" /> New Bill</button>
            <span className="hidden text-sm font-semibold text-slate-500 md:inline" data-testid="admin-username">{me.data?.username}</span>
          </div>
        </header>
        <main className="p-4 sm:p-6">{body}</main>
      </div>
    </div>
  );
}

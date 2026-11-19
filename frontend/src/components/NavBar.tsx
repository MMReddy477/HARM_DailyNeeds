import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Baby,
  BookOpen,
  BriefcaseBusiness,
  Cake,
  ChevronDown,
  Gift,
  GraduationCap,
  House,
  Lock,
  MapPin,
  Menu,
  Milk,
  NotebookPen,
  PartyPopper,
  Phone,
  ShoppingBasket,
  Sparkles,
  Store,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MEGA_MENUS, STORE, type MegaGroup } from "@/lib/constants";
import { cn } from "@/lib/utils";

const IMAGE_BASE =
  "https://static.prod-images.emergentagent.com/jobs/a22da722-1531-450f-80dd-4e90a44395d3/images";
const GIFT_IMAGES = [
  "c7e98b234265f0cdb5d6f51ee2a3f78725bf0562662ff0c8d42be152373c79fa",
  "45de0954baa8528aa8d277af9273b11e9251812bb785a8263a67b2dc09dce7fd",
  "54f67b8289f419b87149dee98b3f041bc6a84f904a9038c0ed6f79b15a50a73e",
  "2571a4000bd4f4e9877b7d64888631339aa64c6df38dbc30fcc68da1a29e5e73",
];
const GIFT_CATEGORY_ICONS = [Cake, GraduationCap, Gift, Baby, House, Sparkles, PartyPopper, BriefcaseBusiness];
const NAV_ICONS = {
  stationery: Store,
  notebooks: NotebookPen,
  "office-supplies": BriefcaseBusiness,
  gifts: Gift,
  "/school-kits": BookOpen,
  "/dairy-drinks": Milk,
  "/c/daily-needs": ShoppingBasket,
  "/location": MapPin,
};

function MegaPanel({ group }: { group: MegaGroup }) {
  if (group.slug === "gifts") {
    return (
      <div className="absolute inset-x-0 top-full hidden border-b border-purple-100 bg-white/98 shadow-xl backdrop-blur-xl lg:block" data-testid="mega-menu-gifts">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">Thoughtful picks for every occasion</p>
              <h2 className="mt-1 font-heading text-lg font-extrabold text-purple-950">Shop Gift Items</h2>
            </div>
            <Link to="/c/gifts" className="text-sm font-bold text-purple-700 hover:text-amber-600" data-testid="gift-menu-view-all">View all gifts →</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {group.columns.map((col, index) => {
              const Icon = GIFT_CATEGORY_ICONS[index];
              return (
                <div key={col.heading} className="rounded-xl border border-purple-100 bg-white p-3 transition-colors hover:border-amber-300" data-testid={`gift-mega-category-${index}`}>
                  <Link to={`/c/gifts?sub=${encodeURIComponent(col.sub)}`} className="flex items-center gap-2 font-heading text-sm font-extrabold text-purple-800 transition-colors hover:text-amber-600">
                    <Icon className="size-[22px] shrink-0 fill-purple-100 stroke-current" strokeWidth={2} aria-hidden="true" />
                    {col.heading}
                  </Link>
                  <div className="mt-2 flex gap-1.5">
                    {[0, 1, 2].map((imageOffset) => {
                      const image = GIFT_IMAGES[(index + imageOffset) % GIFT_IMAGES.length];
                      return <img key={imageOffset} src={`${IMAGE_BASE}/${image}.jpeg`} alt="" loading="lazy" className="size-10 rounded-lg border border-purple-100 bg-purple-50 object-cover" />;
                    })}
                  </div>
                  <ul className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1">
                    {col.items.map((item) => (
                      <li key={item}>
                        <Link to={`/c/gifts?sub=${encodeURIComponent(col.sub)}`} className="text-[11px] leading-4 text-slate-600 transition-colors hover:text-purple-700">{item}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="absolute inset-x-0 top-full hidden border-b border-purple-100 bg-white/98 shadow-xl backdrop-blur-xl lg:block" data-testid={`mega-menu-${group.slug}`}>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-7 lg:grid-cols-3 xl:grid-cols-6">
        {group.columns.map((col) => (
          <div key={col.heading}>
            <Link
              to={`/c/${group.slug}?sub=${encodeURIComponent(col.sub)}`}
              data-testid={`mega-heading-${group.slug}-${col.sub}`}
              className="font-heading text-[13px] font-extrabold uppercase tracking-wider text-purple-900 hover:text-purple-600"
            >
              {col.heading}
            </Link>
            <ul className="mt-2.5 space-y-1.5">
              {col.items.map((item) => (
                <li key={item}>
                  <Link
                    to={`/c/${group.slug}?sub=${encodeURIComponent(col.sub)}`}
                    className="text-[13px] text-slate-600 transition-colors hover:text-purple-700"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-1">
              {col.brands.map((b) => (
                <span key={b} className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                  {b}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NavBar() {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpenGroup(null);
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  const plainLinks = [
    { to: "/school-kits", label: "School Kits" },
    { to: "/dairy-drinks", label: "Dairy & Drinks" },
    { to: "/c/daily-needs", label: "Daily Needs" },
    { to: "/location", label: "Location" },
  ];

  return (
    <header
      className="sticky top-0 z-40 border-b border-purple-100 bg-white/95 backdrop-blur-xl"
      onMouseLeave={() => setOpenGroup(null)}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <Link to="/" data-testid="nav-logo-link" className="flex shrink-0 items-center gap-2.5">
          <img src="/brand/harm-daily-needs-mark.svg" alt="" className="size-10 shrink-0" />
          <span className="leading-tight">
            <span className="block font-heading text-[15px] font-extrabold tracking-tight text-purple-950">
              H.A.R.M DAILY NEEDS
            </span>
            <span className="hidden text-[10px] font-medium uppercase tracking-wider text-purple-600 sm:block xl:max-w-none lg:max-w-[190px]">
              Trusted by Families, Students &amp; Offices Since Day One
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-0.5 xl:flex">
          <Link to="/" data-testid="nav-link-home" className="flex items-center gap-1 whitespace-nowrap rounded-lg px-1.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:text-purple-700">
            <House className="size-4 text-purple-700" aria-hidden="true" /> Home
          </Link>
          {MEGA_MENUS.map((group) => (
            <div key={group.slug} className="relative" onMouseEnter={() => setOpenGroup(group.slug)}>
              <Link
                to={`/c/${group.slug}`}
                data-testid={`nav-mega-${group.slug}`}
                className={cn(
                  "flex items-center gap-1 whitespace-nowrap rounded-lg px-1.5 py-2 text-xs font-semibold transition-colors",
                  openGroup === group.slug ? "bg-purple-50 text-purple-800" : "text-slate-700 hover:text-purple-700"
                )}
              >
                {(() => {
                  const Icon = NAV_ICONS[group.slug as keyof typeof NAV_ICONS];
                  return <Icon className={cn("size-4 transition-colors", openGroup === group.slug ? "text-amber-500" : "text-purple-700")} aria-hidden="true" />;
                })()}
                {group.label}
                <ChevronDown className={cn("size-3.5 transition-transform duration-200", openGroup === group.slug && "rotate-180")} />
              </Link>
            </div>
          ))}
          {plainLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              data-testid={`nav-link-${l.to.replace(/\//g, "").replace(/-/g, "-") || "home"}`}
              className="flex items-center gap-1 whitespace-nowrap rounded-lg px-1.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:text-purple-700"
            >
              {(() => {
                const Icon = NAV_ICONS[l.to as keyof typeof NAV_ICONS];
                return <Icon className="size-4 text-purple-700 transition-colors group-hover:text-amber-500" aria-hidden="true" />;
              })()}
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 xl:ml-2">
          <a
            href={STORE.phoneTel}
            data-testid="nav-call-button"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 border-purple-200 text-purple-800")}
          >
            <Phone className="size-4" />
            <span className="hidden 2xl:inline">{STORE.phoneDisplay}</span>
            <span className="2xl:hidden">Call</span>
          </a>
          <Link
            to="/admin/login"
            data-testid="owner-login-button"
            title="Owner Login"
            className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-purple-400 hover:text-purple-800")}
          >
            <Lock className="size-4" />
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            data-testid="nav-mobile-menu-button"
            aria-label="Open menu"
            className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }), "xl:hidden")}
          >
            <Menu className="size-4" />
          </button>
        </div>
      </div>

      {openGroup ? <MegaPanel group={MEGA_MENUS.find((g) => g.slug === openGroup)!} /> : null}

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="w-80 overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-heading text-purple-950">H.A.R.M DAILY NEEDS</SheetTitle>
          </SheetHeader>
          <div className="space-y-5 px-4 pb-8">
            <Link to="/" data-testid="mobile-nav-link-home" className="flex items-center gap-2 rounded-md bg-purple-50 px-2 py-2 text-sm font-semibold text-purple-800">
              <House className="size-4 text-purple-700" aria-hidden="true" /> Home
            </Link>
            {MEGA_MENUS.map((group) => (
              <div key={group.slug}>
                <Link to={`/c/${group.slug}`} className="font-heading text-xs font-bold uppercase tracking-wider text-purple-600">{group.label}</Link>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  <Link to={`/c/${group.slug}`} data-testid={`mobile-nav-${group.slug}`} className="rounded-md bg-purple-50 px-2 py-1.5 text-[13px] font-semibold text-purple-800">
                    View All
                  </Link>
                  {group.columns.slice(0, group.slug === "gifts" ? 8 : 4).map((col) => (
                    <Link
                      key={col.sub}
                      to={`/c/${group.slug}?sub=${encodeURIComponent(col.sub)}`}
                      data-testid={`mobile-nav-${group.slug}-${col.sub}`}
                      className="rounded-md px-2 py-1.5 text-[13px] text-slate-600"
                    >
                      {col.sub}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <div>
              <p className="font-heading text-xs font-bold uppercase tracking-wider text-purple-600">More</p>
              <div className="mt-2 space-y-1">
                {plainLinks.map((l) => (
                  <Link key={l.to} to={l.to} data-testid={`mobile-nav-link-${l.to.replace(/\//g, "")}`} className="block rounded-md px-2 py-1.5 text-sm font-semibold text-slate-700">
                    {l.label}
                  </Link>
                ))}
                <Link to="/reviews" data-testid="mobile-nav-link-reviews" className="block rounded-md px-2 py-1.5 text-sm font-semibold text-slate-700">
                  Reviews
                </Link>
              </div>
            </div>
            <a
              href={STORE.phoneTel}
              className={cn(buttonVariants(), "w-full gap-2")}
              data-testid="mobile-nav-call-button"
            >
              <Phone className="size-4" /> Call {STORE.phoneDisplay}
            </a>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}

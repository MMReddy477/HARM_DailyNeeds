import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  Briefcase,
  Camera,
  Copy,
  FileText,
  Gift,
  Image as ImageIcon,
  Layers,
  NotebookPen,
  Palette,
  Printer,
  ScanLine,
  ShieldCheck,
  ShoppingBasket,
  Store,
  Clock,
  BadgeCheck,
  IndianRupee,
  Send,
  ShoppingBag,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Store facts (do NOT rebrand — logo, name, tagline and purple theme are fixed)
// ---------------------------------------------------------------------------
export const STORE = {
  name: "H.A.R.M DAILY NEEDS",
  tagline: "Trusted by Families, Students & Offices Since Day One",
  phoneDisplay: "+91 83747 78183",
  phoneTel: "tel:+918374778183",
  whatsappNumber: "918374778183",
  addressLines: [
    "2-2/30/201, My Abode The Sirius,",
    "Suryodhaya Colony, Bandlaguda Jagir,",
    "Hyderabad, Telangana – 500086",
  ],
  timings: "Open Daily 8:00 AM – 10:00 PM",
  mapsQuery: "My Abode The Sirius, Bandlaguda Jagir, Hyderabad, Telangana 500086",
  mapsEmbed:
    "https://www.google.com/maps?q=My%20Abode%20The%20Sirius%2C%20Bandlaguda%20Jagir%2C%20Hyderabad%2C%20Telangana%20500086&output=embed",
  mapsDirections:
    "https://www.google.com/maps/dir/?api=1&destination=My%20Abode%20The%20Sirius%2C%20Bandlaguda%20Jagir%2C%20Hyderabad%2C%20Telangana%20500086",
  mapsListing:
    "https://www.google.com/maps/search/H.A.R.M+DAILY+NEEDS+Bandlaguda+Jagir+Hyderabad",
};

export function whatsappLink(product?: string): string {
  const text = product
    ? `Hi ${STORE.name}! Is "${product}" available in store?`
    : `Hi ${STORE.name}! I have an inquiry.`;
  return `https://wa.me/${STORE.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

// ---------------------------------------------------------------------------
// Categories (slug -> meta). Product `category` values in Mongo must match `name`.
// ---------------------------------------------------------------------------
export interface CategoryMeta {
  slug: string;
  name: string;
  headline: string;
  blurb: string;
  image: string;
  subs: string[];
}

export const CATEGORIES: Record<string, CategoryMeta> = {
  stationery: {
    slug: "stationery",
    name: "Stationery",
    headline: "Stationery Store",
    blurb:
      "Pens, geometry sets, files, art supplies and papers from India's best brands — Cello, Reynolds, Apsara, Nataraj, DOMS, Camlin, Faber-Castell, Kangaro and more.",
    image:
      "https://images.unsplash.com/photo-1501618669935-18b6ecb13d6d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    subs: ["Pens & Writing", "Geometry", "Files & Folders", "Art & Craft", "Office Accessories", "Papers & Labels"],
  },
  notebooks: {
    slug: "notebooks",
    name: "Note Books",
    headline: "Note Books Hub",
    blurb:
      "Long books, school notes, practical records, graph books, drawing books and spiral binding — every size, every rule, every brand your school asks for.",
    image:
      "https://images.unsplash.com/photo-1603188389888-7b80bd0a7e3e?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    subs: ["Long Books", "School Notes", "Records", "Graph Books", "Drawing Books", "Spiral Binding"],
  },
  "office-supplies": {
    slug: "office-supplies",
    name: "Office Supplies",
    headline: "Office & Business Supplies",
    blurb:
      "Attendance registers, ledger and cash books, invoice and receipt books, files, desk organizers and Casio calculators for shops and offices.",
    image:
      "https://images.unsplash.com/photo-1625225233840-695456021cde?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    subs: ["Registers", "Ledgers", "Cash Books", "Invoice Books", "Office Files", "Calculators"],
  },
  "daily-needs": {
    slug: "daily-needs",
    name: "Daily Needs",
    headline: "Daily Needs Store",
    blurb:
      "Chocolates, biscuits, snacks, soft drinks, water, batteries, USB drives, earphones and mobile accessories — grab everyday essentials on the go.",
    image:
      "https://images.pexels.com/photos/17065769/pexels-photo-17065769.jpeg?auto=compress&cs=tinysrgb&w=1200",
    subs: ["Chocolates", "Biscuits", "Snacks", "Soft Drinks", "Water Bottles", "Juices", "Energy Drinks", "Batteries", "USB Drives", "Earphones", "Mobile Accessories"],
  },
  gifts: {
    slug: "gifts",
    name: "Gift Shop",
    headline: "Gift Shop",
    blurb:
      "Premium pen sets, birthday return gifts, greeting cards and creative art kits — wrapped and ready to make someone's day.",
    image:
      "https://images.pexels.com/photos/7657387/pexels-photo-7657387.jpeg?auto=compress&cs=tinysrgb&w=1200",
    subs: ["Gift Sets", "Return Gifts", "Cards & Wraps", "Creative Kits"],
  },
  dairy: {
    slug: "dairy",
    name: "Milk & Dairy",
    headline: "Milk & Dairy",
    blurb: "Fresh milk every morning, curd, paneer, butter and cheese — always within expiry, always chilled.",
    image:
      "https://static.prod-images.emergentagent.com/jobs/a22da722-1531-450f-80dd-4e90a44395d3/images/449dfd520e511cc3176cfb3170112ce93184b3e92aac72dfeaf59e1cf60299fc.jpeg",
    subs: ["Milk", "Curd", "Paneer", "Butter", "Cheese", "Flavoured Milk", "Lassi", "Buttermilk"],
  },
};

export function categorySlug(categoryName: string): string {
  return (
    Object.values(CATEGORIES).find((c) => c.name === categoryName)?.slug ?? "stationery"
  );
}

// ---------------------------------------------------------------------------
// Mega menus
// ---------------------------------------------------------------------------
export interface MegaColumn {
  heading: string;
  sub: string;
  items: string[];
  brands: string[];
}

export interface MegaGroup {
  label: string;
  slug: string;
  columns: MegaColumn[];
}

export const MEGA_MENUS: MegaGroup[] = [
  {
    label: "Stationery",
    slug: "stationery",
    columns: [
      { heading: "Pens & Writing", sub: "Pens & Writing", items: ["Ball Pens", "Gel Pens", "Fountain Pens", "Highlighters", "Whiteboard Markers", "Permanent Markers"], brands: ["Cello", "Reynolds", "DOMS", "Camlin"] },
      { heading: "Geometry & Math", sub: "Geometry", items: ["Mathematical Instrument Boxes", "Rulers & Scales", "Protractors & Set Squares", "Compass Sets"], brands: ["Camlin", "DOMS", "Classmate"] },
      { heading: "Files & Folders", sub: "Files & Folders", items: ["Clear Book Display Files", "Ring Binders", "Report Files", "Document Envelopes", "Folder Dividers"], brands: ["Solo", "Classic"] },
      { heading: "Art & Craft", sub: "Art & Craft", items: ["Oil Pastels", "Wax Crayons", "Water Colours", "Acrylic Paints", "Canvas Boards", "Craft Glue & Clay"], brands: ["Faber-Castell", "Camlin", "DOMS"] },
      { heading: "Office Accessories", sub: "Office Accessories", items: ["Kangaro Staplers & Pins", "Punching Machines", "Tape Dispensers", "Scissors & Cutters", "Sticky Notes & Flags"], brands: ["Kangaro", "3M Post-it"] },
      { heading: "Papers & Labels", sub: "Papers & Labels", items: ["JK Copier A4 Sheets", "Color Craft Sheets", "Label Stickers", "Chart Papers", "Tracing Sheets"], brands: ["JK Paper", "Century"] },
    ],
  },
  {
    label: "Note Books",
    slug: "notebooks",
    columns: [
      { heading: "Long Books", sub: "Long Books", items: ["Classmate King Size 172 Pgs", "Navneet Long Notebooks", "Softcover A4 Long", "Hardcover Long 240 Pgs"], brands: ["Classmate", "Navneet"] },
      { heading: "School Notes", sub: "School Notes", items: ["Single Ruled 172 Pgs", "Double Ruled 172 Pgs", "Four Line Ruled", "Square Ruled Math Books", "Broad Ruled"], brands: ["Classmate", "DOMS"] },
      { heading: "Records & Practical", sub: "Records", items: ["Science Practical Records", "Physics / Chemistry Lab Books", "Computer Record Books", "Biology Record with Sheets"], brands: ["Navneet", "Sundaram"] },
      { heading: "Graph & Drawing", sub: "Graph Books", items: ["Graph Note Books", "Classmate Drawing Book A3/A4", "Artists Sketchpad Spiral", "Cartridge Sheet Books"], brands: ["Classmate", "DOMS", "Camlin"] },
      { heading: "Spiral Binding Books", sub: "Spiral Binding", items: ["Executive Spiral Note Pads", "Subject Dividers Spiral Notebooks", "Pocket Spiral Diaries", "College Ruled Spiral Notebooks"], brands: ["Classmate Pulse", "Solo"] },
    ],
  },
  {
    label: "Office Supplies",
    slug: "office-supplies",
    columns: [
      { heading: "Registers", sub: "Registers", items: ["Staff Attendance Register", "Petty Cash Registers", "Visitor Log Book", "Stock Register"], brands: ["Standard", "Eagle"] },
      { heading: "Ledger Books", sub: "Ledgers", items: ["General Ledger 200 Pgs", "General Ledger 400 Pgs", "Day Book", "Ledger with Index"], brands: ["Standard", "Eagle"] },
      { heading: "Cash Books", sub: "Cash Books", items: ["Cash Book Single Column", "Cash Book Double Column", "Bank Cash Book", "Petty Cash Book"], brands: ["Standard"] },
      { heading: "Invoice Books", sub: "Invoice Books", items: ["Tax Invoice (Duplicate)", "Tax Invoice (Triplicate)", "Money Receipt Books", "Challan Books"], brands: ["Falcon"] },
      { heading: "Office Files", sub: "Office Files", items: ["Box Files", "Lever Arch Files", "Ring Binders", "Display Files", "Document Envelopes"], brands: ["Solo", "Deli"] },
      { heading: "Calculators", sub: "Calculators", items: ["Basic Desktop Calculators", "Scientific Calculators", "Printing Calculators", "Desk Organizers"], brands: ["Casio", "Citizen"] },
    ],
  },
];

// ---------------------------------------------------------------------------
// Featured services
// ---------------------------------------------------------------------------
export interface ServiceCard {
  id: string;
  title: string;
  badge: string;
  description: string;
  image: string;
  cta: string;
  href: string;
  icon: LucideIcon;
  note?: string;
}

export const SERVICES: ServiceCard[] = [
  { id: "stationery-store", title: "Stationery Store", badge: "Top Brands", description: "Premium school & college stationery from Classmate, Navneet, DOMS, Camlin, Faber-Castell, Cello & Reynolds.", image: "https://images.unsplash.com/photo-1501618669935-18b6ecb13d6d?crop=entropy&cs=srgb&fm=jpg&q=85&w=900", cta: "Explore Stationery", href: "/c/stationery", icon: Store },
  { id: "notebooks-hub", title: "Note Books", badge: "All Sizes", description: "Long books, practical records, spiral pads, graph sheets and school notes — every brand on your list.", image: "https://images.unsplash.com/photo-1603188389888-7b80bd0a7e3e?crop=entropy&cs=srgb&fm=jpg&q=85&w=900", cta: "Browse Books", href: "/c/notebooks", icon: NotebookPen },
  { id: "office-supplies", title: "Office Supplies", badge: "Business Grade", description: "Attendance registers, ledger & cash books, invoice books, Casio calculators and filing systems.", image: "https://images.unsplash.com/photo-1625225233840-695456021cde?crop=entropy&cs=srgb&fm=jpg&q=85&w=900", cta: "View Office Gear", href: "/c/office-supplies", icon: Briefcase },
  { id: "xerox-center", title: "Xerox Center", badge: "Starts ₹2/-", description: "High-speed black & white photocopying and vibrant colour Xerox for single and bulk documents.", image: "https://images.unsplash.com/photo-1778330103283-cff9ada3d7b2?crop=entropy&cs=srgb&fm=jpg&q=85&w=900", cta: "Check Rates", href: "/print-xerox", icon: Copy },
  { id: "printing-services", title: "Printing Services", badge: "Immediate", description: "A4/A3 laser prints, project report printouts, glossy passport photos and enlargements.", image: "https://images.pexels.com/photos/9550363/pexels-photo-9550363.jpeg?auto=compress&cs=tinysrgb&w=900", cta: "Print Services", href: "/print-xerox", icon: FileText },
  { id: "binding-lamination", title: "Binding & Lamination", badge: "Professional", description: "Thermal pouch lamination for IDs & certificates, and metal spiral / comb book binding.", image: "https://images.pexels.com/photos/9574509/pexels-photo-9574509.jpeg?auto=compress&cs=tinysrgb&w=900", cta: "Binding Options", href: "/print-xerox", icon: Layers },
  { id: "gift-shop", title: "Gift Shop", badge: "Celebration", description: "Pen gift sets, birthday return gifts, decorative stationery, art kits, greeting cards & wrappers.", image: "https://images.pexels.com/photos/7657387/pexels-photo-7657387.jpeg?auto=compress&cs=tinysrgb&w=900", cta: "Explore Gifts", href: "/c/gifts", icon: Gift },
  { id: "money-transfer", title: "Money Transfer Services", badge: "Store Counter", description: "Quick & secure domestic bank money transfer assistance at the store counter, with receipt.", image: "https://images.unsplash.com/photo-1648201637025-1c77b9be3013?crop=entropy&cs=srgb&fm=jpg&q=85&w=900", cta: "Counter Info", href: "/location", icon: Banknote, note: "In-store counter service only — no online payments." },
  { id: "daily-needs", title: "Daily Needs Store", badge: "Everyday Care", description: "Snacks, chocolates, mineral water, batteries, USB drives, earphones & charging cables.", image: "https://images.pexels.com/photos/17065769/pexels-photo-17065769.jpeg?auto=compress&cs=tinysrgb&w=900", cta: "Explore Daily Needs", href: "/c/daily-needs", icon: ShoppingBasket },
];

// ---------------------------------------------------------------------------
// Print & Xerox rates (rates are "starting from" prices)
// ---------------------------------------------------------------------------
export interface PrintRate {
  id: string;
  service: string;
  rate: number;
  unit: string;
  desc: string;
  icon: LucideIcon;
}

export const PRINT_RATES: PrintRate[] = [
  { id: "xerox-bw", service: "Black & White Xerox (A4)", rate: 2, unit: "per page", desc: "₹2 single side · ₹2.5 both sides (per sheet) on 75 GSM paper", icon: Copy },
  { id: "xerox-color", service: "Color Xerox (A4)", rate: 5, unit: "per page", desc: "High definition colour photocopy", icon: Palette },
  { id: "print", service: "Document Laser Printout", rate: 2, unit: "per page", desc: "From USB, email or WhatsApp submission", icon: FileText },
  { id: "print-color", service: "A4 / A3 Color Printout", rate: 10, unit: "per page", desc: "Vibrant presentation and project printing", icon: ImageIcon },
  { id: "scan", service: "Document Scanning (High-Res)", rate: 10, unit: "per document", desc: "Direct PDF to email / WhatsApp / flash drive", icon: ScanLine },
  { id: "lamination", service: "Hot Pouch Lamination (A4/A3)", rate: 20, unit: "per sheet", desc: "Waterproof sealing for certificates & ID cards", icon: Layers },
  { id: "binding", service: "Spiral & Wire-O Binding", rate: 40, unit: "per book", desc: "Includes transparent front cover & dark back sheet", icon: NotebookPen },
  { id: "photo-print", service: "Passport Size Photo Printing", rate: 20, unit: "set of 8", desc: "Studio quality glossy photo paper", icon: Camera },
];

export const PRINTER_PHOTOS = [
  { url: "https://images.unsplash.com/photo-1778330103283-cff9ada3d7b2?crop=entropy&cs=srgb&fm=jpg&q=85&w=900", caption: "High-speed Xerox & copy counter" },
  { url: "https://images.pexels.com/photos/9550363/pexels-photo-9550363.jpeg?auto=compress&cs=tinysrgb&w=900", caption: "Laser document & photo printing" },
  { url: "https://images.pexels.com/photos/9574509/pexels-photo-9574509.jpeg?auto=compress&cs=tinysrgb&w=900", caption: "Scanning, lamination & binding desk" },
];

// ---------------------------------------------------------------------------
// Brand strip + trust items
// ---------------------------------------------------------------------------
export const BRANDS = [
  { name: "Classmate", logoDomain: "classmateshop.com" },
  { name: "Navneet", logoDomain: "navneet.com" },
  { name: "DOMS", logoDomain: "domsindia.com" },
  { name: "Camlin", logoDomain: "kokuyocamlin.com" },
  { name: "Apsara", logoDomain: "hindustanpencils.com" },
  { name: "Nataraj", logoDomain: "hindustanpencils.com" },
  { name: "Cello", logoDomain: "celloworld.com" },
  { name: "Reynolds", logoDomain: "reynolds.com" },
  { name: "Faber-Castell", logoDomain: "faber-castell.com" },
  { name: "Kangaro", logoDomain: "kangaro.com" },
];

// Shown when a product has no photo yet (owner-added items) — never pass an empty src.
export const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1501618669935-18b6ecb13d6d?crop=entropy&cs=srgb&fm=jpg&q=60&w=600";

export const HERO_IMAGES = {
  main: "https://images.unsplash.com/photo-1501618669935-18b6ecb13d6d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  flatlay: "https://images.pexels.com/photos/7657387/pexels-photo-7657387.jpeg?auto=compress&cs=tinysrgb&w=600",
  notebooks: "https://images.unsplash.com/photo-1603188389888-7b80bd0a7e3e?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
};

export interface TrustItem {
  title: string;
  desc: string;
  icon: LucideIcon;
}

export const TRUST_ITEMS: TrustItem[] = [
  { title: "Open Daily 8 AM - 10 PM", desc: "Every day of the week, including Sundays", icon: Clock },
  { title: "Trusted Local Store", desc: "Serving Bandlaguda Jagir families, students & offices", icon: ShieldCheck },
  { title: "Affordable Prices", desc: "Fair neighbourhood pricing on every single item", icon: IndianRupee },
  { title: "Quality Products", desc: "Only genuine brands — no duplicates, ever", icon: BadgeCheck },
  { title: "Fast Xerox & Printing", desc: "Copies, printouts and scans ready in minutes", icon: Printer },
  { title: "Money Transfer Services", desc: "Secure domestic transfers at the counter", icon: Send },
  { title: "One Stop Solution", desc: "Stationery to snacks — everything in one visit", icon: ShoppingBag },
];

export const SERVICE_AREAS = [
  "Bandlaguda Jagir",
  "Suryodhaya Colony",
  "My Abode The Sirius",
  "Sun City",
  "Kismatpur",
  "Rajendranagar",
  "Hyderabad",
];

export const BEVERAGE_SUBS = ["Soft Drinks", "Water Bottles", "Juices", "Energy Drinks"];

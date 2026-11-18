// Hand-written mirrors of the backend Pydantic models (backend/models/*) — keep in sync in the same edit.

export interface Product {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  brand: string;
  price: number;
  unit: string;
  image: string;
  description: string;
  stock: number;
  is_best_seller: boolean;
  is_new: boolean;
  available: boolean;
  cost_price: number;
  reorder_level: number;
  expiry_date: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  quantity: number;
  description: string;
  product_id: string;
  product_name: string;
  category: string;
  cost: number;
  customer_name: string;
  transfer_amount: number;
  bill_id: string;
  recorded_date: string;
  created_at: string;
}

// ---- mirrors backend/models/extras.py ----
export interface PrintOrder {
  id: string;
  code: string;
  name: string;
  phone: string;
  copies: number;
  color: boolean;
  binding: boolean;
  notes: string;
  file_name: string;
  file_size: number;
  status: string;
  whatsapp_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface PrintStatusResult {
  order: PrintOrder;
  whatsapp_sent: boolean;
  whatsapp_info: string;
  whatsapp_link: string;
}

export interface KitItem {
  product_id: string;
  qty: number;
}

export interface KitItemView extends KitItem {
  name: string;
  price: number;
  image: string;
}

export interface KitView {
  id: string;
  name: string;
  class_range: string;
  description: string;
  items: KitItemView[];
  total: number;
  sort: number;
}

export interface ClosingReport {
  id: string;
  date: string;
  total: number;
  sales: number;
  xerox: number;
  printing: number;
  money_transfer: number;
  entries: number;
  print_orders: number;
  emailed_to: string;
  email_status: string;
  created_at: string;
}

export interface StoreSettings {
  business_name: string;
  address: string;
  phone: string;
  google_review_link: string;
  store_hours: string;
  tax_percent: number;
  report_email: string;
  rates: Record<string, number>;
  whatsapp_auto: boolean;
}

export interface BillLine {
  product_id: string;
  service: string;
  name: string;
  qty: number;
  price: number;
  cost: number;
}

export interface Bill {
  id: string;
  number: string;
  items: BillLine[];
  subtotal: number;
  tax: number;
  total: number;
  profit: number;
  customer_name: string;
  customer_phone: string;
  payment_mode: string;
  points_earned: number;
  points_balance: number;
  recorded_date: string;
  created_at: string;
}

export interface Notice {
  kind: string;
  title: string;
  detail: string;
}

export interface Overview {
  today_sales: number;
  today_profit: number;
  month_revenue: number;
  month_profit: number;
  total_products: number;
  inventory_value: number;
  products_sold_today: number;
  customers_served: number;
  low_stock_count: number;
  out_of_stock_count: number;
  today_commission: number;
  month_commission: number;
  transfer_count: number;
  daily: { date: string; revenue: number; profit: number }[];
  monthly: { month: string; revenue: number; profit: number }[];
  categories: { category: string; revenue: number; qty: number }[];
  gift_categories: { category: string; revenue: number; profit: number; qty: number }[];
  top_products: { name: string; qty: number; revenue: number }[];
  notices: Notice[];
  bills_today: number;
  units: { id: string; label: string; today: number; month: number; today_profit: number; month_profit: number; sold_today: number; products: number }[];
  payments: Record<string, number>;
  activity: { time: string; label: string; amount: number }[];
  snapshot: { label: string; items: number; value: number }[];
  best_product: string;
  worst_product: string;
}

export interface Purchase {
  id: string;
  product_id: string;
  product_name: string;
  qty: number;
  cost_total: number;
  unit_cost: number;
  vendor: string;
  recorded_date: string;
  created_at: string;
}

export const inr = (n: number) => `₹${(Math.round(n * 100) / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export function stockState(p: Pick<Product, "stock" | "reorder_level">): "out" | "low" | "ok" {
  if (p.stock <= 0) return "out";
  return p.stock <= (p.reorder_level || 5) ? "low" : "ok";
}

export interface TypeTotal {
  type: string;
  label: string;
  total: number;
  count: number;
}

export interface DailyPoint {
  date: string;
  amount: number;
}

export interface TopProduct {
  name: string;
  qty: number;
  amount: number;
}

export interface CategorySlice {
  category: string;
  qty: number;
  amount: number;
}

export interface Analytics {
  today_total: number;
  month_total: number;
  today_count: number;
  by_type: TypeTotal[];
  daily_series: DailyPoint[];
  top_products: TopProduct[];
  category_distribution: CategorySlice[];
  low_stock: Product[];
}

export interface OwnerInfo {
  username: string;
  role: string;
}

// Mirrors SERVICE_TYPES in backend/routers/revenue.py
export const SERVICE_TYPE_LABELS: Record<string, string> = {
  sale: "Product Sale",
  "xerox-bw": "B&W Xerox",
  "xerox-bw-2side": "B&W Xerox (Both Sides)",
  "xerox-color": "Color Xerox",
  print: "Printout",
  scan: "Scanning",
  lamination: "Lamination",
  binding: "Spiral Binding",
  "photo-print": "Photo Printing",
  "money-transfer": "Money Transfer",
};

export interface Banner {
  id: string;
  festival: string;
  title: string;
  subtitle: string;
  cta_label: string;
  link: string;
  image: string;
  enabled: boolean;
  start_date: string;
  end_date: string;
  product_ids: string[];
  status: "off" | "scheduled" | "live" | "ended";
  live: boolean;
}

export interface FestivalPage {
  banner: Banner;
  products: Product[];
}

export interface Customer {
  phone: string;
  name: string;
  points: number;
  total_spent: number;
  visits: number;
  last_visit: string;
}

export interface StockItem {
  name: string;
  stock: number;
  reorder_level: number;
}

export interface StockEmailResult {
  date: string;
  items: StockItem[];
  email_status: string;
  emailed_to: string;
}

export interface MilkSubscription {
  id: string;
  code: string;
  name: string;
  phone: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  qty: number;
  mode: "pickup" | "delivery";
  building: string;
  floor: string;
  flat: string;
  address: string;
  start_date: string;
  status: "active" | "paused" | "cancelled";
  skip_dates: string[];
  created_at: string;
}

export interface MilkSubscriptionView extends MilkSubscription {
  month_packets: number;
  month_amount: number;
  total_charged: number;
  total_paid: number;
  balance_due: number;
}

export interface MilkListLine {
  subscription_id: string;
  code: string;
  name: string;
  phone: string;
  product_name: string;
  qty: number;
  mode: string;
  building: string;
  floor: string;
  flat: string;
  address: string;
}

export interface MilkOrderLine {
  product_id: string;
  product_name: string;
  subscribed: number;
  walk_in_avg: number;
  in_stock: number;
  to_order: number;
}

export interface MilkStatement {
  subscription: MilkSubscriptionView;
  month: string;
  days: { date: string; qty: number; amount: number }[];
  packets: number;
  amount: number;
  paid_in_month: number;
  balance_due: number;
}

export interface MilkFamilyView {
  code: string;
  name: string;
  product_name: string;
  qty: number;
  mode: string;
  status: string;
  start_date: string;
  skip_dates: string[];
  earliest_skip: string;
}

export const milkWhere = (l: { flat: string; floor: string; building: string; address: string }) =>
  [l.flat ? `Flat ${l.flat}` : "", l.floor ? `Floor ${l.floor}` : "", l.building, l.address].filter(Boolean).join(", ");

export interface MilkList {
  date: string;
  total_packets: number;
  by_product: { product_name: string; packets: number }[];
  pickups: MilkListLine[];
  deliveries: MilkListLine[];
  skipped: MilkListLine[];
  order_plan: MilkOrderLine[];
  email_status: string;
}

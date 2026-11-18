"""Models for v2.1 features: print orders, school kits, closing reports, settings."""
import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from models.catalog import _aware, utcnow

PRINT_STATUSES = ["received", "printing", "ready", "collected"]


class PrintOrder(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str  # short pickup code shown to the student, e.g. P-4821
    name: str
    phone: str
    copies: int = 1
    color: bool = False
    binding: bool = False
    notes: str = ""
    file_name: str
    file_size: int = 0
    status: str = "received"
    whatsapp_sent: bool = False
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


def print_order_from_doc(doc: dict) -> PrintOrder:
    doc = {k: v for k, v in doc.items() if k not in ("_id", "storage_path", "content_type")}
    doc["created_at"] = _aware(doc.get("created_at"))
    doc["updated_at"] = _aware(doc.get("updated_at"))
    return PrintOrder(**doc)


class PrintStatusUpdate(BaseModel):
    status: str


class PrintStatusResult(BaseModel):
    order: PrintOrder
    whatsapp_sent: bool
    whatsapp_info: str
    whatsapp_link: str


class KitItem(BaseModel):
    product_id: str
    qty: int = Field(default=1, ge=1)


class KitItemView(BaseModel):
    product_id: str
    qty: int
    name: str
    price: float
    image: str


class Kit(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    class_range: str
    description: str = ""
    items: list[KitItem] = []
    sort: int = 0


class KitView(BaseModel):
    id: str
    name: str
    class_range: str
    description: str
    items: list[KitItemView]
    total: float
    sort: int


class KitInput(BaseModel):
    name: str
    class_range: str
    description: str = ""
    items: list[KitItem] = []
    sort: int = 0


class ClosingReport(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str
    total: float
    sales: float
    xerox: float
    printing: float
    money_transfer: float
    entries: int
    print_orders: int
    emailed_to: str = ""
    email_status: str = ""  # sent | skipped (no email set) | failed: ...
    created_at: datetime = Field(default_factory=utcnow)


def report_from_doc(doc: dict) -> ClosingReport:
    doc.pop("_id", None)
    doc["created_at"] = _aware(doc.get("created_at"))
    return ClosingReport(**doc)


DEFAULT_RATES: dict[str, float] = {
    "xerox-bw": 2, "xerox-bw-2side": 2.5, "xerox-color": 10, "print": 3, "scan": 10,
    "lamination": 20, "binding": 30, "photo-print": 20,
}


class StoreSettings(BaseModel):
    business_name: str = "H.A.R.M DAILY NEEDS"
    address: str = "2-2/30/201, My Abode The Sirius, Suryodhaya Colony, Bandlaguda Jagir, Hyderabad, Telangana - 500086"
    phone: str = "+91 8374778183"
    google_review_link: str = "https://www.google.com/maps/search/H.A.R.M+DAILY+NEEDS+Bandlaguda+Jagir+Hyderabad"
    store_hours: str = "Open Daily 8:00 AM - 10:00 PM"
    tax_percent: float = Field(default=0, ge=0, le=28)
    report_email: str = ""
    rates: dict[str, float] = Field(default_factory=lambda: dict(DEFAULT_RATES))
    whatsapp_auto: bool = False  # read-only: True when Twilio keys are configured


class BillLine(BaseModel):
    product_id: str = ""  # empty for a service line
    service: str = ""  # e.g. xerox-bw
    name: str = ""
    qty: int = Field(default=1, ge=1)
    price: float = 0
    cost: float = 0


class BillCreate(BaseModel):
    items: list[BillLine] = Field(min_length=1)
    customer_name: str = ""
    customer_phone: str = ""
    payment_mode: str = "cash"  # cash | upi | card


class Bill(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    number: str
    items: list[BillLine]
    subtotal: float
    tax: float
    total: float
    profit: float
    customer_name: str = ""
    customer_phone: str = ""
    payment_mode: str = "cash"
    points_earned: int = 0
    points_balance: int = 0
    recorded_date: str
    created_at: datetime = Field(default_factory=utcnow)


class BulkUpdate(BaseModel):
    ids: list[str] = Field(min_length=1)
    available: bool | None = None
    category: str | None = None
    stock_delta: int | None = None
    delete: bool = False


class Notice(BaseModel):
    kind: str  # low-stock | out-of-stock | price-change | review | summary | expiry
    title: str
    detail: str


class Overview(BaseModel):
    today_sales: float
    today_profit: float
    month_revenue: float
    month_profit: float
    total_products: int
    inventory_value: float
    products_sold_today: int
    customers_served: int
    low_stock_count: int
    out_of_stock_count: int
    today_commission: float
    month_commission: float
    transfer_count: int
    daily: list[dict]  # [{date, revenue, profit}] last 30 days
    monthly: list[dict]  # [{month, revenue, profit}] last 6 months
    categories: list[dict]  # [{category, revenue, qty}]
    gift_categories: list[dict] = Field(default_factory=list)  # [{category, revenue, profit, qty}] current month
    top_products: list[dict]  # [{name, qty, revenue}]
    notices: list[Notice]
    bills_today: int = 0
    units: list[dict] = []  # [{id,label,today,month,today_profit,month_profit,sold_today,products}]
    payments: dict[str, float] = {}  # cash/upi/card today (from POS bills; walk-in entries count as cash)
    activity: list[dict] = []  # [{time,label,amount}]
    snapshot: list[dict] = []  # [{label, items, value}]
    best_product: str = ""
    worst_product: str = ""


class PurchaseCreate(BaseModel):
    product_id: str
    qty: int = Field(ge=1)
    cost_total: float = Field(gt=0)
    vendor: str = ""


class Purchase(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    product_name: str
    qty: int
    cost_total: float
    unit_cost: float
    vendor: str
    recorded_date: str
    created_at: datetime = Field(default_factory=utcnow)

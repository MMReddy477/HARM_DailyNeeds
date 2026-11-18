"""Operations models: owner auth, service-revenue transactions, analytics."""
import uuid
from datetime import datetime, timezone

from pydantic import BaseModel, Field

from models.catalog import Product, _aware


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class LoginRequest(BaseModel):
    username: str
    password: str


class OwnerInfo(BaseModel):
    username: str
    role: str = "owner"


class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # sale | xerox-bw | xerox-bw-2side | xerox-color | print | scan | lamination | binding | photo-print | money-transfer
    amount: float = Field(gt=0)
    quantity: int = Field(default=1, ge=1)
    description: str = ""
    product_id: str = ""
    product_name: str = ""
    category: str = ""
    cost: float = 0  # cost of goods for profit; 0 for services
    customer_name: str = ""
    transfer_amount: float = 0  # money-transfer principal (amount = commission)
    bill_id: str = ""
    recorded_date: str  # YYYY-MM-DD in store timezone (IST)
    created_at: datetime = Field(default_factory=utcnow)


def transaction_from_doc(doc: dict) -> Transaction:
    doc.pop("_id", None)
    doc["created_at"] = _aware(doc.get("created_at"))
    return Transaction(**doc)


class TransactionCreate(BaseModel):
    type: str
    amount: float = Field(gt=0)
    quantity: int = Field(default=1, ge=1)
    description: str = ""
    product_id: str = ""
    customer_name: str = ""
    transfer_amount: float = 0


class TypeTotal(BaseModel):
    type: str
    label: str
    total: float
    count: int


class DailyPoint(BaseModel):
    date: str
    amount: float


class TopProduct(BaseModel):
    name: str
    qty: int
    amount: float


class CategorySlice(BaseModel):
    category: str
    qty: int
    amount: float


class Analytics(BaseModel):
    today_total: float
    month_total: float
    today_count: int
    by_type: list[TypeTotal]
    daily_series: list[DailyPoint]
    top_products: list[TopProduct]
    category_distribution: list[CategorySlice]
    low_stock: list[Product]

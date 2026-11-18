"""Daily milk subscriptions: families book online, owner sees tomorrow's list, dues are tracked per family."""
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from models.catalog import utcnow


class MilkSubscribeInput(BaseModel):
    name: str = Field(min_length=2, max_length=60)
    phone: str = Field(min_length=10, max_length=16)
    product_id: str
    qty: int = Field(default=1, ge=1, le=10)  # packets per day
    mode: Literal["pickup", "delivery"] = "pickup"
    building: str = Field(default="", max_length=60)  # block / building name
    floor: str = Field(default="", max_length=10)
    flat: str = Field(default="", max_length=20)
    address: str = Field(default="", max_length=200)  # landmark / extra directions
    start_date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")


class MilkSubscription(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    name: str
    phone: str  # normalized digits, 91XXXXXXXXXX
    product_id: str
    product_name: str
    unit_price: float
    qty: int
    mode: str
    building: str = ""
    floor: str = ""
    flat: str = ""
    address: str = ""
    start_date: str
    status: str = "active"  # active | paused | cancelled
    skip_dates: list[str] = []
    created_at: datetime = Field(default_factory=utcnow)


class MilkSubscriptionView(MilkSubscription):
    month_packets: int = 0
    month_amount: float = 0
    total_charged: float = 0
    total_paid: float = 0
    balance_due: float = 0


class MilkSubscriptionUpdate(BaseModel):
    status: Literal["active", "paused", "cancelled"] | None = None
    qty: int | None = Field(default=None, ge=1, le=10)


class MilkPaymentInput(BaseModel):
    amount: float = Field(gt=0, le=100000)
    note: str = Field(default="", max_length=100)


class MilkListLine(BaseModel):
    subscription_id: str
    code: str
    name: str
    phone: str
    product_name: str
    qty: int
    mode: str
    building: str = ""
    floor: str = ""
    flat: str = ""
    address: str = ""


class MilkProductCount(BaseModel):
    product_name: str
    packets: int


class MilkList(BaseModel):
    date: str
    total_packets: int
    by_product: list[MilkProductCount]
    pickups: list[MilkListLine]
    deliveries: list[MilkListLine]
    skipped: list[MilkListLine] = []
    order_plan: list["MilkOrderLine"] = []
    email_status: str = ""


class MilkOrderLine(BaseModel):
    product_id: str
    product_name: str
    subscribed: int
    walk_in_avg: int  # average daily counter sales, last 7 days
    in_stock: int
    to_order: int


class MilkDay(BaseModel):
    date: str
    qty: int
    amount: float


class MilkStatement(BaseModel):
    subscription: MilkSubscriptionView
    month: str  # YYYY-MM
    days: list[MilkDay]
    packets: int
    amount: float
    paid_in_month: float
    balance_due: float


class MilkLookupInput(BaseModel):
    code: str = Field(min_length=3, max_length=10)
    phone: str = Field(min_length=10, max_length=16)


class MilkSkipInput(MilkLookupInput):
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    skip: bool = True


class MilkFamilyView(BaseModel):
    code: str
    name: str
    product_name: str
    qty: int
    mode: str
    status: str
    start_date: str
    skip_dates: list[str]
    earliest_skip: str  # first date that can still be skipped (tomorrow before 9 PM, else day after)


class OwnerSkipInput(BaseModel):
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    skip: bool = True

MilkList.model_rebuild()

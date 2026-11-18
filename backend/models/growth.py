"""Festival banners, loyalty customers and the morning dairy stock email."""
from datetime import datetime

from pydantic import BaseModel, Field

from models.catalog import Product, utcnow


class Banner(BaseModel):
    id: str  # "diwali" | "rakhi" | "ganesh" | "christmas" | "newyear"
    festival: str
    title: str
    subtitle: str
    cta_label: str
    link: str
    image: str
    enabled: bool = False
    start_date: str = ""  # YYYY-MM-DD, optional; banner shows from this day (IST)
    end_date: str = ""  # YYYY-MM-DD, optional; banner hides after this day (IST)
    product_ids: list[str] = []
    status: str = "off"  # computed: off | scheduled | live | ended
    live: bool = False  # computed


class BannerUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=80)
    subtitle: str = Field(default="", max_length=200)
    cta_label: str = Field(default="Shop Now", min_length=1, max_length=30)
    enabled: bool
    start_date: str = Field(default="", pattern=r"^(\d{4}-\d{2}-\d{2})?$")
    end_date: str = Field(default="", pattern=r"^(\d{4}-\d{2}-\d{2})?$")
    product_ids: list[str] = Field(default_factory=list, max_length=60)


class FestivalPage(BaseModel):
    banner: "Banner"
    products: list[Product]


class Customer(BaseModel):
    phone: str  # normalized digits, e.g. 919876543210
    name: str = ""
    points: int = 0
    total_spent: float = 0
    visits: int = 0
    last_visit: datetime = Field(default_factory=utcnow)


class StockItem(BaseModel):
    name: str
    stock: int
    reorder_level: int


class StockEmailResult(BaseModel):
    date: str
    items: list[StockItem]
    email_status: str
    emailed_to: str = ""

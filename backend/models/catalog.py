"""Catalog models: products and customer reviews."""
import uuid
from datetime import datetime, timezone

from pydantic import BaseModel, Field


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _aware(dt: datetime | None) -> datetime | None:
    # motor hands naive UTC datetimes back from BSON — normalise so JS Date() parses them.
    if dt is not None and dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    subcategory: str = ""
    brand: str = ""
    price: float
    unit: str = "per piece"
    image: str = ""
    description: str = ""
    stock: int = 0
    is_best_seller: bool = False
    is_new: bool = False
    available: bool = True
    cost_price: float = 0
    reorder_level: int = 5
    expiry_date: str = ""  # YYYY-MM-DD, dairy/perishables only
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


def product_from_doc(doc: dict) -> Product:
    doc.pop("_id", None)
    doc["created_at"] = _aware(doc.get("created_at"))
    doc["updated_at"] = _aware(doc.get("updated_at"))
    return Product(**doc)


class ProductCreate(BaseModel):
    name: str
    category: str
    subcategory: str = ""
    brand: str = ""
    price: float
    unit: str = "per piece"
    image: str = ""
    description: str = ""
    stock: int = 0
    is_best_seller: bool = False
    is_new: bool = False
    available: bool = True
    cost_price: float = 0
    reorder_level: int = 5
    expiry_date: str = ""  # YYYY-MM-DD, dairy/perishables only


class ProductUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    subcategory: str | None = None
    brand: str | None = None
    price: float | None = None
    unit: str | None = None
    image: str | None = None
    description: str | None = None
    stock: int | None = None
    is_best_seller: bool | None = None
    is_new: bool | None = None
    available: bool | None = None
    cost_price: float | None = None
    reorder_level: int | None = None
    expiry_date: str | None = None


class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    rating: int = Field(ge=1, le=5)
    comment: str
    created_at: datetime = Field(default_factory=utcnow)


def review_from_doc(doc: dict) -> Review:
    doc.pop("_id", None)
    doc["created_at"] = _aware(doc.get("created_at"))
    return Review(**doc)


class ReviewCreate(BaseModel):
    name: str
    rating: int = Field(ge=1, le=5)
    comment: str

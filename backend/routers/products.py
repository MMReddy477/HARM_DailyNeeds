"""Product catalog: public browse + owner-only CRUD."""
import re
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pymongo import ReturnDocument

from lib.db import db
from models.catalog import (
    Product,
    ProductCreate,
    ProductUpdate,
    product_from_doc,
    utcnow,
)
from routers.auth import require_owner

BEVERAGE_SUBS = ["Soft Drinks", "Water Bottles", "Juices", "Energy Drinks"]

router = APIRouter(tags=["products"])


@router.get("/products", response_model=List[Product])
async def list_products(
    category: str | None = None,
    subcategory: str | None = None,
    brand: str | None = None,
    q: str | None = None,
    flag: str | None = None,  # "best" | "new"
    limit: int = 60,
):
    filt: dict = {}
    if category:
        filt["category"] = category
    if subcategory:
        filt["subcategory"] = subcategory
    if brand:
        filt["brand"] = brand
    if q:
        rx = {"$regex": re.escape(q.strip()), "$options": "i"}
        filt["$or"] = [{"name": rx}, {"brand": rx}, {"subcategory": rx}]
    if flag == "best":
        filt["is_best_seller"] = True
    elif flag == "new":
        filt["is_new"] = True
    docs = await db.products.find(filt).sort("created_at", -1).to_list(min(max(limit, 1), 200))
    return [product_from_doc(d) for d in docs]


@router.get("/products/dairy-drinks", response_model=List[Product])
async def dairy_drinks():
    """Business unit 'Milk & Dairy + Cool Drinks' for the public storefront: dairy first, then beverages."""
    filt = {"available": {"$ne": False}, "$or": [{"category": "Milk & Dairy"}, {"category": "Daily Needs", "subcategory": {"$in": BEVERAGE_SUBS}}]}
    docs = await db.products.find(filt).to_list(200)
    docs.sort(key=lambda d: (d.get("category") != "Milk & Dairy", not d.get("is_best_seller"), d.get("name", "")))
    return [product_from_doc(d) for d in docs]


@router.get("/products/{id}", response_model=Product)
async def get_product(id: str):
    doc = await db.products.find_one({"id": id})
    if not doc:
        raise HTTPException(status_code=404, detail="product not found")
    return product_from_doc(doc)


@router.post("/products", response_model=Product, status_code=201)
async def create_product(input: ProductCreate, owner: dict = Depends(require_owner)):
    obj = Product(**input.model_dump())
    await db.products.insert_one(obj.model_dump())
    return obj


@router.patch("/products/{id}", response_model=Product)
async def update_product(id: str, input: ProductUpdate, owner: dict = Depends(require_owner)):
    changes = input.model_dump(exclude_unset=True)
    changes["updated_at"] = utcnow()
    if "price" in changes:
        before = await db.products.find_one({"id": id}, {"price": 1, "name": 1})
        if before and float(before.get("price", 0)) != float(changes["price"]):
            await db.price_changes.insert_one(
                {"product_id": id, "name": before["name"], "old": before["price"], "new": changes["price"], "created_at": utcnow()}
            )
    doc = await db.products.find_one_and_update(
        {"id": id}, {"$set": changes}, return_document=ReturnDocument.AFTER
    )
    if not doc:
        raise HTTPException(status_code=404, detail="product not found")
    return product_from_doc(doc)


@router.delete("/products/{id}", status_code=204)
async def delete_product(id: str, owner: dict = Depends(require_owner)):
    result = await db.products.delete_one({"id": id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="product not found")

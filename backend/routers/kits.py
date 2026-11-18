"""Back-to-school kits: public list with live prices; owner CRUD."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException

from lib.db import db
from models.extras import Kit, KitInput, KitItemView, KitView
from routers.auth import require_owner

router = APIRouter(tags=["kits"])


async def _resolve(doc: dict) -> KitView:
    ids = [i["product_id"] for i in doc.get("items", [])]
    products = {p["id"]: p for p in await db.products.find({"id": {"$in": ids}}).to_list(200)}
    items: list[KitItemView] = []
    for i in doc.get("items", []):
        p = products.get(i["product_id"])
        if not p:
            continue  # product was deleted — drop it from the kit view
        items.append(
            KitItemView(product_id=p["id"], qty=i["qty"], name=p["name"], price=float(p["price"]), image=p.get("image", ""))
        )
    return KitView(
        id=doc["id"],
        name=doc["name"],
        class_range=doc["class_range"],
        description=doc.get("description", ""),
        items=items,
        total=sum(it.price * it.qty for it in items),
        sort=doc.get("sort", 0),
    )


@router.get("/kits", response_model=List[KitView])
async def list_kits():
    docs = await db.kits.find().sort("sort", 1).to_list(50)
    return [await _resolve(d) for d in docs]


@router.post("/kits", response_model=KitView, status_code=201)
async def create_kit(input: KitInput, owner: dict = Depends(require_owner)):
    kit = Kit(**input.model_dump())
    await db.kits.insert_one(kit.model_dump())
    return await _resolve(kit.model_dump())


@router.put("/kits/{id}", response_model=KitView)
async def update_kit(id: str, input: KitInput, owner: dict = Depends(require_owner)):
    result = await db.kits.update_one({"id": id}, {"$set": input.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="kit not found")
    return await _resolve(await db.kits.find_one({"id": id}))


@router.delete("/kits/{id}", status_code=204)
async def delete_kit(id: str, owner: dict = Depends(require_owner)):
    result = await db.kits.delete_one({"id": id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="kit not found")

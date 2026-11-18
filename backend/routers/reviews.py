"""Customer reviews: public read/submit, owner-only delete."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException

from lib.db import db
from models.catalog import Review, ReviewCreate, review_from_doc
from routers.auth import require_owner

router = APIRouter(tags=["reviews"])


@router.get("/reviews", response_model=List[Review])
async def list_reviews(limit: int = 100):
    docs = await db.reviews.find().sort("created_at", -1).to_list(min(max(limit, 1), 200))
    return [review_from_doc(d) for d in docs]


@router.post("/reviews", response_model=Review, status_code=201)
async def create_review(input: ReviewCreate):
    obj = Review(name=input.name.strip(), rating=input.rating, comment=input.comment.strip())
    await db.reviews.insert_one(obj.model_dump())
    return obj


@router.delete("/reviews/{id}", status_code=204)
async def delete_review(id: str, owner: dict = Depends(require_owner)):
    result = await db.reviews.delete_one({"id": id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="review not found")

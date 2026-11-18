"""Owner product-photo uploads + public serving of product images."""
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response

from lib.db import db
from lib.storage import APP_PREFIX, get_object, put_object
from models.catalog import utcnow
from routers.auth import require_owner

router = APIRouter(tags=["uploads"])

IMAGE_TYPES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic", "image/heif": "heif"}
MAX_IMAGE = 10 * 1024 * 1024


@router.post("/uploads/product-image")
async def upload_product_image(file: UploadFile = File(...), owner: dict = Depends(require_owner)) -> dict:
    ctype = (file.content_type or "").lower()
    if ctype not in IMAGE_TYPES:
        raise HTTPException(status_code=422, detail="Please upload a JPG, PNG, WEBP or HEIC photo")
    data = await file.read()
    if not data or len(data) > MAX_IMAGE:
        raise HTTPException(status_code=422, detail="Photo must be under 10 MB")
    path = f"{APP_PREFIX}/products/{uuid.uuid4()}.{IMAGE_TYPES[ctype]}"
    try:
        result = await put_object(path, data, ctype)
    except Exception:
        raise HTTPException(status_code=502, detail="Photo upload failed, please try again")
    await db.files.insert_one(
        {
            "id": str(uuid.uuid4()),
            "storage_path": result["path"],
            "kind": "product-image",
            "original_filename": file.filename,
            "content_type": ctype,
            "size": len(data),
            "is_deleted": False,
            "created_at": utcnow(),
        }
    )
    return {"url": f"/api/files/{result['path']}"}


@router.get("/files/{path:path}")
async def serve_public_file(path: str):
    # Only product images are public; print-order files are served via the owner route.
    record = await db.files.find_one({"storage_path": path, "kind": "product-image", "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        data, ctype = await get_object(path)
    except Exception:
        raise HTTPException(status_code=502, detail="Could not load file")
    return Response(
        content=data,
        media_type=record.get("content_type", ctype),
        headers={"Cache-Control": "public, max-age=604800, immutable"},
    )

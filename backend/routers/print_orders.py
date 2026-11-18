"""Print orders: students upload files publicly; owner manages status and notifies on WhatsApp."""
import random
import uuid
from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

from lib.db import db
from lib.storage import APP_PREFIX, get_object, put_object
from lib.whatsapp import normalize_in_phone, send_whatsapp, wa_link
from models.catalog import utcnow
from models.extras import (
    PRINT_STATUSES,
    PrintOrder,
    PrintStatusResult,
    PrintStatusUpdate,
    print_order_from_doc,
)
from routers.auth import require_owner

router = APIRouter(tags=["print-orders"])

ALLOWED = {
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "image/jpeg": "jpg",
    "image/png": "png",
}
MAX_FILE = 20 * 1024 * 1024


def ready_message(order: dict) -> str:
    return (
        f"Hi {order['name']}, your printout (order {order['code']}) is READY at H.A.R.M DAILY NEEDS. "
        "Collect it at the counter — open daily 8 AM to 10 PM, My Abode The Sirius, Bandlaguda Jagir. "
        "Thank you!"
    )


@router.post("/print-orders", response_model=PrintOrder, status_code=201)
async def create_print_order(
    name: str = Form(..., min_length=2, max_length=60),
    phone: str = Form(...),
    copies: int = Form(1),
    color: bool = Form(False),
    binding: bool = Form(False),
    notes: str = Form("", max_length=300),
    file: UploadFile = File(...),
):
    if len(normalize_in_phone(phone)) != 12:
        raise HTTPException(status_code=422, detail="Enter a valid 10-digit mobile number")
    if not 1 <= copies <= 500:
        raise HTTPException(status_code=422, detail="Copies must be between 1 and 500")
    ctype = (file.content_type or "").lower()
    if ctype not in ALLOWED:
        raise HTTPException(status_code=422, detail="Upload a PDF, Word, PowerPoint, JPG or PNG file")
    data = await file.read()
    if not data or len(data) > MAX_FILE:
        raise HTTPException(status_code=422, detail="File must be under 20 MB")
    path = f"{APP_PREFIX}/print-orders/{uuid.uuid4()}.{ALLOWED[ctype]}"
    try:
        result = await put_object(path, data, ctype)
    except Exception:
        raise HTTPException(status_code=502, detail="File upload failed, please try again")
    order = PrintOrder(
        code=f"P-{random.randint(1000, 9999)}",
        name=name.strip(),
        phone=normalize_in_phone(phone),
        copies=copies,
        color=color,
        binding=binding,
        notes=notes.strip(),
        file_name=(file.filename or "document")[:120],
        file_size=len(data),
    )
    await db.print_orders.insert_one({**order.model_dump(), "storage_path": result["path"], "content_type": ctype})
    return order


@router.get("/print-orders", response_model=List[PrintOrder])
async def list_print_orders(status: str | None = None, owner: dict = Depends(require_owner)):
    filt = {"status": status} if status else {}
    docs = await db.print_orders.find(filt).sort("created_at", -1).to_list(300)
    return [print_order_from_doc(d) for d in docs]


@router.get("/print-orders/{id}/file")
async def download_print_file(id: str, owner: dict = Depends(require_owner)):
    doc = await db.print_orders.find_one({"id": id})
    if not doc:
        raise HTTPException(status_code=404, detail="order not found")
    try:
        data, ctype = await get_object(doc["storage_path"])
    except Exception:
        raise HTTPException(status_code=502, detail="Could not load file")
    safe_name = doc.get("file_name", "document").replace('"', "")
    return Response(
        content=data,
        media_type=doc.get("content_type", ctype),
        headers={"Content-Disposition": f'attachment; filename="{safe_name}"'},
    )


@router.patch("/print-orders/{id}/status", response_model=PrintStatusResult)
async def update_print_status(id: str, input: PrintStatusUpdate, owner: dict = Depends(require_owner)):
    if input.status not in PRINT_STATUSES:
        raise HTTPException(status_code=422, detail=f"status must be one of {PRINT_STATUSES}")
    doc = await db.print_orders.find_one({"id": id})
    if not doc:
        raise HTTPException(status_code=404, detail="order not found")
    changes: dict = {"status": input.status, "updated_at": utcnow()}
    sent, info = False, ""
    if input.status == "ready" and doc.get("status") != "ready":
        sent, info = await send_whatsapp(doc["phone"], ready_message(doc))
        if sent:
            changes["whatsapp_sent"] = True
    await db.print_orders.update_one({"id": id}, {"$set": changes})
    doc.update(changes)
    return PrintStatusResult(
        order=print_order_from_doc(dict(doc)),
        whatsapp_sent=sent,
        whatsapp_info=info,
        whatsapp_link=wa_link(doc["phone"], ready_message(doc)),
    )

"""Festival banners (public + owner edit), loyalty customer lookup, and the 7 AM dairy stock email."""
import hmac
import os
from html import escape
from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Query, Request

from lib.dates import today_iso
from lib.db import db
from lib.emailer import EmailError, send_email
from lib.whatsapp import normalize_in_phone
from models.catalog import _aware, product_from_doc, utcnow
from models.growth import Banner, BannerUpdate, Customer, FestivalPage, StockEmailResult, StockItem
from routers.auth import require_owner

router = APIRouter(tags=["growth"])

DEFAULT_BANNERS = [
    Banner(
        id="diwali", festival="Diwali", title="Diwali Gift Collection",
        subtitle="Premium pen sets, gift hampers, diyas & festive wrapping — light up every celebration.",
        cta_label="Shop Diwali Gifts", link="/c/gifts",
        image="https://static.prod-images.emergentagent.com/jobs/a22da722-1531-450f-80dd-4e90a44395d3/images/4bd77361785476a8fc8b02b1d18829cbe8b9ca6e417e11f7054a3a028bce6046.jpeg",
    ),
    Banner(
        id="rakhi", festival="Raksha Bandhan", title="Rakhi Special Gifts",
        subtitle="Beautiful rakhis, chocolates, greeting cards & return gifts for your brothers and sisters.",
        cta_label="Shop Rakhi Gifts", link="/c/gifts",
        image="https://static.prod-images.emergentagent.com/jobs/a22da722-1531-450f-80dd-4e90a44395d3/images/de63241c1a61688d9a9d4ce06c92cee83f35c2776203386a41c5fb23deb59cb7.jpeg",
    ),
    Banner(
        id="ganesh", festival="Ganesh Chaturthi", title="Ganesh Chaturthi Specials",
        subtitle="Eco-friendly idols, puja essentials, decoration items & sweet gift boxes for Bappa's arrival.",
        cta_label="Shop Festive Gifts", link="/c/gifts",
        image="https://static.prod-images.emergentagent.com/jobs/a22da722-1531-450f-80dd-4e90a44395d3/images/0e3d2cb4897a6033419c054aea1a342dec6e933f81e8e2a45b4f5251eec77a81.jpeg",
    ),
    Banner(
        id="christmas", festival="Christmas", title="Christmas Gift Store",
        subtitle="Gift hampers, chocolates, greeting cards, pen sets & wrapping — Secret Santa sorted.",
        cta_label="Shop Christmas Gifts", link="/c/gifts",
        image="https://static.prod-images.emergentagent.com/jobs/a22da722-1531-450f-80dd-4e90a44395d3/images/cc6d0f2d73c59b31267c3da053d7b3eb1e8d6798bb8f9f9c84e51ee15036abef.jpeg",
    ),
    Banner(
        id="newyear", festival="New Year", title="New Year, New Planners",
        subtitle="Diaries, desk calendars, premium pens & gift sets to start the year organised.",
        cta_label="Shop New Year Gifts", link="/c/gifts",
        image="https://static.prod-images.emergentagent.com/jobs/a22da722-1531-450f-80dd-4e90a44395d3/images/e89430eb2c1f42489c2b670bf40d42bf9fccb659f0cdf6fea2188d7063b48eb6.jpeg",
    ),
]
BEVERAGE_SUBS = {"Soft Drinks", "Water Bottles", "Juices", "Energy Drinks"}


# name keywords used to pre-fill each festival's product list the first time it is created
DEFAULT_PICKS = {
    "diwali": ["Gift Set", "Chocolate", "Greeting", "Return Gift", "Art & Craft Gift", "Snack"],
    "rakhi": ["Chocolate", "Greeting", "Return Gift", "Gift Set", "Biscuit"],
    "ganesh": ["Art & Craft Gift", "Wax Crayons", "Oil Pastels", "Drawing Book", "Chocolate", "Greeting"],
    "christmas": ["Gift Set", "Chocolate", "Greeting", "Return Gift", "Art & Craft Gift", "Snack"],
    "newyear": ["Gift Set", "Desk Organizer", "Highlighter", "Sticky Notes", "Spiral Bound", "Calculator", "Greeting"],
}


async def _default_pick_ids(banner_id: str) -> list[str]:
    ids: list[str] = []
    for kw in DEFAULT_PICKS.get(banner_id, []):
        async for p in db.products.find({"name": {"$regex": kw, "$options": "i"}}, {"id": 1}):
            if p["id"] not in ids:
                ids.append(p["id"])
    return ids[:12]


def _with_status(b: Banner, today: str) -> Banner:
    if not b.enabled:
        b.status = "off"
    elif b.start_date and today < b.start_date:
        b.status = "scheduled"
    elif b.end_date and today > b.end_date:
        b.status = "ended"
    else:
        b.status = "live"
    b.live = b.status == "live"
    b.link = f"/festival/{b.id}"
    return b


async def _banners() -> list[Banner]:
    today = today_iso("Asia/Kolkata")
    out = []
    for d in DEFAULT_BANNERS:
        doc = await db.banners.find_one({"id": d.id}, {"_id": 0})
        if not doc:
            doc = {**d.model_dump(exclude={"status", "live"}), "product_ids": await _default_pick_ids(d.id)}
            await db.banners.insert_one(dict(doc))
        elif "product_ids" not in doc:
            doc["product_ids"] = await _default_pick_ids(d.id)
            await db.banners.update_one({"id": d.id}, {"$set": {"product_ids": doc["product_ids"]}})
        out.append(_with_status(Banner(**{**d.model_dump(), **doc}), today))
    return out


@router.get("/banners", response_model=List[Banner])
async def public_banners():
    return [b for b in await _banners() if b.live]


@router.get("/banners/{id}", response_model=FestivalPage)
async def festival_page(id: str):
    banner = next((b for b in await _banners() if b.id == id and b.live), None)
    if not banner:
        raise HTTPException(status_code=404, detail="This festival collection is not running right now")
    docs = await db.products.find({"id": {"$in": banner.product_ids}, "available": {"$ne": False}}).to_list(100)
    order = {pid: i for i, pid in enumerate(banner.product_ids)}
    products = sorted((product_from_doc(d) for d in docs), key=lambda p: order.get(p.id, 0))
    return FestivalPage(banner=banner, products=products)


@router.get("/admin/banners", response_model=List[Banner])
async def admin_banners(owner: dict = Depends(require_owner)):
    return await _banners()


@router.put("/admin/banners/{id}", response_model=Banner)
async def update_banner(id: str, input: BannerUpdate, owner: dict = Depends(require_owner)):
    if id not in {b.id for b in DEFAULT_BANNERS}:
        raise HTTPException(status_code=404, detail="banner not found")
    if input.start_date and input.end_date and input.end_date < input.start_date:
        raise HTTPException(status_code=422, detail="End date must be on or after the start date")
    await _banners()
    data = input.model_dump()
    data["product_ids"] = list(dict.fromkeys(data["product_ids"]))
    await db.banners.update_one({"id": id}, {"$set": data})
    return next(b for b in await _banners() if b.id == id)


# ---------- loyalty ----------

async def award_points(phone: str, name: str, amount: float) -> tuple[int, int]:
    """Returns (earned, balance). 1 point per full Rs.100 on the bill. No-op for invalid phones."""
    digits = normalize_in_phone(phone)
    if len(digits) != 12:
        return 0, 0
    earned = int(amount // 100)
    update: dict = {"$inc": {"points": earned, "total_spent": amount, "visits": 1}, "$set": {"last_visit": utcnow()}}
    if name.strip():
        update["$set"]["name"] = name.strip()
    await db.customers.update_one({"phone": digits}, update, upsert=True)
    doc = await db.customers.find_one({"phone": digits})
    return earned, int(doc.get("points", 0))


@router.get("/customers/lookup", response_model=Customer)
async def lookup_customer(phone: str = Query(min_length=10), owner: dict = Depends(require_owner)):
    doc = await db.customers.find_one({"phone": normalize_in_phone(phone)}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="new customer")
    return Customer(**{**doc, "last_visit": _aware(doc.get("last_visit"))})


@router.get("/customers", response_model=List[Customer])
async def list_customers(owner: dict = Depends(require_owner)):
    docs = await db.customers.find({}, {"_id": 0}).sort("points", -1).to_list(200)
    return [Customer(**{**d, "last_visit": _aware(d.get("last_visit"))}) for d in docs]


# ---------- 7 AM dairy stock email ----------

def _stock_html(date: str, items: list[StockItem]) -> str:
    rows = "".join(
        f'<tr><td style="padding:8px 0;border-bottom:1px solid #F1F5F9">{escape(i.name)}</td>'
        f'<td style="padding:8px 0;border-bottom:1px solid #F1F5F9;text-align:right;font-weight:bold;'
        f'color:{"#DC2626" if i.stock <= 0 else "#EA580C"}">{i.stock}</td>'
        f'<td style="padding:8px 0;border-bottom:1px solid #F1F5F9;text-align:right;color:#64748B">{i.reorder_level}</td></tr>'
        for i in items
    )
    return (
        '<table role="presentation" width="100%" style="background:#FAF5FF;padding:24px 0"><tr><td align="center">'
        '<table role="presentation" width="480" style="background:#ffffff;border-radius:12px;font-family:Arial,sans-serif;padding:24px">'
        '<tr><td style="font-size:20px;font-weight:bold;color:#581C87">H.A.R.M DAILY NEEDS</td></tr>'
        f'<tr><td style="padding-top:4px;color:#64748B">Morning Reorder List &middot; Milk, Dairy &amp; Cool Drinks &middot; {escape(date)}</td></tr>'
        '<tr><td style="padding-top:16px"><table role="presentation" width="100%" style="font-size:14px">'
        '<tr><td style="color:#94A3B8;font-size:12px">ITEM</td><td style="color:#94A3B8;font-size:12px;text-align:right">IN STOCK</td>'
        '<td style="color:#94A3B8;font-size:12px;text-align:right">REORDER AT</td></tr>'
        f'{rows}</table></td></tr>'
        f'<tr><td style="padding-top:14px;color:#475569;font-size:13px">{len(items)} item(s) need reordering before the store opens.</td></tr>'
        '<tr><td style="padding-top:20px;font-size:12px;color:#94A3B8">Sent automatically by H.A.R.M DAILY NEEDS admin panel.</td></tr>'
        '</table></td></tr></table>'
    )


async def build_stock_email() -> StockEmailResult:
    date = today_iso("Asia/Kolkata")
    query = {"$or": [{"category": "Milk & Dairy"}, {"category": "Daily Needs", "subcategory": {"$in": list(BEVERAGE_SUBS)}}]}
    items = [
        StockItem(name=p["name"], stock=int(p.get("stock", 0)), reorder_level=int(p.get("reorder_level", 5)))
        for p in await db.products.find(query, {"_id": 0}).to_list(1000)
        if int(p.get("stock", 0)) <= int(p.get("reorder_level", 5))
    ]
    items.sort(key=lambda i: i.stock)
    settings = await db.settings.find_one({"id": "store"}) or {}
    email = settings.get("report_email", "")
    result = StockEmailResult(date=date, items=items, email_status="")
    if not items:
        result.email_status = "skipped (all dairy items stocked)"
    elif not email:
        result.email_status = "skipped (no email set)"
    else:
        try:
            await send_email(to=email, subject=f"H.A.R.M Reorder List - {date} - {len(items)} dairy item(s) low", html=_stock_html(date, items))
            result.email_status, result.emailed_to = "sent", email
        except (EmailError, ValueError) as exc:
            result.email_status = f"failed: {exc}"
    await db.stock_emails.replace_one({"date": date}, result.model_dump(), upsert=True)
    return result


@router.post("/cron/morning-stock", status_code=202)
async def cron_morning_stock(request: Request, background: BackgroundTasks, authorization: str | None = Header(default=None), x_webhook_id: str | None = Header(default=None)):
    # Cron endpoints must ack 2xx immediately; enqueue/background the actual work.
    secret = os.environ.get("WEBHOOK_CRON_SECRET", "")
    token = authorization[7:] if authorization and authorization.startswith("Bearer ") else ""
    if not secret or not token or not hmac.compare_digest(token, secret):
        raise HTTPException(status_code=401, detail="unauthorized")
    try:
        envelope = await request.json()
    except Exception:
        envelope = {}
    if envelope is not None and not isinstance(envelope, dict):
        raise HTTPException(status_code=400, detail="invalid body")
    run_id = x_webhook_id or (envelope or {}).get("run_id") or ""
    if run_id:
        try:
            await db.cron_runs.insert_one({"run_id": run_id, "created_at": utcnow()})
        except Exception:
            return {"status": "duplicate"}
    background.add_task(build_stock_email)
    return {"status": "accepted"}


@router.post("/reports/morning-stock/run", response_model=StockEmailResult)
async def run_stock_email(owner: dict = Depends(require_owner)):
    return await build_stock_email()

"""Daily milk subscriptions.

Public: list milk products, book a subscription.
Owner: list subscriptions with monthly dues, pause/resume/cancel, record payments, tomorrow's milk list.
Cron (9 PM IST): snapshots tomorrow's list into `milk_days` (the ledger dues are computed from) and emails it.
"""
import hmac
import os
import random
from datetime import datetime, timedelta
from html import escape
from typing import List
from zoneinfo import ZoneInfo

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Request

from lib.dates import today_iso
from lib.db import db
from lib.emailer import EmailError, send_email
from lib.whatsapp import normalize_in_phone
from models.catalog import Product, _aware, product_from_doc, utcnow
from models.milk import (
    MilkDay, MilkFamilyView, MilkList, MilkListLine, MilkLookupInput, MilkOrderLine, MilkPaymentInput, MilkProductCount,
    MilkSkipInput, MilkStatement, MilkSubscribeInput, MilkSubscription, MilkSubscriptionUpdate, MilkSubscriptionView,
    OwnerSkipInput,
)
from routers.auth import require_owner

router = APIRouter(tags=["milk"])
IST = ZoneInfo("Asia/Kolkata")


def _tomorrow() -> str:
    return (datetime.now(IST) + timedelta(days=1)).strftime("%Y-%m-%d")


def _sub(doc: dict) -> MilkSubscription:
    doc = {k: v for k, v in doc.items() if k != "_id"}
    doc["created_at"] = _aware(doc.get("created_at"))
    return MilkSubscription(**doc)


@router.get("/milk/products", response_model=List[Product])
async def milk_products():
    docs = await db.products.find({"category": "Milk & Dairy", "subcategory": "Milk", "available": {"$ne": False}}).to_list(50)
    return [product_from_doc(d) for d in docs]


@router.post("/milk/subscriptions", response_model=MilkSubscription, status_code=201)
async def subscribe(input: MilkSubscribeInput):
    phone = normalize_in_phone(input.phone)
    if len(phone) != 12:
        raise HTTPException(status_code=422, detail="Enter a valid 10-digit mobile number")
    if input.start_date < _tomorrow():
        raise HTTPException(status_code=422, detail="Start date must be tomorrow or later")
    if input.mode == "delivery" and (not input.building.strip() or not input.flat.strip()):
        raise HTTPException(status_code=422, detail="Please enter your building / block and flat number for delivery")
    p = await db.products.find_one({"id": input.product_id, "category": "Milk & Dairy"})
    if not p:
        raise HTTPException(status_code=404, detail="milk product not found")
    if await db.milk_subscriptions.find_one({"phone": phone, "product_id": p["id"], "status": {"$ne": "cancelled"}}):
        raise HTTPException(status_code=409, detail="This number already has a subscription for this milk — WhatsApp us to change it")
    sub = MilkSubscription(
        code=f"M-{random.randint(1000, 9999)}", name=input.name.strip(), phone=phone, product_id=p["id"],
        product_name=p["name"], unit_price=float(p["price"]), qty=input.qty, mode=input.mode,
        building=input.building.strip() if input.mode == "delivery" else "",
        floor=input.floor.strip() if input.mode == "delivery" else "",
        flat=input.flat.strip() if input.mode == "delivery" else "",
        address=input.address.strip() if input.mode == "delivery" else "", start_date=input.start_date,
    )
    await db.milk_subscriptions.insert_one(sub.model_dump())
    return sub


# ---------- owner ----------

@router.get("/admin/milk/subscriptions", response_model=List[MilkSubscriptionView])
async def list_subscriptions(owner: dict = Depends(require_owner)):
    month = today_iso("Asia/Kolkata")[:7]
    subs = [_sub(d) for d in await db.milk_subscriptions.find().sort("created_at", -1).to_list(500)]
    charged: dict[str, float] = {}
    month_pk: dict[str, int] = {}
    month_amt: dict[str, float] = {}
    for d in await db.milk_days.find({}, {"_id": 0}).to_list(50000):
        sid = d["subscription_id"]
        charged[sid] = charged.get(sid, 0) + d["amount"]
        if d["date"].startswith(month):
            month_pk[sid] = month_pk.get(sid, 0) + d["qty"]
            month_amt[sid] = month_amt.get(sid, 0) + d["amount"]
    paid: dict[str, float] = {}
    for pmt in await db.milk_payments.find({}, {"_id": 0}).to_list(50000):
        paid[pmt["subscription_id"]] = paid.get(pmt["subscription_id"], 0) + pmt["amount"]
    out = []
    for s in subs:
        c, pd = charged.get(s.id, 0.0), paid.get(s.id, 0.0)
        out.append(MilkSubscriptionView(**s.model_dump(), month_packets=month_pk.get(s.id, 0), month_amount=month_amt.get(s.id, 0.0),
                                        total_charged=c, total_paid=pd, balance_due=round(c - pd, 2)))
    return out


@router.patch("/admin/milk/subscriptions/{id}", response_model=MilkSubscription)
async def update_subscription(id: str, input: MilkSubscriptionUpdate, owner: dict = Depends(require_owner)):
    changes = input.model_dump(exclude_none=True)
    if not changes:
        raise HTTPException(status_code=422, detail="nothing to update")
    res = await db.milk_subscriptions.find_one_and_update({"id": id}, {"$set": changes}, return_document=True)
    if not res:
        raise HTTPException(status_code=404, detail="subscription not found")
    return _sub(res)


@router.post("/admin/milk/subscriptions/{id}/payments", response_model=MilkSubscriptionView)
async def record_payment(id: str, input: MilkPaymentInput, owner: dict = Depends(require_owner)):
    if not await db.milk_subscriptions.find_one({"id": id}):
        raise HTTPException(status_code=404, detail="subscription not found")
    await db.milk_payments.insert_one({"subscription_id": id, "amount": input.amount, "note": input.note, "date": today_iso("Asia/Kolkata"), "created_at": utcnow()})
    return next(v for v in await list_subscriptions(owner) if v.id == id)


def _floor_key(f: str) -> tuple[int, str]:
    digits = "".join(ch for ch in f if ch.isdigit())
    return (int(digits) if digits else (0 if f.strip().lower() in ("g", "ground", "gf") else 999), f.lower())


async def _order_plan(subscribed: dict[str, int]) -> list[MilkOrderLine]:
    milks = await db.products.find({"category": "Milk & Dairy", "subcategory": "Milk"}).to_list(50)
    since = (datetime.now(IST) - timedelta(days=7)).strftime("%Y-%m-%d")
    today = today_iso("Asia/Kolkata")
    sold: dict[str, int] = {}
    async for t in db.transactions.find({"type": "sale", "product_id": {"$in": [m["id"] for m in milks]}, "recorded_date": {"$gte": since, "$lt": today}}):
        sold[t["product_id"]] = sold.get(t["product_id"], 0) + int(t.get("quantity", 0) or 0)
    plan = []
    for m in milks:
        subs, walk = subscribed.get(m["id"], 0), round(sold.get(m["id"], 0) / 7)
        stock = max(0, int(m.get("stock", 0)))
        if subs or walk or stock:
            plan.append(MilkOrderLine(product_id=m["id"], product_name=m["name"], subscribed=subs, walk_in_avg=walk, in_stock=stock, to_order=max(0, subs + walk - stock)))
    return sorted(plan, key=lambda p: -p.to_order)


async def build_list(date: str) -> MilkList:
    subs = [_sub(d) for d in await db.milk_subscriptions.find({"status": "active", "start_date": {"$lte": date}}).to_list(500)]

    def line(s: MilkSubscription) -> MilkListLine:
        return MilkListLine(subscription_id=s.id, code=s.code, name=s.name, phone=s.phone, product_name=s.product_name, qty=s.qty,
                            mode=s.mode, building=s.building, floor=s.floor, flat=s.flat, address=s.address)

    going = [s for s in subs if date not in s.skip_dates]
    lines = [line(s) for s in going]
    counts: dict[str, int] = {}
    by_id: dict[str, int] = {}
    for s in going:
        counts[s.product_name] = counts.get(s.product_name, 0) + s.qty
        by_id[s.product_id] = by_id.get(s.product_id, 0) + s.qty
    return MilkList(
        date=date, total_packets=sum(counts.values()),
        by_product=[MilkProductCount(product_name=k, packets=v) for k, v in sorted(counts.items())],
        pickups=sorted([l for l in lines if l.mode == "pickup"], key=lambda l: l.name.lower()),
        deliveries=sorted([l for l in lines if l.mode == "delivery"], key=lambda l: ((l.building or l.address).lower(), _floor_key(l.floor), l.flat.lower())),
        skipped=[line(s) for s in subs if date in s.skip_dates],
        order_plan=await _order_plan(by_id),
    )


@router.get("/admin/milk/tomorrow", response_model=MilkList)
async def tomorrow_list(owner: dict = Depends(require_owner)):
    return await build_list(_tomorrow())


def _where(l: MilkListLine) -> str:
    parts = [f"Flat {l.flat}" if l.flat else "", f"Floor {l.floor}" if l.floor else "", l.building, l.address]
    return ", ".join(p for p in parts if p)


def _list_html(m: MilkList) -> str:
    def rows(lines: list[MilkListLine], with_addr: bool) -> str:
        if not lines:
            return '<tr><td style="padding:6px 0;color:#94A3B8">None</td></tr>'
        return "".join(
            f'<tr><td style="padding:6px 0;border-bottom:1px solid #F1F5F9">{escape(l.name)} <span style="color:#94A3B8">({escape(l.code)})</span>'
            + (f'<br><span style="color:#64748B;font-size:12px">{escape(_where(l))}</span>' if with_addr else "")
            + f'</td><td style="padding:6px 0;border-bottom:1px solid #F1F5F9;text-align:right">{escape(l.product_name)} &times; <b>{l.qty}</b></td></tr>'
            for l in lines
        )
    prod = "".join(f'<tr><td style="padding:4px 0">{escape(c.product_name)}</td><td style="text-align:right;font-weight:bold">{c.packets}</td></tr>' for c in m.by_product)
    return (
        '<table role="presentation" width="100%" style="background:#FAF5FF;padding:24px 0"><tr><td align="center">'
        '<table role="presentation" width="480" style="background:#ffffff;border-radius:12px;font-family:Arial,sans-serif;padding:24px;font-size:14px">'
        '<tr><td style="font-size:20px;font-weight:bold;color:#581C87">H.A.R.M DAILY NEEDS</td></tr>'
        f'<tr><td style="padding-top:4px;color:#64748B">Milk List for {escape(m.date)}</td></tr>'
        f'<tr><td style="padding-top:14px;font-size:26px;font-weight:bold;color:#3B0764">{m.total_packets} packets</td></tr>'
        f'<tr><td><table role="presentation" width="100%">{prod}</table></td></tr>'
        '<tr><td style="padding-top:16px;font-weight:bold;color:#581C87">Order from supplier</td></tr>'
        '<tr><td><table role="presentation" width="100%">'
        + "".join(f'<tr><td style="padding:4px 0">{escape(o.product_name)}<br><span style="color:#94A3B8;font-size:12px">{o.subscribed} booked + {o.walk_in_avg} walk-in - {o.in_stock} in stock</span></td>'
                  f'<td style="text-align:right;font-weight:bold;color:#EA580C">{o.to_order}</td></tr>' for o in m.order_plan)
        + '</table></td></tr>'
        f'<tr><td style="padding-top:16px;font-weight:bold;color:#581C87">Home Delivery ({len(m.deliveries)})</td></tr>'
        f'<tr><td><table role="presentation" width="100%">{rows(m.deliveries, True)}</table></td></tr>'
        f'<tr><td style="padding-top:16px;font-weight:bold;color:#581C87">Counter Pickup ({len(m.pickups)})</td></tr>'
        f'<tr><td><table role="presentation" width="100%">{rows(m.pickups, False)}</table></td></tr>'
        '<tr><td style="padding-top:20px;font-size:12px;color:#94A3B8">Sent automatically by H.A.R.M DAILY NEEDS admin panel.</td></tr>'
        '</table></td></tr></table>'
    )


async def lock_and_send(date: str | None = None) -> MilkList:
    """Writes tomorrow's ledger rows (idempotent per date+subscription) and emails the list."""
    date = date or _tomorrow()
    m = await build_list(date)
    subs = {d["id"]: d for d in await db.milk_subscriptions.find({"id": {"$in": [l.subscription_id for l in m.pickups + m.deliveries]}}).to_list(500)}
    await db.milk_days.delete_many({"date": date})  # re-running replaces the snapshot for that day
    await db.milk_locks.update_one({"date": date}, {"$set": {"date": date, "locked_at": utcnow()}}, upsert=True)
    for l in m.pickups + m.deliveries:
        price = float(subs[l.subscription_id]["unit_price"])
        await db.milk_days.insert_one({"date": date, "subscription_id": l.subscription_id, "qty": l.qty, "amount": price * l.qty, "created_at": utcnow()})
    email = ((await db.settings.find_one({"id": "store"})) or {}).get("report_email", "")
    if not m.total_packets:
        m.email_status = "skipped (no milk booked)"
    elif not email:
        m.email_status = "skipped (no email set)"
    else:
        try:
            await send_email(to=email, subject=f"H.A.R.M Milk List - {date} - {m.total_packets} packets", html=_list_html(m))
            m.email_status = "sent"
        except (EmailError, ValueError) as exc:
            m.email_status = f"failed: {exc}"
    return m


@router.post("/admin/milk/tomorrow/send", response_model=MilkList)
async def send_now(owner: dict = Depends(require_owner)):
    return await lock_and_send()


@router.post("/cron/milk-list", status_code=202)
async def cron_milk_list(request: Request, background: BackgroundTasks, authorization: str | None = Header(default=None), x_webhook_id: str | None = Header(default=None)):
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
    background.add_task(lock_and_send)
    return {"status": "accepted"}


# ---------- skip a day + statements ----------

async def _earliest_skip() -> str:
    """Tomorrow can be skipped until its list is locked (9 PM IST or an earlier manual lock)."""
    tomorrow = _tomorrow()
    locked = datetime.now(IST).hour >= 21 or bool(await db.milk_locks.find_one({"date": tomorrow}))
    return (datetime.strptime(tomorrow, "%Y-%m-%d") + timedelta(days=1)).strftime("%Y-%m-%d") if locked else tomorrow


async def _family(input: MilkLookupInput) -> dict:
    doc = await db.milk_subscriptions.find_one({"code": input.code.strip().upper(), "phone": normalize_in_phone(input.phone)})
    if not doc:
        raise HTTPException(status_code=404, detail="No subscription found for this code and mobile number")
    return doc


async def _family_view(doc: dict) -> MilkFamilyView:
    today = today_iso("Asia/Kolkata")
    return MilkFamilyView(code=doc["code"], name=doc["name"], product_name=doc["product_name"], qty=doc["qty"], mode=doc["mode"],
                          status=doc["status"], start_date=doc["start_date"],
                          skip_dates=sorted(d for d in doc.get("skip_dates", []) if d > today), earliest_skip=await _earliest_skip())


@router.post("/milk/lookup", response_model=MilkFamilyView)
async def family_lookup(input: MilkLookupInput):
    return await _family_view(await _family(input))


@router.post("/milk/skip", response_model=MilkFamilyView)
async def family_skip(input: MilkSkipInput):
    doc = await _family(input)
    earliest = await _earliest_skip()
    latest = (datetime.now(IST) + timedelta(days=30)).strftime("%Y-%m-%d")
    if input.date < earliest:
        raise HTTPException(status_code=422, detail="Tomorrow's milk list is already locked — please call the store")
    if input.date > latest:
        raise HTTPException(status_code=422, detail="You can skip up to 30 days ahead")
    op = "$addToSet" if input.skip else "$pull"
    await db.milk_subscriptions.update_one({"id": doc["id"]}, {op: {"skip_dates": input.date}})
    return await _family_view(await db.milk_subscriptions.find_one({"id": doc["id"]}))


@router.post("/admin/milk/subscriptions/{id}/skip", response_model=MilkSubscription)
async def owner_skip(id: str, input: OwnerSkipInput, owner: dict = Depends(require_owner)):
    doc = await db.milk_subscriptions.find_one({"id": id})
    if not doc:
        raise HTTPException(status_code=404, detail="subscription not found")
    op = "$addToSet" if input.skip else "$pull"
    await db.milk_subscriptions.update_one({"id": id}, {op: {"skip_dates": input.date}})
    if await db.milk_locks.find_one({"date": input.date}):  # already charged/locked: keep the ledger in step
        if input.skip:
            await db.milk_days.delete_many({"date": input.date, "subscription_id": id})
        elif doc["status"] == "active" and doc["start_date"] <= input.date and not await db.milk_days.find_one({"date": input.date, "subscription_id": id}):
            await db.milk_days.insert_one({"date": input.date, "subscription_id": id, "qty": doc["qty"], "amount": float(doc["unit_price"]) * doc["qty"], "created_at": utcnow()})
    return _sub(await db.milk_subscriptions.find_one({"id": id}))


@router.get("/admin/milk/subscriptions/{id}/statement", response_model=MilkStatement)
async def statement(id: str, month: str | None = None, owner: dict = Depends(require_owner)):
    month = month or today_iso("Asia/Kolkata")[:7]
    if len(month) != 7 or month[4] != "-":
        raise HTTPException(status_code=422, detail="month must be YYYY-MM")
    view = next((v for v in await list_subscriptions(owner) if v.id == id), None)
    if not view:
        raise HTTPException(status_code=404, detail="subscription not found")
    days = [MilkDay(date=d["date"], qty=d["qty"], amount=d["amount"])
            for d in await db.milk_days.find({"subscription_id": id, "date": {"$regex": f"^{month}"}}).sort("date", 1).to_list(40)]
    paid = sum(p["amount"] for p in await db.milk_payments.find({"subscription_id": id, "date": {"$regex": f"^{month}"}}).to_list(500))
    return MilkStatement(subscription=view, month=month, days=days, packets=sum(d.qty for d in days),
                         amount=sum(d.amount for d in days), paid_in_month=paid, balance_due=view.balance_due)

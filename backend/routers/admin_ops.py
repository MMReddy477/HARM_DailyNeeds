"""POS bills, bulk product updates and the admin overview (KPIs, charts, notifications)."""
import random
from datetime import datetime, timedelta
from typing import List
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from lib.dates import today_iso
from lib.db import db
from models.catalog import utcnow
from models.extras import Bill, BillCreate, BulkUpdate, Notice, Overview, Purchase, PurchaseCreate
from routers.auth import require_owner
from routers.growth import award_points

router = APIRouter(tags=["admin-ops"])
IST = ZoneInfo("Asia/Kolkata")
SCHOOL_CATS = {"Stationery", "Note Books", "Office Supplies"}
BEVERAGE_SUBS = {"Soft Drinks", "Water Bottles", "Juices", "Energy Drinks"}
UNITS = [
    ("school", "School & Office Supplies"),
    ("dairy", "Dairy & Beverages"),
    ("gifts", "Gift Items"),
    ("xerox", "Xerox & Printing"),
    ("money", "Money Transfer"),
]


def _sum(rows: list[dict], key: str) -> float:
    return float(sum(float(r.get(key, 0) or 0) for r in rows))


@router.post("/bills", response_model=Bill, status_code=201)
async def create_bill(input: BillCreate, owner: dict = Depends(require_owner)):
    settings = await db.settings.find_one({"id": "store"}) or {}
    tax_pct = float(settings.get("tax_percent", 0) or 0)
    lines = []
    # validate stock first so a bill is all-or-nothing
    for line in input.items:
        if line.product_id:
            p = await db.products.find_one({"id": line.product_id})
            if not p:
                raise HTTPException(status_code=404, detail="product not found")
            if int(p.get("stock", 0)) < line.qty:
                raise HTTPException(status_code=400, detail=f"Only {p.get('stock', 0)} left of {p['name']}")
            line.name, line.price = p["name"], float(p["price"])
            line.cost = float(p.get("cost_price", 0) or 0)
            lines.append((line, p))
        else:
            if not line.service or line.price <= 0:
                raise HTTPException(status_code=422, detail="service lines need a service and price")
            lines.append((line, None))
    subtotal = sum(l.price * l.qty for l, _ in lines)
    tax = round(subtotal * tax_pct / 100, 2)
    date = today_iso("Asia/Kolkata")
    bill = Bill(
        number=f"HARM-{datetime.now(IST).strftime('%y%m%d')}-{random.randint(100, 999)}",
        items=[l for l, _ in lines],
        subtotal=subtotal,
        tax=tax,
        total=round(subtotal + tax, 2),
        profit=sum((l.price - l.cost) * l.qty for l, _ in lines),
        customer_name=input.customer_name.strip(),
        customer_phone=input.customer_phone.strip(),
        payment_mode=input.payment_mode,
        recorded_date=date,
    )
    for line, p in lines:
        if p:
            await db.products.update_one({"id": p["id"]}, {"$inc": {"stock": -line.qty}, "$set": {"updated_at": utcnow()}})
        await db.transactions.insert_one(
            {
                "id": f"{bill.id}-{len(line.name)}-{random.randint(0, 99999)}",
                "type": "sale" if p else line.service,
                "amount": line.price * line.qty,
                "quantity": line.qty,
                "description": f"Bill {bill.number}",
                "product_id": p["id"] if p else "",
                "product_name": line.name if p else "",
                "category": p.get("category", "") if p else "",
                "cost": line.cost * line.qty,
                "customer_name": bill.customer_name,
                "transfer_amount": 0,
                "bill_id": bill.id,
                "recorded_date": date,
                "created_at": utcnow(),
            }
        )
    if bill.customer_phone:
        bill.points_earned, bill.points_balance = await award_points(bill.customer_phone, bill.customer_name, bill.total)
    await db.bills.insert_one(bill.model_dump())
    return bill


@router.get("/bills", response_model=List[Bill])
async def list_bills(owner: dict = Depends(require_owner)):
    docs = await db.bills.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [Bill(**d) for d in docs]


@router.get("/bills/{id}/pdf")
async def bill_pdf(id: str, owner: dict = Depends(require_owner)):
    from fpdf import FPDF

    doc = await db.bills.find_one({"id": id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="bill not found")
    b = Bill(**doc)
    pdf = FPDF(format=(80, 200))
    pdf.set_margins(5, 5, 5)
    pdf.add_page()
    pdf.set_font("helvetica", "B", 12)
    pdf.cell(0, 6, "H.A.R.M DAILY NEEDS", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("helvetica", "", 7)
    pdf.multi_cell(0, 3.5, "Bandlaguda Jagir, Hyderabad | +91 8374778183", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(1)
    pdf.cell(0, 4, f"Bill: {b.number}   Date: {b.recorded_date}", new_x="LMARGIN", new_y="NEXT")
    if b.customer_name:
        pdf.cell(0, 4, f"Customer: {b.customer_name}", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 2, "-" * 60, new_x="LMARGIN", new_y="NEXT")
    for it in b.items:
        pdf.cell(44, 4, it.name[:30])
        pdf.cell(8, 4, f"x{it.qty}")
        pdf.cell(0, 4, f"Rs.{it.price * it.qty:,.0f}", align="R", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 2, "-" * 60, new_x="LMARGIN", new_y="NEXT")
    if b.tax:
        pdf.cell(0, 4, f"Tax: Rs.{b.tax:,.2f}", align="R", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("helvetica", "B", 10)
    pdf.cell(0, 6, f"TOTAL: Rs.{b.total:,.2f}  ({b.payment_mode.upper()})", align="R", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("helvetica", "", 7)
    pdf.cell(0, 5, "Thank you! Visit again.", align="C", new_x="LMARGIN", new_y="NEXT")
    return Response(content=bytes(pdf.output()), media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{b.number}.pdf"'})


@router.post("/products/bulk")
async def bulk_update(input: BulkUpdate, owner: dict = Depends(require_owner)) -> dict:
    filt = {"id": {"$in": input.ids}}
    if input.delete:
        res = await db.products.delete_many(filt)
        return {"affected": res.deleted_count}
    update: dict = {"$set": {"updated_at": utcnow()}}
    if input.available is not None:
        update["$set"]["available"] = input.available
    if input.category:
        update["$set"]["category"] = input.category
        update["$set"]["subcategory"] = ""
    if input.stock_delta:
        update["$inc"] = {"stock": input.stock_delta}
    res = await db.products.update_many(filt, update)
    if input.stock_delta and input.stock_delta < 0:
        await db.products.update_many({**filt, "stock": {"$lt": 0}}, {"$set": {"stock": 0}})
    return {"affected": res.modified_count}


@router.get("/admin/overview", response_model=Overview)
async def overview(owner: dict = Depends(require_owner)):
    now = datetime.now(IST)
    today = now.strftime("%Y-%m-%d")
    month = today[:7]
    since = (now - timedelta(days=185)).strftime("%Y-%m-%d")
    txns = await db.transactions.find({"recorded_date": {"$gte": since}}, {"_id": 0}).to_list(20000)
    products = await db.products.find({}, {"_id": 0}).to_list(2000)

    t_today = [t for t in txns if t["recorded_date"] == today]
    t_month = [t for t in txns if t["recorded_date"].startswith(month)]
    profit = lambda rows: _sum(rows, "amount") - _sum(rows, "cost")  # noqa: E731
    mt = lambda rows: [t for t in rows if t["type"] == "money-transfer"]  # noqa: E731

    daily = []
    for off in range(29, -1, -1):
        d = (now - timedelta(days=off)).strftime("%Y-%m-%d")
        rows = [t for t in txns if t["recorded_date"] == d]
        daily.append({"date": d, "revenue": _sum(rows, "amount"), "profit": profit(rows)})
    monthly = []
    for off in range(5, -1, -1):
        m = (now.replace(day=1) - timedelta(days=off * 30)).strftime("%Y-%m")
        rows = [t for t in txns if t["recorded_date"].startswith(m)]
        if not any(x["month"] == m for x in monthly):
            monthly.append({"month": m, "revenue": _sum(rows, "amount"), "profit": profit(rows)})

    cats: dict[str, dict] = {}
    tops: dict[str, dict] = {}
    for t in t_month:
        if t["type"] == "sale":
            c = cats.setdefault(t.get("category") or "Other", {"category": t.get("category") or "Other", "revenue": 0.0, "qty": 0})
            c["revenue"] += t["amount"]; c["qty"] += t["quantity"]
            p = tops.setdefault(t.get("product_name") or "?", {"name": t.get("product_name") or "?", "revenue": 0.0, "qty": 0})
            p["revenue"] += t["amount"]; p["qty"] += t["quantity"]

    low = [p for p in products if 0 < p.get("stock", 0) <= p.get("reorder_level", 5)]
    out = [p for p in products if p.get("stock", 0) <= 0]
    notices: list[Notice] = [Notice(kind="out-of-stock", title=p["name"], detail="Out of stock") for p in out[:10]]
    notices += [Notice(kind="low-stock", title=p["name"], detail=f"Only {p['stock']} remaining") for p in sorted(low, key=lambda x: x["stock"])[:10]]
    soon = (now + timedelta(days=2)).strftime("%Y-%m-%d")
    notices += [Notice(kind="expiry", title=p["name"], detail=f"Expires {p['expiry_date']}") for p in products if p.get("expiry_date") and p["expiry_date"] <= soon]
    async for pc in db.price_changes.find().sort("created_at", -1).limit(5):
        notices.append(Notice(kind="price-change", title=pc["name"], detail=f"Price Rs.{pc['old']} -> Rs.{pc['new']}"))
    async for r in db.reviews.find({"created_at": {"$gte": utcnow() - timedelta(days=3)}}).sort("created_at", -1).limit(5):
        notices.append(Notice(kind="review", title=f"New {r['rating']}-star review", detail=f"{r['name']}: {r['comment'][:60]}"))
    notices.append(Notice(kind="summary", title="Today's summary", detail=f"Rs.{_sum(t_today, 'amount'):,.0f} sales, Rs.{profit(t_today):,.0f} profit, {len(t_today)} entries"))

    bills_today = await db.bills.count_documents({"recorded_date": today})
    walkins = len([t for t in t_today if not t.get("bill_id")])

    # ---- business units: School & Office vs Dairy & Beverages vs Xerox vs Money Transfer
    pmap = {p["id"]: p for p in products}

    def unit_of(t: dict) -> str:
        if t["type"] in ("xerox-bw", "xerox-bw-2side", "xerox-color", "print", "scan", "lamination", "binding", "photo-print"):
            return "xerox"
        if t["type"] == "money-transfer":
            return "money"
        p = pmap.get(t.get("product_id", ""), {})
        cat = t.get("category") or p.get("category", "")
        if cat == "Gift Shop":
            return "gifts"
        if cat == "Milk & Dairy" or (cat == "Daily Needs" and p.get("subcategory") in BEVERAGE_SUBS):
            return "dairy"
        return "school" if cat in SCHOOL_CATS else "other"

    def prod_unit(p: dict) -> str:
        if p.get("category") == "Gift Shop":
            return "gifts"
        if p.get("category") == "Milk & Dairy" or (p.get("category") == "Daily Needs" and p.get("subcategory") in BEVERAGE_SUBS):
            return "dairy"
        return "school" if p.get("category") in SCHOOL_CATS else "other"

    units = []
    for uid, label in UNITS:
        td = [t for t in t_today if unit_of(t) == uid]
        mo = [t for t in t_month if unit_of(t) == uid]
        units.append({"id": uid, "label": label, "today": _sum(td, "amount"), "month": _sum(mo, "amount"),
                      "today_profit": profit(td), "month_profit": profit(mo),
                      "sold_today": int(sum(t["quantity"] for t in td if t["type"] == "sale")),
                      "products": len([p for p in products if prod_unit(p) == uid])})
    snapshot = []
    for uid, label in (("school", "School & Office Supplies"), ("dairy", "Milk, Dairy & Beverages"), ("gifts", "Gift Items"), ("other", "Daily Needs")):
        ps = [p for p in products if prod_unit(p) == uid]
        snapshot.append({"label": label, "items": int(sum(max(p.get("stock", 0), 0) for p in ps)),
                         "value": float(sum(float(p.get("cost_price") or 0) * max(p.get("stock", 0), 0) for p in ps))})
    gift_categories: dict[str, dict] = {}
    for t in t_month:
        if t["type"] != "sale":
            continue
        p = pmap.get(t.get("product_id", ""), {})
        if (t.get("category") or p.get("category", "")) != "Gift Shop":
            continue
        subcategory = p.get("subcategory") or "Other Gift Items"
        row = gift_categories.setdefault(
            subcategory,
            {"category": subcategory, "revenue": 0.0, "profit": 0.0, "qty": 0},
        )
        row["revenue"] += float(t.get("amount", 0) or 0)
        row["profit"] += float(t.get("amount", 0) or 0) - float(t.get("cost", 0) or 0)
        row["qty"] += int(t.get("quantity", 0) or 0)
    payments = {"cash": 0.0, "upi": 0.0, "card": 0.0}
    async for b in db.bills.find({"recorded_date": today}):
        payments[b.get("payment_mode", "cash")] = payments.get(b.get("payment_mode", "cash"), 0) + float(b.get("total", 0))
    payments["cash"] += _sum([t for t in t_today if not t.get("bill_id")], "amount")
    activity = []
    for t in sorted(t_today, key=lambda x: x.get("created_at") or utcnow(), reverse=True)[:15]:
        ca = t.get("created_at")
        tm = ca.replace(tzinfo=ZoneInfo("UTC")).astimezone(IST).strftime("%I:%M %p") if ca else ""
        label = t.get("product_name") or {"money-transfer": "Money Transfer Commission"}.get(t["type"], t["type"].replace("-", " ").title())
        activity.append({"time": tm, "label": label, "amount": float(t["amount"])})
    ranked = sorted(tops.values(), key=lambda p: -p["revenue"])
    sold_ids = {t.get("product_id") for t in t_month if t["type"] == "sale"}
    unsold = [p["name"] for p in products if p["id"] not in sold_ids and p.get("available", True)]
    return Overview(
        today_sales=_sum(t_today, "amount"),
        today_profit=profit(t_today),
        month_revenue=_sum(t_month, "amount"),
        month_profit=profit(t_month),
        total_products=len(products),
        inventory_value=float(sum(float(p.get("cost_price") or p.get("price", 0)) * max(p.get("stock", 0), 0) for p in products)),
        products_sold_today=int(sum(t["quantity"] for t in t_today if t["type"] == "sale")),
        customers_served=bills_today + walkins,
        low_stock_count=len(low),
        out_of_stock_count=len(out),
        today_commission=_sum(mt(t_today), "amount"),
        month_commission=_sum(mt(t_month), "amount"),
        transfer_count=len(mt(txns)),
        daily=daily,
        monthly=monthly,
        categories=sorted(cats.values(), key=lambda c: -c["revenue"]),
        gift_categories=sorted(gift_categories.values(), key=lambda c: -c["revenue"])[:8],
        top_products=ranked[:8],
        notices=notices,
        bills_today=bills_today,
        units=units,
        payments=payments,
        activity=activity,
        snapshot=snapshot,
        best_product=ranked[0]["name"] if ranked else "",
        worst_product=(unsold[0] + " (no sales)") if unsold else (ranked[-1]["name"] if ranked else ""),
    )


@router.post("/purchases", response_model=Purchase, status_code=201)
async def create_purchase(input: PurchaseCreate, owner: dict = Depends(require_owner)):
    p = await db.products.find_one({"id": input.product_id})
    if not p:
        raise HTTPException(status_code=404, detail="product not found")
    unit_cost = round(input.cost_total / input.qty, 2)
    await db.products.update_one({"id": p["id"]}, {"$inc": {"stock": input.qty}, "$set": {"cost_price": unit_cost, "updated_at": utcnow()}})
    obj = Purchase(product_id=p["id"], product_name=p["name"], qty=input.qty, cost_total=input.cost_total,
                   unit_cost=unit_cost, vendor=input.vendor.strip(), recorded_date=today_iso("Asia/Kolkata"))
    await db.purchases.insert_one(obj.model_dump())
    return obj


@router.get("/purchases", response_model=List[Purchase])
async def list_purchases(owner: dict = Depends(require_owner)):
    return [Purchase(**d) for d in await db.purchases.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)]

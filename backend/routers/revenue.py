"""Service-revenue transactions (xerox, printing, money transfer, product sales),
analytics aggregation and Excel/PDF report exports. All owner-only."""
import io
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from lib.db import db
from lib.dates import today_iso
from models.catalog import product_from_doc, utcnow
from models.ops import (
    Analytics,
    CategorySlice,
    DailyPoint,
    TopProduct,
    Transaction,
    TransactionCreate,
    TypeTotal,
    transaction_from_doc,
)
from routers.auth import require_owner

router = APIRouter(tags=["revenue"])

SERVICE_TYPES: dict[str, str] = {
    "sale": "Product Sale",
    "xerox-bw": "B&W Xerox",
    "xerox-bw-2side": "B&W Xerox (Both Sides)",
    "xerox-color": "Color Xerox",
    "print": "Printout",
    "scan": "Scanning",
    "lamination": "Lamination",
    "binding": "Spiral Binding",
    "photo-print": "Photo Printing",
    "money-transfer": "Money Transfer",
}

IST = ZoneInfo("Asia/Kolkata")


def _ist_today() -> str:
    # The store's "today" is IST, not the pod's UTC clock.
    return today_iso("Asia/Kolkata")


@router.post("/revenue", response_model=Transaction, status_code=201)
async def create_transaction(input: TransactionCreate, owner: dict = Depends(require_owner)):
    if input.type not in SERVICE_TYPES:
        raise HTTPException(status_code=422, detail=f"unknown service type: {input.type}")
    doc = input.model_dump()
    if input.type == "sale" and input.product_id:
        product = await db.products.find_one({"id": input.product_id})
        if not product:
            raise HTTPException(status_code=404, detail="product not found")
        if int(product.get("stock", 0)) < input.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"insufficient stock: only {product.get('stock', 0)} left",
            )
        doc["product_name"] = product["name"]
        doc["category"] = product.get("category", "")
        doc["cost"] = float(product.get("cost_price", 0) or 0) * input.quantity
        await db.products.update_one(
            {"id": input.product_id},
            {"$inc": {"stock": -input.quantity}, "$set": {"updated_at": utcnow()}},
        )
    doc["recorded_date"] = _ist_today()
    obj = Transaction(**doc)
    await db.transactions.insert_one(obj.model_dump())
    return obj


@router.get("/revenue", response_model=list[Transaction])
async def list_transactions(
    type: str | None = None,
    date: str | None = None,
    owner: dict = Depends(require_owner),
):
    filt: dict = {}
    if type:
        filt["type"] = type
    if date:
        filt["recorded_date"] = date
    docs = await db.transactions.find(filt).sort("created_at", -1).to_list(500)
    return [transaction_from_doc(d) for d in docs]


@router.get("/revenue/summary", response_model=Analytics)
async def revenue_summary(owner: dict = Depends(require_owner)):
    today = _ist_today()
    month_prefix = today[:7]

    today_row = (
        await db.transactions.aggregate(
            [
                {"$match": {"recorded_date": today}},
                {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}},
            ]
        ).to_list(1)
        or [{}]
    )[0]
    month_row = (
        await db.transactions.aggregate(
            [
                {"$match": {"recorded_date": {"$regex": f"^{month_prefix}"}}},
                {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}},
            ]
        ).to_list(1)
        or [{}]
    )[0]

    by_type_docs = await db.transactions.aggregate(
        [
            {"$group": {"_id": "$type", "total": {"$sum": "$amount"}, "count": {"$sum": 1}}},
            {"$sort": {"total": -1}},
        ]
    ).to_list(50)

    start_date = (datetime.now(IST) - timedelta(days=13)).strftime("%Y-%m-%d")
    series_docs = await db.transactions.aggregate(
        [
            {"$match": {"recorded_date": {"$gte": start_date}}},
            {"$group": {"_id": "$recorded_date", "total": {"$sum": "$amount"}}},
        ]
    ).to_list(50)
    series_map = {d["_id"]: float(d.get("total", 0)) for d in series_docs}
    now_ist = datetime.now(IST)
    daily_series = [
        DailyPoint(
            date=(now_ist - timedelta(days=offset)).strftime("%Y-%m-%d"),
            amount=series_map.get((now_ist - timedelta(days=offset)).strftime("%Y-%m-%d"), 0.0),
        )
        for offset in range(13, -1, -1)
    ]

    top_docs = await db.transactions.aggregate(
        [
            {"$match": {"type": "sale"}},
            {
                "$group": {
                    "_id": "$product_name",
                    "qty": {"$sum": "$quantity"},
                    "amount": {"$sum": "$amount"},
                }
            },
            {"$sort": {"amount": -1}},
            {"$limit": 5},
        ]
    ).to_list(5)

    dist_docs = await db.transactions.aggregate(
        [
            {"$match": {"type": "sale", "category": {"$ne": ""}}},
            {
                "$group": {
                    "_id": "$category",
                    "qty": {"$sum": "$quantity"},
                    "amount": {"$sum": "$amount"},
                }
            },
            {"$sort": {"amount": -1}},
        ]
    ).to_list(20)

    low_stock_docs = await db.products.find({"stock": {"$lte": 5}}).sort("stock", 1).to_list(10)

    return Analytics(
        today_total=float(today_row.get("total", 0) or 0),
        today_count=int(today_row.get("count", 0) or 0),
        month_total=float(month_row.get("total", 0) or 0),
        by_type=[
            TypeTotal(
                type=d["_id"],
                label=SERVICE_TYPES.get(d["_id"], d["_id"]),
                total=float(d.get("total", 0)),
                count=int(d.get("count", 0)),
            )
            for d in by_type_docs
        ],
        daily_series=daily_series,
        top_products=[
            TopProduct(name=d["_id"], qty=int(d.get("qty", 0)), amount=float(d.get("amount", 0)))
            for d in top_docs
        ],
        category_distribution=[
            CategorySlice(
                category=d["_id"], qty=int(d.get("qty", 0)), amount=float(d.get("amount", 0))
            )
            for d in dist_docs
        ],
        low_stock=[product_from_doc(d) for d in low_stock_docs],
    )


@router.get("/export/excel")
async def export_excel(owner: dict = Depends(require_owner)):
    import openpyxl

    wb = openpyxl.Workbook()

    ws = wb.active
    ws.title = "Products"
    ws.append(["Name", "Category", "Subcategory", "Brand", "Price", "Stock", "Best Seller", "New", "Available"])
    async for p in db.products.find().sort([("category", 1), ("name", 1)]):
        ws.append(
            [
                p.get("name", ""),
                p.get("category", ""),
                p.get("subcategory", ""),
                p.get("brand", ""),
                p.get("price", 0),
                p.get("stock", 0),
                "Yes" if p.get("is_best_seller") else "",
                "Yes" if p.get("is_new") else "",
                "Yes" if p.get("available", True) else "No",
            ]
        )

    ws2 = wb.create_sheet("Revenue Log")
    ws2.append(["Date", "Service", "Description", "Product", "Quantity", "Amount (Rs)"])
    async for t in db.transactions.find().sort("created_at", -1).limit(1000):
        ws2.append(
            [
                t.get("recorded_date", ""),
                SERVICE_TYPES.get(t.get("type", ""), t.get("type", "")),
                t.get("description", ""),
                t.get("product_name", ""),
                t.get("quantity", 1),
                t.get("amount", 0),
            ]
        )

    ws3 = wb.create_sheet("Reviews")
    ws3.append(["Name", "Rating", "Comment", "Date"])
    async for r in db.reviews.find().sort("created_at", -1).limit(1000):
        ws3.append([r.get("name", ""), r.get("rating", 0), r.get("comment", ""), str(r.get("created_at", ""))])

    buf = io.BytesIO()
    wb.save(buf)
    filename = f"harm-report-{_ist_today()}.xlsx"
    return Response(
        content=buf.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export/pdf")
async def export_pdf(owner: dict = Depends(require_owner)):
    from fpdf import FPDF

    pdf = FPDF()
    pdf.add_page()

    # purple brand header
    pdf.set_fill_color(88, 28, 135)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("helvetica", "B", 20)
    pdf.cell(0, 16, "H.A.R.M DAILY NEEDS", new_x="LMARGIN", new_y="NEXT", fill=True)
    pdf.set_font("helvetica", "", 10)
    pdf.cell(
        0,
        9,
        "Business Report  |  " + _ist_today() + "  |  Bandlaguda Jagir, Hyderabad",
        new_x="LMARGIN",
        new_y="NEXT",
        fill=True,
    )
    pdf.ln(6)
    pdf.set_text_color(30, 27, 75)

    today = _ist_today()
    month_prefix = today[:7]
    total_today = (
        await db.transactions.aggregate(
            [{"$match": {"recorded_date": today}}, {"$group": {"_id": None, "t": {"$sum": "$amount"}}}]
        ).to_list(1)
        or [{}]
    )[0]
    total_month = (
        await db.transactions.aggregate(
            [
                {"$match": {"recorded_date": {"$regex": f"^{month_prefix}"}}},
                {"$group": {"_id": None, "t": {"$sum": "$amount"}}},
            ]
        ).to_list(1)
        or [{}]
    )[0]
    product_count = await db.products.count_documents({})
    review_count = await db.reviews.count_documents({})

    pdf.set_font("helvetica", "B", 14)
    pdf.cell(0, 10, "Revenue Summary", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("helvetica", "", 11)
    pdf.cell(0, 8, f"Today ({today}): Rs. {float(total_today.get('t', 0) or 0):,.0f}", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 8, f"This month ({month_prefix}): Rs. {float(total_month.get('t', 0) or 0):,.0f}", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    pdf.set_font("helvetica", "B", 14)
    pdf.cell(0, 10, "Revenue by Service (all time)", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("helvetica", "", 11)
    by_type = await db.transactions.aggregate(
        [
            {"$group": {"_id": "$type", "total": {"$sum": "$amount"}, "count": {"$sum": 1}}},
            {"$sort": {"total": -1}},
        ]
    ).to_list(50)
    if not by_type:
        pdf.cell(0, 8, "No revenue entries yet.", new_x="LMARGIN", new_y="NEXT")
    for row in by_type:
        label = SERVICE_TYPES.get(row["_id"], row["_id"])
        pdf.cell(0, 8, f"{label}: Rs. {float(row.get('total', 0)):,.0f}  ({row.get('count', 0)} entries)", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    pdf.set_font("helvetica", "B", 14)
    pdf.cell(0, 10, "Inventory Snapshot", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("helvetica", "", 11)
    pdf.cell(0, 8, f"Products in catalog: {product_count}  |  Customer reviews: {review_count}", new_x="LMARGIN", new_y="NEXT")
    low = await db.products.find({"stock": {"$lte": 5}}).sort("stock", 1).to_list(20)
    if low:
        pdf.set_font("helvetica", "B", 12)
        pdf.cell(0, 10, "Low Stock Alerts (<= 5 units)", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("helvetica", "", 11)
        for p in low:
            pdf.cell(0, 8, f"{p.get('name', '')} - {p.get('stock', 0)} left", new_x="LMARGIN", new_y="NEXT")

    filename = f"harm-report-{today}.pdf"
    return Response(
        content=bytes(pdf.output()),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

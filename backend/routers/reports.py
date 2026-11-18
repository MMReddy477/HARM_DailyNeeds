"""Nightly closing report: platform cron -> /api/cron/closing-report (bearer auth),
plus owner routes for settings, history and a manual 'send now'."""
import hmac
import logging
import os
from html import escape
from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Request

from lib.dates import today_iso
from lib.db import db
from lib.emailer import EmailError, send_email
from lib.whatsapp import twilio_configured
from models.catalog import utcnow
from models.extras import ClosingReport, StoreSettings, report_from_doc
from routers.auth import require_owner

router = APIRouter(tags=["reports"])
logger = logging.getLogger(__name__)

XEROX = {"xerox-bw", "xerox-bw-2side", "xerox-color"}
PRINTING = {"print", "scan", "lamination", "binding", "photo-print"}


async def _settings() -> dict:
    return await db.settings.find_one({"id": "store"}) or {}


def _email_html(r: ClosingReport) -> str:
    def row(label: str, value: float) -> str:
        return (f'<tr><td style="padding:8px 0;color:#475569">{escape(label)}</td>'
                f'<td style="padding:8px 0;text-align:right;font-weight:bold;color:#3B0764">Rs. {value:,.0f}</td></tr>')

    return (
        '<table role="presentation" width="100%" style="background:#FAF5FF;padding:24px 0">'
        '<tr><td align="center"><table role="presentation" width="480" style="background:#ffffff;'
        'border-radius:12px;font-family:Arial,sans-serif;padding:24px">'
        '<tr><td style="font-size:20px;font-weight:bold;color:#581C87">H.A.R.M DAILY NEEDS</td></tr>'
        f'<tr><td style="padding-top:4px;color:#64748B">Daily Closing Report &middot; {escape(r.date)}</td></tr>'
        '<tr><td style="padding-top:16px"><table role="presentation" width="100%">'
        + row("Product Sales", r.sales) + row("Xerox", r.xerox) + row("Printing & Services", r.printing)
        + row("Money Transfer", r.money_transfer)
        + f'<tr><td style="padding:12px 0;border-top:2px solid #E9D5FF;font-weight:bold">Total</td>'
          f'<td style="padding:12px 0;border-top:2px solid #E9D5FF;text-align:right;font-size:18px;'
          f'font-weight:bold;color:#581C87">Rs. {r.total:,.0f}</td></tr></table></td></tr>'
        f'<tr><td style="color:#475569;font-size:13px">{r.entries} entries recorded &middot; '
        f'{r.print_orders} online print orders received</td></tr>'
        '<tr><td style="padding-top:20px;font-size:12px;color:#94A3B8">Sent automatically by H.A.R.M DAILY NEEDS '
        'admin panel. We never ask for your password or payment details by email.</td></tr>'
        '</table></td></tr></table>'
    )


async def build_and_send(date: str | None = None, run_id: str | None = None) -> ClosingReport:
    date = date or today_iso("Asia/Kolkata")
    rows = await db.transactions.aggregate(
        [{"$match": {"recorded_date": date}}, {"$group": {"_id": "$type", "t": {"$sum": "$amount"}, "n": {"$sum": 1}}}]
    ).to_list(50)
    by = {r["_id"]: float(r["t"]) for r in rows}
    day_start = f"{date}T00:00:00"
    print_count = sum(
        1 for d in await db.print_orders.find({}, {"created_at": 1}).to_list(2000)
        if d.get("created_at") and d["created_at"].isoformat()[:10] == date
    )
    report = ClosingReport(
        date=date,
        sales=by.get("sale", 0.0),
        xerox=sum(v for k, v in by.items() if k in XEROX),
        printing=sum(v for k, v in by.items() if k in PRINTING),
        money_transfer=by.get("money-transfer", 0.0),
        total=sum(by.values()),
        entries=sum(int(r["n"]) for r in rows),
        print_orders=print_count,
    )
    _ = day_start
    email = (await _settings()).get("report_email", "")
    if email:
        try:
            await send_email(to=email, subject=f"H.A.R.M Closing Report - {date} - Rs. {report.total:,.0f}", html=_email_html(report))
            report.email_status, report.emailed_to = "sent", email
        except (EmailError, ValueError) as exc:
            report.email_status = f"failed: {exc}"
    else:
        report.email_status = "skipped (no email set)"
    doc = report.model_dump()
    if run_id:
        doc["run_id"] = run_id
    await db.reports.replace_one({"date": date}, doc, upsert=True)  # one report per day
    return report


@router.post("/cron/closing-report", status_code=202)
async def cron_closing_report(request: Request, background: BackgroundTasks, authorization: str | None = Header(default=None), x_webhook_id: str | None = Header(default=None)):
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
            return {"status": "duplicate"}  # unique index on run_id
    background.add_task(build_and_send, None, run_id or None)
    return {"status": "accepted"}


@router.get("/reports", response_model=List[ClosingReport])
async def list_reports(owner: dict = Depends(require_owner)):
    docs = await db.reports.find().sort("date", -1).to_list(60)
    return [report_from_doc(d) for d in docs]


@router.post("/reports/run", response_model=ClosingReport)
async def run_report_now(owner: dict = Depends(require_owner)):
    return await build_and_send()


@router.get("/settings", response_model=StoreSettings)
async def get_settings(owner: dict = Depends(require_owner)):
    s = await _settings()
    s.pop("_id", None)
    s.pop("id", None)
    base = StoreSettings(**s).model_dump()
    base["rates"] = {**StoreSettings().rates, **s.get("rates", {})}
    base["whatsapp_auto"] = twilio_configured()
    return StoreSettings(**base)


@router.put("/settings", response_model=StoreSettings)
async def put_settings(input: StoreSettings, owner: dict = Depends(require_owner)):
    email = input.report_email.strip()
    if email and ("@" not in email or "." not in email.split("@")[-1] or len(email) > 120):
        raise HTTPException(status_code=422, detail="Enter a valid email address")
    data = input.model_dump(exclude={"whatsapp_auto"})
    data["report_email"] = email
    await db.settings.update_one({"id": "store"}, {"$set": data}, upsert=True)
    return StoreSettings(**data, whatsapp_auto=twilio_configured())

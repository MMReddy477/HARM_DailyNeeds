"""Automatic WhatsApp via Twilio's Messages REST API (httpx, no SDK). Silently disabled
until TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_FROM are set — the admin UI
always offers the one-tap wa.me link as a fallback."""
import logging
import os
import re
from urllib.parse import quote

import httpx

logger = logging.getLogger(__name__)


def normalize_in_phone(phone: str) -> str:
    """Return E.164 digits without '+', assuming India for 10-digit numbers."""
    digits = re.sub(r"\D", "", phone or "")
    if len(digits) == 10:
        digits = "91" + digits
    elif len(digits) == 11 and digits.startswith("0"):
        digits = "91" + digits[1:]
    return digits


def wa_link(phone: str, text: str) -> str:
    return f"https://wa.me/{normalize_in_phone(phone)}?text={quote(text)}"


def twilio_configured() -> bool:
    return all(os.environ.get(k) for k in ("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_WHATSAPP_FROM"))


async def send_whatsapp(phone: str, text: str) -> tuple[bool, str]:
    """Returns (sent, info). Never raises."""
    if not twilio_configured():
        return False, "automatic WhatsApp not configured"
    sid = os.environ["TWILIO_ACCOUNT_SID"]
    sender = os.environ["TWILIO_WHATSAPP_FROM"].strip()
    if not sender.startswith("whatsapp:"):
        sender = "whatsapp:" + (sender if sender.startswith("+") else "+" + sender)
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json",
                auth=(sid, os.environ["TWILIO_AUTH_TOKEN"]),
                data={"From": sender, "To": f"whatsapp:+{normalize_in_phone(phone)}", "Body": text},
            )
        if resp.status_code >= 400:
            logger.warning("Twilio WhatsApp failed: %s %s", resp.status_code, resp.text[:300])
            return False, f"Twilio error {resp.status_code}"
        return True, resp.json().get("sid", "")
    except Exception as exc:
        logger.warning("Twilio WhatsApp error: %s", exc)
        return False, "Twilio request failed"

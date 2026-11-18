"""Optional AI features powered by the Emergent LLM key and SDK:
- POST /ai/ask        — storefront "Ask H.A.R.M" assistant, streamed as SSE
- POST /ai/describe   — owner-only product-description writer for the admin panel
"""
import json
import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

AI_SDK_AVAILABLE = True
try:
    from emergentintegrations.llm.chat import LlmChat, StreamDone, TextDelta, UserMessage
except ModuleNotFoundError as exc:
    if exc.name != "emergentintegrations" and not (exc.name or "").startswith("emergentintegrations."):
        raise
    AI_SDK_AVAILABLE = False

from lib.db import db
from lib.dates import today_iso
from routers.auth import require_owner

router = APIRouter(tags=["ai"])

MODEL_PROVIDER = "openai"
MODEL_NAME = "gpt-5.4"

PRINT_RATES = (
    "B&W Xerox Rs.2/page single side, Rs.2.5 both sides; Color Xerox Rs.5+/page; Printout Rs.2+/page; Scanning Rs.10+/doc; "
    "Lamination Rs.20+/sheet; Spiral Binding Rs.40+/book; Passport Photo Printing Rs.20+/set of 8."
)


def _api_key() -> str:
    if not AI_SDK_AVAILABLE:
        raise HTTPException(status_code=503, detail="AI features require the optional Emergent SDK")
    key = os.environ.get("EMERGENT_LLM_KEY")
    if not key:
        raise HTTPException(status_code=503, detail="AI is not configured (missing EMERGENT_LLM_KEY)")
    return key


async def _system_prompt() -> str:
    docs = await db.products.find(
        {}, {"name": 1, "category": 1, "subcategory": 1, "brand": 1, "price": 1, "stock": 1}
    ).to_list(60)
    catalog = "\n".join(
        f"- {d['name']}"
        + (f" ({d['brand']})" if d.get("brand") else "")
        + f" [{d['category']}/{d.get('subcategory', '')}] Rs.{d['price']} — {d.get('stock', 0)} in stock"
        for d in docs
    )
    return f"""You are the friendly in-store AI assistant for H.A.R.M DAILY NEEDS ("{STORE_NAME}"),
a stationery superstore, Xerox centre, printing hub, gift shop and daily-needs store in
Bandlaguda Jagir, Hyderabad. Tagline: "Trusted by Families, Students & Offices Since Day One".

FACTS:
- Open daily 8:00 AM - 10:00 PM (Monday to Sunday).
- Address: 2-2/30/201, My Abode The Sirius, Suryodhaya Colony, Bandlaguda Jagir, Hyderabad, Telangana - 500086.
- Phone / WhatsApp: +91 8374778183.
- Services: stationery store, note books, office supplies, Xerox & photocopy, document/photo printing,
  scanning, lamination, spiral binding, gift shop, and domestic money transfer (IN-STORE COUNTER
  SERVICE ONLY — never accept or process payments on the website).
- Print & Xerox rates: {PRINT_RATES}

PRODUCTS CURRENTLY IN STOCK:
{catalog}

RULES:
- Answer only from the facts and product list above; if something is not listed, say to call or
  WhatsApp +91 8374778183 to confirm availability.
- Keep replies short and warm (2-4 sentences) in PLAIN TEXT — no markdown, no asterisks, no bullet
  symbols. Use "Rs." for prices, and end with a helpful nudge (e.g. visiting the store, WhatsApp, or
  asking about xerox rates) when it fits.
- You are the store's assistant; never discuss competitors or unrelated topics beyond light small talk.
"""


STORE_NAME = "H.A.R.M DAILY NEEDS"


class ChatTurn(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str


class AiAskRequest(BaseModel):
    session_id: str = Field(min_length=8, max_length=64)
    message: str = Field(min_length=1, max_length=1000)
    history: list[ChatTurn] = []


class DescribeRequest(BaseModel):
    name: str
    category: str
    subcategory: str = ""
    brand: str = ""
    price: float | None = None


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


@router.post("/ai/ask")
async def ai_ask(input: AiAskRequest) -> StreamingResponse:
    _api_key()  # fail fast (503) before opening the stream

    transcript = "\n".join(f"{t.role}: {t.content}" for t in input.history[-8:])
    user_text = f"Previous conversation:\n{transcript}\n\nCustomer: {input.message}" if transcript else input.message
    system_prompt = await _system_prompt()

    async def event_stream():
        collected: list[str] = []
        try:
            chat = (
                LlmChat(
                    api_key=_api_key(),
                    session_id=input.session_id,
                    system_message=system_prompt,
                )
                .with_model(MODEL_PROVIDER, MODEL_NAME)
            )
            async for event in chat.stream_message(UserMessage(text=user_text)):
                if isinstance(event, TextDelta):
                    collected.append(event.content)
                    yield _sse({"delta": event.content})
                elif isinstance(event, StreamDone):
                    break
        except HTTPException:
            raise
        except Exception as exc:  # never kill the stream on one bad token
            yield _sse({"error": f"AI assistant is unavailable right now: {exc}"})
        reply = "".join(collected).strip()
        try:
            await db.ai_chats.insert_many(
                [
                    {
                        "session_id": input.session_id,
                        "role": "user",
                        "content": input.message,
                        "created_at": _now(),
                    },
                    {
                        "session_id": input.session_id,
                        "role": "assistant",
                        "content": reply,
                        "created_at": _now(),
                    },
                ]
            )
        except Exception:
            pass  # chat persistence must never break the response
        yield _sse({"done": True, "reply": reply})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/ai/describe")
async def ai_describe(input: DescribeRequest, owner: dict = Depends(require_owner)) -> dict:
    _api_key()
    price_note = f" Rs.{input.price}." if input.price else ""
    prompt = (
        f"Write a short retail product description for an Indian stationery/daily-needs store. "
        f"Product: {input.name}; brand: {input.brand or 'unbranded'}; category: {input.category}"
        f"{(' / ' + input.subcategory) if input.subcategory else ''};{price_note} "
        f"Maximum 18 words, one sentence, no quotes, no emojis, mention why customers will like it. "
        f"Do NOT invent specifications such as page counts, sizes or quantities that are not given."
    )
    try:
        chat = LlmChat(api_key=_api_key(), session_id=f"describe-{input.name[:20]}", system_message="You write crisp Indian retail product descriptions.")
        reply = await chat.send_message(UserMessage(text=prompt))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI description failed: {exc}")
    text = str(reply).strip().strip('"')
    return {"description": text}


def _now():
    from datetime import datetime, timezone

    return datetime.now(timezone.utc)

"""Shared Mongo handle — import `client`/`db` from here (server.py, routers, seed.py)."""

import logging
import os
import uuid
from pathlib import Path
from urllib.parse import urlsplit

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING, IndexModel
from pymongo.errors import DuplicateKeyError

from lib.security import hash_password

load_dotenv(Path(__file__).parent.parent / ".env")

logger = logging.getLogger(__name__)

mongo_url = os.getenv("MONGO_URL") or os.getenv("MONGODB_URI")
if not mongo_url:
    raise RuntimeError("Set either MONGO_URL or MONGODB_URI to connect to MongoDB.")

mongo_env_name = "MONGO_URL" if os.getenv("MONGO_URL") else "MONGODB_URI"
database_name = os.getenv("DB_NAME")
if not database_name:
    raise RuntimeError("Set DB_NAME to select the MongoDB database.")

try:
    database_host = urlsplit(mongo_url).hostname or "unknown"
except ValueError:
    database_host = "invalid MongoDB URI"

client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=10000)
db = client[database_name]


async def verify_connection() -> None:
    logger.info(
        "MongoDB configuration loaded from %s (host=%s, database=%s)",
        mongo_env_name,
        database_host,
        database_name,
    )
    try:
        await client.admin.command("ping")
    except Exception:
        logger.exception(
            "MongoDB connection failed (env=%s, host=%s, database=%s)",
            mongo_env_name,
            database_host,
            database_name,
        )
        raise

    logger.info(
        "MongoDB connection successful (env=%s, host=%s, database=%s)",
        mongo_env_name,
        database_host,
        database_name,
    )


async def ensure_initial_owner() -> None:
    username = os.getenv("HARM_ADMIN_USERNAME", "").strip().upper()
    password = os.getenv("HARM_ADMIN_PASSWORD", "")
    if not username or not password:
        logger.warning(
            "Initial admin was not provisioned: set HARM_ADMIN_USERNAME and HARM_ADMIN_PASSWORD."
        )
        return

    await db.users.create_index("username", unique=True, name="username")
    if await db.users.count_documents({}, limit=1):
        logger.info("An admin account already exists; startup will not change or replace credentials.")
        return

    try:
        await db.users.insert_one(
            {
                "id": str(uuid.uuid4()),
                "username": username,
                "password_hash": hash_password(password),
                "role": "owner",
            }
        )
    except DuplicateKeyError:
        if await db.users.count_documents({}, limit=1):
            logger.info("Admin account was created by another application instance.")
            return
        raise
    logger.info("Created the first admin account from configured environment variables.")


# One entry per collection: every field a route filters, sorts, or dedupes on. Applied by ensure_indexes() at startup.
INDEXES: dict[str, list[IndexModel]] = {
    "status_checks": [IndexModel([("timestamp", DESCENDING)], name="timestamp_desc")],
    "products": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("category", ASCENDING), ("created_at", DESCENDING)], name="category_created"),
        IndexModel([("brand", ASCENDING)], name="brand"),
        IndexModel([("stock", ASCENDING)], name="stock"),
    ],
    "customers": [IndexModel([("phone", ASCENDING)], name="phone", unique=True)],
    "milk_subscriptions": [IndexModel([("id", ASCENDING)], name="id", unique=True), IndexModel([("phone", ASCENDING)], name="phone")],
    "milk_days": [IndexModel([("date", ASCENDING), ("subscription_id", ASCENDING)], name="date_sub", unique=True)],
    "milk_locks": [IndexModel([("date", ASCENDING)], name="date", unique=True)],
    "milk_payments": [IndexModel([("subscription_id", ASCENDING)], name="sub")],
    "banners": [IndexModel([("id", ASCENDING)], name="id", unique=True)],
    "reviews": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("created_at", DESCENDING)], name="created_desc"),
    ],
    "transactions": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("recorded_date", DESCENDING)], name="recorded_date_desc"),
        IndexModel([("type", ASCENDING), ("recorded_date", DESCENDING)], name="type_date"),
    ],
    "users": [IndexModel([("username", ASCENDING)], name="username", unique=True)],
    "sessions": [
        IndexModel([("token", ASCENDING)], name="token", unique=True),
        IndexModel([("expires_at", ASCENDING)], name="expires_at", expireAfterSeconds=0),
    ],
    "ai_chats": [
        IndexModel([("session_id", ASCENDING), ("created_at", ASCENDING)], name="session_created")
    ],
    "files": [IndexModel([("storage_path", ASCENDING)], name="storage_path")],
    "print_orders": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("status", ASCENDING), ("created_at", DESCENDING)], name="status_created"),
    ],
    "kits": [IndexModel([("id", ASCENDING)], name="id", unique=True)],
    "reports": [IndexModel([("date", DESCENDING)], name="date", unique=True)],
    "cron_runs": [IndexModel([("run_id", ASCENDING)], name="run_id", unique=True)],
    "bills": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("recorded_date", DESCENDING)], name="recorded_date"),
    ],
    "price_changes": [IndexModel([("created_at", DESCENDING)], name="created_desc")],
    "settings": [IndexModel([("id", ASCENDING)], name="id", unique=True)],
}


async def ensure_indexes() -> None:
    for collection, models in INDEXES.items():
        for model in models:  # one at a time so a bad spec skips only itself
            try:
                await db[collection].create_indexes([model])
            except Exception as exc:  # never block boot on an index; the log line names what to fix
                logger.error("ensure_indexes(%s.%s): %s", collection, model.document["name"], exc)

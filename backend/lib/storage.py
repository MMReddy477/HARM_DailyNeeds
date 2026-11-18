"""Emergent managed object storage (per playbook). Sync `requests` calls are run in a
thread so FastAPI handlers stay non-blocking."""
import asyncio
import logging
import os

import requests

logger = logging.getLogger(__name__)

APP_PREFIX = "harm-daily-needs"
_storage_key: str | None = None


def _storage_url() -> str:
    # `or`, not default=: the platform sets this to "" when it has no value.
    base = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
    return base.rstrip("/") + "/objstore/api/v1/storage"


def _init(force: bool = False) -> str:
    global _storage_key
    if _storage_key and not force:
        return _storage_key
    resp = requests.post(
        f"{_storage_url()}/init", json={"emergent_key": os.environ.get("EMERGENT_LLM_KEY")}, timeout=30
    )
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    return _storage_key


def _put(path: str, data: bytes, content_type: str) -> dict:
    for attempt in (0, 1):
        resp = requests.put(
            f"{_storage_url()}/objects/{path}",
            headers={"X-Storage-Key": _init(force=attempt == 1), "Content-Type": content_type},
            data=data,
            timeout=120,
        )
        if resp.status_code == 404 and attempt == 0:
            continue  # stale storage key — re-init once
        resp.raise_for_status()
        return resp.json()
    raise RuntimeError("unreachable")


def _get(path: str) -> tuple[bytes, str]:
    for attempt in (0, 1):
        resp = requests.get(
            f"{_storage_url()}/objects/{path}",
            headers={"X-Storage-Key": _init(force=attempt == 1)},
            timeout=60,
        )
        if resp.status_code == 404 and attempt == 0:
            continue
        resp.raise_for_status()
        return resp.content, resp.headers.get("Content-Type", "application/octet-stream")
    raise RuntimeError("unreachable")


async def put_object(path: str, data: bytes, content_type: str) -> dict:
    return await asyncio.to_thread(_put, path, data, content_type)


async def get_object(path: str) -> tuple[bytes, str]:
    return await asyncio.to_thread(_get, path)


async def init_storage() -> None:
    try:
        await asyncio.to_thread(_init)
        logger.info("Object storage initialized")
    except Exception as exc:  # never block boot on storage
        logger.error("Object storage init failed: %s", exc)

"""Local filesystem storage for uploaded product images and print-order files."""

import asyncio
import logging
import os
from pathlib import Path, PurePosixPath

logger = logging.getLogger(__name__)

APP_PREFIX = "harm-daily-needs"
STORAGE_ROOT = Path(
    os.environ.get("UPLOADS_DIR", Path(__file__).resolve().parents[1] / "uploads")
).resolve()


def _object_path(path: str) -> Path:
    object_name = PurePosixPath(path)
    if object_name.is_absolute() or not object_name.parts or any(part in {"", ".", ".."} for part in object_name.parts):
        raise ValueError("Invalid storage path")

    target = STORAGE_ROOT.joinpath(*object_name.parts).resolve()
    try:
        target.relative_to(STORAGE_ROOT)
    except ValueError as exc:
        raise ValueError("Invalid storage path") from exc
    return target


def _put(path: str, data: bytes, content_type: str) -> dict[str, str]:
    target = _object_path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_name(f".{target.name}.tmp")
    try:
        temporary.write_bytes(data)
        temporary.replace(target)
    finally:
        temporary.unlink(missing_ok=True)
    return {"path": path, "content_type": content_type}


def _get(path: str) -> tuple[bytes, str]:
    target = _object_path(path)
    return target.read_bytes(), "application/octet-stream"


async def put_object(path: str, data: bytes, content_type: str) -> dict[str, str]:
    return await asyncio.to_thread(_put, path, data, content_type)


async def get_object(path: str) -> tuple[bytes, str]:
    return await asyncio.to_thread(_get, path)


async def init_storage() -> None:
    try:
        await asyncio.to_thread(STORAGE_ROOT.mkdir, parents=True, exist_ok=True)
    except OSError:
        logger.exception("Local upload storage is unavailable at %s", STORAGE_ROOT)
        return
    logger.info("Local upload storage ready at %s", STORAGE_ROOT)

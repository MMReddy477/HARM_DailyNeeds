"""Owner auth: httpOnly-cookie sessions. Owner login button is the only public entry."""
import secrets
from datetime import timedelta

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response

from lib.db import db
from lib.security import verify_password
from models.ops import LoginRequest, OwnerInfo, utcnow

router = APIRouter(tags=["auth"])

COOKIE_NAME = "harm_session"
SESSION_DAYS = 7


async def require_owner(harm_session: str | None = Cookie(default=None)) -> dict:
    """FastAPI dependency guarding every admin route. Raises 401 without a live session."""
    if not harm_session:
        raise HTTPException(status_code=401, detail="login required")
    session = await db.sessions.find_one({"token": harm_session})
    if not session:
        raise HTTPException(status_code=401, detail="invalid session")
    expires = session.get("expires_at")
    # motor returns naive UTC datetimes — normalise before comparing with aware now().
    if expires is not None and expires.tzinfo is None:
        from datetime import timezone

        expires = expires.replace(tzinfo=timezone.utc)
    if expires is None or expires < utcnow():
        raise HTTPException(status_code=401, detail="session expired")
    return {"username": session.get("username", ""), "role": "owner"}


@router.post("/auth/login", response_model=OwnerInfo)
async def login(input: LoginRequest, response: Response):
    user = await db.users.find_one({"username": input.username.strip().upper()})
    if not user or not verify_password(input.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = secrets.token_urlsafe(32)
    await db.sessions.insert_one(
        {
            "token": token,
            "username": user["username"],
            "expires_at": utcnow() + timedelta(days=SESSION_DAYS),
        }
    )
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=SESSION_DAYS * 86400,
        path="/",
    )
    return OwnerInfo(username=user["username"], role=user.get("role", "owner"))


@router.post("/auth/logout", status_code=204)
async def logout(response: Response, harm_session: str | None = Cookie(default=None)):
    if harm_session:
        await db.sessions.delete_one({"token": harm_session})
    response.delete_cookie(COOKIE_NAME, path="/")


@router.get("/auth/me", response_model=OwnerInfo)
async def me(owner: dict = Depends(require_owner)):
    return OwnerInfo(username=owner["username"], role=owner["role"])

import os
import secrets
import time
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

from app.libs.storage import json_get, json_put

router = APIRouter(prefix="/admin-auth", tags=["admin-auth"])

# Session tokens are persisted to storage so they survive server restarts.
# Stored as { token: expiry_unix_seconds }.
_SESSIONS_KEY = "admin_sessions"
_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60  # 7 days


class AdminLoginRequest(BaseModel):
    password: str


class AdminLoginResponse(BaseModel):
    token: str


class AdminVerifyRequest(BaseModel):
    token: str


class AdminVerifyResponse(BaseModel):
    valid: bool


# ─── Session storage helpers ──────────────────────────────────────────────────

def _load_sessions() -> dict[str, float]:
    return json_get(_SESSIONS_KEY, default={})


def _save_sessions(sessions: dict[str, float]) -> None:
    json_put(_SESSIONS_KEY, sessions)


def _prune(sessions: dict[str, float]) -> dict[str, float]:
    """Drop expired tokens."""
    now = time.time()
    return {t: exp for t, exp in sessions.items() if exp > now}


def is_valid_token(token: str | None) -> bool:
    if not token:
        return False
    sessions = _prune(_load_sessions())
    return token in sessions


# ─── Reusable dependency ──────────────────────────────────────────────────────

def require_admin(x_admin_token: str | None = Header(default=None)) -> str:
    """FastAPI dependency that rejects requests without a valid admin token.

    The token is supplied by the frontend in the `X-Admin-Token` header.
    """
    if not is_valid_token(x_admin_token):
        raise HTTPException(status_code=401, detail="Admin authentication required")
    return x_admin_token


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/login")
def admin_login(body: AdminLoginRequest) -> AdminLoginResponse:
    """Verify admin password and return a session token."""
    admin_password = os.environ.get("ADMIN_PASSWORD", "")
    # Timing-safe comparison; reject when no password is configured.
    if not admin_password or not secrets.compare_digest(body.password, admin_password):
        raise HTTPException(status_code=401, detail="Invalid password")

    token = secrets.token_hex(32)
    sessions = _prune(_load_sessions())
    sessions[token] = time.time() + _TOKEN_TTL_SECONDS
    _save_sessions(sessions)
    return AdminLoginResponse(token=token)


@router.post("/verify")
def admin_verify(body: AdminVerifyRequest) -> AdminVerifyResponse:
    """Check if a session token is still valid."""
    return AdminVerifyResponse(valid=is_valid_token(body.token))


@router.post("/logout")
def admin_logout(body: AdminVerifyRequest) -> dict:
    """Invalidate a session token."""
    sessions = _prune(_load_sessions())
    sessions.pop(body.token, None)
    _save_sessions(sessions)
    return {"message": "Logged out"}

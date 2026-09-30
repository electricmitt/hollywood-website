import math
import os
import secrets
import threading
import time
from collections import deque
from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel

from app.libs.storage import json_get, json_put

router = APIRouter(prefix="/admin-auth", tags=["admin-auth"])

# Session tokens are persisted to storage so they survive server restarts.
# Stored as { token: expiry_unix_seconds }.
_SESSIONS_KEY = "admin_sessions"
_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60  # 7 days

# Login throttling (in memory; resets on restart). A client that fails too often
# is locked out for the rest of the window — even for the right password, so the
# response never reveals a correct guess. The global cap backstops clients that
# spoof X-Forwarded-For to look like many different clients.
_FAIL_WINDOW_SECONDS = 15 * 60
_MAX_FAILS_PER_CLIENT = 5
_MAX_FAILS_TOTAL = 30
_fails_by_client: dict[str, deque] = {}
_fails_all: deque = deque()
_fails_lock = threading.Lock()


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


# ─── Login throttling ─────────────────────────────────────────────────────────

def _client_key(request: Request) -> str:
    """Best-effort visitor address.

    Site traffic arrives via the Vercel rewrite, and Railway replaces
    X-Forwarded-For/X-Real-IP with Vercel's shared address, so use Vercel's
    X-Vercel-Forwarded-For (Vercel overwrites any client-sent value). Direct
    calls to Railway get X-Real-IP from Railway. A direct caller can fake the
    Vercel header to dodge the per-client limit; the global cap still applies.
    """
    for header in ("x-vercel-forwarded-for", "x-real-ip"):
        value = request.headers.get(header, "").split(",")[0].strip()
        if value:
            return value
    return request.client.host if request.client else "unknown"


def _drop_old(q: deque, now: float) -> None:
    while q and now - q[0] > _FAIL_WINDOW_SECONDS:
        q.popleft()


def _lockout_seconds(client: str) -> int:
    """Seconds this client must wait before trying again (0 = allowed)."""
    now = time.time()
    with _fails_lock:
        _drop_old(_fails_all, now)
        q = _fails_by_client.get(client)
        if q is not None:
            _drop_old(q, now)
        oldest = None
        if q and len(q) >= _MAX_FAILS_PER_CLIENT:
            oldest = q[0]
        elif len(_fails_all) >= _MAX_FAILS_TOTAL:
            oldest = _fails_all[0]
        return 0 if oldest is None else max(1, math.ceil(_FAIL_WINDOW_SECONDS - (now - oldest)))


def _record_failure(client: str) -> None:
    now = time.time()
    with _fails_lock:
        _fails_by_client.setdefault(client, deque()).append(now)
        _fails_all.append(now)
        if len(_fails_by_client) > 10_000:  # keep memory bounded
            for key in [k for k, q in _fails_by_client.items() if not q or now - q[-1] > _FAIL_WINDOW_SECONDS]:
                del _fails_by_client[key]


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/login")
def admin_login(body: AdminLoginRequest, request: Request) -> AdminLoginResponse:
    """Verify admin password and return a session token."""
    client = _client_key(request)
    wait = _lockout_seconds(client)
    if wait:
        minutes = math.ceil(wait / 60)
        raise HTTPException(
            status_code=429,
            detail=f"Too many login attempts. Try again in {minutes} minute{'s' if minutes != 1 else ''}.",
            headers={"Retry-After": str(wait)},
        )

    admin_password = os.environ.get("ADMIN_PASSWORD", "")
    # Timing-safe comparison on bytes (compare_digest rejects non-ASCII str);
    # reject when no password is configured.
    if not admin_password or not secrets.compare_digest(body.password.encode(), admin_password.encode()):
        _record_failure(client)
        raise HTTPException(status_code=401, detail="Invalid password")

    with _fails_lock:
        _fails_by_client.pop(client, None)
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

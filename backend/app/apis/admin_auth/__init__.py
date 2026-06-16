import os
import secrets
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/admin-auth", tags=["admin-auth"])

# In-memory session tokens (cleared on server restart)
_active_tokens: set[str] = set()


class AdminLoginRequest(BaseModel):
    password: str


class AdminLoginResponse(BaseModel):
    token: str


class AdminVerifyRequest(BaseModel):
    token: str


class AdminVerifyResponse(BaseModel):
    valid: bool


@router.post("/login")
def admin_login(body: AdminLoginRequest) -> AdminLoginResponse:
    """Verify admin password and return a session token."""
    admin_password = os.environ.get("ADMIN_PASSWORD", "")
    if not admin_password or body.password != admin_password:
        raise HTTPException(status_code=401, detail="Invalid password")
    token = secrets.token_hex(32)
    _active_tokens.add(token)
    return AdminLoginResponse(token=token)


@router.post("/verify")
def admin_verify(body: AdminVerifyRequest) -> AdminVerifyResponse:
    """Check if a session token is still valid."""
    return AdminVerifyResponse(valid=body.token in _active_tokens)


@router.post("/logout")
def admin_logout(body: AdminVerifyRequest) -> dict:
    """Invalidate a session token."""
    _active_tokens.discard(body.token)
    return {"message": "Logged out"}

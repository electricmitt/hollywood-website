"""Email bridge — send outbound emails via riff-email-bridge.

Automatically appends a [riff-session:<id>] footer to replies so the next
inbound email in the thread can resume the same session.
"""

import contextvars
import os
import re

import httpx

BRIDGE_SEND_URL = "https://riff-email-bridge.fly.dev/api/v1/send"

_email_session_id: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "email_session_id", default=None
)

_SESSION_RE = re.compile(r"\[riff-session:([a-f0-9-]{36})\]")


def set_email_session(session_id: str) -> None:
    _email_session_id.set(session_id)


def extract_session_id(text: str) -> str | None:
    match = _SESSION_RE.search(text or "")
    return match.group(1) if match else None


def _project_id() -> str:
    return os.environ.get("DATABUTTON_PROJECT_ID", "")


def _env() -> str:
    return "prod" if os.environ.get("DATABUTTON_SERVICE_TYPE") == "prodx" else "dev"


def _session_text_footer(session_id: str) -> str:
    return f"\n\n---\n[riff-session:{session_id}]"


def _session_html_footer(session_id: str) -> str:
    return (
        f'<br><br><hr style="border:none;border-top:1px solid #eee">'
        f'<span style="color:#aaa;font-size:11px">[riff-session:{session_id}]</span>'
    )


async def send_reply(to: str, subject: str, text: str, html: str | None = None) -> dict:
    """Send an email from the project's dedicated address.

    Automatically appends a [riff-session:<id>] footer when a session is active.
    Replies come from <project-id>@agents.riff.ai so the next reply lands back
    at /agent/webhook/email.
    """
    session_id = _email_session_id.get()
    if session_id:
        text = text + _session_text_footer(session_id)
        if html is not None:
            html = html + _session_html_footer(session_id)

    token = os.environ.get("RIFF_EMAIL_API_TOKEN", "")
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            BRIDGE_SEND_URL,
            headers={"Authorization": f"Bearer {token}"},
            json={
                "project_id": _project_id(),
                "env": _env(),
                "to": to,
                "subject": subject,
                "text": text,
                "html": html,
            },
        )
        resp.raise_for_status()
        return resp.json()

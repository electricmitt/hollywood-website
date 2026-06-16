"""Inbound email webhook — receives emails forwarded by riff-email-bridge.

The bridge POSTs to /agent/webhook/email whenever someone emails
<project-id>@agents.riff.ai. We return 200 immediately and process the
email in a background task so the bridge doesn't time out.
"""

from fastapi import APIRouter, BackgroundTasks, Request
from pydantic import BaseModel, ConfigDict, Field

router = APIRouter(prefix="/webhook", tags=["webhook"])


class EmailFrom(BaseModel):
    email: str
    name: str = ""


class InboundEmail(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    type: str
    email_id: str
    project_id: str
    from_: EmailFrom | None = Field(None, alias="from")
    to: str
    subject: str
    text: str | None = None
    html: str | None = None
    received_at: str


@router.post("/email")
async def handle_inbound_email(
    request: Request, background_tasks: BackgroundTasks
) -> dict:
    """Receive an inbound email from riff-email-bridge and queue agent processing."""
    body = await request.body()
    email = InboundEmail.model_validate_json(body)
    print(
        f"[agent_builder.webhook] received email {email.email_id} from {email.from_.email if email.from_ else 'unknown'} subject={email.subject!r}"
    )
    background_tasks.add_task(_process_email, email)
    return {"ok": True}


async def _process_email(email: InboundEmail) -> None:
    from app.internal.agent_builder.email_bridge import (
        extract_session_id,
        set_email_session,
    )
    from app.internal.agent_builder.runner import run
    from app.internal.agent_builder.session import get_session, start_session

    sender_name = email.from_.name if email.from_ else ""
    sender_email = email.from_.email if email.from_ else "unknown"

    existing_id = extract_session_id(email.text or "")
    if existing_id and get_session(existing_id) is not None:
        session_id = existing_id
        is_resumed = True
        print(
            f"[agent_builder.webhook] resuming session {session_id} for email {email.email_id}"
        )
    else:
        session_id = start_session()
        is_resumed = False
        print(
            f"[agent_builder.webhook] new session {session_id} for email {email.email_id}"
        )

    set_email_session(session_id)

    context_note = (
        "This is a continuation of an ongoing conversation — session history is available above."
        if is_resumed
        else "This is the start of a new conversation."
    )

    prompt = f"""Inbound email received.

From: {sender_name} <{sender_email}>
Subject: {email.subject}
Received: {email.received_at}
Session: {session_id} ({context_note})

--- Message ---
{email.text or "(no plain-text body)"}
---

Handle this email using your tools. If a reply is needed, use send_email_reply."""

    try:
        async for _ in run(session_id, prompt):
            pass
    except Exception as e:
        print(
            f"[agent_builder.webhook] agent error processing email {email.email_id}: {e}"
        )

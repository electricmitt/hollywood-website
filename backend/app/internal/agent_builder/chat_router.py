"""Platform-managed chat endpoints for agent builder apps.

Mounted at /chat when IS_AGENT_BUILDER_TEMPLATE is True.

Endpoints:
    POST   /chat/session             — start a new session
    POST   /chat/message             — send a message (SSE stream)
    POST   /chat/trigger             — fire-and-forget autonomous run
    DELETE /chat/session/{id}        — remove a session
    GET    /chat/sessions            — list all sessions
    GET    /chat/sessions/{id}/messages — get message history
"""

import asyncio
import re

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.internal.agent_builder import store
from app.internal.agent_builder.runner import WORKSPACE_BASE, run
from app.internal.agent_builder.session import end_session, get_session, start_session
from app.internal.mw.auth_mw import AuthenticatedBearerContentsDep

router = APIRouter(prefix="/chat", tags=["chat"])


class SessionResponse(BaseModel):
    session_id: str
    workspace: str


class MessageRequest(BaseModel):
    session_id: str
    message: str


class TriggerRequest(BaseModel):
    prompt: str = "start"
    session_id: str | None = None


class TriggerResponse(BaseModel):
    session_id: str


class SessionInfo(BaseModel):
    session_id: str
    title: str | None
    created_at: str
    updated_at: str


class MessageInfo(BaseModel):
    role: str
    content: str
    metadata: dict | None
    created_at: str


async def _drain_run(session_id: str, message: str) -> None:
    import time

    t0 = time.monotonic()
    try:
        async for _ in run(session_id, message):
            pass
    except Exception as e:
        print(
            f"[agent_builder.chat] run failed session={session_id} elapsed={time.monotonic() - t0:.1f}s error={e}"
        )


def _drain_run_in_thread(session_id: str, message: str) -> None:
    """Sync wrapper so _drain_run can be offloaded to a thread pool.

    Runs the async generator in its own event loop, keeping the main loop free
    to serve healthz probes while the Claude SDK subprocess is active.
    """
    asyncio.run(_drain_run(session_id, message))


def _user_id(bearer: AuthenticatedBearerContentsDep) -> str | None:
    return bearer.user.sub if bearer and bearer.user else None


@router.post("/session")
async def create_session(bearer: AuthenticatedBearerContentsDep) -> SessionResponse:
    session_id = start_session(user_id=_user_id(bearer))
    return SessionResponse(session_id=session_id, workspace=WORKSPACE_BASE)


@router.post("/message", tags=["stream"])
async def send_message(body: MessageRequest):
    if get_session(body.session_id) is None:
        raise HTTPException(
            status_code=404, detail="Session not found. Start a new session."
        )
    return StreamingResponse(
        run(body.session_id, body.message),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/trigger")
async def trigger_session(
    body: TriggerRequest, bearer: AuthenticatedBearerContentsDep
) -> TriggerResponse:
    import time

    session_id = body.session_id
    if not session_id or get_session(session_id) is None:
        session_id = start_session(user_id=_user_id(bearer))
    print(f"[agent_builder.chat] trigger session={session_id} prompt={body.prompt!r}")
    t0 = time.monotonic()
    await asyncio.to_thread(_drain_run_in_thread, session_id, body.prompt)
    print(
        f"[agent_builder.chat] trigger done session={session_id} elapsed={time.monotonic() - t0:.1f}s"
    )
    return TriggerResponse(session_id=session_id)


@router.delete("/session/{session_id}")
async def delete_session_endpoint(session_id: str) -> dict:
    end_session(session_id)
    return {"deleted": session_id}


@router.get("/sessions")
async def list_sessions_endpoint(
    bearer: AuthenticatedBearerContentsDep,
) -> list[SessionInfo]:
    sessions = store.list_sessions(user_id=_user_id(bearer))
    return [
        SessionInfo(
            session_id=s["id"],
            title=s.get("title"),
            created_at=s["created_at"],
            updated_at=s["updated_at"],
        )
        for s in sessions
    ]


_TEXT_EXTENSIONS = {"csv", "txt", "md", "html", "xml", "tsv"}
_EXCEL_EXTENSIONS = {"xls", "xlsx"}
_JSON_EXTENSIONS = {"json"}


def _file_extension(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def _store_file(key: str, data: bytes, ext: str, content_type: str) -> str:
    import databutton as db

    if ext in _JSON_EXTENSIONS or content_type == "application/json":
        import json

        db.storage.json.put(key, json.loads(data.decode("utf-8")))
        return "json"

    if ext in _TEXT_EXTENSIONS or (content_type or "").startswith("text/"):
        db.storage.text.put(key, data.decode("utf-8"))
        return "text"

    if ext in _EXCEL_EXTENSIONS:
        import io

        import pandas as pd

        df = pd.read_excel(io.BytesIO(data))
        db.storage.dataframes.put(key, df)
        return "dataframes"

    db.storage.binary.put(key, data)
    return "binary"


@router.post("/upload")
async def upload_file(
    session_id: str = Form(...),
    file: UploadFile = File(...),
    bearer: AuthenticatedBearerContentsDep = None,
) -> dict:
    """Upload a file, route to the appropriate storage type, and return the key."""
    data = await file.read()
    filename = file.filename or "file"
    raw_key = f"uploads-{session_id}-{filename}"
    key = re.sub(r"[^a-zA-Z0-9._-]", "", raw_key)
    ext = _file_extension(filename)

    try:
        storage_type = _store_file(key, data, ext, file.content_type or "")
    except Exception:
        import databutton as db

        db.storage.binary.put(key, data)
        storage_type = "binary"

    return {
        "key": key,
        "filename": filename,
        "size": len(data),
        "content_type": file.content_type,
        "storage_type": storage_type,
    }


@router.get("/sessions/{session_id}/messages")
async def get_session_messages(session_id: str) -> list[MessageInfo]:
    messages = store.get_messages(session_id)
    return [
        MessageInfo(
            role=m["role"],
            content=m["content"],
            metadata=m.get("metadata"),
            created_at=m["created_at"],
        )
        for m in messages
    ]

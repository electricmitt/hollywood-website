"""Remote session persistence via the external sessions API.

Wraps /routes/sessions/* and /routes/sessions/{id}/messages endpoints.
Requires the AGENT_POC_API_KEY secret.

Public API:
    is_configured()                          -> bool
    create_session(title)                    -> str | None
    get_history(session_id)                  -> list[dict] | None
    append_message(session_id, role, content) -> bool
    delete_session(session_id)               -> bool
    list_sessions()                          -> list[dict]
    update_session_title(session_id, title)  -> bool
    get_messages(session_id)                 -> list[dict]
"""

import os

import requests

BASE_URL = os.environ.get("AGENT_POC_API_URL")
PROJECT_ID = os.environ.get("DATABUTTON_PROJECT_ID", "")


def is_configured() -> bool:
    return bool(os.environ.get("AGENT_POC_API_KEY"))


def _headers() -> dict | None:
    key = os.environ.get("AGENT_POC_API_KEY")
    if not key:
        return None
    return {"x-api-key": key, "x-dbtn-project-id": PROJECT_ID}


def create_session(title: str | None = None, user_id: str | None = None) -> str | None:
    headers = _headers()
    if not headers:
        return None
    body: dict = {"title": title}
    if user_id:
        body["metadata"] = {"user_id": user_id}
    try:
        r = requests.post(
            f"{BASE_URL}/sessions/create",
            headers=headers,
            json=body,
            timeout=10,
        )
        r.raise_for_status()
        return r.json()["id"]
    except Exception as e:
        print(f"[agent_builder.store] create_session failed: {e}")
        return None


def get_history(session_id: str) -> list[dict] | None:
    headers = _headers()
    if not headers:
        return None
    try:
        r = requests.get(
            f"{BASE_URL}/sessions/{session_id}/messages", headers=headers, timeout=10
        )
        if r.status_code == 404:
            return None
        r.raise_for_status()
        return [{"role": m["role"], "content": m["content"]} for m in r.json()]
    except Exception as e:
        print(f"[agent_builder.store] get_history failed: {e}")
        return None


def append_message(
    session_id: str, role: str, content: str, metadata: dict | None = None
) -> bool:
    headers = _headers()
    if not headers:
        return False
    body: dict = {"role": role, "content": content}
    if metadata:
        body["metadata"] = metadata
    try:
        r = requests.post(
            f"{BASE_URL}/sessions/{session_id}/messages",
            headers=headers,
            json=body,
            timeout=10,
        )
        r.raise_for_status()
        return True
    except Exception as e:
        print(f"[agent_builder.store] append_message failed: {e}")
        return False


def delete_session(session_id: str) -> bool:
    headers = _headers()
    if not headers:
        return False
    try:
        r = requests.delete(
            f"{BASE_URL}/sessions/delete/{session_id}", headers=headers, timeout=10
        )
        r.raise_for_status()
        return True
    except Exception as e:
        print(f"[agent_builder.store] delete_session failed: {e}")
        return False


def list_sessions(user_id: str | None = None) -> list[dict]:
    headers = _headers()
    if not headers:
        return []
    try:
        r = requests.get(f"{BASE_URL}/sessions/list", headers=headers, timeout=10)
        r.raise_for_status()
        sessions = r.json()
        if user_id:
            sessions = [
                s for s in sessions if s.get("metadata", {}).get("user_id") == user_id
            ]
        return sorted(sessions, key=lambda s: s.get("updated_at", ""), reverse=True)
    except Exception as e:
        print(f"[agent_builder.store] list_sessions failed: {e}")
        return []


def update_session_title(session_id: str, title: str) -> bool:
    headers = _headers()
    if not headers:
        return False
    try:
        r = requests.patch(
            f"{BASE_URL}/sessions/update/{session_id}",
            headers=headers,
            json={"title": title},
            timeout=10,
        )
        r.raise_for_status()
        return True
    except Exception as e:
        print(f"[agent_builder.store] update_session_title failed: {e}")
        return False


def get_messages(session_id: str) -> list[dict]:
    headers = _headers()
    if not headers:
        return []
    try:
        r = requests.get(
            f"{BASE_URL}/sessions/{session_id}/messages", headers=headers, timeout=10
        )
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"[agent_builder.store] get_messages failed: {e}")
        return []

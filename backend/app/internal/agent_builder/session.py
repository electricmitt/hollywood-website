"""Session state management — delegates to remote session store.

Public API:
    start_session()  -> str            — create a new session, return session_id
    get_session()    -> list | None    — return history, or None if not found
    end_session()    -> None           — discard a session
    append_history() -> None           — append a user/assistant turn after a run
"""

from app.internal.agent_builder import store


def start_session(user_id: str | None = None) -> str:
    remote_id = store.create_session(user_id=user_id)
    if remote_id:
        return remote_id
    raise RuntimeError(
        "Failed to create session — check AGENT_POC_API_KEY and AGENT_POC_API_URL"
    )


def get_session(session_id: str) -> list[dict] | None:
    return store.get_history(session_id)


def end_session(session_id: str) -> None:
    store.delete_session(session_id)


def append_history(
    session_id: str, user_message: str, assistant_text: str, blocks: list | None = None
) -> None:
    store.append_message(session_id, "user", user_message)
    if assistant_text:
        metadata = {"blocks": blocks} if blocks else None
        store.append_message(session_id, "assistant", assistant_text, metadata=metadata)

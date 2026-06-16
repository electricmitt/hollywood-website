"""Kanban API client — wraps the external kanban API.

Public API:
    init_board()                         -> dict | None
    list_tasks(column_id)                -> list[dict]
    create_task(column_id, title, desc)  -> dict | None
    update_task(task_id, **kwargs)       -> dict | None
"""

import os

import requests

BASE_URL = os.environ.get("AGENT_POC_API_URL")
PROJECT_ID = os.environ.get("DATABUTTON_PROJECT_ID", "")


def _headers() -> dict | None:
    key = os.environ.get("AGENT_POC_API_KEY")
    if not key:
        return None
    return {"x-api-key": key, "x-dbtn-project-id": PROJECT_ID}


def init_board() -> dict | None:
    h = _headers()
    if not h:
        return None
    try:
        r = requests.post(f"{BASE_URL}/kanban/init", headers=h, timeout=10)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"[agent_builder.kanban] init_board failed: {e}")
        return None


def list_tasks(column_id: str | None = None) -> list[dict]:
    h = _headers()
    if not h:
        return []
    params = {"column_id": column_id} if column_id else {}
    try:
        r = requests.get(
            f"{BASE_URL}/kanban/tasks", headers=h, params=params, timeout=10
        )
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"[agent_builder.kanban] list_tasks failed: {e}")
        return []


def create_task(
    column_id: str, title: str, description: str | None = None
) -> dict | None:
    h = _headers()
    if not h:
        return None
    try:
        r = requests.post(
            f"{BASE_URL}/kanban/tasks",
            headers=h,
            json={"column_id": column_id, "title": title, "description": description},
            timeout=10,
        )
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"[agent_builder.kanban] create_task failed: {e}")
        return None


def update_task(
    task_id: str,
    column_id: str | None = None,
    title: str | None = None,
    description: str | None = None,
) -> dict | None:
    h = _headers()
    if not h:
        return None
    body = {
        k: v
        for k, v in {
            "column_id": column_id,
            "title": title,
            "description": description,
        }.items()
        if v is not None
    }
    try:
        r = requests.patch(
            f"{BASE_URL}/kanban/tasks/{task_id}", headers=h, json=body, timeout=10
        )
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"[agent_builder.kanban] update_task failed: {e}")
        return None

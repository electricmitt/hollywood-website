"""Built-in Riff kanban tools — always available in agent builder apps.

Gives the agent the ability to manage tasks on the project kanban board
via the external sessions/kanban API (AGENT_POC_API_URL + AGENT_POC_API_KEY).

Tools:
    riff_kanban_get_board    — list columns with their IDs
    riff_kanban_create_task  — create a task in a column
    riff_kanban_list_tasks   — list tasks (all or by column)
    riff_kanban_move_task    — move a task to a different column
    riff_kanban_add_comment  — add a comment to a task
"""

import os
from typing import Any

import requests
from claude_agent_sdk import tool

BASE_URL = os.environ.get("AGENT_POC_API_URL", "")
PROJECT_ID = os.environ.get("DATABUTTON_PROJECT_ID", "")


def _headers() -> dict | None:
    key = os.environ.get("AGENT_POC_API_KEY")
    if not key:
        return None
    return {"x-api-key": key, "x-dbtn-project-id": PROJECT_ID}


def _error(msg: str) -> dict:
    return {"content": [{"type": "text", "text": f"Error: {msg}"}]}


@tool(
    "riff_kanban_get_board",
    "Get the kanban board with all columns and their IDs. Call this first to know which column_id to use.",
    {},
)
async def riff_kanban_get_board(args: dict[str, Any]) -> dict:
    h = _headers()
    if not h:
        return _error("AGENT_POC_API_KEY not configured")
    try:
        r = requests.get(f"{BASE_URL}/kanban/board", headers=h, timeout=10)
        r.raise_for_status()
        board = r.json()
        lines = [f"Board ID: {board['id']}", "Columns:"]
        for c in board["columns"]:
            lines.append(f"  [{c['position']}] {c['name']} (id: {c['id']})")
        return {"content": [{"type": "text", "text": "\n".join(lines)}]}
    except Exception as e:
        return _error(str(e))


@tool(
    "riff_kanban_create_task",
    "Create a new task in a kanban column.",
    {"column_id": str, "title": str, "description": str},
)
async def riff_kanban_create_task(args: dict[str, Any]) -> dict:
    h = _headers()
    if not h:
        return _error("AGENT_POC_API_KEY not configured")
    body = {
        "column_id": args["column_id"],
        "title": args["title"],
        "description": args.get("description") or None,
    }
    try:
        r = requests.post(f"{BASE_URL}/kanban/tasks", headers=h, json=body, timeout=10)
        r.raise_for_status()
        t = r.json()
        return {
            "content": [
                {"type": "text", "text": f"Created task {t['id']}: {t['title']}"}
            ]
        }
    except Exception as e:
        return _error(str(e))


@tool(
    "riff_kanban_list_tasks",
    "List tasks on the board. Pass column_id to filter by column, or leave empty for all tasks.",
    {"column_id": str},
)
async def riff_kanban_list_tasks(args: dict[str, Any]) -> dict:
    h = _headers()
    if not h:
        return _error("AGENT_POC_API_KEY not configured")
    params = {}
    col = args.get("column_id", "").strip()
    if col:
        params["column_id"] = col
    try:
        r = requests.get(
            f"{BASE_URL}/kanban/tasks", headers=h, params=params, timeout=10
        )
        r.raise_for_status()
        tasks = r.json()
        if not tasks:
            return {"content": [{"type": "text", "text": "No tasks found."}]}
        lines = [
            f"- [{t['id']}] {t['title']} (column: {t['column_id']})" for t in tasks
        ]
        return {"content": [{"type": "text", "text": "\n".join(lines)}]}
    except Exception as e:
        return _error(str(e))


@tool(
    "riff_kanban_move_task",
    "Move a task to a different column (e.g. from Inbox to In Progress).",
    {"task_id": str, "column_id": str},
)
async def riff_kanban_move_task(args: dict[str, Any]) -> dict:
    h = _headers()
    if not h:
        return _error("AGENT_POC_API_KEY not configured")
    try:
        r = requests.patch(
            f"{BASE_URL}/kanban/tasks/{args['task_id']}",
            headers=h,
            json={"column_id": args["column_id"]},
            timeout=10,
        )
        r.raise_for_status()
        t = r.json()
        return {
            "content": [
                {
                    "type": "text",
                    "text": f"Moved task {t['id']} to column {t['column_id']}",
                }
            ]
        }
    except Exception as e:
        return _error(str(e))


@tool(
    "riff_kanban_add_comment",
    "Add a comment to a task.",
    {"task_id": str, "content": str},
)
async def riff_kanban_add_comment(args: dict[str, Any]) -> dict:
    h = _headers()
    if not h:
        return _error("AGENT_POC_API_KEY not configured")
    try:
        r = requests.post(
            f"{BASE_URL}/kanban/tasks/{args['task_id']}/comments",
            headers=h,
            json={"content": args["content"]},
            timeout=10,
        )
        r.raise_for_status()
        return {
            "content": [
                {"type": "text", "text": f"Comment added to task {args['task_id']}"}
            ]
        }
    except Exception as e:
        return _error(str(e))

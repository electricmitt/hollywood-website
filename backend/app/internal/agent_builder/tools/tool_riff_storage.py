"""Databutton SDK storage tools — read and write persistent app data.

The user app filesystem is non-persistent, so all data that must survive
restarts is stored via db.storage. Keys must be alphanumeric + dots/underscores/dashes.
"""

import json
import re
from typing import Any

from claude_agent_sdk import tool


def _sanitize(key: str) -> str:
    return re.sub(r"[^a-zA-Z0-9._-]", "", key)


def _err(msg: str) -> dict[str, Any]:
    return {"content": [{"type": "text", "text": f"Error: {msg}"}], "isError": True}


@tool(
    "tool_riff_storage_list",
    "List files stored in Databutton storage. "
    "Use storage_type=* to discover all stored data across all types (text, json, binary, dataframes). "
    "Returns file names, sizes, and type. Call this to discover what data is available "
    "before attempting to read or write.",
    {"storage_type": str},
)
async def tool_riff_storage_list(args: dict[str, Any]) -> dict[str, Any]:
    import databutton as db

    storage_type = args.get("storage_type", "*")
    stores = {
        "text": db.storage.text,
        "json": db.storage.json,
        "binary": db.storage.binary,
        "dataframes": db.storage.dataframes,
    }
    if storage_type == "*":
        selected = stores
    else:
        store = stores.get(storage_type)
        if store is None:
            return _err(
                f"Unknown storage_type '{storage_type}'. Must be one of: {list(stores)} or *"
            )
        selected = {storage_type: store}
    items = [
        {"name": f.name, "size": f.size, "type": t}
        for t, s in selected.items()
        for f in s.list()
    ]
    return {"content": [{"type": "text", "text": json.dumps(items)}]}


@tool(
    "tool_riff_storage_text_get",
    "Read a text file from Databutton storage. Returns an error if the key does not exist.",
    {"key": str},
)
async def tool_riff_storage_text_get(args: dict[str, Any]) -> dict[str, Any]:
    import databutton as db

    key = args.get("key", "")
    if not key:
        return _err("'key' is required")
    files = {f.name for f in db.storage.text.list()}
    if key not in files:
        return _err(f"Key '{key}' not found in text storage")
    value = db.storage.text.get(key, default="")
    return {"content": [{"type": "text", "text": value}]}


@tool(
    "tool_riff_storage_text_put",
    "Write a text file to Databutton storage. Key must be alphanumeric + dots/underscores/dashes.",
    {"key": str, "value": str},
)
async def tool_riff_storage_text_put(args: dict[str, Any]) -> dict[str, Any]:
    import databutton as db

    key = _sanitize(args.get("key", ""))
    value = args.get("value", "")
    if not key:
        return _err("'key' is required and must contain valid characters")
    db.storage.text.put(key, value)
    return {
        "content": [
            {"type": "text", "text": f"Stored text at '{key}' ({len(value)} chars)"}
        ]
    }


@tool(
    "tool_riff_storage_text_delete",
    "Delete a text file from Databutton storage.",
    {"key": str},
)
async def tool_riff_storage_text_delete(args: dict[str, Any]) -> dict[str, Any]:
    import databutton as db

    key = args.get("key", "")
    if not key:
        return _err("'key' is required")
    db.storage.text.delete(key)
    return {"content": [{"type": "text", "text": f"Deleted text '{key}'"}]}


@tool(
    "tool_riff_storage_json_get",
    "Read a JSON value from Databutton storage. Returns an error if the key does not exist.",
    {"key": str},
)
async def tool_riff_storage_json_get(args: dict[str, Any]) -> dict[str, Any]:
    import databutton as db

    key = args.get("key", "")
    if not key:
        return _err("'key' is required")
    files = {f.name for f in db.storage.json.list()}
    if key not in files:
        return _err(f"Key '{key}' not found in json storage")
    value = db.storage.json.get(key, default=None)
    return {"content": [{"type": "text", "text": json.dumps(value)}]}


@tool(
    "tool_riff_storage_json_put",
    "Write a JSON value to Databutton storage. 'value' must be a JSON-serialisable object. "
    "Key must be alphanumeric + dots/underscores/dashes.",
    {"key": str, "value": Any},
)
async def tool_riff_storage_json_put(args: dict[str, Any]) -> dict[str, Any]:
    import databutton as db

    key = _sanitize(args.get("key", ""))
    if not key:
        return _err("'key' is required and must contain valid characters")
    if "value" not in args:
        return _err("'value' is required")
    db.storage.json.put(key, args["value"])
    return {"content": [{"type": "text", "text": f"Stored JSON at '{key}'"}]}


@tool(
    "tool_riff_storage_json_delete",
    "Delete a JSON value from Databutton storage.",
    {"key": str},
)
async def tool_riff_storage_json_delete(args: dict[str, Any]) -> dict[str, Any]:
    import databutton as db

    key = args.get("key", "")
    if not key:
        return _err("'key' is required")
    db.storage.json.delete(key)
    return {"content": [{"type": "text", "text": f"Deleted JSON '{key}'"}]}


@tool(
    "tool_riff_storage_binary_get_text",
    "Read an uploaded file from binary storage and return its content as UTF-8 text. "
    "Useful for CSV, TXT, JSON, and other text-based files uploaded via the chat upload endpoint. "
    "Use tool_riff_storage_list with storage_type=binary to discover available files. "
    "For binary formats like Excel or PDF, use the Bash tool with db.storage.binary.get(key) instead.",
    {"key": str},
)
async def tool_riff_storage_binary_get_text(args: dict[str, Any]) -> dict[str, Any]:
    import databutton as db

    key = args.get("key", "")
    if not key:
        return _err("'key' is required")
    files = {f.name for f in db.storage.binary.list()}
    if key not in files:
        return _err(f"Key '{key}' not found in binary storage")
    data = db.storage.binary.get(key)
    try:
        return {"content": [{"type": "text", "text": data.decode("utf-8")}]}
    except UnicodeDecodeError:
        return _err(
            "File is not UTF-8 text (likely Excel, PDF, or other binary format). "
            "Use the Bash tool with: import databutton as db; data = db.storage.binary.get('{key}')"
        )

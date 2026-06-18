"""Simple JSON file storage — a self-hosted replacement for db.storage.json.

Data is written under DATA_DIR (env var). On Railway, attach a Persistent
Volume and set DATA_DIR to its mount path (e.g. /data) so the files survive
redeploys; otherwise it defaults to a local ".data" directory.
"""

import json
import os
import tempfile
from pathlib import Path
from typing import Any

DATA_DIR = Path(os.environ.get("DATA_DIR", ".data"))


def _path_for(key: str) -> Path:
    safe = key.replace("/", "_").replace("..", "_")
    return DATA_DIR / f"{safe}.json"


def json_get(key: str, default: Any = None) -> Any:
    """Read a JSON value by key, returning `default` if it's missing/unreadable."""
    path = _path_for(key)
    if not path.exists():
        return default
    try:
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return default


def json_put(key: str, value: Any) -> None:
    """Write a JSON value by key, atomically (temp file + rename)."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    path = _path_for(key)
    fd, tmp = tempfile.mkstemp(dir=str(DATA_DIR), suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(value, f)
        os.replace(tmp, path)
    except BaseException:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise

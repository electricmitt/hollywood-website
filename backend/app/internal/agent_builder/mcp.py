"""MCP server for the agent builder.

Discovers tools from two locations:
1. Platform tools: app/internal/agent_builder/tools/tool_riff_*.py (always available)
2. User tools: {DEVX_BACKEND_DIR}/app/libs/tool_*.py (added by builders)

No registration needed — drop a tool_*.py file and it's auto-discovered.
"""

import importlib
import importlib.util
import os
import pkgutil
import sys

from claude_agent_sdk import create_sdk_mcp_server

MCP_SERVER_NAME = "riff"


def _has_tool_attrs(obj: object) -> bool:
    return (
        hasattr(obj, "name") and hasattr(obj, "description") and hasattr(obj, "handler")
    )


def _discover_platform_tools() -> list:
    import app.internal.agent_builder.tools as platform_pkg

    tools = []
    for module_info in pkgutil.iter_modules(platform_pkg.__path__):
        if not module_info.name.startswith("tool_"):
            continue
        module = importlib.import_module(
            f"app.internal.agent_builder.tools.{module_info.name}"
        )
        if getattr(module, "ENABLED", True) is False:
            continue
        for attr_name in dir(module):
            obj = getattr(module, attr_name)
            if _has_tool_attrs(obj):
                tools.append(obj)
    return tools


def _discover_user_tools() -> list:
    backend_dir = os.environ.get("DEVX_BACKEND_DIR", "")
    if not backend_dir:
        return []
    libs_path = os.path.join(backend_dir, "app", "libs")
    if not os.path.isdir(libs_path):
        return []

    tools = []
    for filename in sorted(os.listdir(libs_path)):
        if not (filename.startswith("tool_") and filename.endswith(".py")):
            continue
        module_name = filename[:-3]
        module_path = os.path.join(libs_path, filename)
        try:
            spec = importlib.util.spec_from_file_location(
                f"user_tools.{module_name}", module_path
            )
            if spec is None or spec.loader is None:
                continue
            module = importlib.util.module_from_spec(spec)
            sys.modules[f"user_tools.{module_name}"] = module
            spec.loader.exec_module(module)  # type: ignore[attr-defined]
            for attr_name in dir(module):
                obj = getattr(module, attr_name)
                if _has_tool_attrs(obj):
                    tools.append(obj)
        except Exception as e:
            print(f"[agent_builder.mcp] failed to load {filename}: {e}")
    return tools


def _discover_tools() -> list:
    return _discover_platform_tools() + _discover_user_tools()


ALL_TOOLS = _discover_tools()
ALL_TOOL_NAMES = [f"mcp__{MCP_SERVER_NAME}__{t.name}" for t in ALL_TOOLS]


def build_mcp_server():
    return create_sdk_mcp_server(name=MCP_SERVER_NAME, version="1.0.0", tools=ALL_TOOLS)

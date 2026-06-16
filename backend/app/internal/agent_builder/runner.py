"""Claude SDK streaming runner.

Drives a single agent turn: builds the prompt, calls the SDK,
streams SSE events to the caller, and persists the turn to session history.

Public API:
    run(session_id, message) -> AsyncIterator[str]
"""

import json
import os
import uuid
from typing import AsyncIterator

from app.context import context_path
from app.internal.agent_builder import store
from app.internal.agent_builder.instrumentation import start_turn
from app.internal.agent_builder.session import append_history, get_session

DEFAULT_TOOLS = ["Read", "Glob", "Grep", "WebSearch", "Skill"]
WORKSPACE_BASE = str(context_path)
AGENT_MODEL = os.environ.get("AGENT_MODEL", "claude-sonnet-4-6")


def _bootstrap_gcp() -> None:
    """Write GCP credentials to a stable path for the SDK subprocess."""
    creds_json = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    if creds_json and not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        creds_path = "/tmp/gcp_creds.json"
        with open(creds_path, "w") as f:
            f.write(creds_json)
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = creds_path


async def run(session_id: str, message: str) -> AsyncIterator[str]:
    """Run one agent turn and stream SSE events."""
    _bootstrap_gcp()

    from claude_agent_sdk import (
        AssistantMessage,
        ClaudeAgentOptions,
        ClaudeSDKClient,
        ResultMessage,
        TextBlock,
        ThinkingBlock,
        ToolResultBlock,
        ToolUseBlock,
        UserMessage,
    )
    from claude_agent_sdk.types import StreamEvent
    from builtins import BaseExceptionGroup
    from app.internal.agent_builder.mcp import ALL_TOOL_NAMES, build_mcp_server

    history = get_session(session_id) or []

    prompt_parts = []
    for turn in history:
        label = "User" if turn["role"] == "user" else "Assistant"
        prompt_parts.append(f"{label}: {turn['content']}")
    prompt_parts.append(f"User: {message}")
    full_prompt = "\n\n".join(prompt_parts)

    options = ClaudeAgentOptions(
        cwd=WORKSPACE_BASE,
        system_prompt=(
            "You are an autonomous agent built on the Riff platform. "
            "Do not refer to yourself as Claude Code or as a CLI tool. "
            "Your purpose is to automate workflows and handle operational tasks, "
            "freeing up the user's time to focus on strategic, high-value work."
        ),
        setting_sources=["project"],
        allowed_tools=[*DEFAULT_TOOLS, *ALL_TOOL_NAMES],
        permission_mode="bypassPermissions",
        model=AGENT_MODEL,
        include_partial_messages=True,
        max_budget_usd=10.0,
        mcp_servers={"riff": build_mcp_server()},
    )

    turn_trace = start_turn(session_id, message)

    collected_blocks: list[dict] = []
    last_snapshot_blocks: list = []
    blk_counter = 0
    idx_map: dict[int, int] = {}
    active_blocks: dict[int, dict] = {}

    try:
        async with ClaudeSDKClient(options=options) as client:
            await client.query(full_prompt)
            async for msg in client.receive_messages():
                if isinstance(msg, StreamEvent):
                    event = msg.event
                    event_type = event.get("type")

                    if event_type == "message_start":
                        idx_map = {}

                    elif event_type == "content_block_start":
                        local_idx = event.get("index", 0)
                        cb = event.get("content_block", {})
                        cb_type = cb.get("type", "")
                        gidx = blk_counter
                        blk_counter += 1
                        idx_map[local_idx] = gidx

                        if cb_type == "text":
                            active_blocks[gidx] = {"type": "text", "text": ""}
                        elif cb_type == "thinking":
                            active_blocks[gidx] = {"type": "thinking", "thinking": ""}
                        elif cb_type == "tool_use":
                            tool_id = cb.get("id", str(uuid.uuid4()))
                            tool_name = cb.get("name", "")
                            active_blocks[gidx] = {
                                "type": "tool_use",
                                "name": tool_name,
                                "tool_id": tool_id,
                                "input_json": "",
                            }
                            yield f"data: {json.dumps({'type': 'tool_use_start', 'name': tool_name, 'tool_id': tool_id, 'block_index': gidx})}\n\n"

                    elif event_type == "content_block_delta":
                        local_idx = event.get("index", 0)
                        gidx = idx_map.get(local_idx)
                        if gidx is None:
                            continue
                        delta = event.get("delta", {})
                        delta_type = delta.get("type", "")
                        block = active_blocks.get(gidx)
                        if not block:
                            continue

                        if delta_type == "text_delta" and block["type"] == "text":
                            chunk = delta.get("text", "")
                            block["text"] += chunk
                            yield f"data: {json.dumps({'type': 'text_delta', 'text': chunk, 'block_index': gidx})}\n\n"
                        elif (
                            delta_type == "thinking_delta"
                            and block["type"] == "thinking"
                        ):
                            chunk = delta.get("thinking", "")
                            block["thinking"] += chunk
                            yield f"data: {json.dumps({'type': 'thinking_delta', 'thinking': chunk, 'block_index': gidx})}\n\n"
                        elif (
                            delta_type == "input_json_delta"
                            and block["type"] == "tool_use"
                        ):
                            block["input_json"] += delta.get("partial_json", "")

                    elif event_type == "content_block_stop":
                        local_idx = event.get("index", 0)
                        gidx = idx_map.get(local_idx)
                        if gidx is None:
                            continue
                        block = active_blocks.get(gidx)
                        if block and block["type"] == "tool_use":
                            try:
                                parsed_input = (
                                    json.loads(block["input_json"])
                                    if block["input_json"]
                                    else {}
                                )
                            except json.JSONDecodeError:
                                parsed_input = {}
                            turn_trace.tool_started(
                                block["tool_id"], block["name"], parsed_input
                            )
                            yield f"data: {json.dumps({'type': 'tool_use', 'name': block['name'], 'input': parsed_input, 'tool_id': block['tool_id'], 'block_index': gidx})}\n\n"

                elif isinstance(msg, AssistantMessage):
                    seen_tool_ids = {
                        b.get("tool_id")
                        for b in active_blocks.values()
                        if b.get("type") == "tool_use"
                    }
                    for snap in msg.content:
                        if isinstance(snap, ToolUseBlock):
                            snap_tool_id = getattr(snap, "id", None) or ""
                            if snap_tool_id and snap_tool_id not in seen_tool_ids:
                                gidx = blk_counter
                                blk_counter += 1
                                active_blocks[gidx] = {
                                    "type": "tool_use",
                                    "name": snap.name,
                                    "tool_id": snap_tool_id,
                                    "input_json": "",
                                }
                                seen_tool_ids.add(snap_tool_id)
                                yield f"data: {json.dumps({'type': 'tool_use', 'name': snap.name, 'input': snap.input if isinstance(snap.input, dict) else {}, 'tool_id': snap_tool_id, 'block_index': gidx})}\n\n"
                    last_snapshot_blocks.extend(msg.content)

                elif isinstance(msg, UserMessage):
                    if isinstance(msg.content, list):
                        for block in msg.content:
                            if isinstance(block, ToolResultBlock):
                                tool_id = getattr(block, "tool_use_id", None) or ""
                                content = block.content
                                if isinstance(content, list):
                                    content = "\n".join(
                                        c.get("text", "")
                                        for c in content
                                        if isinstance(c, dict)
                                    )
                                is_error = bool(block.is_error)
                                turn_trace.tool_finished(
                                    tool_id, content or "", is_error
                                )
                                gidx = blk_counter
                                blk_counter += 1
                                yield f"data: {json.dumps({'type': 'tool_result', 'content': content or '', 'is_error': is_error, 'tool_id': tool_id, 'block_index': gidx})}\n\n"
                        last_snapshot_blocks.extend(msg.content)

                elif isinstance(msg, ResultMessage):
                    cost = msg.total_cost_usd or 0.0
                    turns = msg.num_turns or 0
                    duration_ms = msg.duration_ms or 0
                    turn_trace.finish(cost, turns, duration_ms)
                    yield f"data: {json.dumps({'type': 'result', 'cost': cost, 'turns': turns, 'duration_ms': duration_ms})}\n\n"
                    break

    except BaseExceptionGroup as eg:  # noqa: BLE001
        from claude_agent_sdk._errors import CLIConnectionError as _CLIErr

        real_errors = [e for e in eg.exceptions if not isinstance(e, _CLIErr)]
        if real_errors:
            import traceback

            for e in real_errors:
                print(f"[agent_builder.runner] stream error: {e}")
                traceback.print_exception(type(e), e, e.__traceback__)
            yield f"data: {json.dumps({'type': 'error', 'message': str(real_errors[0])})}\n\n"
        else:
            print(
                "[agent_builder.runner] SDK cleanup: ProcessTransport closed (harmless)"
            )
    except Exception as e:
        import traceback

        print(f"[agent_builder.runner] stream error: {e}\n{traceback.format_exc()}")
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    finally:
        yield 'data: {"type": "done"}\n\n'
        turn_trace.finish(0.0, 0, 0)  # no-op if already finished normally

        for block in last_snapshot_blocks:
            if isinstance(block, TextBlock):
                collected_blocks.append({"type": "text", "text": block.text or ""})
            elif isinstance(block, ThinkingBlock):
                collected_blocks.append(
                    {"type": "thinking", "thinking": block.thinking or ""}
                )
            elif isinstance(block, ToolUseBlock):
                collected_blocks.append(
                    {
                        "type": "tool_use",
                        "name": block.name,
                        "input": block.input,
                        "tool_id": getattr(block, "id", None) or "",
                    }
                )
            elif isinstance(block, ToolResultBlock):
                content = block.content
                if isinstance(content, list):
                    content = "\n".join(
                        c.get("text", "") for c in content if isinstance(c, dict)
                    )
                collected_blocks.append(
                    {
                        "type": "tool_result",
                        "content": content or "",
                        "is_error": bool(block.is_error),
                        "tool_id": getattr(block, "tool_use_id", None) or "",
                    }
                )

        assistant_text = " ".join(
            b.get("text", "") or b.get("content", "")
            for b in collected_blocks
            if b.get("type") in ("text", "tool_result")
        ).strip()

        append_history(session_id, message, assistant_text, blocks=collected_blocks)

        if store.is_configured():
            try:
                from app.internal.agent_builder.titler import generate_title

                title = generate_title(message, assistant_text)
                if title:
                    store.update_session_title(session_id, title)
            except Exception:
                pass

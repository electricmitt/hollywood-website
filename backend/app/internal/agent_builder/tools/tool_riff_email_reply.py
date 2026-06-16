"""MCP tool — lets the agent send email replies via the riff-email-bridge."""

from typing import Any

from claude_agent_sdk import tool

from app.internal.agent_builder.email_bridge import send_reply


@tool(
    "tool_riff_email_reply",
    "Send an email reply from the agent's dedicated inbox. "
    "Use when a reply to an inbound email is needed, or to send a proactive notification.",
    {"to": str, "subject": str, "text": str, "html": str},
)
async def send_email_reply(args: dict[str, Any]) -> dict[str, Any]:
    result = await send_reply(
        to=args["to"],
        subject=args["subject"],
        text=args["text"],
        html=args.get("html"),
    )
    return {"content": [{"type": "text", "text": str(result)}]}

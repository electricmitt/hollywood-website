"""Render HTML inline in the chat as a rich visualization.

Used by the frontend's HtmlVisualizationFrame which renders the HTML in a
sandboxed iframe with Tailwind CSS, Chart.js 4, and D3.js 7 pre-loaded.

Pass-through: the tool does not transform the HTML beyond a length check.
The frontend matches on the tool name `tool_riff_render_html` and pulls
the html string from `tool_use.input.html`.
"""

from typing import Any

from claude_agent_sdk import tool

MAX_HTML_BYTES = 200_000  # 200 KB safety limit


@tool(
    "tool_riff_render_html",
    (
        "Render an interactive HTML visualization inline in the chat. "
        "Pass complete HTML body content (no <html>/<head>/<body> tags). "
        "Pre-loaded: Tailwind CSS, Chart.js 4 (window.Chart), D3.js 7 (window.d3), and CSS vars: "
        "--primary #1C7AFE, --bg-0 #FFF, --bg-1 #F8FAFB, --bg-2 #EFF3F5, --fg #444F62, --fg-muted "
        "#616D7D, --border #D0D7E0, --success #0cce6b, --warning #FF9400, --danger #E84040. "
        "Card template: background:var(--bg-0);border:1px solid var(--border);border-radius:10px;padding:20px. "
        "Charts: rgba(28,122,254,0.12) fill + #1C7AFE stroke. "
        "Use blue+neutral palette, bold numbers for KPIs. No emojis. Bake all data inline — no external fetches. "
        "Sizing: ~500px tall x 600-700px wide."
    ),
    {"html": str},
)
async def tool_riff_render_html(args: dict[str, Any]) -> dict[str, Any]:
    html = args.get("html", "")
    if not isinstance(html, str) or not html:
        return {
            "content": [{"type": "text", "text": "Error: 'html' is required"}],
            "isError": True,
        }
    if len(html.encode("utf-8")) > MAX_HTML_BYTES:
        return {
            "content": [
                {
                    "type": "text",
                    "text": f"Error: html exceeds {MAX_HTML_BYTES // 1000}KB limit",
                }
            ],
            "isError": True,
        }
    return {"content": [{"type": "text", "text": "HTML rendered"}]}

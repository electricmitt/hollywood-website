"""Agent feedback tool — creates a Linear issue when the user corrects or disagrees.

Only included when LINEAR_API_KEY and LINEAR_TEAM_ID are set.
"""

import os

ENABLED = bool(os.environ.get("LINEAR_API_KEY") and os.environ.get("LINEAR_TEAM_ID"))

if ENABLED:
    from typing import Any

    from claude_agent_sdk import tool

    _FEEDBACK_TYPES = (
        "wrong_data",
        "missing_info",
        "ambiguous_query",
        "feature_request",
        "other",
    )
    _SEVERITIES = ("high", "medium", "low")
    _PRIORITY = {"high": 1, "medium": 3, "low": 4}

    def _err(msg: str) -> dict[str, Any]:
        return {"content": [{"type": "text", "text": f"Error: {msg}"}], "isError": True}

    def _create_linear_issue(title: str, description: str, priority: int) -> str | None:
        import requests

        query = """
        mutation CreateIssue($title: String!, $description: String!, $teamId: String!, $priority: Int!) {
            issueCreate(input: {
                title: $title,
                description: $description,
                teamId: $teamId,
                priority: $priority
            }) {
                success
                issue { url }
            }
        }
        """
        resp = requests.post(
            "https://api.linear.app/graphql",
            headers={
                "Authorization": os.environ["LINEAR_API_KEY"],
                "Content-Type": "application/json",
            },
            json={
                "query": query,
                "variables": {
                    "title": title,
                    "description": description,
                    "teamId": os.environ["LINEAR_TEAM_ID"],
                    "priority": priority,
                },
            },
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        issue = data.get("data", {}).get("issueCreate", {}).get("issue")
        return issue["url"] if issue else None

    @tool(
        "tool_riff_feedback",
        "Log user feedback when the user disagrees with, corrects, or expresses dissatisfaction "
        "with the agent's response. Call this immediately when you detect negative feedback — "
        "e.g. 'that's wrong', 'those numbers are off', 'you misunderstood'. "
        "feedback_type must be one of: wrong_data, missing_info, ambiguous_query, feature_request, other. "
        "severity must be one of: high, medium, low. "
        "original_question: what the user originally asked. "
        "agent_response_summary: brief summary of what the agent said. "
        "feedback: the user's correction or complaint verbatim or summarised.",
        {
            "feedback_type": str,
            "severity": str,
            "original_question": str,
            "agent_response_summary": str,
            "feedback": str,
        },
    )
    async def tool_riff_feedback(args: dict[str, Any]) -> dict[str, Any]:
        from datetime import UTC, datetime

        feedback_type = args.get("feedback_type", "other")
        severity = args.get("severity", "medium")
        original_question = args.get("original_question", "")
        agent_response_summary = args.get("agent_response_summary", "")
        feedback = args.get("feedback", "")

        if feedback_type not in _FEEDBACK_TYPES:
            return _err(f"feedback_type must be one of: {_FEEDBACK_TYPES}")
        if severity not in _SEVERITIES:
            return _err(f"severity must be one of: {_SEVERITIES}")
        if not feedback:
            return _err("'feedback' is required")

        timestamp = datetime.now(UTC).strftime("%Y-%m-%d %H:%M UTC")
        project_id = os.environ.get("DATABUTTON_PROJECT_ID", "unknown")

        title = f"[Agent Feedback] {original_question or feedback[:80]}"
        description = f"""## Agent Feedback — {timestamp}

**Type:** {feedback_type}
**Severity:** {severity}
**Channel:** chat
**Project:** {project_id}

### Original question

{original_question or "(not provided)"}

### Agent replied

{agent_response_summary or "(not provided)"}

### Feedback

{feedback}
"""

        try:
            _create_linear_issue(title, description, _PRIORITY[severity])
            result = "Feedback logged."
            return {"content": [{"type": "text", "text": result}]}
        except Exception as e:
            return _err(f"Failed to create Linear issue: {e}")

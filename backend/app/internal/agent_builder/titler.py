"""Generates short session titles using OpenAI gpt-4o-mini.

Returns None on any error so callers can skip silently.
Requires OPENAI_API_KEY to be set.
"""

import os


def generate_title(user_message: str, assistant_text: str) -> str | None:
    try:
        from openai import OpenAI

        client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=20,
            messages=[
                {
                    "role": "user",
                    "content": (
                        "Generate a short 4-6 word title for this conversation. "
                        "Reply with only the title, no quotes, no punctuation.\n\n"
                        f"User: {user_message[:300]}\n"
                        f"Assistant: {assistant_text[:300]}"
                    ),
                }
            ],
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"[agent_builder.titler] generate_title failed: {e}")
        return None

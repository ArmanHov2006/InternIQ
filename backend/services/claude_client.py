import json
import os
from typing import Any, Dict

import anthropic

from services.prompts import ANALYZE_SYSTEM_PROMPT, EMAIL_SYSTEM_PROMPT


def _get_client() -> anthropic.Anthropic:
    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is missing")
    return anthropic.Anthropic(api_key=api_key)


def _extract_json_from_response(text: str) -> Dict[str, Any]:
    candidate = text.strip()

    if candidate.startswith("```"):
        parts = candidate.split("```")
        if len(parts) >= 3:
            candidate = parts[1]
            if candidate.startswith("json"):
                candidate = candidate[4:]
            candidate = candidate.strip()

    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        start = candidate.find("{")
        end = candidate.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise
        return json.loads(candidate[start : end + 1])


async def analyze_fit(job_text: str, resume_text: str) -> Dict[str, Any]:
    client = _get_client()
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1200,
        system=ANALYZE_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": (
                    f"## Job Posting\n{job_text}\n\n"
                    f"## Candidate Resume\n{resume_text}"
                ),
            }
        ],
    )
    text = "".join(
        block.text for block in message.content if getattr(block, "type", "") == "text"
    )
    return _extract_json_from_response(text)


async def generate_cold_email(
    job_text: str,
    resume_text: str,
    company: str,
    role: str,
    contact_name: str,
    tone: str,
) -> Dict[str, Any]:
    client = _get_client()
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1200,
        system=EMAIL_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": (
                    f"## Job Posting\n{job_text}\n\n"
                    f"## Candidate Resume\n{resume_text}\n\n"
                    f"## Company\n{company}\n"
                    f"## Role\n{role}\n"
                    f"## Contact Name\n{contact_name}\n"
                    f"## Tone\n{tone}"
                ),
            }
        ],
    )
    text = "".join(
        block.text for block in message.content if getattr(block, "type", "") == "text"
    )
    return _extract_json_from_response(text)

import json
import os
from typing import Any, Dict

import anthropic

from services.prompts import (
    ANALYZE_SYSTEM_PROMPT,
    CHATBOT_SYSTEM_PROMPT,
    COVER_LETTER_SYSTEM_PROMPT,
    EMAIL_SYSTEM_PROMPT,
    INTERVIEW_PREP_SYSTEM_PROMPT,
    RESUME_TAILOR_SYSTEM_PROMPT,
)


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


async def generate_interview_prep(job_text: str, resume_text: str) -> Dict[str, Any]:
    client = _get_client()
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1600,
        system=INTERVIEW_PREP_SYSTEM_PROMPT,
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


async def generate_cover_letter(
    job_text: str,
    resume_text: str,
    company: str,
    role: str,
    tone: str,
) -> Dict[str, Any]:
    client = _get_client()
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1600,
        system=COVER_LETTER_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": (
                    f"## Job Posting\n{job_text}\n\n"
                    f"## Candidate Resume\n{resume_text}\n\n"
                    f"## Company\n{company}\n"
                    f"## Role\n{role}\n"
                    f"## Tone\n{tone}"
                ),
            }
        ],
    )
    text = "".join(
        block.text for block in message.content if getattr(block, "type", "") == "text"
    )
    return _extract_json_from_response(text)


async def tailor_resume(resume_text: str, job_description: str) -> Dict[str, Any]:
    client = _get_client()
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2500,
        system=RESUME_TAILOR_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": (
                    f"## Candidate Resume\n{resume_text}\n\n"
                    f"## Job Description\n{job_description}"
                ),
            }
        ],
    )
    text = "".join(
        block.text for block in message.content if getattr(block, "type", "") == "text"
    )
    return _extract_json_from_response(text)


_CHAT_TOOLS = [
    {
        "name": "navigate_to_page",
        "description": "Navigate the user to a specific page in the InternIQ dashboard",
        "input_schema": {
            "type": "object",
            "properties": {
                "page": {
                    "type": "string",
                    "enum": [
                        "overview",
                        "tracker",
                        "profile",
                        "analyze",
                        "email",
                        "automation",
                        "interview-prep",
                        "cover-letter",
                        "resume-tailor",
                    ],
                    "description": "The dashboard page to navigate to",
                }
            },
            "required": ["page"],
        },
    },
    {
        "name": "add_application",
        "description": (
            "Add a new internship/job application to the user's tracker board. "
            "Use this whenever the user mentions applying somewhere, getting an interview, "
            "receiving an offer, being rejected, or wanting to track/save a job. "
            "Extract company, role, status, location, and any pay/salary info from their message."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "company": {"type": "string", "description": "Company name"},
                "role": {
                    "type": "string",
                    "description": "Job/internship title. If not specified, use 'General Application'",
                },
                "status": {
                    "type": "string",
                    "enum": ["saved", "applied", "interview", "offer", "rejected"],
                    "description": "Application status (defaults to saved)",
                },
                "location": {"type": "string", "description": "Job location"},
                "job_url": {"type": "string", "description": "URL of the job posting"},
                "notes": {"type": "string", "description": "Any notes about the application"},
            },
            "required": ["company", "role"],
        },
    },
    {
        "name": "update_application",
        "description": (
            "Update an existing application's status or details. Use when user says "
            "things like 'move Google to interview', 'I got rejected from Meta', "
            "'update my Stripe notes'. Match by company name from the context."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "company": {
                    "type": "string",
                    "description": "Company name to match against existing applications",
                },
                "status": {
                    "type": "string",
                    "enum": ["saved", "applied", "interview", "offer", "rejected"],
                    "description": "New status to set",
                },
                "notes": {"type": "string", "description": "Notes to append"},
            },
            "required": ["company"],
        },
    },
    {
        "name": "open_add_dialog",
        "description": "Open the Quick Add Application dialog for the user to fill in details manually",
        "input_schema": {
            "type": "object",
            "properties": {},
        },
    },
    {
        "name": "set_tracker_filter",
        "description": "Set a search query or status filter on the application tracker and navigate there",
        "input_schema": {
            "type": "object",
            "properties": {
                "search": {
                    "type": "string",
                    "description": "Search query for company or role",
                },
                "status_filter": {
                    "type": "string",
                    "enum": ["saved", "applied", "interview", "offer", "rejected"],
                    "description": "Filter by application status",
                },
            },
        },
    },
]


async def chat_completion(messages: list, context: dict) -> Dict[str, Any]:
    client = _get_client()
    system = CHATBOT_SYSTEM_PROMPT
    if context:
        system += f"\n\nCURRENT USER CONTEXT:\n{json.dumps(context, indent=2)}"

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=800,
        system=system,
        messages=messages,
        tools=_CHAT_TOOLS,
    )

    reply_parts: list[str] = []
    actions: list[Dict[str, Any]] = []
    tool_use_blocks = []

    for block in response.content:
        if getattr(block, "type", "") == "text":
            reply_parts.append(block.text)
        elif getattr(block, "type", "") == "tool_use":
            actions.append({"type": block.name, "payload": block.input})
            tool_use_blocks.append(block)

    if response.stop_reason == "tool_use" and tool_use_blocks:
        assistant_content = []
        for block in response.content:
            if getattr(block, "type", "") == "text":
                assistant_content.append({"type": "text", "text": block.text})
            elif getattr(block, "type", "") == "tool_use":
                assistant_content.append(
                    {
                        "type": "tool_use",
                        "id": block.id,
                        "name": block.name,
                        "input": block.input,
                    }
                )

        tool_results = [
            {
                "type": "tool_result",
                "tool_use_id": b.id,
                "content": f"Action '{b.name}' queued for client execution.",
            }
            for b in tool_use_blocks
        ]

        follow_up = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=300,
            system=system,
            messages=[
                *messages,
                {"role": "assistant", "content": assistant_content},
                {"role": "user", "content": tool_results},
            ],
        )

        reply_parts = [
            b.text for b in follow_up.content if getattr(b, "type", "") == "text"
        ]

    reply = "\n".join(reply_parts).strip() or "Done!"
    return {"reply": reply, "actions": actions}

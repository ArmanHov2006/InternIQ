from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from auth import verify_token
from services.claude_client import chat_completion

router = APIRouter(prefix="/api", tags=["chat"])


class _ChatMessage(BaseModel):
    role: str
    content: str


class _ChatAction(BaseModel):
    type: str
    payload: Dict[str, Any] = {}


class _ChatRequest(BaseModel):
    messages: List[_ChatMessage]
    context: Optional[Dict[str, Any]] = None


class _ChatResponse(BaseModel):
    reply: str
    actions: List[_ChatAction] = []


@router.post("/chat", response_model=_ChatResponse)
async def chat(body: _ChatRequest, user_id: str = Depends(verify_token)):
    result = await chat_completion(
        messages=[{"role": m.role, "content": m.content} for m in body.messages],
        context=body.context or {},
    )
    return _ChatResponse(
        reply=result["reply"],
        actions=[
            _ChatAction(type=a["type"], payload=a.get("payload", {}))
            for a in result.get("actions", [])
        ],
    )

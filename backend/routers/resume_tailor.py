import anthropic
from fastapi import APIRouter, Depends, HTTPException

from auth import verify_token
from models.schemas import (
    ResumeTailorRequest,
    ResumeTailorResponse,
    ResumeTailorSuggestion,
)
from services.claude_client import tailor_resume

router = APIRouter(prefix="/api", tags=["resume-tailor"])


@router.post("/resume-tailor", response_model=ResumeTailorResponse)
async def resume_tailor(
    payload: ResumeTailorRequest,
    user_id: str = Depends(verify_token),
) -> ResumeTailorResponse:
    _ = user_id

    try:
        generated = await tailor_resume(
            resume_text=payload.resume_text,
            job_description=payload.job_description,
        )
        items = generated.get("suggestions", [])
        suggestions = [
            ResumeTailorSuggestion(
                section=str(item.get("section", "General")).strip(),
                original=str(item.get("original", "")).strip(),
                suggested=str(item.get("suggested", "")).strip(),
                rationale=str(item.get("rationale", "")).strip(),
            )
            for item in items
            if isinstance(item, dict) and str(item.get("suggested", "")).strip()
        ]
        return ResumeTailorResponse(
            summary=str(generated.get("summary", "")).strip(),
            suggestions=suggestions,
        )
    except HTTPException:
        raise
    except anthropic.APIError as exc:
        raise HTTPException(
            status_code=500, detail="AI resume tailoring failed. Please try again."
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail="Something went wrong while tailoring resume."
        ) from exc

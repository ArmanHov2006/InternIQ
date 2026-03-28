import anthropic
from fastapi import APIRouter, Depends, HTTPException

from auth import verify_token
from models.schemas import CoverLetterRequest, CoverLetterResponse
from services.claude_client import generate_cover_letter
from services.scraper import scrape_job_url

router = APIRouter(prefix="/api", tags=["cover-letter"])


@router.post("/cover-letter", response_model=CoverLetterResponse)
async def cover_letter(
    payload: CoverLetterRequest,
    user_id: str = Depends(verify_token),
) -> CoverLetterResponse:
    _ = user_id

    try:
        job_text = await scrape_job_url(payload.job_url)
        generated = await generate_cover_letter(
            job_text=job_text,
            resume_text=payload.resume_text,
            company=payload.company,
            role=payload.role,
            tone=payload.tone,
        )
        return CoverLetterResponse(
            title=str(generated.get("title", "Cover Letter")).strip(),
            content=str(generated.get("content", "")).strip(),
        )
    except HTTPException:
        raise
    except anthropic.APIError as exc:
        raise HTTPException(
            status_code=500, detail="AI cover letter generation failed. Please try again."
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail="Something went wrong while generating cover letter."
        ) from exc

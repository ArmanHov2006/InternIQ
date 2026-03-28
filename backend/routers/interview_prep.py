import anthropic
from fastapi import APIRouter, Depends, HTTPException

from auth import verify_token
from models.schemas import InterviewPrepRequest, InterviewPrepResponse, InterviewQuestion
from services.claude_client import generate_interview_prep
from services.scraper import scrape_job_url

router = APIRouter(prefix="/api", tags=["interview-prep"])


@router.post("/interview-prep", response_model=InterviewPrepResponse)
async def interview_prep(
    payload: InterviewPrepRequest,
    user_id: str = Depends(verify_token),
) -> InterviewPrepResponse:
    _ = user_id

    try:
        job_text = await scrape_job_url(payload.job_url)
        generated = await generate_interview_prep(job_text, payload.resume_text)
        items = generated.get("questions", [])
        questions = [
            InterviewQuestion(
                category=str(item.get("category", "general")),
                question=str(item.get("question", "")).strip(),
                answer_framework=str(item.get("answer_framework", "")).strip(),
            )
            for item in items
            if isinstance(item, dict) and str(item.get("question", "")).strip()
        ]
        return InterviewPrepResponse(questions=questions)
    except HTTPException:
        raise
    except anthropic.APIError as exc:
        raise HTTPException(
            status_code=500, detail="AI interview prep generation failed. Please try again."
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Something went wrong while generating interview questions.",
        ) from exc

import anthropic
from fastapi import APIRouter, Depends, HTTPException

from auth import verify_token
from models.schemas import EmailRequest, EmailResponse
from services.claude_client import generate_cold_email
from services.scraper import scrape_job_url


router = APIRouter(prefix="/api", tags=["email"])


@router.post("/generate-email", response_model=EmailResponse)
async def generate_email(
    payload: EmailRequest,
    user_id: str = Depends(verify_token),
) -> EmailResponse:
    _ = user_id

    try:
        job_text = await scrape_job_url(payload.job_url)
        contact = payload.contact_name or "Hiring Manager"
        generated = await generate_cold_email(
            job_text=job_text,
            resume_text=payload.resume_text,
            company=payload.company,
            role=payload.role,
            contact_name=contact,
            tone=payload.tone,
        )
        return EmailResponse(
            subject=str(generated.get("subject", "")).strip(),
            body=str(generated.get("body", "")).strip(),
        )
    except HTTPException:
        raise
    except anthropic.APIError as exc:
        raise HTTPException(
            status_code=500, detail="AI email generation failed. Please try again."
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail="Something went wrong while generating email."
        ) from exc

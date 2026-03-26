import anthropic
from fastapi import APIRouter, Depends, HTTPException

from auth import verify_token
from models.schemas import AnalyzeRequest, AnalyzeResponse, AnalysisDetail
from services.claude_client import analyze_fit
from services.scraper import scrape_job_url


router = APIRouter(prefix="/api", tags=["analyze"])


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_resume_fit(
    payload: AnalyzeRequest,
    user_id: str = Depends(verify_token),
) -> AnalyzeResponse:
    _ = user_id

    try:
        job_text = await scrape_job_url(payload.job_url)
        analysis = await analyze_fit(job_text, payload.resume_text)

        fit_score = int(analysis.get("fit_score", 0))
        details = AnalysisDetail(
            strengths=[str(item) for item in analysis.get("strengths", [])],
            gaps=[str(item) for item in analysis.get("gaps", [])],
            suggestions=[str(item) for item in analysis.get("suggestions", [])],
            summary=str(analysis.get("summary", "")),
        )

        return AnalyzeResponse(fit_score=fit_score, analysis=details)
    except HTTPException:
        raise
    except anthropic.APIError as exc:
        raise HTTPException(
            status_code=500, detail="AI analysis failed. Please try again."
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail="Something went wrong while analyzing fit."
        ) from exc

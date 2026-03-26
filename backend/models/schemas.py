from typing import List, Optional

from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    job_url: str
    resume_text: str


class AnalysisDetail(BaseModel):
    strengths: List[str]
    gaps: List[str]
    suggestions: List[str]
    summary: str


class AnalyzeResponse(BaseModel):
    fit_score: int
    analysis: AnalysisDetail


class EmailRequest(BaseModel):
    job_url: str
    resume_text: str
    company: str
    role: str
    contact_name: Optional[str] = None
    tone: str = "professional"


class EmailResponse(BaseModel):
    subject: str
    body: str

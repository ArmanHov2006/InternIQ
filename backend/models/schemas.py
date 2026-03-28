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


class InterviewPrepRequest(BaseModel):
    job_url: str
    resume_text: str


class InterviewQuestion(BaseModel):
    category: str
    question: str
    answer_framework: str


class InterviewPrepResponse(BaseModel):
    questions: List[InterviewQuestion]


class CoverLetterRequest(BaseModel):
    job_url: str
    resume_text: str
    company: str
    role: str
    tone: str = "professional"


class CoverLetterResponse(BaseModel):
    title: str
    content: str


class ResumeTailorRequest(BaseModel):
    resume_text: str
    job_description: str


class ResumeTailorSuggestion(BaseModel):
    section: str
    original: str
    suggested: str
    rationale: str


class ResumeTailorResponse(BaseModel):
    summary: str
    suggestions: List[ResumeTailorSuggestion]

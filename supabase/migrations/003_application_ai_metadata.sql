-- Optional JSON blob for per-application AI outputs (cover letter, interview prep, resume tailor)
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS ai_metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.applications.ai_metadata IS 'Structured AI artifacts keyed by feature (coverLetter, interviewPrep, resumeTailor)';

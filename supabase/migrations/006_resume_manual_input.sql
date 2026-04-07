-- =============================================================
-- InternIQ: Manual resume input and richer resume metadata
-- =============================================================

ALTER TABLE public.resumes
  ALTER COLUMN file_url DROP NOT NULL;

ALTER TABLE public.resumes
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'upload'
    CHECK (source_type IN ('upload', 'manual')),
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.resumes
SET source_type = 'upload'
WHERE source_type IS NULL OR source_type = '';

DROP TRIGGER IF EXISTS update_resumes_updated_at ON public.resumes;

CREATE TRIGGER update_resumes_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

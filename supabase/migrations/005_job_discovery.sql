-- =============================================================
-- InternIQ: Job discovery (preferences, runs, opportunity API fields)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.discovery_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  locations TEXT[] NOT NULL DEFAULT '{}',
  remote_preference TEXT NOT NULL DEFAULT 'any'
    CHECK (remote_preference IN ('any', 'remote_only', 'hybrid', 'onsite')),
  role_types TEXT[] NOT NULL DEFAULT '{}',
  excluded_companies TEXT[] NOT NULL DEFAULT '{}',
  greenhouse_slugs TEXT[] NOT NULL DEFAULT '{}',
  min_match_score INT NOT NULL DEFAULT 50
    CHECK (min_match_score >= 0 AND min_match_score <= 100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_discovery_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.discovery_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  api_source TEXT NOT NULL DEFAULT 'aggregate'
    CHECK (api_source IN ('adzuna', 'themuse', 'remotive', 'greenhouse', 'aggregate')),
  query_params JSONB NOT NULL DEFAULT '{}'::jsonb,
  results_count INT NOT NULL DEFAULT 0,
  new_opportunities_count INT NOT NULL DEFAULT 0,
  ai_scored_count INT NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_discovery_runs_user_started
  ON public.discovery_runs(user_id, started_at DESC);

CREATE TRIGGER update_discovery_preferences_updated_at
  BEFORE UPDATE ON public.discovery_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS api_source TEXT,
  ADD COLUMN IF NOT EXISTS api_job_id TEXT,
  ADD COLUMN IF NOT EXISTS discovery_run_id UUID,
  ADD COLUMN IF NOT EXISTS ai_score JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'opportunities_discovery_run_id_fkey'
  ) THEN
    ALTER TABLE public.opportunities
      ADD CONSTRAINT opportunities_discovery_run_id_fkey
      FOREIGN KEY (discovery_run_id) REFERENCES public.discovery_runs(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_opportunities_user_api_dedupe
  ON public.opportunities (user_id, api_source, api_job_id)
  WHERE api_source IS NOT NULL AND api_job_id IS NOT NULL;

ALTER TABLE public.discovery_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own discovery preferences"
  ON public.discovery_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own discovery preferences"
  ON public.discovery_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own discovery preferences"
  ON public.discovery_preferences FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own discovery preferences"
  ON public.discovery_preferences FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own discovery runs"
  ON public.discovery_runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own discovery runs"
  ON public.discovery_runs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own discovery runs"
  ON public.discovery_runs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own discovery runs"
  ON public.discovery_runs FOR DELETE USING (auth.uid() = user_id);

-- Draft answers for Smart Apply (Phase 2)
ALTER TABLE public.application_artifacts
  DROP CONSTRAINT IF EXISTS application_artifacts_artifact_type_check;

ALTER TABLE public.application_artifacts
  ADD CONSTRAINT application_artifacts_artifact_type_check
  CHECK (artifact_type IN (
    'proof_pack',
    'recruiter_note',
    'story_bank',
    'company_brief',
    'resume_version',
    'draft_answers'
  ));

ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS discovery_last_seen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS discovery_missed_runs INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discovery_is_stale BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_opportunities_discovery_active
  ON public.opportunities (user_id, source, status, discovery_is_stale, updated_at DESC)
  WHERE api_source IS NOT NULL AND api_job_id IS NOT NULL;

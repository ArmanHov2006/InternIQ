-- Add automation metadata and immutable status event log.

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS status_source TEXT NOT NULL DEFAULT 'manual'
    CHECK (status_source IN ('manual', 'email_auto', 'email_suggested')),
  ADD COLUMN IF NOT EXISTS status_confidence NUMERIC(5,4) NOT NULL DEFAULT 1.0
    CHECK (status_confidence >= 0 AND status_confidence <= 1),
  ADD COLUMN IF NOT EXISTS status_evidence TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS previous_status TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS auto_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suggestion_pending BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_applications_status_source ON public.applications (user_id, status_source);
CREATE INDEX IF NOT EXISTS idx_applications_suggestion_pending ON public.applications (user_id, suggestion_pending);

CREATE TABLE IF NOT EXISTS public.application_status_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  previous_status TEXT NOT NULL,
  next_status TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('manual', 'email_auto', 'email_suggested', 'undo')),
  confidence NUMERIC(5,4) NOT NULL DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  evidence TEXT DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_application_status_events_app ON public.application_status_events (application_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_application_status_events_user ON public.application_status_events (user_id, created_at DESC);

ALTER TABLE public.application_status_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own status events" ON public.application_status_events;
CREATE POLICY "Users can view own status events"
  ON public.application_status_events
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own status events" ON public.application_status_events;
CREATE POLICY "Users can insert own status events"
  ON public.application_status_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own status events" ON public.application_status_events;
CREATE POLICY "Users can update own status events"
  ON public.application_status_events
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

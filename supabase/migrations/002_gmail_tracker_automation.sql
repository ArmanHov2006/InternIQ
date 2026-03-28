-- =============================================================
-- InternIQ: Gmail tracker automation schema
-- =============================================================

-- Add provenance fields to applications so tracker can explain
-- why/where a status changed (manual vs automation).
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS last_status_change_source TEXT NOT NULL DEFAULT 'manual'
    CHECK (last_status_change_source IN ('manual', 'gmail_auto', 'gmail_confirmed', 'system')),
  ADD COLUMN IF NOT EXISTS last_status_change_reason TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_status_change_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Gmail account connection and automation settings per user.
CREATE TABLE IF NOT EXISTS public.email_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gmail')),
  provider_account_email TEXT NOT NULL,
  access_token TEXT NOT NULL DEFAULT '',
  refresh_token TEXT NOT NULL DEFAULT '',
  access_token_expires_at TIMESTAMPTZ,
  watch_expiration TIMESTAMPTZ,
  automation_mode TEXT NOT NULL DEFAULT 'suggestions_only'
    CHECK (automation_mode IN ('suggestions_only', 'hybrid', 'fully_auto')),
  auto_update_threshold NUMERIC(4, 3) NOT NULL DEFAULT 0.90
    CHECK (auto_update_threshold >= 0 AND auto_update_threshold <= 1),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_account_email),
  UNIQUE (user_id, provider)
);

CREATE TRIGGER update_email_connections_updated_at
  BEFORE UPDATE ON public.email_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Raw/normalized inbound email events and processing lifecycle.
CREATE TABLE IF NOT EXISTS public.email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES public.email_connections(id) ON DELETE SET NULL,
  provider TEXT NOT NULL CHECK (provider IN ('gmail')),
  provider_message_id TEXT NOT NULL,
  provider_thread_id TEXT,
  provider_history_id TEXT,
  from_email TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  snippet TEXT NOT NULL DEFAULT '',
  received_at TIMESTAMPTZ,
  normalized_signal TEXT NOT NULL DEFAULT 'unknown',
  proposed_status TEXT CHECK (proposed_status IN ('saved', 'applied', 'interview', 'offer', 'rejected')),
  confidence NUMERIC(4, 3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  processing_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (processing_status IN ('pending', 'processed', 'suggested', 'applied', 'ignored', 'dead_letter')),
  processing_attempts INT NOT NULL DEFAULT 0,
  last_error TEXT NOT NULL DEFAULT '',
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_message_id)
);

CREATE INDEX IF NOT EXISTS idx_email_events_user_created_at
  ON public.email_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_events_status
  ON public.email_events(user_id, processing_status);

CREATE INDEX IF NOT EXISTS idx_email_events_thread
  ON public.email_events(provider_thread_id);

CREATE TRIGGER update_email_events_updated_at
  BEFORE UPDATE ON public.email_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Suggestions created when confidence is below threshold or anti-flap guards trigger.
CREATE TABLE IF NOT EXISTS public.application_status_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  email_event_id UUID REFERENCES public.email_events(id) ON DELETE SET NULL,
  from_status TEXT CHECK (from_status IN ('saved', 'applied', 'interview', 'offer', 'rejected')),
  to_status TEXT NOT NULL CHECK (to_status IN ('saved', 'applied', 'interview', 'offer', 'rejected')),
  confidence NUMERIC(4, 3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  reason TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  acted_at TIMESTAMPTZ,
  acted_by_source TEXT NOT NULL DEFAULT 'user'
    CHECK (acted_by_source IN ('user', 'system')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_status_suggestions_user_status
  ON public.application_status_suggestions(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_status_suggestions_application
  ON public.application_status_suggestions(application_id, created_at DESC);

CREATE TRIGGER update_application_status_suggestions_updated_at
  BEFORE UPDATE ON public.application_status_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================
-- RLS
-- =====================
ALTER TABLE public.email_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email connections"
  ON public.email_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own email connections"
  ON public.email_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own email connections"
  ON public.email_connections FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own email connections"
  ON public.email_connections FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own email events"
  ON public.email_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own email events"
  ON public.email_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own email events"
  ON public.email_events FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own email events"
  ON public.email_events FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own status suggestions"
  ON public.application_status_suggestions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own status suggestions"
  ON public.application_status_suggestions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own status suggestions"
  ON public.application_status_suggestions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own status suggestions"
  ON public.application_status_suggestions FOR DELETE USING (auth.uid() = user_id);

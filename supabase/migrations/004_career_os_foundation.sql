-- =============================================================
-- InternIQ: Career OS foundation
-- =============================================================

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS job_description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'extension', 'imported', 'referral', 'automation')),
  ADD COLUMN IF NOT EXISTS board TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS external_job_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS match_score INT CHECK (match_score IS NULL OR (match_score >= 0 AND match_score <= 100)),
  ADD COLUMN IF NOT EXISTS next_action_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resume_version_id UUID;

CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  board TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'extension', 'imported', 'recommendation')),
  job_url TEXT NOT NULL DEFAULT '',
  external_job_id TEXT,
  salary_range TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'saved', 'applied', 'archived')),
  employment_type TEXT NOT NULL DEFAULT '',
  job_description TEXT NOT NULL DEFAULT '',
  match_score INT CHECK (match_score IS NULL OR (match_score >= 0 AND match_score <= 100)),
  match_summary TEXT NOT NULL DEFAULT '',
  matched_keywords TEXT[] NOT NULL DEFAULT '{}',
  missing_keywords TEXT[] NOT NULL DEFAULT '{}',
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  query TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  boards TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.application_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  relationship_type TEXT NOT NULL DEFAULT 'recruiter'
    CHECK (relationship_type IN ('recruiter', 'referrer', 'hiring_manager', 'interviewer', 'other')),
  notes TEXT NOT NULL DEFAULT '',
  last_contacted_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.application_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.application_contacts(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'email'
    CHECK (channel IN ('email', 'linkedin', 'phone', 'meeting', 'other')),
  summary TEXT NOT NULL DEFAULT '',
  direction TEXT NOT NULL DEFAULT 'outbound'
    CHECK (direction IN ('inbound', 'outbound', 'internal')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.application_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'done', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.interview_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  interview_type TEXT NOT NULL DEFAULT 'screen'
    CHECK (interview_type IN ('screen', 'behavioral', 'technical', 'onsite', 'final', 'other')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.resume_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  label TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  keyword_coverage INT CHECK (keyword_coverage IS NULL OR (keyword_coverage >= 0 AND keyword_coverage <= 100)),
  targeted_keywords TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.application_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  artifact_type TEXT NOT NULL
    CHECK (artifact_type IN ('proof_pack', 'recruiter_note', 'story_bank', 'company_brief', 'resume_version')),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  share_slug TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.application_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('status_change', 'contact', 'interview', 'artifact', 'note', 'system')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_user_status
  ON public.opportunities(user_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_user_match
  ON public.opportunities(user_id, match_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user
  ON public.saved_searches(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_application_contacts_application
  ON public.application_contacts(application_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_application_conversations_application
  ON public.application_conversations(application_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_application_reminders_application
  ON public.application_reminders(application_id, due_at ASC);
CREATE INDEX IF NOT EXISTS idx_interview_events_application
  ON public.interview_events(application_id, scheduled_at ASC);
CREATE INDEX IF NOT EXISTS idx_resume_versions_application
  ON public.resume_versions(application_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_application_artifacts_application
  ON public.application_artifacts(application_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_application_artifacts_share_slug
  ON public.application_artifacts(share_slug)
  WHERE share_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_application_timeline_events_application
  ON public.application_timeline_events(application_id, occurred_at DESC);

CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_saved_searches_updated_at
  BEFORE UPDATE ON public.saved_searches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_application_contacts_updated_at
  BEFORE UPDATE ON public.application_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_application_reminders_updated_at
  BEFORE UPDATE ON public.application_reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_interview_events_updated_at
  BEFORE UPDATE ON public.interview_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_application_artifacts_updated_at
  BEFORE UPDATE ON public.application_artifacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own opportunities"
  ON public.opportunities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own opportunities"
  ON public.opportunities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own opportunities"
  ON public.opportunities FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own opportunities"
  ON public.opportunities FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own saved searches"
  ON public.saved_searches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved searches"
  ON public.saved_searches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own saved searches"
  ON public.saved_searches FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved searches"
  ON public.saved_searches FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own application contacts"
  ON public.application_contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own application contacts"
  ON public.application_contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own application contacts"
  ON public.application_contacts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own application contacts"
  ON public.application_contacts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own application conversations"
  ON public.application_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own application conversations"
  ON public.application_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own application conversations"
  ON public.application_conversations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own application conversations"
  ON public.application_conversations FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own application reminders"
  ON public.application_reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own application reminders"
  ON public.application_reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own application reminders"
  ON public.application_reminders FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own application reminders"
  ON public.application_reminders FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own interview events"
  ON public.interview_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own interview events"
  ON public.interview_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own interview events"
  ON public.interview_events FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own interview events"
  ON public.interview_events FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own resume versions"
  ON public.resume_versions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own resume versions"
  ON public.resume_versions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own resume versions"
  ON public.resume_versions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own resume versions"
  ON public.resume_versions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own application artifacts"
  ON public.application_artifacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Shared proof packs are public"
  ON public.application_artifacts FOR SELECT USING (artifact_type = 'proof_pack' AND share_slug IS NOT NULL);
CREATE POLICY "Users can insert own application artifacts"
  ON public.application_artifacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own application artifacts"
  ON public.application_artifacts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own application artifacts"
  ON public.application_artifacts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own application timeline"
  ON public.application_timeline_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own application timeline"
  ON public.application_timeline_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own application timeline"
  ON public.application_timeline_events FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own application timeline"
  ON public.application_timeline_events FOR DELETE USING (auth.uid() = user_id);

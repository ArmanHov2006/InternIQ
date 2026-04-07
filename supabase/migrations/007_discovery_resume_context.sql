ALTER TABLE public.discovery_preferences
  ADD COLUMN IF NOT EXISTS resume_context_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS resume_context_customized BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resume_context_overrides JSONB NOT NULL DEFAULT
    '{"skills":[],"locations":[],"role_types":[],"note":""}'::jsonb;

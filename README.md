# InternIQ

InternIQ is a full-stack **job application tracker** with AI embedded directly into each application.

Primary product identity: **Job Application Tracker**  
Core principle: **the Application is the atomic unit**.  
AI actions are performed inside the application workflow, not as standalone tools.

## Product Scope

Main navigation:
- `Dashboard`: executive pipeline overview
- `Pipeline`: kanban workspace + application drawer
- `Insights`: analytics and batch preparation
- `Settings`: profile, resumes, integrations

Application drawer tabs:
- `Overview`: core application fields + notes autosave
- `AI`: analyze fit, cold email, cover letter, interview prep, resume tailoring
- `History`: workflow and automation traceability

## Tech Stack

- Frontend: Next.js App Router, TypeScript, Tailwind, Radix UI
- State: Zustand
- Database/Auth: Supabase (Postgres + RLS)
- AI services: Next.js API + FastAPI backend
- Automation: Gmail webhook ingestion + suggestion engine
- Testing: Vitest

## Local Setup

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

Copy environment templates and fill required values:

- Root app: `.env.example` -> `.env.local`
- Backend service: `backend/.env.example` -> `backend/.env`

Minimum local values are typically:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_FASTAPI_URL`

Optional (automation/AI fallback):
- `NEXT_PUBLIC_GMAIL_AUTOMATION_ENABLED`
- `GMAIL_AUTOMATION_ENABLED`
- `GMAIL_WEBHOOK_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `TOKEN_ENCRYPTION_KEY`
- `ANTHROPIC_API_KEY`

### 3) Run app

```bash
npm run dev
```

### 4) Verify quality gates

```bash
npm run lint
npm run test
npm run build
```

## Database and Migrations

Supabase SQL migrations live in:
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_gmail_tracker_automation.sql`
- `supabase/migrations/003_application_ai_metadata.sql`

## Demo Script (Internship Review)

Use this short walkthrough:

1. Open `Pipeline`, add 2-3 applications.
2. Open an application drawer and run `Analyze Fit`.
3. Generate one AI artifact (email or cover letter) and confirm persistence.
4. Go to `Dashboard` and show needs-attention routing back to pipeline.
5. Show `Insights` analytics and `Settings` integrations/resume management.

## Architecture

See `SYSTEM_DESIGN.md` for architecture and data flow details.

## Release Planning

See `RELEASE_MONETIZATION.md` for pricing, metering, and launch checklist.

# InternIQ System Design

## Product Principle

InternIQ is a job application tracker where **Application is the atomic unit**.

- Every major workflow starts from an application record.
- AI outputs are persisted onto the application.
- Navigation supports workflow context, not disconnected tools.

## High-Level Architecture

```mermaid
flowchart LR
  subgraph client [Next.js Client]
    dashboard[Dashboard]
    pipeline[Pipeline]
    insights[Insights]
    settings[Settings]
    drawer[ApplicationDrawer]
  end

  subgraph api [Next.js API Routes]
    appsApi[/api/applications]
    aiApi[/api/analyze /api/email /api/cover-letter /api/interview-prep /api/resume-tailor]
    gmailApi[/api/automation/* and /api/integrations/gmail/*]
    chatApi[/api/chat]
  end

  subgraph db [Supabase]
    appTable[(applications)]
    resumeTable[(resumes)]
    suggestionTable[(application_status_suggestions)]
    connTable[(email_connections)]
  end

  subgraph aiBackend [FastAPI Backend]
    orchestrator[AI Routers and Services]
  end

  pipeline --> drawer
  dashboard --> appsApi
  insights --> appsApi
  settings --> gmailApi
  drawer --> appsApi
  drawer --> aiApi
  aiApi --> aiBackend
  appsApi --> appTable
  settings --> resumeTable
  gmailApi --> connTable
  gmailApi --> suggestionTable
  chatApi --> appsApi
```

## Request and Data Flows

1. `Pipeline` loads `applications`, renders Kanban, and opens `ApplicationDrawer`.
2. Drawer `Overview` edits persist through `PUT /api/applications`.
3. Drawer `AI` actions call feature routes and save outputs to fields like:
   - `fit_score`
   - `fit_analysis`
   - `generated_email`
   - `ai_metadata` (structured JSON for additional outputs)
4. `Dashboard` and `Insights` compute analytics from `GET /api/applications`.
5. Gmail integration stores connection records and status suggestions that feed `Needs Attention`.

## Key Modules

- Routing and pages: `src/app/(dashboard)/dashboard/*`
- Pipeline UX: `src/components/kanban/*`, `src/components/pipeline/*`
- API layer: `src/app/api/*`
- Data types: `src/types/database.ts`
- State store: `src/stores/kanban-store.ts`
- Migrations: `supabase/migrations/*`

## Security and Reliability Notes

- Supabase Auth + RLS as baseline data isolation.
- OAuth tokens encrypted before persistence.
- Middleware applies baseline security headers.
- Rate limiting exists but should be distributed for production multi-instance deployments.

## Internship Demo Narrative

1. Add applications in pipeline.
2. Open drawer and run AI analysis.
3. Show persisted AI outputs on the same application.
4. Show dashboard needs-attention and insights analytics.
5. Show settings profile/resume and integration controls.

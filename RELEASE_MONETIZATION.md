# Release and Monetization Checklist

## Pricing Definition

Current package definition lives in `src/lib/billing/plans.ts`.

- Free: pipeline + insights + limited AI
- Pro: prioritizer + application pack + follow-up copilot
- Pro+: automation-heavy and advanced intelligence

## Usage Metering Strategy

Track these counters per user per billing cycle:

- AI generation calls (`/api/analyze`, `/api/email/generate`, `/api/cover-letter/generate`, `/api/interview-prep`, `/api/resume-tailor`, chat AI actions)
- Automation events processed
- Active applications count

Recommended storage:

- `subscription_plans` table (plan metadata snapshot)
- `user_subscriptions` table (current plan, billing cycle dates)
- `usage_events` table (event stream for audit/debug)
- `usage_aggregates` table (fast quota checks per cycle)

## Release Gates

1. Product
   - 4-nav architecture stable
   - application drawer AI persistence verified
   - insights prioritizer + follow-up workflows verified
2. Engineering
   - lint/build/tests green in CI
   - route-level error and fallback states reviewed
   - data migrations reviewed and applied
3. Security and Ops
   - webhook signature verification enabled
   - production secrets and token encryption key rotated
   - analytics + error monitoring connected
4. Go-to-market
   - landing page pricing section
   - onboarding checklist for first session
   - support/contact channel and feedback collection

## Pre-Launch Dry Run

- Invite 5-10 pilot users.
- Run two weeks in Free mode while recording friction.
- Enable Pro plan manually for pilot users.
- Validate conversion trigger: users who generate >=10 AI actions in a week.

## Monetization KPIs

- Activation: first application + first AI action within 24 hours
- Weekly active users
- AI actions per active user
- Free-to-Pro conversion
- Churn (monthly)

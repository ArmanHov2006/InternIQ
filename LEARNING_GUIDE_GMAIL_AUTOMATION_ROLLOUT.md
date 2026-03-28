# Gmail Automation Rollout Guide

## Stage 0: Suggestions only (recommended default)

1. Apply `supabase/migrations/002_gmail_tracker_automation.sql`.
2. Set feature flags:
   - `NEXT_PUBLIC_GMAIL_AUTOMATION_ENABLED=true`
   - `GMAIL_AUTOMATION_ENABLED=true`
3. Keep each user connection in `automation_mode = suggestions_only`.
4. Verify suggestions arrive in `/dashboard/automation`.

## Stage 1: Hybrid mode

1. For pilot users, change `automation_mode` to `hybrid`.
2. Set `auto_update_threshold` to `0.90` initially.
3. Monitor `/dashboard/automation/debug` and `/api/automation/gmail/metrics`.
4. Confirm dead-letter rate remains low before expanding to more users.

## Stage 2: Fully automatic (optional)

1. Enable `fully_auto` only for high-trust users/workflows.
2. Keep replay path and suggestion review available for audits.

## Test commands

- Lint: `npm run lint`
- Build: `npm run build`
- Unit tests: `npm run test`

## Current test coverage

- Signal parsing rules: `tests/email-classifier.test.ts`
- Webhook payload parsing: `tests/gmail-webhook-parsing.test.ts`
- Transition guard behavior: `tests/automation-policy.test.ts`

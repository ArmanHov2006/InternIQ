-- Expand tracker status taxonomy to linear9 and backfill legacy values.

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE public.applications
  ALTER COLUMN status SET DEFAULT 'saved';

UPDATE public.applications
SET status = CASE
  WHEN status = 'phone_screen' THEN 'recruiter_screen'
  WHEN status = 'interview' THEN 'hiring_manager'
  WHEN status IN (
    'saved',
    'applied',
    'recruiter_screen',
    'hiring_manager',
    'final_round',
    'take_home',
    'offer',
    'rejected',
    'withdrawn'
  ) THEN status
  ELSE 'saved'
END;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_check
  CHECK (
    status IN (
      'saved',
      'applied',
      'recruiter_screen',
      'hiring_manager',
      'final_round',
      'take_home',
      'offer',
      'rejected',
      'withdrawn'
    )
  );

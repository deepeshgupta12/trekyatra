# STEP 31 — Email Automation and Audience Workflows

## Goal
Build automated email sequences: welcome on signup, season-based nurture, trek interest tagging on newsletter subscribers. These compound subscriber engagement and support the lead pipeline.

## Scope

### Welcome email sequence
- Trigger: user signs up → `send_welcome_email_task` Celery task fires
- Email: subject "Welcome to TrekYatra", intro + 3 curated trek recommendations (top-rated by difficulty match)
- Trek recommendations pulled from cms_pages (published, ranked by freshness)
- SMTP send via existing SMTP config (Step 22 pattern)

### Trek interest tagging
- When a lead is submitted with `trek_interest` field → tag the associated newsletter subscriber record with that trek
- `subscriber_tags` table: subscriber_id, tag, created_at
- Tags drive nurture sequence selection

### Nurture sequences
- 3 sequences defined in `email_sequences` table: winter_trek_nurture, monsoon_prep, general_trek_discovery
- `email_sequence_steps` table: sequence_id, step_number, subject, body_template, delay_days
- Subscriber enrolled in a sequence by tag match
- `subscriber_sequence_enrollments` table: subscriber_id, sequence_id, current_step, next_send_at, enrolled_at

### Digest opt-in/opt-out
- `newsletter_subscribers.preferences` JSON field: `{digest: bool, nurture: bool, seasonal: bool}`
- PATCH /api/v1/newsletter/preferences — token-authenticated (same pattern as Step 29 operator token)
- Unsubscribe link in every email sets `active = False`

### Beat tasks
- Daily: check `subscriber_sequence_enrollments` where `next_send_at <= now` → send next step email
- Weekly: send digest to subscribers with `preferences.digest = true` (calls Step 27 NewsletterAgent)

### Admin UI
- `/admin/email-sequences` (new page): list sequences, steps per sequence, enrollment counts, sent/open stats placeholder

### Backend
- Alembic migration: `subscriber_tags`, `email_sequences`, `email_sequence_steps`, `subscriber_sequence_enrollments` tables; `preferences` JSON on newsletter_subscribers
- Celery tasks: `send_welcome_email_task`, `process_nurture_sequences_task`

## Preconditions
- Read docs/MASTER_TRACKER.md, PROCESS_GUARDRAILS.md, DEPENDENCY_MAP.md
- Confirm Step 30 complete
- Confirm Step 22 complete (newsletter_subscribers table + SMTP)
- Confirm Step 27 complete (NewsletterAgent for digest)

## Dependency Check
- `app/modules/newsletter/models.py` — NewsletterSubscriber (add preferences field via migration)
- `app/modules/leads/` — lead submission fires subscriber tag
- `app/worker/celery_app.py` — daily/weekly beat tasks

## Planned Files to Create
- `services/api/alembic/versions/YYYYMMDD_0020_email_sequences.py`
- `services/api/app/modules/email_sequences/__init__.py`
- `services/api/app/modules/email_sequences/models.py`
- `services/api/app/modules/email_sequences/service.py`
- `services/api/app/modules/email_sequences/tasks.py`
- `services/api/app/api/routes/email_sequences.py`
- `services/api/app/schemas/email_sequences.py`
- `services/api/tests/test_email_sequences.py`
- `apps/web-next/app/(admin)/admin/email-sequences/page.tsx`

## Planned Files to Modify
- `services/api/app/modules/newsletter/models.py`
- `services/api/app/modules/leads/service.py` — subscriber tagging
- `services/api/app/worker/celery_app.py` — new beat tasks
- `services/api/app/db/base.py`
- `services/api/app/api/router.py`
- `apps/web-next/app/(admin)/admin/layout.tsx`
- `apps/web-next/lib/api.ts`

## Status
pending

## Notes
- Email body templates are stored as Jinja2 strings in the DB — render with `jinja2.Template(step.body_template).render(subscriber=..., cms_pages=...)` before sending.
- Open tracking: embed a 1x1 pixel img with `/api/v1/track/email-open/{token}` URL — records open_at on enrollment step.
- Do not use this mechanism for transactional auth emails (those stay in auth module) — only marketing sequences.

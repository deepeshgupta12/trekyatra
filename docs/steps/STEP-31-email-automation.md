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
Done

## Files Created
- `services/api/alembic/versions/20260430_0020_email_sequences.py` — 4 new tables + 2 new columns on newsletter_subscribers; applied with `alembic upgrade head`
- `services/api/app/modules/email_sequences/__init__.py`
- `services/api/app/modules/email_sequences/models.py` — SubscriberTag, EmailSequence, EmailSequenceStep, SubscriberSequenceEnrollment ORM models
- `services/api/app/modules/email_sequences/service.py` — seed_default_sequences (3 sequences), list_sequences, get_sequence_with_steps, add_subscriber_tag, enroll_subscriber, enroll_by_tag (tag→slug routing), update_subscriber_preferences, generate/verify_preferences_token, get_pending_enrollments
- `services/api/app/modules/email_sequences/tasks.py` — send_welcome_email_task (Celery, SMTP-guarded, pulls 3 top published CMS pages for recommendations), process_nurture_sequences_task (Jinja2 template render, step advance, status=completed when done)
- `services/api/app/api/routes/email_sequences.py` — admin_router (GET/GET/{id}/POST seed/POST enroll) + public_router (PATCH /newsletter/preferences, GET /newsletter/unsubscribe); both HMAC-token authenticated for public routes
- `services/api/app/schemas/email_sequences.py` — EmailSequenceResponse, EmailSequenceStepResponse, SubscriberSequenceEnrollmentResponse, SubscriberPreferencesUpdate, SeedSequencesResponse
- `services/api/tests/test_email_sequences.py` — 17 tests (TC-B01 through TC-B17)
- `apps/web-next/app/(admin)/admin/email-sequences/page.tsx` — sequence list (expandable steps), KPI strip (sequences/steps/enrollments), Seed button, info card

## Files Modified
- `services/api/app/modules/newsletter/models.py` — `preferences` JSON + `active` Boolean added to NewsletterSubscriber
- `services/api/app/modules/leads/service.py` — subscriber tagging hook in create_lead (looks up NewsletterSubscriber by email, tags with trek_interest, enrolls in matching sequence)
- `services/api/app/api/routes/auth.py` — send_welcome_email_task.delay() fired after successful email signup
- `services/api/app/worker/celery_app.py` — `app.modules.email_sequences.tasks` in include; `daily-nurture-sequences` beat entry (86400s)
- `services/api/app/db/base.py` — SubscriberTag, EmailSequence, EmailSequenceStep, SubscriberSequenceEnrollment registered
- `services/api/app/api/router.py` — email_sequences_admin_router + email_sequences_public_router registered
- `services/api/pyproject.toml` — `jinja2>=3.1,<4.0` added
- `apps/web-next/app/(admin)/admin/layout.tsx` — "Email Sequences" nav item (Workflow icon) added to Growth group after Newsletter
- `apps/web-next/lib/api.ts` — EmailSequence, EmailSequenceStep, SeedSequencesResult interfaces; fetchEmailSequences, fetchEmailSequence, seedEmailSequences helpers

## Notes
- Jinja2 installed (3.1.6) and added to pyproject.toml — required for body_template rendering in process_nurture_sequences_task
- Tag routing: "winter" in tag → winter_trek_nurture; "monsoon" in tag → monsoon_prep; all others → general_trek_discovery
- Welcome email task fires try/except so a Celery/SMTP failure never breaks signup response
- Preferences PATCH + unsubscribe GET use HMAC-SHA256(subscriber_id, auth_jwt_secret) token — same token format generated server-side for inclusion in email links
- Digest weekly send: Step 27 NewsletterAgent generates the campaign; no separate Celery task added since the weekly-newsletter-generate beat already fires NewsletterAgent every 7 days
- 325/325 backend tests pass; `next build` clean (136 static pages); GitNexus re-indexed: 6,857 nodes | 11,664 edges | 236 clusters | 185 flows

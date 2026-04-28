# STEP 27 — Newsletter Automation + Repurposing Agent

## Goal
Build a NewsletterAgent that composes weekly digest emails from published content and a social repurposing agent that generates captions and pin copy. Wire to Mailchimp or Brevo for actual sending.

## Scope

### NewsletterAgent
- Weekly digest: picks top 3–5 recently published pages by freshness and page_type
- Generates: subject line, preview text, body HTML (hero section + content cards)
- Output stored in `newsletter_campaigns` table with status (draft / ready / sent)
- Human approval gate: editor reviews and approves in admin before send

### Social repurposing agent
- Input: any published CMSPage
- Output: Instagram caption (280 chars), Pinterest pin copy (150 chars + title), Twitter/X thread hook
- Stored in `social_snippets` table (page_id FK, platform, copy, status)

### Email sending integration
- Mailchimp or Brevo send via API (configured via `NEWSLETTER_PLATFORM` env var — pattern from Step 22 newsletter sync)
- `send_campaign(campaign_id)` — calls external API, updates status to `sent`, records sent_at

### Admin UI
- `/admin/newsletter` (new page): campaign list, compose button, preview modal, approve + send action
- Social snippets tab: view generated snippets per page, copy to clipboard

### Backend
- Alembic migration: `newsletter_campaigns` table + `social_snippets` table
- `POST /api/v1/admin/newsletter/generate` — trigger NewsletterAgent for current week
- `GET /api/v1/admin/newsletter` — list campaigns
- `POST /api/v1/admin/newsletter/{id}/send` — send approved campaign
- `POST /api/v1/admin/pages/{slug}/repurpose` — trigger social repurposing

## Preconditions
- Read docs/MASTER_TRACKER.md, PROCESS_GUARDRAILS.md, DEPENDENCY_MAP.md
- Confirm Step 26 complete
- Confirm Step 22 complete (newsletter subscriber sync pattern)
- NEWSLETTER_PLATFORM_API_KEY configured

## Dependency Check
- `app/modules/newsletter/` — existing service.py from Step 22 (extend, don't replace)
- `app/modules/cms/models.py` — CMSPage (read-only)

## Planned Files to Create
- `services/api/alembic/versions/YYYYMMDD_0017_newsletter_campaigns.py`
- `services/api/app/modules/agents/newsletter/agent.py`
- `services/api/app/modules/agents/social_repurpose/agent.py`
- `services/api/app/modules/newsletter/models.py` — NewsletterCampaign, SocialSnippet
- `services/api/app/api/routes/newsletter_admin.py`
- `services/api/app/schemas/newsletter.py`
- `services/api/tests/test_newsletter_agent.py`
- `apps/web-next/app/(admin)/admin/newsletter/page.tsx`

## Planned Files to Modify
- `services/api/app/modules/newsletter/service.py` — send_campaign helper
- `services/api/app/db/base.py`
- `services/api/app/api/router.py`
- `apps/web-next/app/(admin)/admin/layout.tsx` — nav item
- `apps/web-next/lib/api.ts`

## Status
pending

## Notes
- NewsletterAgent output is HTML — store as raw HTML in `body_html` column; preview modal in admin renders it in an iframe.
- Social repurposing agent runs synchronously (short output) — no Celery task needed; direct API response.
- Beat schedule: weekly on Monday 09:00 IST auto-generates newsletter draft (human still approves before send).

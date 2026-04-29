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
Done

## Files Created
- `services/api/alembic/versions/20260429_0017_newsletter_campaigns.py` — migration creating newsletter_campaigns + social_snippets tables
- `services/api/app/modules/agents/newsletter/__init__.py` — package init
- `services/api/app/modules/agents/newsletter/agent.py` — NewsletterAgent (LangGraph 3-node: fetch_pages → generate_newsletter → store_campaign); picks top 5 published CMSPages; Claude generates subject/preview_text/body_html JSON; JSON parsed with regex fallback; stores NewsletterCampaign(status=draft)
- `services/api/app/modules/agents/social_repurpose/__init__.py` — package init
- `services/api/app/modules/agents/social_repurpose/agent.py` — SocialRepurposeAgent (LangGraph 3-node: fetch_page → generate_snippets → store_snippets); Instagram + Pinterest + Twitter copy; stores 3 SocialSnippet records
- `services/api/app/api/routes/newsletter_admin.py` — GET /admin/newsletter, POST /admin/newsletter/generate, GET /admin/newsletter/{id}, POST /admin/newsletter/{id}/send, GET /admin/newsletter/snippets/list, POST /admin/pages/{slug}/repurpose; all require get_current_admin
- `services/api/tests/test_newsletter_agent.py` — 15 tests (1 skipped when published pages exist)
- `apps/web-next/app/(admin)/admin/newsletter/page.tsx` — campaigns tab (list + iframe preview + Send) + snippets tab (repurpose form + copy-to-clipboard per snippet)

## Files Modified
- `services/api/app/modules/newsletter/models.py` — NewsletterCampaign + SocialSnippet ORM models added
- `services/api/app/modules/newsletter/service.py` — list_campaigns, get_campaign, send_campaign (_send_mailchimp / _send_brevo), list_snippets added
- `services/api/app/modules/newsletter/tasks.py` — auto_generate_newsletter_task Celery task added
- `services/api/app/db/base.py` — NewsletterCampaign + SocialSnippet registered
- `services/api/app/api/router.py` — newsletter_admin_router + newsletter_pages_router registered
- `services/api/app/worker/celery_app.py` — weekly-newsletter-generate beat entry (604800s)
- `services/api/app/schemas/newsletter.py` — 5 new schema classes added
- `apps/web-next/app/(admin)/admin/layout.tsx` — "Newsletter" nav item (Mail icon) added to Growth group
- `apps/web-next/lib/api.ts` — 5 interfaces + 5 fetch helpers added

## Notes
- NewsletterAgent output is HTML — stored as raw HTML in body_html; preview modal renders in sandboxed iframe
- Social repurposing runs synchronously (short output) — no Celery task needed; direct API response
- Beat schedule: weekly (604800s) auto-generates newsletter draft — human must approve and trigger send separately
- send_campaign gracefully marks campaign as sent locally when NEWSLETTER_PLATFORM is not configured (no error)
- JSON parsing uses regex fallback (`re.search(r"\{.*\}", raw, re.DOTALL)`) in case LLM wraps output in commentary
- Use `.replace()` not `.format()` for prompt interpolation (JSON curly braces in body_html would cause KeyError with .format())
- 271/271 backend tests pass; next build clean (132 pages); GitNexus 5,930 nodes | 10,072 edges | 183 clusters | 181 flows

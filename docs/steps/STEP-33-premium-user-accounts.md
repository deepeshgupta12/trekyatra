# STEP 33 — Premium User Accounts + Bookmarks

## Goal
Build saved treks, download history, trek alert subscriptions, and onboarding form data persistence. These features increase return visits and deepen the product's value proposition for logged-in users.

## Scope

### Saved treks / bookmarks
- `user_bookmarks` table: user_id (FK→users), cms_page_id (FK→cms_pages), created_at
- `POST /api/v1/account/bookmarks` — add bookmark
- `DELETE /api/v1/account/bookmarks/{page_id}` — remove
- `GET /api/v1/account/bookmarks` — list saved pages (returns CMSPage summaries)
- Frontend: bookmark icon on trek cards and guide pages; saved list on `/account/saved`

### Download history
- `user_downloads` table: user_id, product_id (step 34 prereq — FK nullable for now), filename, downloaded_at
- `GET /api/v1/account/downloads` — list downloads
- Frontend: `/account/downloads` page renders download history

### Trek alert subscriptions
- `trek_alerts` table: user_id, trek_slug, alert_type (permit_open, new_content, price_change), active, created_at
- `POST /api/v1/account/alerts` — subscribe to trek alert
- `DELETE /api/v1/account/alerts/{id}` — unsubscribe
- Alert delivery: daily beat checks for trigger conditions → email via SMTP (Step 31 pattern)

### Onboarding form persistence
- Onboarding form (already exists on `/auth/onboarding` from Step 09) currently discards data
- `user_profiles` table: user_id, fitness_level, trek_experience, preferred_regions[], budget_range, submitted_at
- `PATCH /api/v1/account/profile` — save/update onboarding answers
- Used for personalised recommendations (Step 35)

### Admin UI
- `/admin/leads` — show bookmark_count per user next to leads (denormalised counter)

## Preconditions
- Read docs/MASTER_TRACKER.md, PROCESS_GUARDRAILS.md, DEPENDENCY_MAP.md
- Confirm Step 32 complete (V2 done)
- Confirm Step 09 complete (user auth, session, route guards)
- Confirm Step 16 complete (CMSPage model for bookmark FK)

## Dependency Check
- `app/modules/users/models.py` — User model (FK source for bookmarks, alerts)
- `app/modules/cms/models.py` — CMSPage (bookmark target)
- `app/api/routes/auth.py` — session auth dependency (`get_current_user`)

## Planned Files to Create
- `services/api/alembic/versions/YYYYMMDD_0022_user_bookmarks.py`
- `services/api/app/modules/account/__init__.py`
- `services/api/app/modules/account/models.py` — UserBookmark, UserDownload, TrekAlert, UserProfile
- `services/api/app/modules/account/service.py`
- `services/api/app/modules/account/tasks.py` — trek alert check beat task
- `services/api/app/api/routes/account.py`
- `services/api/app/schemas/account.py`
- `services/api/tests/test_account.py`
- `apps/web-next/app/(public)/account/saved/page.tsx` (rewrite from stub)
- `apps/web-next/app/(public)/account/downloads/page.tsx` (rewrite from stub)
- `apps/web-next/components/ui/BookmarkButton.tsx`

## Planned Files to Modify
- `services/api/app/db/base.py`
- `services/api/app/api/router.py`
- `apps/web-next/app/(public)/auth/onboarding/page.tsx` — wire to profile API
- `apps/web-next/lib/api.ts`

## Status
pending

## Notes
- Bookmark icon state: client-side optimistic update; confirm on API response.
- Trek alerts only fire if SMTP is configured — graceful no-op if not. Alert types expandable without migration via the alert_type string field.
- `user_profiles` is the personalisation foundation for Step 35 (recommendation engine).

# STEP 33 — Premium User Accounts + Bookmarks

## Goal
Build saved treks, download history, trek alert subscriptions, and onboarding form data persistence. These features increase return visits and deepen the product's value proposition for logged-in users.

## Scope

### Saved treks / bookmarks
- `user_bookmarks` table: user_id (FK→users), cms_page_id (FK→cms_pages), created_at
- `POST /api/v1/account/bookmarks` — add bookmark
- `DELETE /api/v1/account/bookmarks/{page_id}` — remove
- `GET /api/v1/account/bookmarks` — list saved pages (returns CMSPage summaries)
- Frontend: BookmarkButton client component; saved list on `/account/saved`

### Download history
- `user_downloads` table: user_id, product_id (step 34 prereq — FK nullable for now), filename, downloaded_at
- `GET /api/v1/account/downloads` — list downloads
- Frontend: `/account/downloads` page renders download history from real API

### Trek alert subscriptions
- `trek_alerts` table: user_id, trek_slug, alert_type (permit_open, new_content, price_change), active, created_at
- `POST /api/v1/account/alerts` — subscribe to trek alert
- `DELETE /api/v1/account/alerts/{trek_slug}` — unsubscribe
- Alert delivery: daily beat checks for trigger conditions → email via SMTP (Step 31 pattern)

### Onboarding form persistence
- Onboarding form (already exists on `/auth/onboarding` from Step 09) previously discarded data
- `user_profiles` table: user_id, fitness_level, trek_experience, preferred_regions[], budget_range, submitted_at
- `PATCH /api/v1/account/profile` — save/update onboarding answers
- Used for personalised recommendations (Step 35)

## Preconditions
- Read docs/MASTER_TRACKER.md, PROCESS_GUARDRAILS.md, DEPENDENCY_MAP.md
- Confirm Step 32 complete (V2 done)
- Confirm Step 09 complete (user auth, session, route guards)
- Confirm Step 16 complete (CMSPage model for bookmark FK)

## Dependency Check
- `app/modules/auth/models.py` — User model (FK source for bookmarks, alerts)
- `app/modules/cms/models.py` — CMSPage (bookmark target)
- `app/modules/auth/dependencies.py` — get_current_user dependency

## Planned Files to Create
- `services/api/alembic/versions/20260430_0022_user_accounts.py`
- `services/api/app/modules/account/__init__.py`
- `services/api/app/modules/account/models.py` — UserBookmark, UserDownload, TrekAlert, UserProfile
- `services/api/app/modules/account/service.py`
- `services/api/app/api/routes/account.py`
- `services/api/app/schemas/account.py`
- `services/api/tests/test_account.py`
- `apps/web-next/app/(public)/account/saved/page.tsx` (rewrite from stub)
- `apps/web-next/app/(public)/account/downloads/page.tsx` (rewrite from stub)
- `apps/web-next/components/account/BookmarkButton.tsx`

## Planned Files to Modify
- `services/api/app/db/base.py`
- `services/api/app/api/router.py`
- `apps/web-next/app/(auth)/auth/onboarding/page.tsx` — wire to profile API + redirect to /explore
- `apps/web-next/lib/api.ts`

## Status
Done

## Files Created
- `services/api/alembic/versions/20260430_0022_user_accounts.py` — user_bookmarks + user_downloads + trek_alerts + user_profiles tables; applied with `alembic upgrade head`
- `services/api/app/modules/account/__init__.py`
- `services/api/app/modules/account/models.py` — UserBookmark, UserDownload, TrekAlert, UserProfile ORM models
- `services/api/app/modules/account/service.py` — add/remove/list_bookmarks (with CMSPage enrichment), record/list_downloads, add/remove/list_alerts, get/upsert_profile
- `services/api/app/api/routes/account.py` — POST/DELETE/GET /account/bookmarks; GET /account/downloads; POST/DELETE/GET /account/alerts; GET/PATCH /account/profile; all require get_current_user
- `services/api/app/schemas/account.py` — BookmarkCreate/Response, DownloadResponse, TrekAlertCreate/Response, UserProfileUpdate/Response
- `services/api/tests/test_account.py` — 20 tests (TC-B01 through TC-B20)
- `apps/web-next/app/(public)/account/saved/page.tsx` — rewritten as client component; calls fetchBookmarks(); shows CMS page cards with hero image, page type label, view + remove actions
- `apps/web-next/app/(public)/account/downloads/page.tsx` — rewritten as client component; calls fetchDownloads(); renders filenames + download date
- `apps/web-next/components/account/BookmarkButton.tsx` — client component; toggle bookmark via addBookmark/removeBookmark; optimistic state; filled icon when bookmarked

## Files Modified
- `services/api/app/db/base.py` — UserBookmark, UserDownload, TrekAlert, UserProfile registered
- `services/api/app/api/router.py` — account_router registered
- `apps/web-next/app/(auth)/auth/onboarding/page.tsx` — step 3 "Start exploring" now calls upsertUserProfile(trek_experience, preferred_regions) then router.push("/explore"); graceful on auth failure
- `apps/web-next/lib/api.ts` — BookmarkResponse, DownloadResponse, TrekAlertResponse, UserProfileResponse/Update interfaces + fetch/add/remove/upsert helpers

## Notes
- All account routes are user-auth-gated (get_current_user dependency). Unauthenticated requests return 401.
- BookmarkButton placed in components/account/ (not components/ui/) to keep it account-domain specific.
- Onboarding saves trek_experience (maps experience level) and preferred_regions (interests array). fitness_level and budget_range are null until user updates them via profile edit.
- 363 backend tests pass (20 new for this step); next build clean (137 static pages); GitNexus: 7,396 nodes | 12,613 edges | 266 clusters | 199 flows

## Bug Fix Round 2 (bookmark root cause)
- Migration `20260501_0023_bookmark_by_slug.py` applied: cms_page_id nullable, trek_slug/bookmark_title/bookmark_image_url added to user_bookmarks; partial unique indexes
- Bookmark button now works for all static treks via addBookmarkBySlug/removeBookmarkBySlug
- Unauthenticated bookmark queue: localStorage pendingBookmarks flushed on login/signup
- Dashboard counts update reactively via bookmark-changed window event
- 363/363 tests still pass; next build clean

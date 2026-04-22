# STEP 24 — Analytics Ingestion + Admin Panel Full Wiring

## Goal
Wire analytics events, affiliate click tracking, and lead tracking. Then fully wire every admin panel page to real backend data. This is the V1 completion step — after this, the platform is operational end-to-end.

## Scope

### Analytics events (frontend)
- Integrate a lightweight analytics setup: GA4 via `gtag.js` or a privacy-first alternative (Plausible / Umami)
- Track events: `page_view`, `trek_detail_view`, `affiliate_click`, `lead_form_open`, `lead_form_submit`, `newsletter_subscribe`, `admin_draft_approved`, `admin_draft_published`
- `trackEvent(name, properties)` utility in `lib/analytics.ts`
- Event tracking added to: AffiliateCard, LeadForm, NewsletterCapture, admin publish button

### Affiliate click tracking (backend)
- `affiliate_clicks` table: id, page_id, affiliate_link_id, affiliate_program, clicked_at, user_agent, session_id (hashed)
- POST /api/v1/track/affiliate-click — receives click event from frontend
- Daily aggregate: clicks per program, clicks per page

### Lead submission tracking (backend)
- `lead_submissions` table: id, name, email, phone, trek_interest, source_page, source_cluster, cta_type, submitted_at, status (new/contacted/converted)
- POST /api/v1/leads — already planned in Step 20; implement ORM here if not done
- GET /api/v1/admin/leads — paginated lead list with filters

### Revenue summary (basic)
- GET /api/v1/admin/analytics/summary — aggregate: total leads (last 30d), affiliate clicks (last 30d), newsletter subscribers (total), pages published (total), pipeline runs (last 30d)
- No real ad revenue data in V1 (AdSense doesn't have a programmatic API without MCM); show placeholder RPM

### Admin panel full wiring
Wire all currently-unconnected admin pages to real backend data:
- `/admin/dashboard` — wire to /admin/analytics/summary
- `/admin/topics` — wire to GET /api/v1/topics (already exists from Step 06)
- `/admin/clusters` — wire to GET /api/v1/clusters
- `/admin/briefs` — wire to GET /api/v1/admin/briefs (Step 14)
- `/admin/drafts` — already wired (Step 10) — add claim flag count
- `/admin/fact-check` — wire to GET /api/v1/admin/drafts?has_flags=true + claims detail
- `/admin/linking` — wire to linking API (Step 22)
- `/admin/refresh` — wire to refresh API (Step 23)
- `/admin/pipeline` — wire to pipeline API (Step 17)
- `/admin/analytics` — wire to /admin/analytics/summary
- `/admin/logs` — wire to GET /api/v1/admin/agent-runs

### V1 smoke test
- End-to-end validation: trigger pipeline → approve brief → approve draft → publish to WP → page visible on frontend → analytics event fires
- Document pass/fail per stage

## Preconditions
- Read docs/MASTER_TRACKER.md
- Read docs/PROCESS_GUARDRAILS.md
- Read docs/DEPENDENCY_MAP.md
- Confirm Steps 20–23 are all complete
- GA4 property or Plausible instance configured

## Dependency Check
- `apps/web-next/lib/analytics.ts` — new file; consumed by existing components (additive)
- All admin page files in `apps/web-next/app/(admin)/admin/` — wired to real APIs
- New backend tables require Alembic migration
- GET /api/v1/admin/analytics/summary — new endpoint

## Planned Files to Create
- `apps/web-next/lib/analytics.ts` — trackEvent utility
- `services/api/app/modules/analytics/__init__.py`
- `services/api/app/modules/analytics/models.py` — AffiliateClick, LeadSubmission (if not already from Step 20)
- `services/api/app/modules/analytics/service.py` — click/lead aggregate helpers, summary service
- `services/api/app/api/routes/analytics.py` — summary + click-track + lead endpoints
- `services/api/app/schemas/analytics.py`
- `services/api/alembic/versions/20260422_0011_analytics.py`
- `services/api/tests/test_analytics.py`

## Planned Files to Modify
- All admin page files in `apps/web-next/app/(admin)/admin/` — wire to real APIs
- `apps/web-next/components/monetization/AffiliateCard.tsx` — add click tracking
- `apps/web-next/components/monetization/LeadForm.tsx` — confirm uses analytics on submit
- `apps/web-next/components/monetization/NewsletterCapture.tsx` — confirm uses analytics on subscribe
- `apps/web-next/app/layout.tsx` — inject analytics script
- `services/api/app/api/router.py` — register analytics_router
- `docs/MASTER_TRACKER.md` — mark V1 complete
- `docs/DEPENDENCY_MAP.md`

## Validation Commands
```bash
make install
cd services/api && alembic upgrade head
PYTHONPATH=services/api .venv/bin/pytest services/api/tests/ -v

# Analytics summary
curl http://localhost:8000/api/v1/admin/analytics/summary

# Track affiliate click
curl -X POST http://localhost:8000/api/v1/track/affiliate-click \
  -H 'Content-Type: application/json' \
  -d '{"page_id":"<id>","affiliate_program":"amazon","page_slug":"/packing/kedarkantha"}'

# Admin leads
curl http://localhost:8000/api/v1/admin/leads

cd apps/web-next && npm run build
open http://localhost:3000/admin/dashboard
open http://localhost:3000/admin/analytics

npx gitnexus analyze --force
```

## Status
pending

## Notes
- V1 analytics is event-forward: we fire events to GA4 or Plausible but do not pull aggregated data back into the admin panel via their APIs (too complex for V1). The /admin/analytics/summary is sourced from our own DB tables.
- After Step 24 is complete, V1 is done. Run a full end-to-end smoke test session and document the results in this file.
- V1 content target: after full pipeline is live, seed at least 10 trek guide posts, 5 packing lists, 5 seasonal pages, 3 comparison pages through the pipeline to validate quality and indexability
- GitNexus should be re-indexed after Step 24 — expected: 2500+ symbols, 80+ flows

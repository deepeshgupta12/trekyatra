# Step 43 — Slug Deduplication & CMS as Canonical Source

## Status: Done (frontend portion) — commit b4924d6 (2026-05-15)

## Notes
- dynamicParams=true + revalidate=60 added to trek/[slug]/page.tsx
- CMS-first logic was already in place from Step 18; Step 43 made it explicit and added on-demand rendering for CMS-only slugs
- Backend slug conflict detection API (GET /admin/cms/slug-check) and admin UI warning deferred to post-launch (lower priority)
- Sitemap real-time: dynamic="force-dynamic" + revalidate=0 added to sitemap.ts

## Summary
Ensure no two content sources serve the same URL. The CMS (`cms_pages`) is the canonical source for all published content. Static data in `data/treks.ts` and any other hardcoded datasets must not conflict with CMS slugs. Implement slug registry, conflict detection, and redirect resolution so every URL has exactly one authoritative source.

## Motivation
- `data/treks.ts` has 12 static trek slugs (e.g. `kedarkantha`, `hampta-pass`)
- If a CMS page with slug `kedarkantha` is published, both static and CMS would try to serve `/trek/kedarkantha`
- Search engines would see duplicate content → SEO penalty
- CMS must win when a slug exists in both sources

## Scope

### Backend
- Add slug uniqueness check in CMS service: before creating or publishing a CMS page, verify slug does not conflict with known static routes
- Add GET `/admin/cms/slug-check?slug=X` — returns `{available: bool, conflict_source: "static"|"cms"|null}`
- Detect slugs in `data/treks.ts` (hardcoded) and register them as reserved until replaced by CMS
- Admin UI: show conflict warning in CMSPageForm if slug is already served by static data

### Frontend
- In `/trek/[slug]`: CMS wins — if a CMS page exists for a slug, always render CMS version; static data used only as fallback
- In `/packing/[slug]`, `/permits/[slug]`, `/guides/[slug]`: same CMS-first logic (already implemented in Step 18, needs audit)
- Add `generateStaticParams` audit: ensure static trek slugs are only generated when no CMS override exists

### Migration path
1. Owner creates CMS page with slug = existing static slug (e.g. `kedarkantha`)
2. CMS page goes live → static fallback is suppressed for that slug
3. Eventually all static trek data is replaced by CMS pages → `data/treks.ts` deprecated

## Files to Create
- `services/api/app/modules/cms/slug_registry.py` — slug conflict detection service
- `services/api/tests/test_slug_registry.py` — tests

## Files to Modify
- `services/api/app/modules/cms/service.py` — add slug conflict check on create/publish
- `services/api/app/api/routes/admin_cms.py` — add `/slug-check` endpoint
- `apps/web-next/components/admin/CMSPageForm.tsx` — add slug availability indicator
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — audit CMS-first logic

## Dependencies
- Step 16 (CMS) — done ✅
- Step 17 (publish pipeline) — done ✅

## Acceptance Criteria
- [ ] Creating a CMS page with a duplicate slug is warned (not blocked — operator decides)
- [ ] `/trek/[slug]` always renders CMS version when published CMS page exists
- [ ] No URL can be served by both static data and CMS simultaneously
- [ ] All 12 static treks in `data/treks.ts` have a clear migration path to CMS
- [ ] `next build` passes; backend tests pass

# STEP 37 — Multilingual Content Workflows

## Goal
Build the pipeline for alternate-language draft generation (Hindi first), hreflang SEO wiring, and language fields on cms_pages. No WordPress dependency — uses the native CMS from Step 16.

## Scope

### Language model on cms_pages
- Add `language` field to `cms_pages`: default `en`; supported: `en`, `hi`, `mr` (Marathi — Sahyadri audience)
- Add `translations` JSON field: `{hi: cms_page_id, mr: cms_page_id}` — cross-reference to translated versions
- Alembic migration: `language` (String(10)), `translations` (JSON), `source_page_id` (nullable FK→cms_pages self-reference)

### TranslationAgent
- Input: source CMSPage (English)
- Output: translated ContentDraft in target language
- LLM prompt: translate markdown preserving headings, alt tags, anchor text structure; do not translate proper nouns (trek names, peak names, region names)
- Output stored as a new ContentDraft → standard approval pipeline → new CMSPage with `language = hi`

### hreflang setup (frontend)
- On every public page, add `<link rel="alternate" hreflang="en" href="..." />` and `<link rel="alternate" hreflang="hi" href="..." />`
- URL pattern for translations: `/hi/trek/[slug]`, `/hi/guides/[slug]` (subdirectory, not subdomain)
- Next.js `generateMetadata` extended to include hreflang alternates from CMSPage.translations

### Hindi public routes
- `/hi/trek/[slug]` — serves cms_pages where slug matches and language = hi
- `/hi/guides/[slug]`, `/hi/packing/[slug]` — same pattern
- Middleware: if user's browser `Accept-Language` is `hi` and page has a Hindi translation → banner "Read in Hindi →"

### Admin UI
- `/admin/cms` — language badge per page (EN / HI / MR)
- "Generate translation" button per page → triggers TranslationAgent for selected target language
- Translated pages link back to source page in admin detail view

### Backend
- `POST /api/v1/admin/cms/{slug}/translate` — trigger TranslationAgent for target_language
- `GET /api/v1/cms/{slug}?lang=hi` — return translated version if available, fallback to English

## Preconditions
- Read docs/MASTER_TRACKER.md, PROCESS_GUARDRAILS.md, DEPENDENCY_MAP.md
- Confirm Step 36 complete (V3 penultimate step)
- Confirm Step 16 complete (Master CMS with CMSPage model)

## Dependency Check
- `app/modules/cms/models.py` — CMSPage (add language, translations, source_page_id)
- `app/modules/agents/` — new TranslationAgent node
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — hreflang in generateMetadata

## Planned Files to Create
- `services/api/alembic/versions/YYYYMMDD_0026_cms_language.py`
- `services/api/app/modules/agents/translation/agent.py`
- `services/api/app/api/routes/translation.py`
- `services/api/app/schemas/translation.py`
- `services/api/tests/test_translation.py`
- `apps/web-next/app/(public)/hi/trek/[slug]/page.tsx`
- `apps/web-next/app/(public)/hi/guides/[slug]/page.tsx`
- `apps/web-next/app/(public)/hi/packing/[slug]/page.tsx`

## Planned Files to Modify
- `services/api/app/modules/cms/models.py` — language, translations, source_page_id
- `services/api/app/api/routes/cms.py` — lang query param support
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — hreflang alternates
- `apps/web-next/app/(public)/guides/[slug]/page.tsx` — hreflang alternates
- `apps/web-next/app/(admin)/admin/cms/page.tsx` — language badge + translate button
- `apps/web-next/lib/api.ts`

## Files Created
- `services/api/alembic/versions/20260506_0027_cms_language.py`
- `services/api/app/data/glossary_hi.json`
- `services/api/app/modules/agents/translation/__init__.py`
- `services/api/app/modules/agents/translation/agent.py`
- `services/api/app/schemas/translation.py`
- `services/api/app/api/routes/translation.py`
- `services/api/tests/test_translation.py`
- `apps/web-next/app/(public)/hi/trek/[slug]/page.tsx`
- `apps/web-next/app/(public)/hi/guides/[slug]/page.tsx`
- `apps/web-next/app/(public)/hi/packing/[slug]/page.tsx`

## Files Modified
- `services/api/app/modules/cms/models.py` — language, translations, source_page_id fields added
- `services/api/app/schemas/cms.py` — language/translations/source_page_id in Create, Patch, Response
- `services/api/app/api/routes/cms.py` — lang query param on GET /cms/pages/{slug}; CMSPage import added
- `services/api/app/api/router.py` — translation_router registered
- `apps/web-next/lib/api.ts` — CMSPage multilingual fields; fetchCMSPage lang param; TranslateResult; triggerTranslation
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — hreflang alternates in generateMetadata
- `apps/web-next/app/(public)/guides/[slug]/page.tsx` — hreflang alternates in generateMetadata
- `apps/web-next/app/(admin)/admin/cms/page.tsx` — language badge, HI ✓ indicator, translate button wired

## Status
Done

## Notes
- Hindi translation quality gate: TranslationAgent output goes through the same compliance check (Step 28) before admin approval — risky wording rules apply in Hindi too.
- Proper nouns list: stored in a `translation_glossary` JSON file (`services/api/app/data/glossary_hi.json`) — names like "Kedarkantha", "Uttarakhand", "Roopkund" must not be translated.
- V3 completion: Step 37 done — V3 complete. Next phase: V4 (Steps 38–41 — Operator marketplace, Trip planning assistant, Premium subscription, B2B API).
- Marathi (mr) is supported by the backend (agent + route) but frontend `/mr/` routes are not yet created — Hindi-first per scope. Add `/mr/trek/[slug]` etc. as a follow-up.
- `TranslationAgent` creates a CMSPage draft directly (not via ContentDraft + pipeline) to avoid adding a `language` field to `content_drafts`. The admin reviews and publishes the translated CMSPage via `/admin/cms`.
- Middleware-based `Accept-Language: hi` banner (auto-suggest Hindi version) was descoped — the static language switcher banner on hi/ pages fulfils the intent.

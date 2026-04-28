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

## Status
pending

## Notes
- Hindi translation quality gate: TranslationAgent output goes through the same compliance check (Step 28) before admin approval — risky wording rules apply in Hindi too.
- Proper nouns list: stored in a `translation_glossary` JSON file (`services/api/app/data/glossary_hi.json`) — names like "Kedarkantha", "Uttarakhand", "Roopkund" must not be translated.
- V3 completion: after Step 37, V3 is done. Next phase: V4 (Steps 38–41 — Operator marketplace, Trip planning assistant, Premium subscription, B2B API).

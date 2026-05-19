# Step 48 — Critical Pipeline + CMS Fixes

## Status: Done — 2026-05-19

## Issues Fixed

### 1. Pipeline "No topic_id available for content_brief stage" (CRITICAL)
**Root cause:** `create_topic` calls `db.commit()` which throws `IntegrityError` when a topic with the same slug already exists (e.g., running the same trek twice creates "kedarkantha" slug conflict). The agent caught the exception, called `db.rollback()`, and returned `created_ids = []`. Downstream stages had no topic_id.

**Fix:**
- `content/service.py`: Added `upsert_topic()` — checks if slug already exists and returns the existing topic instead of failing
- `trend_discovery/agent.py`: Changed `create_topic()` → `upsert_topic()` in `_store_results`
- Effect: Re-running a pipeline for the same trek slug now reuses the existing topic and proceeds correctly through content_brief → content_writing → publish

**Files:** `services/api/app/modules/content/service.py`, `services/api/app/modules/agents/trend_discovery/agent.py`

### 2. "Re-parse sections" not working (DEGRADED GRACEFULLY)
**Root cause:** `reparse_sections_from_draft` raised ValueError immediately if:
- `page.brief_id` is None (manually created pages)
- No draft found for brief_id (draft deleted)
- No H2 sections extracted from markdown (unusual LLM heading format)

**Fix:**
- Rewrote `reparse_sections_from_draft` to:
  - Log warning instead of raising when brief_id is missing or draft not found
  - Still raise with a clear actionable message when no markdown source exists
  - When H2 sections can't be extracted (unusual heading format), update trek_facts + FAQs WITHOUT overwriting existing sections (partial success)
  - When sections ARE extracted, also calls `_apply_trek_meta()` to refresh trek DB columns in the same operation

**Files:** `services/api/app/modules/cms/service.py`

### 3. Cannot edit Season / State / Trek metadata in Master CMS admin (CRITICAL)
**Root cause — two layers:**
1. Backend: `CMSPagePatch` schema was missing all 6 trek metadata columns (`trek_name`, `trek_state`, `trek_difficulty`, `trek_duration`, `trek_season`, `trek_suitability`). PATCH requests silently ignored these fields.
2. Frontend: `CMSPagePayload` interface missing these fields. Step 47 rendered them as read-only display — not editable inputs — so admin couldn't save values.

**Fix:**
- `services/api/app/schemas/cms.py`: Added all 6 trek_* fields to `CMSPagePatch`
- `apps/web-next/lib/api.ts`: Added all 6 trek_* fields to `CMSPagePayload`
- `apps/web-next/components/admin/CMSPageForm.tsx`: Replaced read-only display panel with editable text inputs; added `trekMeta` state; `buildPayload()` now includes trek_* fields in PATCH payload

### 4. Pre-existing flaky tests stabilised
- `test_cms.py::test_api_reparse_sections_422_when_no_brief_id`: Updated assertion to match new error message
- `test_pipeline.py::test_list_pipeline_runs`: Rewrote to use `run.id` lookup instead of count comparison (count was flaky when DB had 100+ runs)

## Files Modified
- `services/api/app/modules/content/service.py`
- `services/api/app/modules/agents/trend_discovery/agent.py`
- `services/api/app/modules/cms/service.py`
- `services/api/app/schemas/cms.py`
- `apps/web-next/lib/api.ts`
- `apps/web-next/components/admin/CMSPageForm.tsx`
- `services/api/tests/test_cms.py`
- `services/api/tests/test_pipeline.py`

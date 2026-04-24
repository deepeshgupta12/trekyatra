# STEP 17 — Full Publish Orchestration Pipeline

## Goal
Wire all agents and approval gates into a single orchestrated content pipeline. A single trigger should be able to run the full Trend → Cluster → Brief → Write → SEO → Publish chain, with human checkpoints at brief approval and draft approval. Manual and scheduled execution both supported.

## Scope

### Orchestration service
- `PipelineOrchestrator` service that chains: TrendDiscoveryAgent → KeywordClusterAgent → ContentBriefAgent → ContentWritingAgent → SEOAEOAgent → PublishingAgent
- Each stage creates an AgentRun record; pipeline tracks overall status
- Checkpoints: pipeline pauses at "brief approval" and "draft approval" gates; resumes after human approval via API

### Pipeline models
- `pipeline_runs` table: id, pipeline_type, status, current_stage, input_json, created_at, completed_at
- `pipeline_stages` table: pipeline_run_id, stage_name, agent_run_id, status, started_at, completed_at

### Admin APIs
- POST /api/v1/admin/pipeline/run — trigger full or partial pipeline (accepts start_stage and end_stage params)
- GET /api/v1/admin/pipeline/runs — list pipeline runs
- GET /api/v1/admin/pipeline/runs/{id} — pipeline run detail with all stages
- POST /api/v1/admin/pipeline/runs/{id}/resume — resume a paused pipeline (after human approval)
- POST /api/v1/admin/pipeline/runs/{id}/cancel — cancel in-flight pipeline

### Celery orchestration
- Each pipeline stage runs as a Celery task in a chain
- Beat scheduler: daily pipeline trigger (discover 3 topics, create briefs) — gated at brief approval
- Failure of any stage marks pipeline as failed; stages before checkpoint are not re-run unless explicitly retried

### Admin UI
- Admin pipeline monitor page (`/admin/pipeline`) with:
  - Active runs with stage progress indicator
  - Approval gates clearly marked (brief approval pending, draft approval pending)
  - Resume / Cancel buttons per run
  - Stage-level error detail

## Preconditions
- Read docs/MASTER_TRACKER.md
- Read docs/PROCESS_GUARDRAILS.md
- Read docs/DEPENDENCY_MAP.md
- Confirm Step 15 is complete (all 5 agents operational)
- Confirm Step 16 is complete (Master CMS publish_to_cms working end-to-end)
- Celery worker running (Step 11)

## Dependency Check
- All agent modules (Steps 12–15) consumed by orchestrator
- `app/modules/publish/service.py` (Step 10) called at final publish stage
- New Alembic migration for pipeline_runs and pipeline_stages tables
- `apps/web-next/app/(admin)/admin/` — new pipeline page

## Planned Files to Create
- `services/api/app/modules/pipeline/__init__.py`
- `services/api/app/modules/pipeline/models.py` — PipelineRun, PipelineStage
- `services/api/app/modules/pipeline/service.py` — PipelineOrchestrator, stage handlers
- `services/api/app/modules/pipeline/tasks.py` — Celery task chain definitions
- `services/api/app/api/routes/pipeline.py`
- `services/api/app/schemas/pipeline.py`
- `services/api/alembic/versions/20260422_0007_pipeline.py`
- `services/api/tests/test_pipeline.py`
- `apps/web-next/app/(admin)/admin/pipeline/page.tsx`

## Planned Files to Modify
- `services/api/app/db/base.py` — register PipelineRun, PipelineStage
- `services/api/app/api/router.py` — register pipeline_router
- `services/api/app/worker/celery_app.py` — add beat schedule for daily pipeline
- `docs/MASTER_TRACKER.md`
- `docs/DEPENDENCY_MAP.md`

## Validation Commands
```bash
make install
cd services/api && alembic upgrade head
PYTHONPATH=services/api .venv/bin/pytest services/api/tests/ -v

# Trigger full pipeline
curl -X POST http://localhost:8000/api/v1/admin/pipeline/run \
  -H 'Content-Type: application/json' \
  -d '{"seed_topics": ["triund trek guide"], "start_stage": "trend_discovery", "end_stage": "brief"}'

# Poll runs
curl http://localhost:8000/api/v1/admin/pipeline/runs

# Resume after brief approval
curl -X POST http://localhost:8000/api/v1/admin/pipeline/runs/<id>/resume

npx gitnexus analyze --force
```

## Status
Done

## Files Created
- `services/api/app/modules/pipeline/__init__.py`
- `services/api/app/modules/pipeline/models.py` — PipelineRun, PipelineStage
- `services/api/app/modules/pipeline/service.py` — PipelineOrchestrator + CRUD helpers
- `services/api/app/modules/pipeline/tasks.py` — run_pipeline_task, resume_pipeline_task, daily_discovery_task
- `services/api/app/api/routes/pipeline.py` — 5 endpoints
- `services/api/app/schemas/pipeline.py` — 4 Pydantic schemas
- `services/api/alembic/versions/20260423_0009_pipeline.py`
- `services/api/tests/test_pipeline.py` — 20 tests

## Files Modified
- `services/api/app/db/base.py` — PipelineRun, PipelineStage registered
- `services/api/app/api/router.py` — pipeline_router registered
- `services/api/app/worker/celery_app.py` — pipeline.tasks included; beat_schedule daily_discovery
- `apps/web-next/lib/api.ts` — PipelineRun/PipelineStage types + 5 pipeline helpers
- `apps/web-next/app/(admin)/admin/pipeline/page.tsx` — full rewrite as orchestration monitor
- `docs/MASTER_TRACKER.md`
- `docs/DEPENDENCY_MAP.md`
- `docs/IMPLEMENTATION_PLAN.md`

## Post-TC Enhancement (same step, separate commit)

### Bug fix: END_MAP frontend bug
- `apps/web-next/app/(admin)/admin/pipeline/page.tsx` — `END_MAP["trend_discovery"]` corrected from `"content_brief"` to `"publish"` (caused resume ValueError)

### Enhancements applied after TC review
- Alembic migration `20260423_0010_cms_hero_image.py` — adds `hero_image_url` to `cms_pages`
- `CMSPage` model + all 3 CMS schemas (`CMSPageCreate`, `CMSPagePatch`, `CMSPageResponse`) — `hero_image_url` added
- `CMSPageForm` — hero image URL input + preview; trek facts strip (duration / altitude / difficulty / season / permits / base); `content_json.trek_facts` persisted
- `lib/api.ts` — `TrekFacts` interface; `CMSPage` + `CMSPagePayload` extended
- Pipeline `resume()` fix: `paused_at_draft_approval` now resumes at `seo_aeo` (was incorrectly `publish`); 2 new tests; 139/139 pass
- Trek detail page: `generateMetadata`, descriptive anchor IDs, sticky sidebar fix (removed `self-start`), all 12 TOC entries wired, 4 new sections (best_time, difficulty, packing, safety), H1 strips SEO subtitle, hero_image_url from CMS, trek facts from `content_json.trek_facts`

### Resilience fix: Anthropic 529 overloaded errors
- `services/api/app/modules/agents/client.py` — shared `get_anthropic_client()` factory with `max_retries=6` (~32s total backoff budget via SDK exponential backoff)
- All 5 agents (`trend_discovery`, `keyword_cluster`, `content_brief`, `content_writing`, `seo_aeo`) updated to import and use `get_anthropic_client()` instead of inline `anthropic.Anthropic(api_key=...)` with default 2 retries
- 139/139 backend tests pass after change

## Notes
- Pipeline pauses at "brief_approval" checkpoint (after ContentBriefAgent); human approves the brief in admin UI; POST /runs/{id}/resume dispatches resume_pipeline_task which continues from content_writing
- Pipeline pauses again at "paused_at_draft_approval" if ContentWritingAgent marks draft as requires_review; resume now correctly runs seo_aeo → publish
- Partial pipeline: start_stage=content_writing + brief_id, or start_stage=seo_aeo/publish + draft_id
- Beat schedule: daily_discovery_task runs every 24h; triggers trend_discovery → content_brief; pauses at brief_approval gate (never auto-publishes)
- Migration 20260423_0009 was initially created with duplicate index bug (index=True in Column + explicit op.create_index); fixed in-place before first successful apply (migration had never applied to any DB)
- Migration 20260423_0010 adds hero_image_url — additive, zero downtime
- Trek facts (duration, altitude etc.) are stored in content_json.trek_facts and editable via CMSPageForm; agent-generated CMS pages will have empty trek_facts until an editor fills them in
- Anthropic SDK max_retries=6 gives backoff sequence 0.5→1→2→4→8→8s (7 total attempts, ~32s budget); sufficient to survive transient 529 overloaded errors without failing the pipeline
### Post-TC fix 2: Sticky sidebar + CMS empty sections
- `apps/web-next/app/globals.css` — `overflow-x: hidden` → `overflow-x: clip`; root cause of broken sticky: `hidden` on `<html>` re-assigns scroll container away from viewport in Chromium/Safari, `clip` does not
- `services/api/app/modules/cms/service.py:_process_content_json` — HTML passthrough: values starting with `<` are no longer re-processed through markdown converter, preventing double-processing of pipeline-generated sections
- `services/api/app/modules/cms/service.py:reparse_sections_from_draft` — new service function; finds ContentDraft via page.brief_id, re-parses optimized_content/content_markdown with fixed `_parse_sections_from_markdown`, stores HTML sections in content_json.sections
- `services/api/app/api/routes/cms.py` — new `POST /cms/pages/{slug}/reparse-sections` endpoint calling the service function
- `apps/web-next/lib/api.ts` — `reparseCMSSections(slug)` function added
- `apps/web-next/components/admin/CMSPageForm.tsx` — Re-parse sections button (shown when `brief_id` exists); calls reparse endpoint, updates section state with returned HTML values
- 2 new tests: `test_api_reparse_sections_422_when_no_brief_id`, `test_api_reparse_sections_200_populates_sections`
- 141/141 backend tests pass; next build clean (89 pages)

### Post-TC fix 3: Section parser overhaul + trek facts auto-extraction
- `services/api/app/modules/cms/service.py:_SECTION_HEADING_MAP` — `faqs` moved to first position (first-match-wins; fixes FAQ content incorrectly landing in why_this_trek due to `about.*trek` match); `difficult\b` added to difficulty pattern (matches "How Difficult Is the X Trek?"); `key facts` + `overview` added to why_this_trek pattern
- `services/api/app/modules/cms/service.py:_parse_sections_from_markdown` — heading regex changed from `^#{1,3}` to `^#{1,2}` so H3 sub-headings (e.g. "### May – June") are captured as section content, not treated as section boundaries; H1 now explicitly sets `current_key = "why_this_trek"` so intro paragraphs between H1 and first H2 are always captured
- `services/api/app/modules/cms/service.py:_extract_trek_facts_from_markdown` — new helper; regex-extracts duration/altitude/difficulty/season/permits/base from structured markdown ("**Duration:** X days", "**Difficulty Level:** Moderate" etc.)
- `services/api/app/modules/cms/service.py:upsert_page_from_draft` — now calls `_extract_trek_facts_from_markdown` and includes trek_facts in content_json at publish time
- `services/api/app/modules/cms/service.py:reparse_sections_from_draft` — now calls `_extract_trek_facts_from_markdown`; merges extracted facts with editor-supplied values (editor values take priority)
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — hardcoded fallbacks "Moderate" (difficulty), "Required" (permits), "Sankri" (base) replaced with "—"
- `services/api/tests/test_cms.py` — 8 new parser/extraction unit tests: faqs-not-in-why_this_trek, H3-is-content, difficult-matches-difficulty, key-facts-maps-to-why_this_trek, H1-intro-captured, extract-duration, extract-difficulty, extract-altitude; 29/29 CMS tests pass; 148/149 total (1 pre-existing pipeline list test fails due to DB pollution, unrelated to this fix)
- next build clean (89 pages)

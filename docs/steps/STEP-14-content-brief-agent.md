# STEP 14 — Content Brief Agent + Brief Approval Workflow

## Goal
Implement the ContentBriefAgent that produces SEO+AEO execution-grade briefs from a cluster/topic. Wire the brief approval workflow so editors can review, approve, or reject briefs before content generation begins.

## Scope

### Content Brief Agent
- Accepts: topic_id or cluster_id, target keyword, page type
- Outputs: structured brief JSON with:
  - page objective, audience, target keyword, secondary keywords
  - heading structure (H1, H2s, H3s)
  - FAQ suggestions
  - key entities to cover
  - internal link targets
  - schema recommendations
  - monetization slot suggestions
  - freshness interval
- Also outputs human-readable editorial brief (markdown)
- Stores output as a `content_briefs` record

### Brief Approval Workflow
- Extend existing brief status: `new → review → approved → rejected → scheduled`
- PATCH /api/v1/admin/briefs/{id}/status — controlled transitions (extend Step 10's state machine pattern)
- Brief version storage: each edit creates a new version snapshot (brief_versions table)
- Admin UI: brief review queue page wired to real brief data with approve/reject actions

### Admin APIs
- POST /api/v1/admin/agents/generate-brief — trigger ContentBriefAgent for a topic
- GET /api/v1/admin/briefs — list with status filter
- GET /api/v1/admin/briefs/{id} — detail with structured brief JSON
- PATCH /api/v1/admin/briefs/{id}/status
- GET /api/v1/admin/briefs/{id}/versions — version history

## Preconditions
- Read docs/MASTER_TRACKER.md
- Read docs/PROCESS_GUARDRAILS.md
- Read docs/DEPENDENCY_MAP.md
- Confirm Step 13 is complete (topics and clusters populated)
- ANTHROPIC_API_KEY configured in .env

## Dependency Check
- `app/modules/content/models.py` — ContentBrief model may need structured_brief JSON column + brief_versions table
- `app/modules/agents/base_agent.py` — inherited by ContentBriefAgent
- `app/modules/content/service.py` — used for brief create/update
- New Alembic migration if brief_versions table is added or new columns on content_briefs

## Planned Files to Create
- `services/api/app/modules/agents/content_brief/agent.py`
- `services/api/app/modules/agents/content_brief/prompts.py`
- `services/api/app/modules/agents/content_brief/schema.py` — BriefStructure TypedDict
- `services/api/tests/test_brief_agent.py`

## Planned Files to Modify
- `services/api/app/modules/content/models.py` — add structured_brief (JSON), brief_versions if needed
- `services/api/app/api/routes/agent_triggers.py` — add generate-brief endpoint
- `services/api/app/api/routes/content.py` — add brief detail + version endpoints
- `services/api/alembic/versions/` — new migration if schema changes
- `apps/web-next/app/(admin)/admin/briefs/page.tsx` — wire to real API with approve/reject actions
- `docs/MASTER_TRACKER.md`
- `docs/DEPENDENCY_MAP.md`

## Validation Commands
```bash
make install
cd services/api && alembic upgrade head
PYTHONPATH=services/api .venv/bin/pytest services/api/tests/ -v
make api

# Generate brief for a topic
curl -X POST http://localhost:8000/api/v1/admin/agents/generate-brief \
  -H 'Content-Type: application/json' \
  -d '{"topic_id": "<id>", "target_keyword": "kedarkantha trek guide", "page_type": "trek_guide"}'

# List briefs
curl http://localhost:8000/api/v1/admin/briefs

# Approve
curl -X PATCH http://localhost:8000/api/v1/admin/briefs/<id>/status \
  -H 'Content-Type: application/json' -d '{"status": "approved"}'

npx gitnexus analyze --force
```

## Status
Done

## Files Created
- `services/api/alembic/versions/20260422_0006_brief_versions.py`
- `services/api/app/modules/agents/content_brief/__init__.py`
- `services/api/app/modules/agents/content_brief/schema.py`
- `services/api/app/modules/agents/content_brief/prompts.py`
- `services/api/app/modules/agents/content_brief/agent.py`
- `services/api/tests/test_brief_agent.py` — 15 tests

## Files Modified
- `services/api/app/modules/content/models.py` — `structured_brief`, `word_count_target`, `versions` on ContentBrief; new `BriefVersion`
- `services/api/app/db/base.py` — registered `BriefVersion`
- `services/api/app/schemas/content.py` — `BriefStatusPatch`, `BriefVersionResponse`, `BRIEF_STATUS_TRANSITIONS`; extended ContentBriefCreate/Response
- `services/api/app/modules/content/service.py` — `get_brief`, `update_brief_status`, `create_brief_version`, `list_brief_versions`, `list_briefs` (filter)
- `services/api/app/worker/tasks/agent_tasks.py` — `generate_brief_task`
- `services/api/app/api/routes/agent_triggers.py` — POST /admin/agents/generate-brief
- `services/api/app/api/routes/content.py` — GET/PATCH /admin/briefs/{id}; GET /admin/briefs/{id}/versions
- `services/api/app/api/router.py` — moved admin_router before content_router
- `apps/web-next/app/(admin)/admin/briefs/page.tsx` — real API wired

## Notes
- `BRIEF_STATUS_TRANSITIONS`: draft→review→approved/rejected; rejected→review; approved→scheduled
- `brief_versions` CASCADE-deletes on ContentBrief deletion — no extra cleanup needed in test fixtures
- Router order matters: admin_router must be before content_router so `/admin/briefs/summary` isn't shadowed by `/{brief_id}`
- 84/84 tests pass; `next build` clean

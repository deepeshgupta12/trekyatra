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
pending

## Notes
- Brief JSON structure must be stored as JSONB column on content_briefs (not just rendered markdown)
- Brief version table: brief_id, version_number, structured_brief, created_at, created_by
- ContentBriefAgent must check that the topic has at least one keyword cluster before generating (fail with clear error otherwise)
- The structured brief is the input contract for ContentWritingAgent in Step 15
- Monetization slot suggestions: the agent should suggest where affiliate cards, lead forms, or newsletter captures would fit based on page type and intent

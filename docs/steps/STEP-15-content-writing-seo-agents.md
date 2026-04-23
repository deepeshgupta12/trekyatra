# STEP 15 — Content Writing Agent + SEO/AEO Optimization Agent

## Goal
Implement the two core content generation agents. ContentWritingAgent produces a full article draft from an approved brief. SEOAEOAgent then optimizes it for snippet readiness, FAQ blocks, entity coverage, and answer surfaces. These two agents form the core of the automated publishing engine.

## Scope

### Content Writing Agent
- Accepts: approved brief (structured_brief JSON from content_briefs)
- Outputs:
  - Full article draft (title, meta description, intro, body sections per H2/H3, FAQ section, CTA copy, excerpt, slug suggestion)
  - Fact-check flags: any claim about route distance, altitude, permit, seasonality, cost flagged as "needs verification" with confidence score
  - Draft stored as `content_drafts` record (status: draft)
- Guardrails: no hallucinated trek facts; uncertain claims explicitly flagged; max token budget per section

### SEO/AEO Optimization Agent
- Accepts: draft content_draft record
- Outputs:
  - Optimized draft with improved heading hierarchy
  - Snippet-ready intro (under 160 chars answer block)
  - FAQ schema suggestions (question + answer pairs)
  - Structured answer boxes for PAA-style queries
  - Entity coverage improvements (trek name, region, altitude, permit, season)
  - Internal link opportunity markers
  - Schema payload suggestions (Article, FAQPage)
- Updates the draft with optimized content; creates new draft version

### Fact-Check Flag System
- `draft_claims` table: draft_id, claim_text, claim_type, confidence_score, flagged_for_review
- Any low-confidence claim (< 0.7) auto-flags the draft for human review
- Flagged claims visible in admin draft detail view

### Admin APIs
- POST /api/v1/admin/agents/write-draft — trigger ContentWritingAgent for an approved brief
- POST /api/v1/admin/agents/optimize-draft — trigger SEOAEOAgent for a draft
- GET /api/v1/admin/drafts/{id}/claims — list fact-check claims for a draft

### Admin UI
- Admin drafts page: content preview in detail panel
- Flagged claims highlighted with confidence scores
- Approve / Send Back / Optimize actions

## Preconditions
- Read docs/MASTER_TRACKER.md
- Read docs/PROCESS_GUARDRAILS.md
- Read docs/DEPENDENCY_MAP.md
- Confirm Step 14 is complete (approved briefs available)
- ANTHROPIC_API_KEY in .env; Step 11 worker running

## Dependency Check
- `app/modules/content/models.py` — add draft_claims table; add optimized_content column to content_drafts
- `app/modules/agents/base_agent.py` — inherited by both agents
- New Alembic migration for draft_claims + new draft columns
- `app/api/routes/publish.py` — no change; status transitions already defined in Step 10

## Planned Files to Create
- `services/api/app/modules/agents/content_writing/agent.py`
- `services/api/app/modules/agents/content_writing/prompts.py`
- `services/api/app/modules/agents/seo_aeo/agent.py`
- `services/api/app/modules/agents/seo_aeo/prompts.py`
- `services/api/alembic/versions/20260422_0006_draft_claims.py`
- `services/api/tests/test_content_writing_agent.py`
- `services/api/tests/test_seo_aeo_agent.py`

## Planned Files to Modify
- `services/api/app/modules/content/models.py` — DraftClaim model, optimized_content on ContentDraft
- `services/api/app/db/base.py` — register DraftClaim
- `services/api/app/api/routes/agent_triggers.py` — add write-draft and optimize-draft endpoints
- `services/api/app/api/routes/content.py` — add draft claims endpoint
- `apps/web-next/app/(admin)/admin/drafts/page.tsx` — content preview + claim flags
- `docs/MASTER_TRACKER.md`
- `docs/DEPENDENCY_MAP.md`

## Validation Commands
```bash
make install
cd services/api && alembic upgrade head
PYTHONPATH=services/api .venv/bin/pytest services/api/tests/ -v
make api

# Write draft from approved brief
curl -X POST http://localhost:8000/api/v1/admin/agents/write-draft \
  -H 'Content-Type: application/json' \
  -d '{"brief_id": "<approved_brief_id>"}'

# Optimize draft
curl -X POST http://localhost:8000/api/v1/admin/agents/optimize-draft \
  -H 'Content-Type: application/json' \
  -d '{"draft_id": "<draft_id>"}'

# View claims
curl http://localhost:8000/api/v1/admin/drafts/<id>/claims

npx gitnexus analyze --force
```

## Status
Done

## Files Created
- `services/api/alembic/versions/20260422_0007_draft_claims.py`
- `services/api/app/modules/agents/content_writing/__init__.py`
- `services/api/app/modules/agents/content_writing/agent.py`
- `services/api/app/modules/agents/content_writing/prompts.py`
- `services/api/app/modules/agents/seo_aeo/__init__.py`
- `services/api/app/modules/agents/seo_aeo/agent.py`
- `services/api/app/modules/agents/seo_aeo/prompts.py`
- `services/api/tests/test_content_writing_agent.py`
- `services/api/tests/test_seo_aeo_agent.py`

## Files Modified
- `services/api/app/modules/content/models.py` — DraftClaim model, optimized_content on ContentDraft
- `services/api/app/db/base.py` — DraftClaim registered
- `services/api/app/schemas/content.py` — DraftClaimCreate, DraftClaimResponse, optimized_content on ContentDraftCreate/Response
- `services/api/app/modules/content/service.py` — get_draft, update_draft_optimized_content, create_draft_claim, list_draft_claims
- `services/api/app/worker/tasks/agent_tasks.py` — write_draft_task + optimize_draft_task
- `services/api/app/api/routes/agent_triggers.py` — /write-draft + /optimize-draft
- `services/api/app/api/routes/content.py` — GET /admin/drafts/{id}/claims, _draft_to_response helper
- `apps/web-next/app/(admin)/admin/drafts/page.tsx` — content preview, claims panel, Optimize button, Write Draft form

## Notes
- Migration numbering: step doc said 0006 but that was taken by Step 14's brief_versions; using 0007
- ContentWritingAgent uses claude-sonnet-4-6; max_tokens=16000; prompt caching on system prompt block
- SEOAEOAgent uses claude-sonnet-4-6; max_tokens=16000; prompt caching on system prompt block
- CONFIDENCE_FLAG_THRESHOLD = 0.7 — any claim below sets draft status to requires_review
- Fact-check claim types: route_distance, altitude, permit_requirement, seasonality, cost_estimate, safety_advisory, operator_claim
- 101/101 backend tests pass; next build clean

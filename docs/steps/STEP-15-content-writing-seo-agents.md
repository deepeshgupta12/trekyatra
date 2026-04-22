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
pending

## Notes
- ContentWritingAgent should use Claude claude-sonnet-4-6 as the default model; add model selection to AgentRun metadata
- SEOAEOAgent should run as a separate LangGraph pass so it can be re-triggered independently after human edits
- Fact-check claim types: route_distance, altitude, permit_requirement, seasonality, cost_estimate, safety_advisory, operator_claim
- Any draft with 1+ flagged claim (confidence < 0.7) must be set to requires_review status — cannot be approved or published without human clearing the flags
- Prompt caching: use Anthropic SDK cache_control on system prompt blocks to reduce cost on repeated agent runs

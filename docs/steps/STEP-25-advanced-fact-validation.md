# STEP 25 — Advanced Fact Validation System

## Goal
Upgrade the basic fact-check flags from Step 15 into a structured claim → evidence mapping system with confidence scoring. Mandatory human-review gates for YMYL/safety content. Admin fact-check inspector shows claim-by-claim verification status.

## Scope

### Claim extraction and evidence mapping
- Extend `FactClaim` model (from Step 15) with: `evidence_url`, `confidence_score` (0.0–1.0), `review_required` flag
- `ClaimExtractionAgent` node: extract all factual claims from draft markdown (dates, altitudes, permit costs, distances, safety stats)
- `EvidenceSearchAgent` node: for each claim, attempt to find a corroborating source (web search or internal DB; mock in V2.0, real web search in V2.1)
- Confidence scoring: HIGH (verified with source) / MEDIUM (internally consistent) / LOW (unverifiable) / CRITICAL (contradicts known data)

### YMYL safety gate
- Tag pages as YMYL: trek difficulty, altitude sickness, permit regulations, emergency contacts
- Any YMYL claim with confidence < 0.7 → `review_required = True`; draft status → `requires_review`
- Agent cannot self-approve YMYL claims; human must approve before publish

### Fact-check inspector (admin UI)
- `/admin/fact-check` rewritten: claim-by-claim table per draft
- Show: claim text, confidence score, evidence URL (if found), review_required badge
- Actions: Approve claim, Flag claim, Approve all (if no HIGH flags), Send to author

### Backend
- Alembic migration: add `evidence_url`, `confidence_score`, `review_required` to `fact_claims`
- `POST /api/v1/admin/drafts/{id}/fact-check` — trigger ClaimExtractionAgent
- `GET /api/v1/admin/drafts/{id}/claims` — return claims list with evidence
- `PATCH /api/v1/admin/claims/{id}` — update individual claim status

## Preconditions
- Read docs/MASTER_TRACKER.md, PROCESS_GUARDRAILS.md, DEPENDENCY_MAP.md
- Confirm Step 24 complete (V1 done)
- Confirm Step 15 complete (FactClaim model and basic claim extraction exist)

## Dependency Check
- `app/modules/content/models.py` — FactClaim model (add columns via migration)
- `app/modules/agents/` — new agent nodes following existing pattern
- `app/api/routes/drafts.py` — new endpoints additive

## Planned Files to Create
- `services/api/alembic/versions/YYYYMMDD_0015_fact_claims_evidence.py`
- `services/api/app/modules/agents/fact_validation/agent.py`
- `services/api/app/schemas/fact_claims.py`
- `services/api/app/api/routes/fact_claims.py`
- `services/api/tests/test_fact_validation.py`

## Planned Files to Modify
- `services/api/app/modules/content/models.py` — FactClaim columns
- `services/api/app/api/router.py` — register fact_claims_router
- `apps/web-next/app/(admin)/admin/fact-check/page.tsx` — claim inspector
- `apps/web-next/lib/api.ts` — claim fetch/approve helpers

## Status
pending

## Notes
- Web search for evidence requires external API (Brave Search or Serper) — mock in V2.0 with static fixtures; real API in V2.1 behind feature flag
- YMYL tag set: `['safety', 'altitude_sickness', 'permits', 'emergency_contacts', 'difficulty']` — stored as JSON array on cms_pages

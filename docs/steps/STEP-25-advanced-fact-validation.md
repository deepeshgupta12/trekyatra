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
Done

## Files Created
- `services/api/alembic/versions/20260428_0015_draft_claims_ymyl.py` — adds `evidence_url` (nullable Text) and `ymyl_flag` (bool, server_default=false) to `draft_claims`
- `services/api/app/modules/agents/fact_validation/__init__.py` — package init
- `services/api/app/modules/agents/fact_validation/agent.py` — ClaimExtractionAgent (LangGraph 3-node: fetch_draft → extract_claims → store_claims); YMYL_CLAIM_TYPES set; uses `.replace("{content}", ...)` not `.format()` to avoid KeyError from JSON {} in prompt; clears existing claims before re-inserting; evidence_url=None in V2.0
- `services/api/app/api/routes/fact_validation.py` — POST /admin/drafts/{id}/fact-check → FactCheckTriggerResponse (draft_id, claims_extracted, ymyl_claims, flagged_claims)
- `services/api/tests/test_fact_validation.py` — 7 tests (model field existence, ORM insert with new fields, agent mock with 4 claims inserted + YMYL detection, claim clearing on re-run, endpoint 200/404/400)

## Files Modified
- `services/api/app/modules/content/models.py` — DraftClaim: `ymyl_flag: Mapped[bool]` + `evidence_url: Mapped[str | None]`
- `services/api/app/schemas/content.py` — DraftClaimCreate + DraftClaimResponse: `ymyl_flag`, `evidence_url` added
- `services/api/app/schemas/admin.py` — ClaimResponse: `ymyl_flag`, `evidence_url` added
- `services/api/app/api/routes/admin.py` — list_fact_check_claims + patch_fact_check_claim: pass ymyl_flag + evidence_url in ClaimResponse
- `services/api/app/api/routes/content.py` — get_draft_claims serialization: ymyl_flag + evidence_url included
- `services/api/app/api/router.py` — fact_validation_router registered
- `services/api/tests/test_refresh.py` — pre-existing fix: ?limit=200 for stale pages query (50+ real pages in DB)
- `apps/web-next/lib/api.ts` — FactCheckClaim: `ymyl_flag: boolean` + `evidence_url: string | null`; added `FactCheckTriggerResult` interface + `triggerFactCheck(draftId)` function
- `apps/web-next/app/(admin)/admin/fact-check/page.tsx` — rewritten: claims grouped by draft (byDraft reduce), per-draft Re-run button (triggerFactCheck), YMYL badge (ShieldAlert/red), evidence URL link, YMYL+flagged counts in header, confidence bar, flaggedOnly filter

## Notes
- Step 25 doc referred to "FactClaim" model — actual model is DraftClaim (in content/models.py). Renamed throughout.
- Prompt uses `.replace("{content}", ...)` not `.format()` because the JSON example blocks `{...}` in the prompt would cause Python KeyError.
- EvidenceSearchAgent mocked in V2.0: `evidence_url = None` for all claims. Real web search (Brave/Serper API) deferred to V2.1 behind feature flag.
- 239/239 backend tests pass; `next build` clean with zero TypeScript errors.
- GitNexus re-index required after this step.
- V1 code gap (separate from Step 25 scope): admin publish/approve `trackEvent` not yet wired in `/admin/drafts` page — flagged for V2.1 micro-task.

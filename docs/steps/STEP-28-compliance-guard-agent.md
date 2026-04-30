# STEP 28 — Compliance Guard Agent

## Goal
Build the Trust & Compliance Guard Agent that automatically checks every draft for required disclosures, risky wording, and safety disclaimer presence before publish. Escalates non-compliant drafts to human review instead of blocking the pipeline.

## Scope

### ComplianceGuardAgent
- Checks every draft at publish time (hooked into publish pipeline before `_run_publish`)
- Rule set (configurable JSON in `compliance_rules` table):
  - `affiliate_disclosure`: page must contain affiliate disclosure text if it has affiliate cards
  - `safety_disclaimer`: trek pages rated "difficult" or "technical" must have a safety disclaimer section
  - `risky_wording`: detect phrases like "guaranteed weather", "100% safe", "always passable" — flag with replacement suggestion
  - `ymyl_claim`: any claim about permits, costs, altitudes must be attributed or hedged
- Output: `ComplianceReport` with pass/fail per rule + human-readable note

### Compliance status on drafts
- `compliance_status` field on `content_drafts`: `unchecked` / `passed` / `flagged` / `overridden`
- `compliance_notes` JSON array: [{rule, status, note, suggestion}]
- A draft with `compliance_status = flagged` cannot auto-publish; editor must override or fix

### Admin UI
- `/admin/drafts` compliance column: badge showing compliance_status
- Compliance detail drawer: shows rule-by-rule results inline per draft
- Override button: editor can override a flagged compliance check with a note (audit trail)

### Backend
- Alembic migration: add `compliance_status`, `compliance_notes` to `content_drafts`; create `compliance_rules` table
- `POST /api/v1/admin/drafts/{id}/compliance-check` — run compliance check on demand
- `PATCH /api/v1/admin/drafts/{id}/compliance-override` — override with note (admin only)
- Hook `run_compliance_check()` into publish_to_cms before actual publish

## Preconditions
- Read docs/MASTER_TRACKER.md, PROCESS_GUARDRAILS.md, DEPENDENCY_MAP.md
- Confirm Step 27 complete
- Confirm Step 15 complete (ContentDraft model and publish pipeline exist)

## Dependency Check
- `app/modules/content/models.py` — ContentDraft (add columns)
- `app/modules/publish/service.py` — publish_to_cms hook point
- `app/modules/agents/` — new ComplianceGuardAgent node

## Planned Files to Create
- `services/api/alembic/versions/YYYYMMDD_0018_compliance_fields.py`
- `services/api/app/modules/agents/compliance/agent.py`
- `services/api/app/modules/compliance/__init__.py`
- `services/api/app/modules/compliance/models.py` — ComplianceRule
- `services/api/app/modules/compliance/service.py`
- `services/api/app/api/routes/compliance.py`
- `services/api/app/schemas/compliance.py`
- `services/api/tests/test_compliance.py`

## Planned Files to Modify
- `services/api/app/modules/content/models.py` — compliance_status, compliance_notes
- `services/api/app/modules/publish/service.py` — pre-publish compliance hook
- `services/api/app/db/base.py`
- `services/api/app/api/router.py`
- `apps/web-next/app/(admin)/admin/drafts/page.tsx` — compliance column + drawer
- `apps/web-next/lib/api.ts`

## Files Created
- `services/api/alembic/versions/20260430_0018_compliance_fields.py` — adds 5 compliance columns to `content_drafts`; creates `compliance_rules` table (UUID PK, name unique, rule_type, description, rule_config JSON, is_active, created_at)
- `services/api/app/modules/compliance/__init__.py` — package init
- `services/api/app/modules/compliance/models.py` — ComplianceRule ORM model
- `services/api/app/modules/compliance/service.py` — seed_default_rules (idempotent), list_rules, run_compliance_check, override_compliance
- `services/api/app/modules/agents/compliance/__init__.py` — package init
- `services/api/app/modules/agents/compliance/agent.py` — ComplianceGuardAgent (LangGraph 3-node: fetch → run → store); claude-haiku-4-5-20251001; 4 rules: affiliate_disclosure (string match), safety_disclaimer (difficulty-triggered), risky_wording_llm (LLM), ymyl_claims (count threshold)
- `services/api/app/schemas/compliance.py` — ComplianceRuleResponse, ComplianceResultItem, ComplianceCheckResponse, ComplianceOverrideRequest, ComplianceOverrideResponse
- `services/api/app/api/routes/compliance.py` — POST /{id}/compliance-check, PATCH /{id}/compliance-override (router prefix /admin/drafts); GET /rules (rules_router prefix /admin/compliance)
- `services/api/tests/test_compliance.py` — 13 tests (TC-B01 through TC-B13)

## Files Modified
- `services/api/app/modules/content/models.py` — ContentDraft: added compliance_status, compliance_notes, compliance_override_note, compliance_overridden_by, compliance_overridden_at
- `services/api/app/modules/publish/service.py` — publish_to_cms: compliance gate (auto-check unchecked, block flagged)
- `services/api/app/db/base.py` — ComplianceRule imported and registered
- `services/api/app/api/router.py` — compliance_router + compliance_rules_router registered
- `services/api/tests/test_publish.py` — 3 publish success tests updated to mock compliance check
- `apps/web-next/lib/api.ts` — ComplianceResultItem, ComplianceCheckResult, ComplianceOverrideResult interfaces; runComplianceCheck, overrideCompliance helpers
- `apps/web-next/app/(admin)/admin/drafts/page.tsx` — compliance_status + compliance_notes on Draft interface; compliance badge per card; per-rule results in expanded view; Run Compliance Check button; Override button + note textarea
- `apps/web-next/next.config.mjs` — experimental.proxyTimeout: 120_000 (fixes TC-03 ECONNRESET for LLM-backed endpoints)
- `CLAUDE.md` — Section 11 (Step Completion Gate) adds Backend Test Cases checkbox; Section 12 renamed "Test Case Delivery Standard" with TC-B01/TC-F01 format; Section 13 (Communication Rules) references both test case types
- `docs/PROCESS_GUARDRAILS.md` — Step Completion Gate updated with backend test cases requirement

## Status
Done

## Notes
- Compliance rules are stored in DB (not hardcoded) so editors can add/update rules without a deploy.
- Override must record: overriding user_id (from JWT sub), override_note, overridden_at — audit trail for content liability.
- `risky_wording` detection uses an LLM call with claude-haiku-4-5-20251001; uses `.replace("CONTENT", excerpt)` NOT `.format()` to avoid KeyError from JSON braces in prompt template.
- seed_default_rules is idempotent: checks if ANY rule exists; if so, skips seeding entirely. Seeds 4 default rules.
- Compliance gate in publish_to_cms: unchecked → auto-runs check; flagged → 400 error; passed/overridden/unchecked-post-check → allows publish.
- TC-B03 tests structure (any rules with correct fields) rather than specific rule count to avoid isolation issues in shared dev DB.
- next.config.mjs proxyTimeout fix benefits all LLM-backed admin endpoints (compliance-check, cannibalization detect, newsletter generate, content write) that may exceed 30s default.
- GitNexus re-indexed post-step: 6,164 nodes | 10,475 edges | 200 clusters | 187 flows
- 284 backend tests pass (271 prior + 13 new compliance); next build clean (132 static pages)

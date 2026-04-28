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

## Status
pending

## Notes
- Compliance rules are stored in DB (not hardcoded) so editors can add/update rules without a deploy.
- Override must record: overriding user_id, override_note, overridden_at — audit trail for content liability.
- `risky_wording` detection uses an LLM call with a short, cached system prompt — not regex, to handle paraphrase variations.

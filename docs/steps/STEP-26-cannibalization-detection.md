# STEP 26 — Cannibalization Detection + Consolidation Agent

## Goal
Detect keyword overlap and content cannibalization across published pages. Provide a merge / redirect / canonical recommendation engine and a dedicated admin report so editors can resolve conflicts before they hurt rankings.

## Scope

### Cannibalization detection service
- `detect_cannibalization(db)` — for each keyword cluster, find pages that share ≥ 2 primary keywords
- Severity scoring: LOW (2 shared keywords), MEDIUM (3–4), HIGH (5+ or same target keyword)
- Output: `CannibalizationReport` with pairs: `(page_a, page_b, shared_keywords[], severity, recommendation)`

### Recommendation engine
- `merge`: consolidate page_b content into page_a, 301-redirect page_b
- `redirect`: page_b adds canonical to page_a (weaker content kept but de-ranked)
- `differentiate`: editor should rewrite one page to target a different angle
- Recommendations stored in `cannibalization_issues` table

### ConsolidationAgent
- Takes a merge recommendation → generates a merged draft combining best sections of both pages
- Outputs a new ContentDraft for human approval before publish

### Admin UI
- `/admin/cannibalization` (new page): report table with severity badges, recommendation per pair
- Actions: Accept recommendation (triggers ConsolidationAgent), Dismiss, Mark manual

### Backend
- Alembic migration: `cannibalization_issues` table (page_a_id, page_b_id, shared_keywords, severity, recommendation, status, resolved_at)
- `GET /api/v1/admin/cannibalization` — report list, filterable by severity
- `POST /api/v1/admin/cannibalization/{id}/resolve` — accept/dismiss recommendation
- `POST /api/v1/admin/cannibalization/{id}/merge` — trigger ConsolidationAgent

## Preconditions
- Read docs/MASTER_TRACKER.md, PROCESS_GUARDRAILS.md, DEPENDENCY_MAP.md
- Confirm Step 25 complete
- Confirm pages and keyword_clusters tables exist (Step 22, Step 13)

## Dependency Check
- `app/modules/linking/models.py` — Page model (read-only)
- `app/modules/content/models.py` — KeywordCluster (read-only)
- New `cannibalization_issues` table

## Planned Files to Create
- `services/api/alembic/versions/YYYYMMDD_0016_cannibalization_issues.py`
- `services/api/app/modules/cannibalization/__init__.py`
- `services/api/app/modules/cannibalization/models.py`
- `services/api/app/modules/cannibalization/service.py`
- `services/api/app/modules/agents/consolidation/agent.py`
- `services/api/app/api/routes/cannibalization.py`
- `services/api/app/schemas/cannibalization.py`
- `services/api/tests/test_cannibalization.py`
- `apps/web-next/app/(admin)/admin/cannibalization/page.tsx`

## Planned Files to Modify
- `services/api/app/db/base.py`
- `services/api/app/api/router.py`
- `apps/web-next/app/(admin)/admin/layout.tsx` — nav item
- `apps/web-next/lib/api.ts`

## Status
pending

## Notes
- V2.0: keyword overlap is string-match on keyword_clusters.keywords JSON array. V2.1: upgrade to embedding-similarity for semantic overlap detection (Step 35 prereq).
- ConsolidationAgent merge output must be reviewed by human before auto-publish — same approval gate as ContentBrief.

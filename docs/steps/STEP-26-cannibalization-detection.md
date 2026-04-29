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
Done

## Files Created
- `services/api/alembic/versions/20260429_0016_cannibalization_issues.py` — migration creating cannibalization_issues table (page_a_id + page_b_id FK→pages CASCADE, shared_keywords JSON, severity, recommendation, status default=open, resolved_at, created_at)
- `services/api/app/modules/cannibalization/__init__.py` — package init
- `services/api/app/modules/cannibalization/models.py` — CannibalizationIssue ORM
- `services/api/app/modules/cannibalization/service.py` — detect_cannibalization (pairwise overlap via {primary_keyword}∪supporting_keywords; upserts on re-run), get_issues, resolve_issue, get_issue
- `services/api/app/modules/agents/consolidation/__init__.py` — package init
- `services/api/app/modules/agents/consolidation/agent.py` — ConsolidationAgent (LangGraph 3-node: fetch_pages → merge_content → store_draft); creates ContentBrief stub + ContentDraft(requires_review); uses explicit timestamps (server_default not reliable for direct ORM inserts)
- `services/api/app/api/routes/cannibalization.py` — GET /admin/cannibalization, POST /detect, POST /{id}/resolve, POST /{id}/merge; all require get_current_admin
- `services/api/app/schemas/cannibalization.py` — CannibalizationIssueResponse, DetectResponse, ResolveRequest, MergeResponse
- `services/api/tests/test_cannibalization.py` — 17 tests

## Files Modified
- `services/api/app/db/base.py` — CannibalizationIssue imported + registered
- `services/api/app/api/router.py` — cannibalization_router registered
- `services/api/app/api/routes/refresh.py` — stale pages endpoint limit raised from le=200 to le=1000 (growing test data)
- `services/api/tests/test_refresh.py` — two stale page tests updated to ?limit=500
- `apps/web-next/lib/api.ts` — CannibalizationIssue + DetectCannibalizationResult + MergeResult interfaces; 4 fetch helpers added
- `apps/web-next/app/(admin)/admin/cannibalization/page.tsx` — new admin page
- `apps/web-next/app/(admin)/admin/layout.tsx` — "Cannibalization" nav item (Swords icon) added to Growth group

## Notes
- Severity logic: HIGH = same primary_keyword OR ≥5 shared; MEDIUM = 3–4 shared; LOW = 2 shared
- Recommendation: merge (HIGH/same-primary), redirect (MEDIUM), differentiate (LOW)
- Keyword sets are built as {primary_keyword.lower()} ∪ {kw.lower() for kw in supporting_keywords}
- Page pairs are stored with deterministic ordering (str(uuid) sort) to prevent (a,b)/(b,a) duplicates
- ConsolidationAgent must pass explicit created_at/updated_at to ContentBrief+ContentDraft — server_default=func.now() only fires at DB level for API-created records, not direct ORM inserts
- V2.0: string-match only. V2.1: upgrade to embedding-similarity for semantic overlap (Step 35 prereq)
- 256/256 backend tests pass; next build clean with zero TypeScript errors
- GitNexus re-indexed: 5,663 nodes | 9,587 edges | 181 flows

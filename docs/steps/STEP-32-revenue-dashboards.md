# STEP 32 — Deeper Dashboards and Revenue Attribution

## Goal
Build cluster-level and page-type-level revenue attribution dashboards. Show affiliate EPC, content decay signals, and a weekly automated executive summary. Makes the monetisation picture legible so editors can prioritise high-ROI content.

## Scope

### Revenue attribution model
- `revenue_attributions` table: page_id, date, affiliate_clicks, lead_conversions, estimated_revenue_inr, page_type, cluster_id
- Daily aggregation task: reads affiliate_clicks + lead_submissions → writes revenue_attributions rows
- `estimated_revenue_inr` formula: (affiliate_clicks × avg_cpc) + (lead_conversions × lead_value_inr) — configurable constants in `revenue_config` table

### Cluster-level dashboard
- `GET /api/v1/admin/revenue/by-cluster` — sum revenue_attributions grouped by cluster_id, last 30d
- `GET /api/v1/admin/revenue/by-page-type` — grouped by page_type

### Content decay dashboard
- Decay signal: page where affiliate_clicks trend is -20% week-over-week for 3 consecutive weeks
- `GET /api/v1/admin/revenue/decaying-pages` — list with decay_score, recommended action (refresh / consolidate / retire)

### Page-type RPM and EPC
- RPM (Revenue per Mille views): estimated_revenue_inr / (pageviews / 1000) — pageviews mocked from affiliate_clicks proxy in V1; real GA4 data in V4
- EPC (Earnings per Click on affiliate links): estimated_revenue_inr / affiliate_clicks

### Weekly executive summary
- `ExecutiveSummaryAgent`: generates a 300-word markdown digest of week's performance
- Sent to admin email every Monday 08:00 IST via SMTP
- Also stored in `executive_summaries` table and visible in admin

### Admin UI
- `/admin/revenue` (new page): cluster revenue table, page-type EPC cards, decaying pages list, config editor, executive summary history

### Backend
- Alembic migration: `revenue_attributions`, `revenue_config`, `executive_summaries` tables
- Celery beat: daily aggregation + weekly summary generation/send

## Preconditions
- Read docs/MASTER_TRACKER.md, PROCESS_GUARDRAILS.md, DEPENDENCY_MAP.md
- Confirm Step 31 complete
- Confirm Step 24 complete (affiliate_clicks table + analytics summary pattern)

## Dependency Check
- `app/modules/analytics/models.py` — AffiliateClick (read-only)
- `app/modules/leads/models.py` — LeadSubmission (read-only)
- `app/modules/cms/models.py` — CMSPage page_type (read-only)
- `app/modules/content/models.py` — KeywordCluster (read-only)

## Planned Files to Create
- `services/api/alembic/versions/20260430_0021_revenue_attributions.py`
- `services/api/app/modules/revenue/__init__.py`
- `services/api/app/modules/revenue/models.py`
- `services/api/app/modules/revenue/service.py`
- `services/api/app/modules/revenue/tasks.py`
- `services/api/app/modules/agents/executive_summary/__init__.py`
- `services/api/app/modules/agents/executive_summary/agent.py`
- `services/api/app/api/routes/revenue.py`
- `services/api/app/schemas/revenue.py`
- `services/api/tests/test_revenue.py`
- `apps/web-next/app/(admin)/admin/revenue/page.tsx`

## Planned Files to Modify
- `services/api/app/worker/celery_app.py` — daily + weekly beat tasks
- `services/api/app/db/base.py`
- `services/api/app/api/router.py`
- `apps/web-next/app/(admin)/admin/layout.tsx` — Revenue nav item (TrendingUp icon)
- `apps/web-next/lib/api.ts`

## Status
Done

## Files Created
- `services/api/alembic/versions/20260430_0021_revenue_attributions.py` — revenue_config + revenue_attributions + executive_summaries tables; applied with `alembic upgrade head`
- `services/api/app/modules/revenue/__init__.py`
- `services/api/app/modules/revenue/models.py` — RevenueConfig, RevenueAttribution, ExecutiveSummary ORM models
- `services/api/app/modules/revenue/service.py` — _ensure_config (seed defaults), aggregate_revenue, revenue_by_cluster, revenue_by_page_type, decaying_pages, upsert_executive_summary, list_executive_summaries, get/update config
- `services/api/app/modules/revenue/tasks.py` — aggregate_revenue_task (daily), generate_executive_summary_task (weekly)
- `services/api/app/modules/agents/executive_summary/__init__.py`
- `services/api/app/modules/agents/executive_summary/agent.py` — ExecutiveSummaryAgent (3-node LangGraph: gather_data → generate_summary → store_summary); 300-word digest from cluster/type/decay data
- `services/api/app/api/routes/revenue.py` — GET by-cluster, by-page-type, decaying-pages; POST aggregate; GET/PATCH config/{key}; GET summaries; POST summaries/generate
- `services/api/app/schemas/revenue.py` — ClusterRevenueRow, PageTypeRevenueRow, DecayingPageRow, RevenueConfigResponse/Update, AggregateRevenueResponse, ExecutiveSummaryResponse
- `services/api/tests/test_revenue.py` — 18 tests (TC-B01 through TC-B18)
- `apps/web-next/app/(admin)/admin/revenue/page.tsx` — KPI strip, cluster table, page-type table, decaying pages, inline config editor, executive summary history with expand/collapse

## Files Modified
- `services/api/app/worker/celery_app.py` — revenue.tasks in include; daily-aggregate-revenue + weekly-executive-summary beat entries
- `services/api/app/db/base.py` — RevenueAttribution, RevenueConfig, ExecutiveSummary registered
- `services/api/app/api/router.py` — revenue_router registered
- `apps/web-next/app/(admin)/admin/layout.tsx` — TrendingUp icon imported; "Revenue" nav item added to Growth group before Monetization
- `apps/web-next/lib/api.ts` — ClusterRevenueRow, PageTypeRevenueRow, DecayingPageRow, RevenueConfig, ExecutiveSummaryResponse interfaces + fetch/aggregate/patch helpers

## Notes
- Revenue estimates are proxy-based (click counts × config constants from revenue_config). UI labels all values as "estimated".
- Default config: avg_cpc_inr=3.0, lead_value_inr=500.0 — seeded lazily on first API call via _ensure_config().
- ExecutiveSummaryAgent uses get_anthropic_client() (same as all other agents) + stores result in executive_summaries table.
- Daily beat aggregates last 1 day; manual trigger supports configurable `days` param (default 7).
- 363 backend tests pass (18 new for this step); next build clean (137 static pages); GitNexus: 7,396 nodes | 12,613 edges | 266 clusters | 199 flows

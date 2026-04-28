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
- `/admin/revenue` (new page): cluster revenue table, page-type EPC cards, decaying pages list
- `/admin/revenue/summary` (sub-route): executive summary history

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
- `services/api/alembic/versions/YYYYMMDD_0021_revenue_attributions.py`
- `services/api/app/modules/revenue/__init__.py`
- `services/api/app/modules/revenue/models.py`
- `services/api/app/modules/revenue/service.py`
- `services/api/app/modules/revenue/tasks.py`
- `services/api/app/modules/agents/executive_summary/agent.py`
- `services/api/app/api/routes/revenue.py`
- `services/api/app/schemas/revenue.py`
- `services/api/tests/test_revenue.py`
- `apps/web-next/app/(admin)/admin/revenue/page.tsx`

## Planned Files to Modify
- `services/api/app/worker/celery_app.py` — daily + weekly beat tasks
- `services/api/app/db/base.py`
- `services/api/app/api/router.py`
- `apps/web-next/app/(admin)/admin/layout.tsx` — Revenue nav item
- `apps/web-next/lib/api.ts`

## Status
pending

## Notes
- Revenue estimates in V2 are proxy-based (click counts × config constants) — not real payment receipts. Present them clearly as "estimated" in the UI.
- `revenue_config` table: editable by admin — avg_cpc_inr (default: 3), lead_value_inr (default: 500). These drive all RPM/EPC calculations.
- ExecutiveSummaryAgent uses the same send infrastructure as Step 31 (SMTP + template). No new send path needed.

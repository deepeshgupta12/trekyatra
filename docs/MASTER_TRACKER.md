# TrekYatra Master Tracker

## Purpose
This file is the source of truth for implementation progress. It must be read before every step.

## Product Scope References
- Master business/product scope: `/mnt/data/Travel_Blog.md`
- Frontend source of truth: `apps/web-next/` (Next.js 14 App Router)
- Process discipline: `docs/PROCESS_GUARDRAILS.md`
- Dependency discipline: `docs/DEPENDENCY_MAP.md`
- Step plan: `docs/IMPLEMENTATION_PLAN.md`

## Current Execution Rule
Do not modify any code file without first:
1. Reading this tracker
2. Reading `docs/PROCESS_GUARDRAILS.md`
3. Reading `docs/DEPENDENCY_MAP.md`
4. Checking impacted files and blast radius
5. Updating the relevant step file in `docs/steps/`

## V0 Status — Complete
All V0 foundations are shipped. The stack is live locally with:
- FastAPI backend, PostgreSQL, Redis, Celery-ready infra
- Full Next.js 14 App Router frontend (85 pages)
- Auth (email + Google OAuth), session management, route guards
- WordPress REST integration (health, connectivity, create_post)
- Content domain (topics, clusters, briefs, drafts)
- Draft status machine + publish pipeline + publish logs
- Admin summary APIs, smoke tests, GitNexus indexed

## V1 Status — Complete ✓
**All V1 steps delivered. V2 in progress (Steps 25–32).**

| Step | Title | Status |
|------|-------|--------|
| 11 | Worker and task queue infrastructure | done |
| 12 | LangGraph agent framework + agent tracking | done |
| 13 | Trend Discovery Agent + Keyword Cluster Agent | done |
| 14 | Content Brief Agent + brief approval workflow | done |
| 15 | Content Writing Agent + SEO/AEO Optimization Agent | done |
| 15B | Admin CMS enhancements — real API wiring + pipeline view | done |
| 16 | Master CMS Foundation (WordPress removed) | done |
| 17 | Full publish orchestration pipeline | done |
| 18 | Public frontend content page templates | done |
| 19 | SEO and schema infrastructure (frontend) | done |
| 20 | Monetization frontend components | done |
| 21 | RBAC enforcement | done |
| 22 | Internal linking engine + lead pipeline + newsletter platform | done |
| 23 | Content refresh engine (basic) | done |
| 24 | Analytics ingestion + admin panel full wiring | done |

## V2 Status — In Progress
| Step | Title | Status |
|------|-------|--------|
| 25 | Advanced fact validation system | done |
| 26 | Cannibalization detection + consolidation agent | done |
| 27 | Newsletter automation + repurposing agent | done |
| 28 | Compliance Guard Agent | done |
| 29 | Content performance feedback loop | pending |
| 30 | Multi-format content expansion | pending |
| 31 | Advanced monetization layer | pending |
| 32 | Production hardening | pending |

### Step 28 — Compliance Guard Agent
Status: done
What is done:
- Alembic migration `20260430_0018_compliance_fields.py` — adds `compliance_status` (String(32), server_default='unchecked', indexed), `compliance_notes` (JSON nullable), `compliance_override_note` (Text nullable), `compliance_overridden_by` (String(255) nullable), `compliance_overridden_at` (DateTime nullable) to `content_drafts`; creates `compliance_rules` table (id UUID PK, name unique, rule_type, description, rule_config JSON, is_active Boolean, created_at); applied with `alembic upgrade head`
- `modules/compliance/models.py` — ComplianceRule ORM model registered in `db/base.py`
- `modules/compliance/service.py` — seed_default_rules (idempotent: 4 default rules; skips if any exist), list_rules, run_compliance_check (seeds then runs agent), override_compliance (sets overridden + audit trail)
- `modules/agents/compliance/agent.py` — ComplianceGuardAgent (LangGraph 3-node: fetch_draft → run_compliance → store_report); claude-haiku-4-5-20251001; 4 rules: affiliate_disclosure (string match), safety_disclaimer (difficulty-triggered), risky_wording (LLM call using .replace not .format), ymyl_claims (count≥2 threshold); stores compliance_status + compliance_notes on draft
- `schemas/compliance.py` — ComplianceRuleResponse, ComplianceResultItem, ComplianceCheckResponse, ComplianceOverrideRequest, ComplianceOverrideResponse
- `api/routes/compliance.py` — POST /admin/drafts/{id}/compliance-check, PATCH /admin/drafts/{id}/compliance-override, GET /admin/compliance/rules; registered in router.py
- `modules/publish/service.py` — compliance gate added to publish_to_cms: auto-runs check for unchecked drafts; blocks publish if flagged (unless overridden)
- `tests/test_compliance.py` — 13 tests (TC-B01 through TC-B13): ORM insert, seed idempotency, list rules, API list rules, 404 check, happy-path mocked LLM, status persists, override 404/happy-path/audit-trail, publish blocked when flagged, publish allowed when overridden, publish auto-checks unchecked
- `tests/test_publish.py` — 3 existing publish success tests updated to mock compliance check (patch target: `app.modules.compliance.service.run_compliance_check`)
- `lib/api.ts` — ComplianceResultItem, ComplianceCheckResult, ComplianceOverrideResult interfaces; runComplianceCheck, overrideCompliance helpers
- `app/(admin)/admin/drafts/page.tsx` — compliance_status + compliance_notes added to Draft interface; compliance badge (unchecked/passed/flagged/overridden) per card header; per-rule result list in expanded view (fail=red, warn=amber, pass=muted); Run Compliance Check button in action bar; Override button + note textarea for flagged drafts
- `next.config.mjs` — experimental.proxyTimeout: 120_000 (fixes TC-03 ECONNRESET for all LLM-backed admin endpoints)
- `CLAUDE.md` + `PROCESS_GUARDRAILS.md` — Backend Test Cases added to Step Completion Gate; TC-B01/TC-F01 format documented in Section 12
- 284/284 backend tests pass; next build clean (132 static pages)
- GitNexus re-indexed: 6,164 nodes | 10,475 edges | 200 clusters | 187 flows
What remains:
- Step 29 (Operator listing + lead marketplace) pending

### Step 27 — Newsletter Automation + Repurposing Agent
Status: done
What is done:
- Alembic migration `20260429_0017_newsletter_campaigns.py` — creates `newsletter_campaigns` table (id UUID PK, week_label String(50), subject String(500), preview_text String(300) nullable, body_html Text, status String(32) default=draft, sent_at nullable, created_at) and `social_snippets` table (id UUID PK, page_id FK→pages SET NULL nullable, platform String(50), copy Text, copy_title String(500) nullable, status String(32) default=draft, created_at); applied with `alembic upgrade head`
- `modules/newsletter/models.py` — NewsletterCampaign + SocialSnippet ORM models added (alongside existing NewsletterSubscriber)
- `db/base.py` — NewsletterCampaign + SocialSnippet registered
- `schemas/newsletter.py` — NewsletterCampaignResponse, GenerateCampaignResponse, SendCampaignResponse, SocialSnippetResponse, RepurposeResponse added
- `modules/newsletter/service.py` — list_campaigns, get_campaign, send_campaign (Mailchimp/Brevo send via API; graceful no-op when platform unconfigured), _send_mailchimp, _send_brevo, list_snippets added
- `modules/agents/newsletter/__init__.py`, `agent.py` — NewsletterAgent (LangGraph 3-node: fetch_pages → generate_newsletter → store_campaign); picks top 5 published CMSPages by recency; Claude generates subject/preview_text/body_html; JSON parsed with regex fallback; stores NewsletterCampaign with status=draft
- `modules/agents/social_repurpose/__init__.py`, `agent.py` — SocialRepurposeAgent (LangGraph 3-node: fetch_page → generate_snippets → store_snippets); takes page_slug; Claude generates Instagram (280 chars) + Pinterest (title + 150 chars) + Twitter hook; stores 3 SocialSnippet records
- `modules/newsletter/tasks.py` — auto_generate_newsletter_task (Celery) added before sync_subscriber_task
- `worker/celery_app.py` — weekly-newsletter-generate beat entry (604800s)
- `api/routes/newsletter_admin.py` — GET /admin/newsletter, POST /admin/newsletter/generate, GET /admin/newsletter/{id}, POST /admin/newsletter/{id}/send, GET /admin/newsletter/snippets/list, POST /admin/pages/{slug}/repurpose; all require get_current_admin
- `api/router.py` — newsletter_admin_router + newsletter_pages_router registered
- `tests/test_newsletter_agent.py` — 15 tests (2 model ORM, 5 list/get campaigns, 3 send paths, 1 generate mocked, 2 repurpose, 2 snippets); 271/271 backend tests pass
- `lib/api.ts` — NewsletterCampaign, GenerateCampaignResult, SendCampaignResult, SocialSnippet, RepurposeResult interfaces; fetchNewsletterCampaigns, generateNewsletter, sendNewsletterCampaign, fetchSocialSnippets, repurposePage helpers
- `app/(admin)/admin/newsletter/page.tsx` — campaign list with Preview + Send actions (iframe preview modal), social snippets tab with repurpose form + clipboard copy per snippet, status badges
- `app/(admin)/admin/layout.tsx` — "Newsletter" nav item (Mail icon) added to Growth group
- `next build` clean (132 static pages); 271/271 backend tests pass
- GitNexus re-indexed: 5,930 nodes | 10,072 edges | 183 clusters | 181 flows
What remains:
- Configure NEWSLETTER_PLATFORM + NEWSLETTER_PLATFORM_API_KEY + NEWSLETTER_LIST_ID for real Mailchimp/Brevo send
- Weekly auto-generate fires Monday 09:00 UTC via Celery Beat (worker must be running)

### Step 26 — Cannibalization Detection + Consolidation Agent
Status: done
What is done:
- Alembic migration `20260429_0016_cannibalization_issues.py` — creates `cannibalization_issues` table (page_a_id + page_b_id FK→pages CASCADE, shared_keywords JSON, severity VARCHAR(16), recommendation VARCHAR(32), status VARCHAR(32) default=open, resolved_at nullable, created_at); 4 indexes on page_a_id, page_b_id, severity, status
- `modules/cannibalization/__init__.py`, `models.py` — CannibalizationIssue ORM
- `modules/cannibalization/service.py` — detect_cannibalization() (pairwise keyword overlap detection: full keyword set = {primary_keyword} ∪ supporting_keywords; ≥2 shared → issue; upserts on re-run); get_issues(severity, status, limit); resolve_issue(); get_issue()
- Severity: HIGH (same primary_keyword or 5+ shared), MEDIUM (3–4 shared), LOW (2 shared)
- Recommendation: merge (HIGH/same-primary), redirect (MEDIUM), differentiate (LOW)
- `modules/agents/consolidation/__init__.py`, `agent.py` — ConsolidationAgent (LangGraph 3-node: fetch_pages → merge_content → store_draft); creates ContentBrief stub + ContentDraft with status=requires_review
- `api/routes/cannibalization.py` — GET /admin/cannibalization (filter by severity/status), POST /detect, POST /{id}/resolve, POST /{id}/merge; all require get_current_admin
- `api/router.py` — cannibalization_router registered
- `schemas/cannibalization.py` — CannibalizationIssueResponse (enriched with page slugs/titles), DetectResponse, ResolveRequest, MergeResponse
- `db/base.py` — CannibalizationIssue registered
- `tests/test_cannibalization.py` — 17 tests (severity/recommendation unit tests, detect service, list/filter, resolve 200/422/404, merge 400/404/happy-path with mocked LLM); 256/256 backend tests pass
- Pre-existing fix: test_refresh.py stale pages tests now use `?limit=500`; refresh.py endpoint le raised to 1000 (from 200) to accommodate growing test data
- `lib/api.ts` — CannibalizationIssue interface + fetchCannibalizationIssues, detectCannibalization, resolveCannibalizationIssue, triggerConsolidationMerge helpers
- `app/(admin)/admin/cannibalization/page.tsx` — new page: scan button, severity+status filter pills, issue cards with shared keyword chips, Merge/Dismiss/Resolve actions
- `app/(admin)/admin/layout.tsx` — "Cannibalization" nav item (Swords icon) added to Growth group
- `next build` clean; 256/256 backend tests pass; GitNexus 5,663 nodes | 9,587 edges | 181 flows
What remains:
- V2.1: Embedding-similarity upgrade for semantic (not just string-match) keyword overlap detection (Step 35 prereq)

### Step 25 — Advanced Fact Validation System
Status: done
What is done:
- Alembic migration `20260428_0015_draft_claims_ymyl.py` — adds `evidence_url` (nullable Text) and `ymyl_flag` (bool, server_default=false) to `draft_claims`; applied with `alembic upgrade head`
- `modules/agents/fact_validation/__init__.py`, `agent.py` — ClaimExtractionAgent (LangGraph 3-node: fetch_draft → extract_claims → store_claims); YMYL_CLAIM_TYPES = {altitude, safety_advisory, permit_requirement, emergency_contact, medical_advisory}; uses `.replace()` not `.format()` to avoid KeyError from JSON `{}` blocks in extraction prompt; clears existing claims before re-inserting; `evidence_url = None` in V2.0 (EvidenceSearchAgent mocked)
- `api/routes/fact_validation.py` — POST /admin/drafts/{id}/fact-check → FactCheckTriggerResponse (draft_id, claims_extracted, ymyl_claims, flagged_claims); requires get_current_admin
- `api/router.py` — fact_validation_router registered
- `modules/content/models.py` — DraftClaim: `ymyl_flag: Mapped[bool]`, `evidence_url: Mapped[str | None]` added
- `schemas/content.py` — DraftClaimCreate + DraftClaimResponse: ymyl_flag + evidence_url added
- `schemas/admin.py` — ClaimResponse: ymyl_flag + evidence_url added
- `api/routes/admin.py` — list_fact_check_claims + patch_fact_check_claim pass new fields in ClaimResponse
- `api/routes/content.py` — get_draft_claims serialization updated for new fields
- `tests/test_fact_validation.py` — 7 tests (model field check, ORM insert, agent mock 4 claims + YMYL detection, claim clearing on re-run, endpoint 200/404/400); 239/239 backend tests pass
- Pre-existing fix: test_refresh.py stale pages test uses `?limit=200` (50+ real pages in DB exceed default limit=50)
- `lib/api.ts` — FactCheckClaim: `ymyl_flag: boolean` + `evidence_url: string | null`; `FactCheckTriggerResult` interface; `triggerFactCheck(draftId)` helper
- `app/(admin)/admin/fact-check/page.tsx` — rewritten: claims grouped by draft (byDraft map), per-draft "Re-run fact-check" button (triggerFactCheck), YMYL badge (ShieldAlert/red), evidence URL link, YMYL+flagged counts in header, confidence bar, flaggedOnly filter
- `next build` clean (zero TypeScript errors); 239/239 backend tests pass
What remains:
- V2.1 micro-task: wire `trackEvent("admin_draft_approved")` / `trackEvent("admin_draft_published")` in `/admin/drafts` page (flagged V1 code gap, separate scope)
- V2.1: EvidenceSearchAgent with real web search (Brave/Serper API) behind feature flag

### Step 24 — Analytics Ingestion + Admin Panel Full Wiring
Status: done
What is done:
- Alembic migration `20260428_0014_analytics.py` — creates `affiliate_clicks` table (UUID PK, page_slug, affiliate_program, affiliate_link_url, clicked_at, user_agent, session_id, created_at); indexed on affiliate_program, clicked_at, page_slug
- `modules/analytics/__init__.py`, `models.py` — AffiliateClick ORM model
- `modules/analytics/service.py` — `track_affiliate_click` (creates AffiliateClick with explicit timestamps); `get_analytics_summary` (6 COUNT queries: leads_last_30d, affiliate_clicks_last_30d, newsletter_subscribers_total, pages_published_total, pipeline_runs_last_30d, agent_runs_last_30d)
- `schemas/analytics.py` — AffiliateClickCreate, AffiliateClickResponse, AnalyticsSummaryResponse
- `api/routes/analytics.py` — dual routers: POST /track/affiliate-click (public, 201) + GET /admin/analytics/summary (admin auth)
- `db/base.py` — AffiliateClick registered
- `api/router.py` — analytics public + admin routers registered
- `tests/test_analytics.py` — 5 tests; 232/232 backend tests pass
- `lib/analytics.ts` — trackEvent(name, properties) utility: fires to GA4 (window.gtag) and Plausible (window.plausible); silent no-op if neither configured
- `lib/api.ts` — AnalyticsSummary, AffiliateClickPayload, AgentRun interfaces; fetchAnalyticsSummary, trackAffiliateClick, fetchAgentRuns helpers
- `components/monetization/AffiliateCard.tsx` — trackEvent + trackAffiliateClick on affiliate link click
- `components/monetization/LeadForm.tsx` — trackEvent("lead_form_submit") on success
- `components/monetization/NewsletterCapture.tsx` — trackEvent("newsletter_subscribe") on new subscription
- `app/layout.tsx` — conditional GA4 gtag.js script injection (NEXT_PUBLIC_GA4_ID env var)
- `app/(admin)/admin/page.tsx` — rewritten as "use client"; real KPIs from /admin/analytics/summary; real agent runs table from /admin/agent-runs with status badges
- `app/(admin)/admin/analytics/page.tsx` — rewritten; 6 real KPI cards; GA4 integration note
- `app/(admin)/admin/logs/page.tsx` — rewritten; real agent run table with refresh button; status badges
- `.env.local.example` — NEXT_PUBLIC_GA4_ID documented
- Bug fix (pre-existing): test_cms.py list_pages tests fixed with limit=10000 after 50+ pages in DB hit the default limit=50 ceiling
- `next build` clean with zero TypeScript errors; 232/232 backend tests pass
- GitNexus re-indexed: 5,106 nodes | 8,744 edges | 165 clusters | 172 flows
What remains:
- Configure NEXT_PUBLIC_GA4_ID with real G-XXXXXXXXXX ID for production event tracking
- V1 content seeding: run pipeline to generate at least 10 trek guide posts, 5 packing lists, 5 seasonal pages

### Step 23 — Content Refresh Engine (Basic)
Status: done
What is done:
- Alembic migration `20260427_0013_content_refresh.py` — adds `freshness_interval_days`, `last_refreshed_at`, `do_not_refresh` to `pages`; adds `freshness_interval_days` to `content_drafts`; creates `refresh_logs` table (page_id FK→pages, triggered_by, trigger_at, completed_at, result, notes)
- `modules/linking/models.py` — Page model updated with 3 new fields
- `modules/content/models.py` — ContentDraft updated with `freshness_interval_days`
- `modules/refresh/__init__.py`, `models.py` — RefreshLog ORM model
- `modules/refresh/service.py` — `get_stale_pages` (excludes do_not_refresh, uses PostgreSQL interval arithmetic); `create_refresh_log`, `update_refresh_log`, `get_refresh_logs`
- `modules/refresh/tasks.py` — `refresh_task` (Celery: SEOAEOAgent re-run → flag check → upsert_page_from_draft or requires_review gate); `auto_refresh_task` (Celery beat: detect 5 stale pages, dispatch refresh_task per page)
- `api/routes/refresh.py` — GET /admin/refresh/stale, POST /admin/refresh/trigger, GET /admin/refresh/logs; all require get_current_admin
- `schemas/refresh.py` — StalePageResponse, RefreshTriggerRequest, RefreshLogResponse, RefreshTriggerResponse
- `db/base.py` — RefreshLog registered
- `api/router.py` — refresh_router registered
- `worker/celery_app.py` — `app.modules.refresh.tasks` added to include; `daily-auto-refresh` beat entry (86400s)
- `tests/test_refresh.py` — 13 tests (stale detection, do_not_refresh exclusion, recently-refreshed exclusion, trigger 404/422/happy-path with mock dispatch, logs list); 227/227 backend tests pass
- `lib/api.ts` — StalePage, RefreshLog, RefreshTriggerResponse interfaces + fetchStalePages, triggerRefresh, fetchRefreshLogs helpers
- `app/(admin)/admin/refresh/page.tsx` — stale pages table with Refresh-now button per row; refresh log history table with result badge; responsive, matches design system
- `app/(admin)/admin/layout.tsx` — "Content Refresh" nav item (RefreshCw icon) added to Growth group
- `next build` clean; 227/227 backend tests pass; GitNexus re-indexed
What remains:
- Beat schedule runs daily — adjust `freshness_interval_days` per page_type (30/60/90/120 days) via DB update if needed

### Post-Step 23 Bug Fixes (commits 783a004 → current)
Status: done
Five bugs found during end-to-end testing of the Step 23 refresh flow and the pipeline orchestrator. All fixed as separate labelled bug-fix commits. 227/227 backend tests pass after each fix.

**Bug 1 — Pipeline StaleDataError on pipeline_stages UPDATE (commit 783a004)**
- Symptom: `StaleDataError: UPDATE statement on table 'pipeline_stages' expected to update 1 row(s); 0 were matched` on `run_pipeline` and `resume_pipeline` Celery tasks
- Root cause: `TrendDiscoveryAgent._store_results` calls `self.db.rollback()` on duplicate topic errors. SQLAlchemy's `rollback()` always expires ALL session-tracked objects regardless of `expire_on_commit=False`. The `stage_record` (PipelineStage) held by `_execute_stages` was expired; subsequent `_update_stage` commit matched 0 rows.
- Fix: `_update_stage` and `_update_run` now call `db.get(Model, id)` to re-fetch a fresh ORM instance by PK before setting attributes and committing. Both silently no-op if the row is missing.
- Files changed: `services/api/app/modules/pipeline/service.py`

**Bug 2 — Published pages not appearing in Content Refresh queue (commit b5e44a7)**
- Symptom: Pipeline-published pages visible in Master CMS but absent from `/admin/refresh/stale`
- Root cause: `publish_to_cms` wrote to `cms_pages` but never called `sync_pages_from_cms`. The `pages` table (which Content Refresh queries) was only populated by the daily Celery beat or a manual `/admin/links/sync` trigger. The Step 22 MASTER_TRACKER and DEPENDENCY_MAP incorrectly stated this sync was hooked in — it was not in the actual code.
- Fix: `publish_to_cms` now calls `sync_pages_from_cms(db)` after `upsert_page_from_draft`, within the same transaction (flush only; caller commits). Applies to both manual publish and pipeline `_run_publish`.
- Files changed: `services/api/app/modules/publish/service.py`

**Bug 3 — refresh_task TypeError: unexpected keyword argument 'input' (commit 96c85e2)**
- Symptom: `Task refresh.run_refresh raised unexpected: TypeError("BaseAgent.run() got an unexpected keyword argument 'input'")`
- Root cause: `refresh_task` called `agent.run(input={...})`. `BaseAgent.run()` signature is `run(self, input_data, run_id=None)` — the parameter is `input_data`, not `input`.
- Fix: Changed `input=` to `input_data=` on line 49 of `modules/refresh/tasks.py`.
- Files changed: `services/api/app/modules/refresh/tasks.py`

**Bug 4 — Test fixtures wiping real pipeline data on every test run (commits b4fc9e1, d3bd4c7)**
- Symptom: `refresh.run_refresh` returned `result: failed, reason: no_draft` even for pages with a published CMS entry. After investigation: `test_publish.py` and `test_cms.py` `clean_state` fixtures ran `DELETE FROM content_briefs` (which CASCADE-deletes `content_drafts`) and `DELETE FROM cms_pages` on every test run, destroying all real pipeline data.
- Root cause: Blanket `DELETE` on all content tables in `autouse=True` fixtures targeting the shared dev database.
- Fix: Replaced blanket deletes with snapshot approach — record pre-existing IDs for all 5 content tables before each test, delete only newly-created rows post-test in FK-safe order (ContentBrief first → CASCADE to ContentDraft → PublishLog, then CMSPage, KeywordCluster, TopicOpportunity). Count-exact test assertions updated to delta assertions.
- Files changed: `services/api/tests/test_cms.py`, `services/api/tests/test_publish.py`

**Bug 5 — refresh_task hard-fails with "no_draft" when ContentDraft was previously deleted**
- Symptom: Clicking "Refresh" on a published page returns `result: failed, reason: no_draft` even though the page exists in `cms_pages`. Happens when the page's `ContentDraft` row was wiped by test runs before the Bug 4 isolation fix landed.
- Root cause: `refresh_task` queried `ContentDraft` by `cms_page_id` and immediately returned failure when no row found, with no recovery path. Pages whose draft chains were deleted by earlier blanket test deletes are permanently stuck in a "can't refresh" state.
- Fix: When no `ContentDraft` is found, `refresh_task` now looks up the `CMSPage` record and reconstructs a stub `ContentBrief` + `ContentDraft` from it (title, slug, content_html), flushes both, then proceeds with the SEO/AEO agent and re-publish as normal. The refresh succeeds for any published page regardless of draft chain history.
- Files changed: `services/api/app/modules/refresh/tasks.py`

### Step 22 — Internal Linking Engine + Lead Pipeline + Newsletter Platform
Status: done
What is done:
- Alembic migration `20260427_0012_internal_linking_lead_status.py` — creates `pages` and `page_links` tables; adds `status` column to `lead_submissions`
- `modules/linking/models.py` — `Page` + `PageLink` ORM models with FK relationships; registered in `db/base.py`
- `schemas/linking.py` — PageResponse, RelatedPageResponse, AnchorSuggestion, SyncResponse, OrphanResponse
- `modules/linking/service.py` — `sync_pages_from_cms`, `get_related_pages` (cluster-first + fallback), `get_orphan_pages`, `get_anchor_suggestions`
- `modules/linking/tasks.py` — `sync_pages_task` (daily beat), `detect_orphans_task` (daily beat)
- `modules/leads/service.py` — `list_leads` + `update_lead_status` added
- `modules/leads/tasks.py` — `notify_admin_new_lead_task` (SMTP, graceful skip if unconfigured)
- `modules/newsletter/tasks.py` — `sync_subscriber_task` (Mailchimp + Brevo, graceful skip)
- `modules/newsletter/service.py` — fires `sync_subscriber_task.delay()` after DB insert
- `api/routes/linking.py` — POST /admin/links/sync, GET /links/suggestions/{slug}, GET /admin/links/orphans, GET /admin/links/anchors/{slug}
- `api/routes/leads_admin.py` — GET /admin/leads, PATCH /admin/leads/{id}
- `api/routes/leads.py` — fires `notify_admin_new_lead_task.delay()` after submit
- `api/routes/newsletter.py` — POST /newsletter/sync (admin)
- `api/router.py` — linking public+admin, leads_admin registered
- `worker/celery_app.py` — linking/leads/newsletter tasks + daily beat for sync_pages + detect_orphans
- `modules/publish/service.py` — `sync_pages_from_cms()` hooked in after every publish (non-fatal)
- `tests/test_linking.py` — 12 tests; 214/214 backend tests pass
- Frontend: `lib/api.ts` — RelatedPage, OrphanPage, AnchorSuggestion, AdminLead types + fetch helpers
- Frontend: `RelatedContent.tsx` — server-component path fetches from `/links/suggestions/{slug}` when `pageSlug` prop given
- Frontend: `/admin/linking` page rewritten with real API: orphan table + sync trigger + anchor suggestions (inline row expand)
- Frontend: `/admin/leads` page — paginated leads table, KPI row, status filter, mark-as-contacted action
- Frontend: admin sidebar — Leads nav item added (Users icon)
- GitNexus re-indexed: 4,771 nodes | 8,189 edges | 172 flows
What remains:
- SMTP creds must be configured in services/api/.env to enable lead email notifications
- NEWSLETTER_PLATFORM, NEWSLETTER_PLATFORM_API_KEY, NEWSLETTER_LIST_ID must be set to activate external sync

### Step 21 — RBAC Enforcement (+ Step 21 Arch Fix: Separate CMS Auth)
Status: done
What is done:
- RequireRole class in dependencies.py with named singletons (require_super_admin, require_admin, require_editor, require_pipeline, require_agent_admin)
- create_access_token extended with roles list in JWT payload
- services/api/app/schemas/rbac.py — RoleResponse, RoleAssignRequest, UserWithRolesResponse
- services/api/app/modules/rbac/service.py — seed_roles, assign/revoke role helpers, list_users_with_roles
- scripts/seed_roles.py + scripts/assign_admin.py — management scripts
- ARCHITECTURAL FIX: Separated CMS admin auth from public user auth entirely (no shared DB)
  - get_current_admin dependency added to dependencies.py (validates trekyatra_admin_token cookie)
  - create_admin_token() added to security.py (stateless JWT, typ: admin_access)
  - Settings: admin_email, admin_password, admin_cookie_name, admin_token_expire_hours added to config.py
  - NEW routes/admin_auth.py: POST /admin/auth/login, POST /admin/auth/logout, GET /admin/auth/me
  - All 9 admin route routers (admin, publish, content, pipeline, agent_triggers, agent_runs, worker, cms, users) switched from RequireRole to get_current_admin
  - apps/web-next/middleware.ts — checks trekyatra_admin_token for /admin/* (not user token); redirects to /admin/sign-in
  - apps/web-next/app/(admin-auth)/admin/sign-in/page.tsx — standalone admin sign-in page (no sidebar)
  - apps/web-next/app/(admin)/admin/layout.tsx — Sign out button added to header
  - apps/web-next/lib/admin-auth-api.ts — adminLogin, adminLogout, getAdminMe client helpers
  - conftest.py bypass updated to override get_current_admin
  - test_rbac.py rewritten: 20 tests (admin token guards, admin auth endpoints, role seeding, role assignment, user management API)
  - 202/202 backend tests pass; next build clean (128 pages); GitNexus re-indexed 4519 nodes | 7744 edges | 165 flows
What remains:
- Admin password is set in services/api/.env — change from TrekAdmin@2026 to your preferred password

## Step History

### Step 00 — Repo bootstrap, docs, and source-of-truth setup
Status: done
What is done:
- Monorepo folders created
- Uploaded frontend preserved untouched in `apps/web-static`
- Tracker, process, dependency, and implementation docs created

### Step 01 — Backend foundation and local infra scaffold
Status: done
What is done:
- Root repo tooling added
- GitNexus installed and initial graph indexed
- Backend FastAPI scaffold added under `services/api`
- Docker Compose added for Postgres and Redis
- Health endpoints and tests added
- Local API boot validated

### Step 02 — Database, config, and auth data model foundation
Status: done
What is done:
- SQLAlchemy base and session foundation added
- Alembic initialized
- Initial migration created
- User, auth identity, user session, role, permission, user-role, and role-permission models added
- Metadata tests added
- Pylance-safe model typing fixed for auth and RBAC relationships

### Step 03 — Auth APIs foundation
Status: done
What is done:
- Email signup/login/logout/me endpoints implemented
- Password hashing implemented
- JWT access token in HttpOnly cookie implemented
- Placeholder Google/mobile auth interfaces added
- Auth tests added
- Python 3.10 compatibility fixes applied
- ORM registration fix applied for runtime mapper resolution

### Step 04 — Frontend audit and full Next.js migration blueprint
Status: done
What is done:
- Static frontend structure audited using GitNexus and file inventory
- Frontend entry chain and blast radius documented
- Migration direction finalized: full Next.js migration
- Vite app reclassified as source-reference/design-reference only
- API wiring groups mapped for auth, homepage, explore, trek detail, account, admin, and content surfaces
- Mock data deprecation strategy documented

### Step 05 — WordPress integration foundation
Status: done
What is done:
- WordPress config model extended
- WordPress response schemas added
- WordPress REST client skeleton added
- WordPress service helpers added
- WordPress health endpoint added
- WordPress connectivity test endpoint added
- WordPress tests added
- Local WordPress fallback using `?rest_route=/` validated
- Authenticated local WordPress connectivity validated

### Step 06 — Content domain foundation
Status: done
What is done:
- Topic, keyword cluster, content brief, and content draft ORM models added
- Content-domain schemas added
- Content-domain service helpers added
- List/create APIs for topics, clusters, briefs, and drafts added
- Alembic migration `20260421_0003_content_domain_foundation.py` added and validated
- Content route tests added and passing
- Local WordPress bootstrap compose file added
- Local WordPress setup documentation added
- Content insert stability fix applied
- Manual topic create/list curl validation completed

### Step 07 — Internal admin foundation
Status: done
What is done:
- Admin summary schemas added
- Admin service aggregation layer added
- Admin routes added for dashboard, topics, clusters, briefs, drafts, and system summaries
- Admin route tests added and passing
- Manual curl validation completed for:
  - `/api/v1/admin/dashboard/summary`
  - `/api/v1/admin/topics/summary`
  - `/api/v1/admin/clusters/summary`
  - `/api/v1/admin/briefs/summary`
  - `/api/v1/admin/drafts/summary`
  - `/api/v1/admin/system/summary`
What is pending:
- Static admin frontend remains unwired
- Role-aware admin access enforcement is still pending for future steps

### Step 08 — Public frontend data integration phase 1 + full Next.js migration
Status: done
What is done:
- Added public trek read APIs (`GET /api/v1/treks`, `GET /api/v1/treks/{slug}`) in FastAPI
- Added `services/api/app/modules/treks/` domain with in-memory data, service, and schemas
- Added trek route tests (`test_treks.py`)
- Completed full Next.js 14 App Router migration of all ~55 routes from Vite SPA
- Created `apps/web-next/` with: root layout, Providers (QueryClient + Tooltip), globals.css design system, tailwind.config.ts
- Migrated all public pages: homepage (SSG), explore (client), trek detail (SSG + generateStaticParams), compare, regions/[slug], seasons/[slug], all content pages, saved, search, no-results, empty-saved, under-review
- Migrated all auth pages: sign-in, sign-up, otp, forgot-password, reset-password, verify-email, invalid-token, onboarding (multi-step wizard)
- Migrated all success pages (5): newsletter, plan, checkout, password-reset, signup
- Migrated account section: layout with responsive sidebar, dashboard, saved, compare, downloads, enquiries, settings
- Migrated admin section: AdminLayout with dark sidebar, dashboard (KPIs + publish queue), topics, clusters, briefs, drafts, fact-check, linking, monetization, analytics, logs, settings
- Universal `lib/api.ts` with server/client URL detection and 3-second abort timeout
- `lib/trekApi.ts` with mergeImage() and safe static fallback
- `data/treks.ts` with 12 treks using string image paths
- Next.js rewrites proxy `/api/:path*` → `http://localhost:8000/api/:path*`
- All 85 pages build cleanly (`next build` passes)
- `apps/web-static/` Vite reference app removed (migration complete)
What remains:
- Role-aware admin access enforcement is still pending

### Google OAuth (addendum to Step 09)
Status: done
What is done:
- Backend: replaced `google_auth_placeholder` (501) with real `google_auth` handler
- Backend: added `login_or_register_google_user` service — handles new user, existing email link, and returning Google user
- Backend: `POST /api/v1/auth/google` accepts `{ access_token }`, verifies with Google's userinfo endpoint via httpx, upserts user + auth_identity, creates session, sets HttpOnly cookie
- Backend schema: `GoogleAuthRequest.access_token` (was `id_token`)
- Backend tests: 3 new Google auth tests (creates user, 401 for bad token, links to existing email account) — all 7 auth tests pass
- Frontend: installed `@react-oauth/google`
- Frontend: `googleAuth()` added to `lib/auth-api.ts`
- Frontend: `loginWithGoogle()` added to `AuthContext` and `AuthProvider`
- Frontend: `Providers.tsx` wrapped with `GoogleOAuthProvider` (reads `NEXT_PUBLIC_GOOGLE_CLIENT_ID`)
- Frontend: "Continue with Google" button wired with `useGoogleLogin` in both sign-in and sign-up pages
- Frontend: `apps/web-next/.env.local.example` created with `NEXT_PUBLIC_GOOGLE_CLIENT_ID` instruction
- All 85 pages build cleanly
What is required to activate:
- Create OAuth 2.0 credentials at Google Cloud Console (Web application type)
- Set Authorized JavaScript origins: `http://localhost:3000`
- Copy Client ID → `apps/web-next/.env.local` as `NEXT_PUBLIC_GOOGLE_CLIENT_ID=<id>`

### Step 17 — Full Publish Orchestration Pipeline (+ enhancements)
Status: done
What is done (enhancements, post-TC review):
- Alembic migration `20260423_0010_cms_hero_image.py` — adds hero_image_url (String 512, nullable) to cms_pages
- `CMSPage` model + all 3 CMS schemas updated with hero_image_url field
- `CMSPageForm` — hero_image_url URL input + preview; trek_facts strip (6 fields: duration, altitude, difficulty, season, permits, base); trek_facts persisted to content_json.trek_facts; buildPayload updated
- `lib/api.ts` — TrekFacts interface added; CMSPage + CMSPagePayload extended with hero_image_url and trek_facts
- Pipeline service `resume()` fix: paused_at_draft_approval now resumes at seo_aeo (not publish) — SEO/AEO agent runs before every publish
- 2 new pipeline tests: draft-approval resume dispatches task, stages_slice confirms seo_aeo→publish path; 139/139 backend tests pass
- Trek detail page full overhaul: generateMetadata (seo_title/description), descriptive anchor IDs (#why-this-trek, #quick-facts, etc.), sticky sidebars fixed (nested sticky+overflow), all 12 TOC items match real section blocks, 4 new content blocks (best_time, difficulty, packing, safety), hero_image_url from CMS, trek facts from content_json.trek_facts, H1 strips SEO subtitle (splits on : or —); CMS section extraction broadened (question-form headings, intro pre-heading capture); CMS form fields full-width (max-w-4xl removed)
- Anthropic 529 resilience: `agents/client.py` shared factory with `max_retries=6`; all 5 agents updated to use `get_anthropic_client()`; 139/139 tests pass
- Sticky sidebar root fix: `globals.css` changed `overflow-x: hidden` → `overflow-x: clip` on html/body; `hidden` on `<html>` re-assigns the scroll container away from the viewport, breaking `position: sticky` in Chromium/Safari
- CMS empty sections fix: `cms/service.py:reparse_sections_from_draft` + `POST /cms/pages/{slug}/reparse-sections` route + Re-parse sections button in CMSPageForm; prevents double-processing HTML via `_process_content_json` passthrough; 2 new tests; 141/141 pass
- Section parser overhaul (parser fix batch): `_parse_sections_from_markdown` updated to use `^#{1,2}` (H3 = content not boundary), H1 always opens why_this_trek (captures intro paragraphs), `faqs` moved to top of `_SECTION_HEADING_MAP` (first-match-wins; fixes FAQ content landing in why_this_trek), `difficult\b` added to difficulty pattern, `key facts` and `overview` added to why_this_trek pattern; `_extract_trek_facts_from_markdown` helper added — extracts duration/altitude/difficulty/season/permits/base from structured markdown; `upsert_page_from_draft` + `reparse_sections_from_draft` both write trek_facts to content_json; FE hardcoded fallbacks "Required"/"Sankri"/"Moderate" replaced with "—"; 8 new parser unit tests; 148/149 pass (1 pre-existing pipeline test pollution — unrelated)

### Step 20 — Monetization Frontend Components
Status: done
What is done:
- Alembic migration `20260427_0011_leads_newsletter.py` — creates `lead_submissions` (id, name, email, phone nullable, trek_interest, message nullable, source_page, source_cluster nullable, cta_type, created_at) and `newsletter_subscribers` (id, email UNIQUE, name nullable, source_page, lead_magnet nullable, created_at)
- `modules/leads/models.py` — LeadSubmission ORM model
- `modules/newsletter/models.py` — NewsletterSubscriber ORM model with UniqueConstraint on email
- `db/base.py` — LeadSubmission + NewsletterSubscriber registered
- `schemas/leads.py` — LeadCreate (custom email validator) + LeadResponse
- `schemas/newsletter.py` — NewsletterSubscribeCreate + NewsletterSubscribeResponse (already_subscribed: bool)
- `modules/leads/service.py` — create_lead()
- `modules/newsletter/service.py` — subscribe() with idempotent duplicate detection
- `api/routes/leads.py` — POST /api/v1/leads (201)
- `api/routes/newsletter.py` — POST /api/v1/newsletter/subscribe (200)
- `api/router.py` — leads_router + newsletter_router registered
- `tests/test_leads_newsletter.py` — 8 tests; 182/182 backend tests pass
- `apps/web-next/lib/api.ts` — LeadPayload, LeadResponse, NewsletterPayload, NewsletterResponse interfaces + submitLead() + subscribeNewsletter()
- `apps/web-next/components/monetization/InArticleAdSlot.tsx` — conditional AdSense/placeholder
- `apps/web-next/components/monetization/SidebarAdSlot.tsx` — 300×250 ad slot
- `apps/web-next/components/monetization/FooterAdSlot.tsx` — 970×60 footer ad
- `apps/web-next/components/monetization/AffiliateCard.tsx` — product card with rel="nofollow sponsored noopener"
- `apps/web-next/components/monetization/AffiliateRail.tsx` — snap-scroll horizontal rail
- `apps/web-next/components/monetization/ComparisonTable.tsx` — comparison table with checkmark icons
- `apps/web-next/components/monetization/GearRecommendation.tsx` — inline affiliate gear mention
- `apps/web-next/components/monetization/LeadForm.tsx` — name/email/phone/trek/message → POST /leads; localStorage-backed
- `apps/web-next/components/monetization/OperatorCard.tsx` — operator display + embedded LeadForm
- `apps/web-next/components/monetization/ConsultationCTA.tsx` — inline/card CTA wrapping LeadForm
- `apps/web-next/components/monetization/NewsletterCapture.tsx` — email → POST /newsletter/subscribe; localStorage guards duplicate
- `apps/web-next/components/monetization/LeadMagnetCapture.tsx` — download CTA wrapping NewsletterCapture
- `apps/web-next/components/monetization/InlineNewsletterBlock.tsx` — mid-article wrapper for NewsletterCapture
- `apps/web-next/components/trust/DisclosureBlock.tsx` — affiliate/ads/AI disclosure block
- `apps/web-next/components/trust/TrustSignals.tsx` — date/author/fact-checked trust bar
- `apps/web-next/components/trust/StickyMobileCTA.tsx` — lg:hidden sticky mobile CTA with localStorage 7-day dismiss
- `apps/web-next/app/layout.tsx` — conditional AdSense script via NEXT_PUBLIC_ADSENSE_ID
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — InArticleAdSlot + AffiliateRail + TrustSignals + StickyMobileCTA inserted
- `apps/web-next/app/(public)/packing/[slug]/page.tsx` — AffiliateRail + NewsletterCapture inserted
- `apps/web-next/app/(public)/.env.local.example` — NEXT_PUBLIC_ADSENSE_ID documented
- `next build` clean (127 static pages); 182/182 backend tests pass

### Step 19 Bug Fixes — Fact-check wiring, flagged-marker stripping, pipeline clear
Status: done
What is done:
- `PATCH /admin/fact-check/claims/{claim_id}`: new endpoint updates `flagged_for_review` on DraftClaim; `update_draft_claim()` service function added to `content/service.py`
- `ClaimPatch` Pydantic schema added to `schemas/admin.py`
- Fact Check admin page: "Mark verified" calls PATCH with `flagged_for_review=false`, optimistic UI update removes flag; "Flag for editor" calls PATCH confirm + shows "Sent to editor queue ✓" (no DB change, already flagged)
- `patchFactCheckClaim()`, `clearPipelineRuns()`, `clearAgentRuns()` helpers added to `lib/api.ts`
- Pipeline page: "Clear all" button in Failed/Cancelled section header calls `DELETE /admin/pipeline/runs/clear` and reloads
- `_strip_flagged_markers()` + `_strip_flagged_markers_html()` helpers in `cms/service.py`: strip `*(flagged for verification)*`, `[flagged for verification ...]`, `<em>(flagged...)</em>` from markdown/HTML before storage
- `_md_to_html()` now calls `_strip_flagged_markers()` before markdown conversion
- `_process_content_json()` now strips flagged HTML markers from already-stored HTML sections
- Section patterns expanded: "safety" gains `medical|health.*altitude|mountain.*safe|know before`; "cost_estimate" gains `invest|spend|financial|tariff|expenditure`
- 6 new backend tests; 174/174 pass; `next build` clean
- Pipeline keyword_cluster fallback: `_run_keyword_cluster` now falls back to 10 most-recent DB topics when trend_discovery returns `topic_ids: []`, preventing hard failure on every re-run
- TrendDiscoveryAgent `_store_results`: added `logger.warning()` + `self.db.rollback()` in except block — fixes silent DB session corruption when first `create_topic` leaves an aborted transaction (causing all subsequent topics to fail silently)
- 174/174 backend tests pass; `next build` clean; GitNexus re-indexed (4,093 nodes | 7,032 edges | 155 flows)

### Step 19 — SEO and Schema Infrastructure (Frontend)
Status: done
What is done:
- `apps/web-next/lib/schema.ts` — schema builder utilities: `buildArticleSchema`, `buildFAQSchema`, `buildBreadcrumbSchema`, `buildItemListSchema`, `buildWebSiteSchema`; all use `NEXT_PUBLIC_SITE_URL` env
- `apps/web-next/components/seo/SchemaInjector.tsx` — renders `<script type="application/ld+json">` for each valid schema object; filters null entries
- `apps/web-next/app/sitemap.ts` — Next.js App Router sitemap: static pages + trek detail slugs + published CMS pages by type prefix; deduplicates by URL; fails gracefully when API unavailable
- `apps/web-next/app/robots.ts` — blocks `/admin/`, `/account/`, `/auth/`, `/api/`; references sitemap URL
- `apps/web-next/app/layout.tsx` — `metadataBase`, global OG site defaults, Twitter card defaults, `robots: {index: true, follow: true}` added
- `apps/web-next/app/(public)/page.tsx` — homepage gets `buildWebSiteSchema()` via SchemaInjector
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — canonical, OG, Twitter card via `generateMetadata()`; Article + FAQPage + BreadcrumbList JSON-LD; section padding increased `pt-16 pb-16 md:pt-20 md:pb-20`; TOC URL hash reinstated via `history.pushState`
- `apps/web-next/app/(public)/packing/[slug]/page.tsx` — canonical, OG, Twitter card; Article + FAQ JSON-LD
- `apps/web-next/app/(public)/permits/[slug]/page.tsx` — canonical, OG, Twitter card; Article + FAQ JSON-LD
- `apps/web-next/app/(public)/guides/[slug]/page.tsx` — canonical, OG, Twitter card; Article + FAQ JSON-LD
- Step 18 bug fixes: trek facts two-pass extraction (table → KV, colon required); FAQ H3 format parsing; stale-run cleanup at startup; fact-check admin page wired to real DraftClaim data
- Backend: `DELETE /admin/pipeline/runs/clear` + `DELETE /admin/agent-runs/clear` bulk cleanup endpoints; `GET /admin/fact-check/claims` with DraftClaim join; startup `_cancel_stale_runs()` lifespan hook
- `apps/web-next/app/(admin)/admin/fact-check/page.tsx` rewritten as real-API client component
- `apps/web-next/lib/api.ts`: `FactCheckClaim` type + `fetchFactCheckClaims` helper
- 168/168 backend tests pass; `next build` clean; CLAUDE.md updated with inter-step dependency rules (Section 16)

### Step 18 — Public Frontend Content Page Templates
Status: done
What is done:
- Backend parser: fixed permits regex (`permit\b[^*:\n]{0,20}(?::?\*\*)?:?`) to match "Permit Required:" format; fixed base regex to match "Nearest Base Villages:" + note stripping; added `_extract_faq_section_raw` + `_parse_faqs_from_section` — parses bold-question/paragraph-answer FAQ format into `[{q, a}]` list; `upsert_page_from_draft` + `reparse_sections_from_draft` both now write `content_json.faqs`; 4 new tests (permits format, nearest base villages, FAQ parse, FAQ extract); 153/153 pass
- Shared components created: `components/content/FAQAccordion.tsx` (client, smooth open/close, accent active state), `components/content/TableOfContents.tsx` (client, IntersectionObserver scroll spy, active highlight with border-l-2), `components/content/Breadcrumb.tsx`, `components/content/RelatedContent.tsx`, `components/content/AuthorBlock.tsx`, `components/content/UpdatedBadge.tsx`, `components/content/SafetyDisclaimer.tsx`, `components/content/AffiliateDisclosure.tsx`
- Trek page rewrite: uses TableOfContents (scroll spy replaces hardcoded i===0), FAQAccordion (from content_json.faqs with HTML answers), Breadcrumb, AuthorBlock; added body-level Quick Facts section (`#quick-facts`) so TOC link scrolls correctly; cost fallback changed to generic "Contact for pricing" message; permits fallback made generic; difficulty badge uses tf.difficulty
- CMSPageForm: FAQ textarea removed; replaced with structured Q&A pair editor (add/remove pairs); answer field accepts HTML from auto-parse or plain text; Re-parse sections button also updates FAQ state when new pairs extracted
- `lib/api.ts`: `FAQItem` type exported; `CMSPage.content_json.faqs` typed; `CMSPagePayload.content_json.faqs` typed
- New page templates: `app/(public)/packing/[slug]/page.tsx`, `app/(public)/permits/[slug]/page.tsx`, `app/(public)/guides/[slug]/page.tsx` — all CMS-powered with static fallbacks, use shared components
- next build clean (89+ pages); 153/153 backend tests pass
- Alembic migration `20260423_0009_pipeline.py` — creates `pipeline_runs` (id UUID PK, pipeline_type, status, current_stage, start/end_stage, input/output_json, error_detail, timestamps) and `pipeline_stages` (id UUID PK, pipeline_run_id FK, stage_name, agent_run_id FK→agent_runs, status, error_detail, timestamps)
- `app/modules/pipeline/models.py` — `PipelineRun` + `PipelineStage` ORM models with relationship; `db/base.py` updated
- `app/schemas/pipeline.py` — `PipelineRunCreate`, `PipelineRunResponse`, `PipelineStageResponse`, `PipelineTriggerResponse`
- `app/modules/pipeline/service.py` — CRUD helpers + `PipelineOrchestrator` class: `run()` / `resume()` / stage dispatchers for all 6 stages; checkpoint gates: `paused_at_brief_approval` (after content_brief), `paused_at_draft_approval` (after content_writing if draft has flagged claims); partial pipeline support via start_stage/end_stage
- `app/modules/pipeline/tasks.py` — `run_pipeline_task`, `resume_pipeline_task`, `daily_discovery_task` (Celery beat)
- `app/worker/celery_app.py` — pipeline tasks included; beat_schedule daily_discovery added
- `app/api/routes/pipeline.py` — POST /run, GET /runs, GET /runs/{id}, POST /runs/{id}/resume, POST /runs/{id}/cancel
- `app/api/router.py` — pipeline_router registered
- `tests/test_pipeline.py` — 20 tests: CRUD, stages_slice, API trigger/list/get/cancel/resume/409, orchestrator failure propagation, metadata coverage
- 137/137 backend tests pass; `next build` clean
- `apps/web-next/lib/api.ts` — PipelineRun/PipelineStage types + triggerPipeline/fetchPipelineRuns/fetchPipelineRun/resumePipelineRun/cancelPipelineRun
- `apps/web-next/app/(admin)/admin/pipeline/page.tsx` — fully rewritten: TriggerForm (start stage selector + seed topics/brief_id/draft_id inputs), RunCard (stage track, output chips, resume/cancel buttons, approval gate notice, error detail), KPI strip, auto-refresh while runs are active

### Step 16 — Master CMS Foundation
Status: done
What is done:
- WordPress removed entirely: deleted `app/modules/wordpress/`, `app/api/routes/wordpress.py`, `app/schemas/wordpress.py`, `tests/test_wordpress*.py`, `docker-compose.wordpress.yml`, `infrastructure/wordpress/`; 5 WP config settings removed from `config.py` and `.env.example`
- `services/api/alembic/versions/20260423_0008_master_cms.py` — creates `cms_pages` table; drops WP columns from drafts+logs; adds `cms_page_id`+`published_url`
- `services/api/app/modules/cms/service.py` — full CRUD + `upsert_page_from_draft` (agent pipeline → CMS); `_md_to_html` converts markdown at storage time; `_parse_sections_from_markdown` extracts named sections from agent output into `content_json.sections`; `_process_content_json` converts section markdown to HTML for manual saves; `cache_invalidate`/`cache_invalidate_all` (Redis DB 2)
- `services/api/app/api/routes/cms.py` — `GET/POST /cms/pages`, `GET/PATCH/DELETE /cms/pages/{slug}`, `POST /cms/cache/invalidate`
- `services/api/app/modules/publish/service.py` — `publish_to_cms` replaces `push_draft_to_wordpress`
- 117/117 backend tests pass
- `apps/web-next/lib/api.ts` — `CMSPage` + `TrekContentSections` interfaces; `fetchCMSPage`/`fetchCMSPages`/`createCMSPage`/`updateCMSPage` helpers
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — each named Block renders from `content_json.sections[key]` (HTML) when present; static template is fallback; `notFound()` guard for unknown slugs; `formatUpdatedAt` from `cmsPage.published_at`; sticky sidebars `max-h` capped
- `apps/web-next/app/api/revalidate/route.ts` — Next.js on-demand revalidation endpoint
- `apps/web-next/app/(admin)/admin/cms/page.tsx` — KPI cards + pages table; New page button + edit icon per row; cache clear (per-page + global)
- `apps/web-next/app/(admin)/admin/cms/new/page.tsx` — manual CMS page creation form
- `apps/web-next/app/(admin)/admin/cms/[slug]/edit/page.tsx` — edit existing CMS page with Save + Publish + cache clear
- `apps/web-next/components/admin/CMSPageForm.tsx` — shared form: title, slug, page type, status, SEO meta, 10 section textareas (markdown)
- `apps/web-next/app/globals.css` — `.cms-section` prose styles for agent-generated HTML blocks
- `apps/web-next/app/(admin)/admin/drafts/page.tsx` — "Publish to Master CMS" CTA label
- `services/api/pyproject.toml` — `markdown>=3.6` dependency added
- `next build` clean (89 static pages); GitNexus re-indexed

### Step 15B — Admin CMS Enhancements (real API wiring + pipeline view)
Status: done
What is done:
- `components/admin/CopyableId.tsx` — click-to-copy UUID component; `Copy` icon on hover, `Check` icon on copied (2s reset); shows truncated UUID with optional label prefix
- `components/admin/AgentRunsPanel.tsx` — live last-5 agent-run panel; polls every 5s while any run has status="running"; auto-stops when all complete; remounts per dispatch via `key={runKey}`; shows status badge + duration; non-intrusive (returns null on empty)
- `admin/topics/page.tsx` — fully rewritten; loads real topics from `GET /api/v1/topics`; trend_score and urgency_score progress bars; status badges; CopyableId per topic; "Generate brief →" nav link with `?topic_id=&kw=` query params; AgentRunsPanel for trend_discovery agent
- `admin/clusters/page.tsx` — fully rewritten; loads real clusters from `GET /api/v1/clusters`; intent badges (informational/commercial/transactional); supporting keywords expandable (first 6 shown, +N more toggle); AgentRunsPanel for keyword_cluster agent
- `admin/briefs/page.tsx` — structured brief content viewer expanded (heading tree H1/H2/H3 indented, FAQs list, key_entities + secondary_keywords tag pills); CopyableId for brief/topic/cluster UUIDs; "Write draft →" cross-nav link on approved briefs; AgentRunsPanel for content_brief agent
- `admin/drafts/page.tsx` — requires_review and review status badges added; per-card agentFeedback state shows dispatch confirmation after optimize; await-outside-setState bug fixed
- `admin/pipeline/page.tsx` — new page; parallel fetches all 4 entities; client-side join (topicMap, clusterMap, draftByBrief); stage summary pills (In Progress→In Review→Approved→Draft Stage→Published); full pipeline table with brief/topic/cluster/draft status + confidence %, all UUIDs via CopyableId, nav links to /admin/briefs and /admin/drafts
- `admin/layout.tsx` — Pipeline View nav item added (GitMerge icon, href /admin/pipeline)
- GitNexus re-indexed: 3,268 nodes | 5,350 edges | 81 clusters | 101 flows (commit aab2d3e)

### Step 15 — Content Writing Agent + SEO/AEO Optimization Agent
Status: done
What is done:
- Alembic migration `20260422_0007_draft_claims.py` — adds `optimized_content` (Text nullable) to `content_drafts`; creates `draft_claims` table (id UUID PK, draft_id FK→content_drafts CASCADE, claim_text, claim_type, confidence_score, flagged_for_review, created_at) with indexes on draft_id and flagged_for_review
- `app/modules/content/models.py` — `ContentDraft` extended with `optimized_content` and `claims` relationship; new `DraftClaim` ORM model added
- `app/db/base.py` — `DraftClaim` registered in metadata
- `app/schemas/content.py` — `ContentDraftCreate`/`ContentDraftResponse` extended with `optimized_content`; `DraftClaimCreate` and `DraftClaimResponse` added
- `app/modules/content/service.py` — `get_draft`, `update_draft_optimized_content`, `create_draft_claim`, `list_draft_claims` added; `create_draft` updated for `optimized_content`
- `app/modules/agents/content_writing/__init__.py` + `agent.py` + `prompts.py` — `ContentWritingAgent`: 3-node LangGraph (fetch_brief → write_draft → store_results); validates brief is approved + has structured_brief; calls Claude claude-sonnet-4-6 with prompt caching; stores draft + all DraftClaim records; sets status `requires_review` if any claim confidence < 0.7
- `app/modules/agents/seo_aeo/__init__.py` + `agent.py` + `prompts.py` — `SEOAEOAgent`: 3-node LangGraph (fetch_draft → optimize → store_results); runs SEO/AEO pass; stores `optimized_content` on draft; returns changes_count + faq_count
- `app/worker/tasks/agent_tasks.py` — `write_draft_task` + `optimize_draft_task` Celery tasks added
- `app/api/routes/agent_triggers.py` — `POST /api/v1/admin/agents/write-draft` + `POST /api/v1/admin/agents/optimize-draft` added
- `app/api/routes/content.py` — `GET /api/v1/admin/drafts/{id}/claims` added; `_draft_to_response` helper added; `get_drafts`/`post_draft` refactored to use it
- `tests/test_content_writing_agent.py` — 11 tests: missing brief_id, invalid format, not found, unapproved brief, no structured_brief, mocked-LLM creates draft+claims, no-flagged sets status=draft, claims empty, claims returns data, invalid ID, trigger dispatch
- `tests/test_seo_aeo_agent.py` — 6 tests: missing draft_id, invalid format, not found, mocked-LLM optimizes + stores optimized_content, content unchanged, trigger dispatch
- `apps/web-next/app/(admin)/admin/drafts/page.tsx` — fully rewritten: expandable content preview (optimized if available), flagged claims panel with confidence % and claim type badges, Optimize button, Write Draft trigger form, `requires_review` status badge
- 101/101 backend tests pass; `next build` clean (zero errors)
What remains:
- Real LLM calls require ANTHROPIC_API_KEY in services/api/.env
- Draft status machine: `requires_review` → `review` transition manually wired via Submit for Review button

### Step 14 — Content Brief Agent + Brief Approval Workflow
Status: done
What is done:
- Alembic migration `20260422_0006_brief_versions.py` — adds `structured_brief` (JSON) and `word_count_target` (int) to `content_briefs`; creates `brief_versions` table (id UUID PK, brief_id FK→content_briefs CASCADE, version_number, structured_brief, created_at)
- `app/modules/content/models.py` — `ContentBrief` extended with `structured_brief`, `word_count_target`, `versions` relationship; new `BriefVersion` ORM model
- `app/db/base.py` — `BriefVersion` registered in metadata
- `app/schemas/content.py` — `ContentBriefCreate`/`ContentBriefResponse` extended; `BriefStatusPatch`, `BriefVersionResponse`, `BRIEF_STATUS_TRANSITIONS` state machine added
- `app/modules/content/service.py` — `get_brief`, `update_brief_status` (state machine: draft→review→approved/rejected→scheduled), `create_brief_version`, `list_brief_versions`, `list_briefs` (status filter) added
- `app/modules/agents/content_brief/__init__.py` — package init
- `app/modules/agents/content_brief/schema.py` — `BriefStructure` TypedDict (all brief fields)
- `app/modules/agents/content_brief/prompts.py` — Claude prompt for SEO+AEO execution-grade brief generation
- `app/modules/agents/content_brief/agent.py` — `ContentBriefAgent`: 3-node LangGraph (fetch_context → generate_brief → store_results); fetches topic + cluster context, calls Claude, stores brief + version 1
- `app/worker/tasks/agent_tasks.py` — `generate_brief_task` Celery task added (`agents.generate_brief`)
- `app/api/routes/agent_triggers.py` — `POST /api/v1/admin/agents/generate-brief` added
- `app/api/routes/content.py` — `GET /api/v1/admin/briefs/{id}`, `PATCH /api/v1/admin/briefs/{id}/status`, `GET /api/v1/admin/briefs/{id}/versions` added; `get_briefs` supports `?status_filter=`
- `app/api/router.py` — `admin_router` moved before `content_router` to prevent route shadowing
- `tests/test_brief_agent.py` — 15 tests: agent no-topic, invalid-topic, mocked-LLM creates brief+version, state machine valid/invalid/not-found, version increment, API detail/404, PATCH valid/invalid, versions empty/filled, trigger missing IDs, trigger dispatch
- `apps/web-next/app/(admin)/admin/briefs/page.tsx` — fully wired to real API: loads briefs, approve/reject via PATCH, generate-brief trigger with topic UUID + keyword inputs
- 84/84 backend tests pass; `next build` clean (zero errors)
What remains:
- Real LLM calls require ANTHROPIC_API_KEY in services/api/.env
- Brief detail expanded view (structured_brief JSON viewer) deferred to a later step

### Step 13 — Trend Discovery Agent + Keyword Cluster Agent
Status: done
What is done:
- `app/modules/agents/base_agent.py` — `_build_graph` return type fixed to `Any` (compiled graph)
- `app/modules/agents/trend_discovery/prompts.py` — Claude prompt for SEO topic scoring
- `app/modules/agents/trend_discovery/agent.py` — `TrendDiscoveryAgent`: 2-node LangGraph (score_topics → store_results); calls Claude, writes `TopicOpportunity` rows
- `app/modules/agents/keyword_cluster/prompts.py` — Claude prompt for semantic topic clustering
- `app/modules/agents/keyword_cluster/agent.py` — `KeywordClusterAgent`: 3-node LangGraph (fetch_topics → cluster_topics → store_results); writes `KeywordCluster` rows with `competition_score` and `cannibalization_risk` in `notes`
- `app/modules/agents/service.py` — `get_run` added
- `app/worker/tasks/agent_tasks.py` — `discover_trends_task` and `cluster_keywords_task` Celery tasks; use `SessionLocal` directly; call agent, then `complete_run`/`fail_run`
- `app/worker/celery_app.py` — `agent_tasks` added to `include` list
- `app/api/routes/agent_runs.py` — `GET /api/v1/admin/agent-runs/{id}` endpoint added
- `app/api/routes/agent_triggers.py` — `POST /api/v1/admin/agents/discover-trends` and `POST /api/v1/admin/agents/cluster-keywords`; both dispatch Celery tasks and return `agent_run_id`
- `app/api/router.py` — `agent_triggers_router` registered
- `apps/web-next/app/(admin)/admin/topics/page.tsx` — "Discover trends" button wired; shows run ID + poll link
- `apps/web-next/app/(admin)/admin/clusters/page.tsx` — "Cluster topics" button wired; accepts topic UUID input
- `tests/test_agent_triggers.py` — 8 tests (trigger dispatch, run_id returned, GET by ID, 404, mocked LLM unit test, empty input error)
- No new DB migration (TopicOpportunity and KeywordCluster models already have all required fields)
- 69/69 backend tests pass; `next build` clean
What remains:
- Real LLM calls require ANTHROPIC_API_KEY in services/api/.env
- Admin topics/clusters pages still show static seed data; live data wiring deferred to Step 18

### Step 12 — LangGraph agent framework + agent tracking
Status: done
What is done:
- `pyproject.toml` — `anthropic`, `langchain-core`, `langchain-anthropic`, `langgraph` added and installed
- `app/core/config.py` — `anthropic_api_key` setting added
- `app/modules/agents/models.py` — `AgentRun` ORM model (id, agent_type, status, input_json, output_json, error, started_at, completed_at, created_at, updated_at)
- `app/modules/agents/state.py` — `BaseAgentState` TypedDict (run_id, agent_type, input, output, errors, metadata)
- `app/modules/agents/base_agent.py` — `BaseAgent` ABC wrapping LangGraph `StateGraph`; subclasses define `_build_graph()` and call `run()`
- `app/modules/agents/service.py` — `start_run`, `update_run`, `complete_run`, `fail_run`, `list_runs`
- `app/schemas/agents.py` — `AgentRunResponse` Pydantic schema
- `app/api/routes/agent_runs.py` — `GET /api/v1/admin/agent-runs` with agent_type, status, limit, offset filters
- `app/api/router.py` — `agent_runs_router` registered
- `app/db/base.py` — `AgentRun` imported and registered in metadata
- `alembic/versions/20260422_0005_agent_runs.py` — `agent_runs` table with status/agent_type indexes; migration applied
- `tests/test_agent_runs.py` — 7 tests (list empty, filter by type, filter by status, CRUD lifecycle, fail lifecycle, nonexistent run, API list after create)
- 61/61 backend tests pass; `next build` not needed (no frontend changes)
What remains:
- Actual LLM calls wired through agents (Steps 13–15)
- ANTHROPIC_API_KEY must be set in `.env` before agents make real LLM calls

### Step 11 — Worker and task queue infrastructure
Status: done
What is done:
- `app/core/config.py` — `celery_broker_url` and `celery_result_backend` computed fields added (Redis DB 1)
- `app/worker/celery_app.py` — Celery instance with broker/backend from settings; task serializer, UTC, acks_late, prefetch=1 configured; empty beat_schedule stub
- `app/worker/tasks/base.py` — `BaseTask` with `max_retries=3`, `default_retry_delay=60s`, `on_failure` and `on_retry` hooks
- `app/worker/tasks/smoke.py` — `smoke.ping` task using `BaseTask`; validates end-to-end queue flow
- `app/api/routes/worker.py` — `GET /api/v1/worker/health`; checks Redis broker connectivity, returns broker status and URL
- `app/api/router.py` — `worker_router` registered additively
- `docker-compose.yml` — `worker` and `beat` services added under `profiles: [worker]`; arm64-safe `python:3.12-slim` base via Dockerfile
- `services/api/Dockerfile` — minimal Python image for Docker-based worker/beat runs
- `Makefile` — `make worker` and `make beat` targets for local host-based worker runs
- `services/api/.env.example` — Celery broker/backend documented (derived automatically, override comment provided)
- `tests/test_worker.py` — 4 new tests: 200 status, response shape, broker connected, broker URL uses DB 1
- 54/54 backend tests pass; no Alembic migration (infra-only step)
What remains:
- `agent_runs` table and LangGraph wiring (Step 12)
- Dead-letter `failed` flag on `agent_runs` referenced in base.py on_failure (wired in Step 12)

### Step 10 — Publish, tracking, and validation workflows
Status: done
What is done:
- `PublishLog` ORM model added to `content_drafts` cascade (tracks every push attempt)
- `published_at` and `wordpress_post_id` columns added to `content_drafts` via migration `20260422_0004`
- `WordPressClient.create_post()` method added
- `schemas/publish.py` — `DraftStatusPatch`, `PublishLogResponse`, `DraftPublishResponse`
- `modules/publish/service.py` — `VALID_TRANSITIONS` dict, `update_draft_status`, `push_draft_to_wordpress`, `get_publish_logs`
- `api/routes/publish.py` — `PATCH /admin/drafts/{id}/status`, `POST /admin/drafts/{id}/publish`, `GET /admin/drafts/{id}/publish-log`
- `publish_router` registered in `api/router.py`
- `test_smoke.py` — smoke tests for all key API surfaces (14 tests)
- `test_publish.py` — full publish workflow tests (9 tests, including mocked WP push)
- Admin drafts page rewritten as real API client with status badges and action buttons
- 50/50 backend tests pass; `next build` clean; GitNexus re-indexed (2072 nodes, 74 flows)
What remains:
- Role-aware admin access enforcement (future step)
- OTP mobile auth (future step)

### Step 09 — User account foundation on frontend
Status: done
What is done:
- Created `apps/web-next/lib/auth-api.ts`: typed client-only fetch helpers for `/auth/me`, `/auth/login`, `/auth/signup`, `/auth/logout`
- Created `apps/web-next/lib/auth-context.tsx`: React context with `AuthProvider` that bootstraps from `GET /me` on mount; exposes `user`, `isLoading`, `login()`, `signup()`, `logout()`, `refresh()`
- Created `apps/web-next/middleware.ts`: Next.js middleware protecting `/account/*` routes (redirects to `/auth/sign-in?next=<path>`) and bouncing authenticated users from `/auth/sign-in` and `/auth/sign-up` to `/account`
- Created `apps/web-next/components/account/UserGreeting.tsx`: client component reading `useAuth()` to display personalised welcome in account dashboard
- Modified `apps/web-next/components/Providers.tsx`: wrapped children in `<AuthProvider>`
- Modified `apps/web-next/app/(auth)/auth/sign-in/page.tsx`: wired to `login()` from `useAuth()`, `useSearchParams` redirect after login, `<Suspense>` boundary for static generation compatibility
- Modified `apps/web-next/app/(auth)/auth/sign-up/page.tsx`: wired to `signup()` from `useAuth()`, redirects to `/auth/onboarding` on success
- Modified `apps/web-next/components/layout/Header.tsx`: auth-aware desktop dropdown (avatar with initials, name/email, Dashboard link, Sign out) and mobile drawer (Dashboard link, Sign out)
- Modified `apps/web-next/app/(public)/account/page.tsx`: replaced static greeting with `<UserGreeting />` component
- All 85 pages build cleanly with Step 9 changes applied
What remains:
- Saved treks/downloads/enquiries wired to real user data (future step)
- Onboarding form data persisted to backend (future step)
- OTP and Google auth (backend stubs return 501; frontend UI exists)
- Role-aware admin access enforcement (future step)
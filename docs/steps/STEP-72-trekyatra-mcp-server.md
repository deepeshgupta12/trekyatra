# STEP-72 — "TrekSage" MCP Server + Trek Intelligence Data Layer + Datacenter Subdomain

**Status:** Done
**Phase:** V6 (Platform Extensibility)
**Dependencies:** Step 57 (Plan My Trek matching engine), Step 37 (translation agent), `app/modules/agents/client.py` (Claude Haiku client), Step 69 (compare page), M05/M06 (mobile trek detail + home)
**Last updated:** 2026-06-15

---

## Overview

Adds a deterministic, token-minimized "trek intelligence" data layer on top of `cms_pages` (`page_type="trek_guide"`), exposes it via:

1. New REST endpoints (`/api/v1/treks/*`, `/api/v1/leads/operator-help`, `/api/v1/ai/log`)
2. A new MCP server **"TrekSage"** mounted at `https://api.trekyatra.co.in/mcp` (8 tools), for ChatGPT and Claude connectors
3. A new `datacenter.trekyatra.co.in/trek-guide/{slug}` subdomain showing the full structured `TrekProfile` (human + AI readable)
4. Website Trek Detail "Ask AI" widget + revamped Compare page (backend-wired, AI trade-off summary)
5. Mobile Plan tab wiring, Trek Detail "Ask TrekSage" card, and a backend-wired Compare screen
6. Admin trek-data quality dashboard + AI interaction log viewer

**Token-minimization principle (binding for all future trek-intelligence work):** all ranking/matching/comparison is deterministic Python — **zero LLM calls**. LLM (Claude Haiku, `claude-haiku-4-5-20251001`) is used ONLY for:
- Trek Detail Q&A (`ask_trek_question`, `max_tokens=250`)
- Compare-page trade-off summary (`max_tokens=300`)
- Admin-triggered structured-field backfill drafts (`max_tokens=400`, one trek at a time, never bulk)
- Existing Hindi translation (Step 37, unchanged)

Every LLM call is cached in `trek_qa_cache` (DB-backed) by a hash of trek_slug(s) + normalized question/type — repeat queries cost nothing. If `trek_data_confidence` marks the relevant field as `"missing"`, `ask_trek_question` skips the LLM entirely and returns a templated "not verified yet" disclaimer (zero cost, zero hallucination).

---

## Scope Decisions (confirmed before implementation)

1. Mobile wiring (Plan tab + Trek Q&A + Compare) is in scope for this step.
2. Structured trek data lives on CMS `trek_guide` pages (`cms_pages` table) — the legacy 12-trek hardcoded `services/api/app/modules/treks/data.py` / `/api/v1/treks` (non-versioned legacy routes) is untouched/out of scope.
3. MCP server mounts at `https://api.trekyatra.co.in/mcp` as a sub-app on the existing `api` component — only one new subdomain (`datacenter.trekyatra.co.in`) is created.

---

## Commit 1 — DB migration: trek structured data + AI logging + lead extension

**File:** `services/api/alembic/versions/20260615_0043_step72_trek_intelligence.py`

- `cms_pages` new nullable columns (populated only for `page_type="trek_guide"`):
  - `trek_region`, `trek_max_altitude_ft`, `trek_duration_days_min`, `trek_duration_days_max`
  - `trek_best_months`, `trek_open_months`, `trek_avoid_months` (JSON list[int] 1-12)
  - `trek_permit_required` (Boolean), `trek_permit_notes` (Text)
  - `trek_budget_min`, `trek_budget_max` (Integer, INR)
  - `trek_themes` (JSON list[str]), `trek_crowd_level` (String)
  - `trek_beginner_friendly`, `trek_solo_friendly`, `trek_family_friendly` (Boolean)
  - `trek_operator_available` (Boolean, default true)
  - `trek_is_unsafe_closed` (Boolean, default false) — admin override; matching engine always excludes when true
  - `trek_data_confidence` (JSON dict[field_name, "verified"|"draft"|"missing"])
  - `trek_last_verified_at` (DateTime)
- New table `ai_interaction_logs`: `id, source (web|mobile|chatgpt|claude), tool_name, query_summary, result_summary, page_url, session_id, trek_slugs (JSON), created_at`. No raw PII.
- New table `trek_qa_cache`: `id, cache_key (unique), answer_text, model, created_at`.
- `lead_submissions` new nullable column `details_json` (JSON) — operator-help fields: `travel_month`, `traveller_count`, `city`, `budget_preference`, `transport_required`.

`alembic upgrade head` run successfully.

---

## Commit 2 — `services/api/app/modules/trek_intelligence/` (new module)

- `models.py` — `AIInteractionLog`, `TrekQACache` ORM models, registered in `app/db/base.py`.
- `__init__.py`
- `matching.py` — refines `app/modules/plan/service.py` scoring:
  - Real `budget_score` using `trek_budget_min`/`trek_budget_max` vs user `budget_inr` (100 within range / 70 ≤20% over / 40 20-40% over / 0 much higher).
  - Season score uses `trek_best_months`/`trek_open_months`/`trek_avoid_months` when present (100/70/30/0), falls back to existing `trek_season` string-overlap logic when fields are empty.
  - Hard exclusion: any trek with `trek_is_unsafe_closed=True` or selected month in `trek_avoid_months` → score forced to 0, filtered from candidates entirely.
- `service.py` — PRD §7 tool implementations as plain functions (DB session in, dict/Pydantic out), shared by REST routes (Commit 3) and MCP tools (Commit 4):
  - `search_treks`, `get_trek_details` (full `TrekProfile`), `recommend_treks` (delegates to refined `matching.py`), `compare_treks` (2-4 slugs, deterministic diff table + cached AI trade-off summary), `get_trek_content`, `ask_trek_question`, `create_trek_plan_lead`, `translate_trek_content` (wraps Step 37 agent), `log_ai_interaction` (fire-and-forget, never raises), `backfill_trek_meta` (admin-triggered draft fill).
  - `_BACKFILL_FIELDS` — the 16 structured fields eligible for admin backfill / confidence tracking.
  - `list_trek_data_quality`, `update_trek_meta`, `list_ai_interaction_logs` — admin dashboard support functions.
- `services/api/app/schemas/trek_intelligence.py` — `TrekProfile`, `CompareTreksRequest/Response`, `AskTrekQuestionRequest/Response`, `OperatorHelpLeadRequest`, `TrekMetaPatch`, `TrekDataQualityRow`, `AIInteractionLog` response schema, etc.

---

## Commit 3 — REST API routes + pytest tests

- `services/api/app/api/routes/treks.py` — added:
  - `GET /api/v1/treks/{slug}/profile` — full `TrekProfile`
  - `POST /api/v1/treks/compare` — 2-4 slugs
  - `POST /api/v1/treks/{slug}/ask` — Trek Detail Q&A
  - `GET /api/v1/treks/{slug}/content` — one `content_json` section
  - Also added `FilterFacets` fields (`states`, `difficulties`, `seasons`, `suitabilities`) used by explore/compare pickers.
- `services/api/app/api/routes/leads.py` — `POST /api/v1/leads/operator-help` via `create_trek_plan_lead` (422 if `consent != true`).
- New `services/api/app/api/routes/ai_log.py` — `POST /api/v1/ai/log` (public, calls `log_ai_interaction`, never raises to caller).
- New `services/api/app/api/routes/admin_treks.py` — admin trek-data quality + meta-patch + backfill-trigger + AI log routes (Commit 8).
- Registered in `services/api/app/api/router.py` — static routes registered before dynamic `{slug}` routes.
- `services/api/tests/test_trek_intelligence.py` — full pytest coverage (see Test Cases below).

---

## Commit 4 — MCP server ("TrekSage")

- Added `mcp` (official Python MCP SDK) to `services/api/pyproject.toml`.
- New `services/api/app/mcp_server.py` — `FastMCP("TrekSage")`, 8 tools as thin wrappers over `trek_intelligence/service.py`:
  - `search_treks`, `get_trek_details`, `recommend_treks`, `compare_treks`, `get_trek_content` — open, read-only, no PII.
  - `ask_trek_question`, `create_trek_plan_lead`, `translate_trek_content` — gated by `X-MCP-Key` header checked against `MCP_SHARED_SECRET` (new env var, `services/api/app/core/config.py` → `mcp_shared_secret: str | None`).
  - Every tool response is a compact dict (no `content_html`, descriptions truncated ~300 chars) to minimize the calling AI's context cost.
- Mounted as a sub-app at `/mcp` (Streamable HTTP transport) in `services/api/app/main.py` (`lifespan` updated to start the MCP session manager).
- New Celery task `services/api/app/worker/tasks/trek_intelligence_tasks.py` — `trek_intelligence.backfill_trek_meta` (`backfill_trek_meta_task`), registered in `app/worker/celery_app.py` include list. **Worker restart required** to pick this up.

### Manual setup — ChatGPT / Claude connectors (user action, cannot be automated)

**ChatGPT:**
1. Settings → Connectors → Add custom connector
2. URL: `https://api.trekyatra.co.in/mcp`
3. No auth needed for read-only tools; `create_trek_plan_lead`/`translate_trek_content` require `X-MCP-Key: <MCP_SHARED_SECRET>` header — ChatGPT custom connectors support a static header field for this.

**Claude (claude.ai / Claude Desktop):**
1. Settings → Connectors → Add custom connector
2. URL: `https://api.trekyatra.co.in/mcp`
3. Same header note as above for the two gated tools.

**Local smoke test (before production DNS is live):**
```bash
npx @modelcontextprotocol/inspector
# Connect to http://localhost:8000/mcp (Streamable HTTP) — confirm 8 tools listed with schemas
```

---

## Commit 5 — Web: Trek Detail Q&A widget + structured fields

- New `apps/web-next/components/trek/TrekAskAI.tsx` — "Ask AI" card with 4 suggested prompts (beginner-friendly? best month? permit needed? what to pack?), calls `POST /api/v1/treks/{slug}/ask`; shows "not verified yet" disclaimer styling (amber) when `not_verified`.
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — mounts `<TrekAskAI>`; surfaces new fields (permit required/notes, budget range, themes, crowd level) in quick-facts/permits/cost blocks where present, omitted gracefully when null.
- `apps/web-next/lib/api.ts` — `TrekProfile`, `askTrekQuestion`, `compareTreks`, `fetchTrekProfile`, etc. added.

---

## Commit 6 — Web: Compare page backend wiring + Plan results polish

- `apps/web-next/app/(public)/compare/CompareClient.tsx` — replaced frontend-only CMS fetch with `POST /api/v1/treks/compare`; renders comparison table (permit, budget, crowd, solo/family suitability, safety notes) + cached AI trade-off summary card; existing save/share CTAs retained.
- `apps/web-next/components/plan/RecommendationCard.tsx` + `services/api/app/schemas/plan.py` (`PlanRecommendResponse`) — recommendation cards now surface budget/permit/themes when present (refined matching engine populates these automatically, no API signature break).

---

## Commit 7 — `datacenter.trekyatra.co.in/trek-guide/[slug]` subdomain

- New route group `apps/web-next/app/datacenter/` — `layout.tsx`, `page.tsx` (index — lists published trek_guide slugs), `trek-guide/[slug]/page.tsx` (server component, full `TrekProfile` via `GET /api/v1/treks/{slug}/profile`, definition-list layout with confidence/last-verified badges, `noindex`).
- `apps/web-next/middleware.ts` — host-based rewrite: `host === "datacenter.trekyatra.co.in"` → rewrites into `/datacenter/*`; all other hosts unaffected.
- `docs/URL_MAP.md` — added `## TrekSage MCP Server & Datacenter Subdomain (Step 72)` section documenting the subdomain, MCP endpoint, and new `/api/v1/treks/*`, `/api/v1/leads/operator-help`, `/api/v1/ai/log` routes.

### Manual infra setup (user action, cannot be automated)

1. DO App Platform → existing `web` component → Settings → Domains → add `datacenter.trekyatra.co.in` (same component, no new deployment).
2. GoDaddy DNS → add CNAME `datacenter` → DO app domain (same target as `www`/apex).
3. Local testing before DNS is live: `curl -H "Host: datacenter.trekyatra.co.in" http://localhost:3000/trek-guide/<slug>`.

---

## Commit 8 — Admin: trek data-quality dashboard + AI log viewer

- New `apps/web-next/app/(admin)/admin/trek-data/page.tsx` — follows admin design system (dark cards, status badges):
  - KPI cards: Trek Guides, Verified/Draft/Missing field totals, Unsafe/Closed count.
  - "Structured Field Coverage" table — per-trek verified/draft/missing counts from `trek_data_confidence`, expandable inline editor (`TrekEditForm`) for all 16 backfill fields + `trek_is_unsafe_closed` toggle.
  - "Backfill draft" button per trek → `POST /api/v1/admin/treks/{slug}/backfill` → `trek_intelligence.backfill_trek_meta` Celery task.
  - "AI / MCP Interaction Log" table — `ai_interaction_logs`, source badges (web=blue, mobile=pine, chatgpt=purple, claude=accent).
- `apps/web-next/app/(admin)/admin/layout.tsx` — added "Trek Data" nav entry (System group).
- `apps/web-next/lib/api.ts` — `fetchTrekDataQuality`, `updateTrekMeta`, `triggerTrekBackfill`, `fetchAiInteractionLogs`.
- Backend: `services/api/app/api/routes/admin_treks.py` — `GET /api/v1/admin/treks/data-quality`, `PATCH /api/v1/admin/treks/{slug}/meta`, `POST /api/v1/admin/treks/{slug}/backfill`, `GET /api/v1/admin/treks/ai-logs`.

---

## Commit 9 — Mobile: Plan tab wiring + Trek Q&A + Compare

- `apps/mobile/app/(tabs)/plan.tsx` — replaced dead "coming in M08" stub; now re-exports `apps/mobile/app/(tabs)/(home)/plan-my-trek.tsx` (fully-wired wizard from Step M-DS1/M06, now reachable from the Plan tab).
- New `apps/mobile/components/trek/TrekAskAI.tsx` — GlassSurface "Ask TrekSage" card, same 4 suggested prompts as web, calls `trekIntelligenceApi.ask()`.
- `apps/mobile/app/(tabs)/(home)/trek/[slug].tsx` — mounts `<TrekAskAI>` in the "guide" tab, above related treks.
- `apps/mobile/app/(tabs)/(home)/compare.tsx` — full rewrite: pick up to 3 treks (was 2), calls `trekIntelligenceApi.compare()`, renders dynamic comparison table + cached AI trade-off summary card (`GlassSurface`).
- `apps/mobile/lib/mobileApi.ts` — added `trekIntelligenceApi` (`ask`, `compare`) + `TrekProfile`, `AskTrekQuestionResponse`, `CompareTreksResponse`, `TrekComparisonRow` types.

---

## Commit 10 — Docs, env vars, full test run, re-index

- This step doc.
- `services/api/.env.example` — added `MCP_SHARED_SECRET` (Step 72 section).
- `services/api/app/core/config.py` — `mcp_shared_secret: str | None = None` (added in Commit 4).
- `docs/MASTER_TRACKER.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/DEPENDENCY_MAP.md`, `README.md` updated (see below).
- Full backend test suite: 665 passed, 1 skipped, 2 pre-existing failures (`test_refresh.py`, unrelated to Step 72 — baseline).
- `cd apps/web-next && npm run build` — zero TypeScript/build errors.
- `cd apps/mobile && npx tsc --noEmit` — zero errors.
- `npx gitnexus analyze --force` + `gitnexus_detect_changes(scope:"all")` — counts recorded in `docs/MASTER_TRACKER.md`.

---

## Files Created

- `services/api/alembic/versions/20260615_0043_step72_trek_intelligence.py`
- `services/api/app/modules/trek_intelligence/__init__.py`
- `services/api/app/modules/trek_intelligence/models.py`
- `services/api/app/modules/trek_intelligence/matching.py`
- `services/api/app/modules/trek_intelligence/service.py`
- `services/api/app/schemas/trek_intelligence.py`
- `services/api/app/api/routes/admin_treks.py`
- `services/api/app/api/routes/ai_log.py`
- `services/api/app/mcp_server.py`
- `services/api/app/worker/tasks/trek_intelligence_tasks.py`
- `services/api/tests/test_trek_intelligence.py`
- `apps/web-next/components/trek/TrekAskAI.tsx`
- `apps/web-next/app/datacenter/layout.tsx`
- `apps/web-next/app/datacenter/page.tsx`
- `apps/web-next/app/datacenter/trek-guide/[slug]/page.tsx`
- `apps/web-next/app/(admin)/admin/trek-data/page.tsx`
- `apps/mobile/components/trek/TrekAskAI.tsx`

## Files Modified

- `services/api/app/db/base.py`, `services/api/app/api/router.py`, `services/api/app/api/routes/treks.py`, `services/api/app/api/routes/leads.py`, `services/api/app/core/config.py`, `services/api/app/main.py`, `services/api/app/modules/cms/models.py`, `services/api/app/modules/leads/models.py`, `services/api/app/modules/plan/service.py`, `services/api/app/schemas/leads.py`, `services/api/app/schemas/plan.py`, `services/api/app/worker/celery_app.py`, `services/api/pyproject.toml`, `services/api/.env.example`
- `apps/web-next/lib/api.ts`, `apps/web-next/middleware.ts`, `apps/web-next/app/(public)/trek/[slug]/page.tsx`, `apps/web-next/app/(public)/compare/CompareClient.tsx`, `apps/web-next/components/plan/RecommendationCard.tsx`, `apps/web-next/app/(admin)/admin/layout.tsx`
- `apps/mobile/app/(tabs)/plan.tsx`, `apps/mobile/app/(tabs)/(home)/trek/[slug].tsx`, `apps/mobile/app/(tabs)/(home)/compare.tsx`, `apps/mobile/lib/mobileApi.ts`
- `docs/URL_MAP.md`

---

## Notes

- Legacy `/api/v1/treks` 12-trek hardcoded list (`services/api/app/modules/treks/data.py`) — untouched, out of scope.
- Real-time operator inventory, WhatsApp bot, community reviews, live permit status — explicitly excluded.
- Per-trek backfill is admin-triggered one-at-a-time (no automatic bulk job) — avoids uncontrolled LLM spend.
- **Celery worker must be restarted** after deploy to register `trek_intelligence.backfill_trek_meta` task.
- New structured fields on existing trek_guide pages start at `trek_data_confidence = {}` (all "missing") until admin backfills/verifies — `ask_trek_question` returns the templated disclaimer for those fields until then.
- `npx gitnexus analyze --force` re-index after this step: **458,363 nodes | 752,216 edges | 3,652 clusters | 300 flows** (from 485,615 / 767,598 / 3,315 / 300 at start of step). Final `gitnexus_detect_changes(scope:"all")`: 142 changed symbols / 31 files / 13 affected processes, risk level high — expected (cumulative across all 10 commits' uncommitted files); every affected process is a leaf screen-component trace already individually verified LOW via `gitnexus_impact` per commit.

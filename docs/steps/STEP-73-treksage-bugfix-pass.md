# STEP-73 — TrekSage Bugfix Pass: Data Backfill, Q&A Grounding, Compare Summary, Conversational Follow-ups, /treksage Chat + Datacenter JSON Viewer

**Status:** Done
**Phase:** V6 (Platform Extensibility — bugfix continuation of Step 72)
**Dependencies:** Step 72 (`trek_intelligence` module, `trek_qa_cache`, `ai_interaction_logs`, MCP server, compare page, datacenter subdomain)
**Last updated:** 2026-06-16

---

## Overview

Production testing of Step 72 at `www.trekyatra.co.in` surfaced 7 issues, all with confirmed root causes in the Step 72 implementation. This step fixes all 7 and adds 2 new surfaces.

### Issues Fixed

| # | Issue | Root Cause |
|---|-------|-----------|
| 1 | Compare page shows "—" for most fields | `backfill_trek_meta` was never bulk-run; all 51 CMS trek guides still have `missing` confidence for all 16 structured fields |
| 2 | "TrekSage's Take" AI compare summary is generic | `facts_lines` prompt missing `permit_required/notes`, `themes`, `solo_friendly`, `suitability`, `best_months`, `avoid_months`; also stale shallow summaries cached from #1 |
| 3 | Ask AI always returns "not verified" | `ask_trek_question` never queries `content_json.sections` — grounding was purely from 16 structured fields; packing/itinerary/safety questions have no structured fields so always hit the `structured_missing` early-return |
| 4 | Follow-up questions don't maintain context | `ask_trek_question` was fully stateless — no `history` param, `AskTrekQuestionRequest` had no `history` field |
| 5 | Admin `/admin/trek-data` shows 0 verified / 805 missing | Same root cause as #1 — data never bulk-backfilled |
| 6 | Plan result cards missing budget/themes/permit/crowd badges | Same root cause as #1 — badges rely on the 16 structured fields which were all `null` |
| 7a | Datacenter JSON viewer inadequate | `TrekProfile` didn't include `content_sections`/`faqs` — the per-trek "bible" shape MCP reasoned over was incomplete |
| 7b | No public TrekSage conversational assistant | Feature request from user — Myra-style AI chat page with session persistence |

---

## Commits

### Commit 1 — Bulk backfill + admin trigger (fixes #1, #5, #6)
- `service.py`: new `backfill_all_trek_meta(db)` — iterates all published `trek_guide` CMSPages; skips any where all `_BACKFILL_FIELDS` are already `"verified"` via `trek_data_confidence`; calls existing `backfill_trek_meta(db, slug)` per page; aggregates `{processed, skipped, failed}`.
- `trek_intelligence_tasks.py`: new `trek_intelligence.backfill_all_trek_meta` Celery task.
- New `POST /api/v1/admin/trek-data/backfill-all` route (registered BEFORE the existing `/{slug}/backfill`).
- Admin UI `trek-data/page.tsx`: "Backfill All Treks" `variant="hero"` button in page header.
- Tests TC-B23–TC-B26: skip-all-verified, process-missing, never-overwrite-verified, aggregate-failures.

### Commit 2 — Richer compare summary prompt (fixes #2)
- `service.py`: extended `facts_lines` in `_get_or_create_compare_summary` to include permit/themes/solo/suitability/best_months/avoid_months.
- Added `_SUMMARY_PROMPT_VERSION = "v2"` constant included in summary cache key hash — busts all stale shallow cached summaries.
- Tests TC-B27: cache-invalidation-by-version; TC-B28: new fields present in prompt.

### Commit 3 — CMS section grounding for Ask AI (fixes #3)
- `service.py`: new `_QA_SECTION_KEYWORDS: dict[str, str]` mapping keyword groups → `content_json.sections` keys (pack/carry/gear/clothing → `packing`; itinerary/day/route → `itinerary`; safety/AMS/risk → `safety`; faq/frequently asked → `faqs`).
- New helpers `_matching_section_for_question(question)` and `_strip_html(html)`.
- `ask_trek_question`: before the structured-missing early-return, checks `content_json.sections.{section_key}` directly (NOT via `get_trek_content` — that looked at a wrong path); if section HTML found, strips to plain text and includes in Haiku prompt; early-return `not_verified` only if NEITHER structured fields NOR matching section content exists.
- Tests TC-B29: packing question with populated `content_json.sections.packing` → LLM called, section in prompt; TC-B30 (partial — see #4).

### Commit 4 — Conversational follow-ups (fixes #4)
- `schemas/trek_intelligence.py`: new `ChatTurn(BaseModel)` (`role: str`, `content: str`); `AskTrekQuestionRequest.history: list[ChatTurn] | None = None`.
- `ask_trek_question(db, slug, question, history=None)`: `has_history = bool(history)` gate added to early-return (`if structured_missing and not section_text and not has_history:`); last 6 history turns prepended to Haiku `messages`; cache skipped for history-bearing requests.
- `routes/treks.py`: threads `history=payload.history` through.
- Web `TrekAskAI.tsx`: maintains `QAExchange[]` state; sends last 3 exchanges (6 turns) as history.
- Tests TC-B30: history follow-up bypasses early-return and includes prior turn in prompt; TC-B31: no-history request still cached.

### Commit 5 — Expanded TrekProfile "bible" + compact MCP list tools (for datacenter #7a)
- `schemas/trek_intelligence.py` `TrekProfile`: added `content_sections: dict[str, str]` and `faqs: list[dict[str, str]]`.
- `service.py`: new `_extract_content_sections(page)` and `_extract_faqs(page)` helpers; `page_to_profile()` populates both fields from `content_json`.
- `mcp_server.py` `_compact_profile`: added `data.pop("content_sections", None)` and `data.pop("faqs", None)` so search/list/recommend tools stay token-light; `get_trek_details` returns the full profile.
- `lib/api.ts` `TrekProfile` interface: added `content_sections`/`faqs` fields.
- Tests TC-B32: `page_to_profile` includes `content_sections`; TC-B33: compact profile excludes them.

### Commit 6 — DB migration + TrekSage conversational agent backend (for #7b)
- **Migration `20260616_0044`** (`down_revision = "20260615_0043"`):
  - `treksage_chat_sessions`: `id uuid pk`, `user_id nullable FK → users`, `session_key varchar unique`, `created_at`, `last_active_at`.
  - `treksage_chat_messages`: `id uuid pk`, `session_id FK cascade`, `role varchar(16)`, `content text`, `tool_calls_json JSON nullable`, `created_at`.
- `models.py`: `TreksageChatSession` + `TreksageChatMessage` ORM models with `relationship`.
- `db/base.py`: both models imported + added to `__all__`.
- `treksage_agent.py` (new module): `_HAIKU_MODEL`, `MAX_TOOL_ROUNDS=3`, `_TOOLS` list (5 tools: search_treks/recommend_treks/compare_treks/ask_trek_question/create_trek_plan_lead), `_call_tool(db, name, inputs)` dispatcher, `get_or_create_session(db, session_key)`, `get_session_history(db, session)`, `_persist_messages(db, session, ...)`, `chat(db, session, user_message)` tool-calling loop.
- `routes/treksage.py` (new): `POST /api/v1/treksage/chat` + `GET /api/v1/treksage/chat/{session_key}/history`.
- `router.py`: `treksage_router` included.
- `lib/api.ts`: added `TreksageChatResponse`, `TreksageChatHistoryItem`, `treksageChat()`, `fetchTreksageChatHistory()`.
- Tests TC-B34–TC-B40: new session, tool-call dispatch, round-cap, history endpoint, 404 history, chat endpoint.

### Commit 7 — /treksage public chat page
- `apps/web-next/app/(public)/treksage/page.tsx` (new server component with metadata).
- `apps/web-next/app/(public)/treksage/TreksageChat.tsx` (new client component): session restore from `localStorage`/history endpoint on mount, 5 suggested prompts, user/assistant message bubbles, loading dots, "New chat" clears session.
- `apps/web-next/app/sitemap.ts`: added `/treksage` entry (`priority=0.8`, `changeFrequency=weekly`).
- `docs/URL_MAP.md`: added `/treksage` entry.

### Commit 8 — datacenter ?slug= JSON viewer + 308 redirect
- `apps/web-next/app/datacenter/page.tsx` (rewritten): `dynamic = "force-dynamic"`; with `?slug=` param, fetches `GET /api/v1/treks/{slug}/profile` and renders full `TrekProfile` JSON in `<pre>` block; without `?slug=`, renders trek list + slug input form.
- `apps/web-next/app/datacenter/trek-guide/[slug]/page.tsx` (rewritten): `permanentRedirect(\`/datacenter?slug=${params.slug}\`)`.
- `docs/URL_MAP.md`: updated datacenter entries — `?slug=` JSON viewer + 308 redirect from `/trek-guide/[slug]`.

### Commit 9 — Mobile parity (history for TrekAskAI)
- `apps/mobile/lib/mobileApi.ts`: added `MobileChatTurn` interface; updated `trekIntelligenceApi.ask()` to accept optional `history?: MobileChatTurn[]` and send in request body.
- `apps/mobile/components/trek/TrekAskAI.tsx`: updated `ask()` to build history from last 3 exchanges and send with request.
- `npx tsc --noEmit`: zero errors.

### Commit 10 — Docs, MD files, re-index, completion gate
- `docs/IMPLEMENTATION_PLAN.md`: Step 73 entry added.
- `docs/MASTER_TRACKER.md`: Step 73 row added with infra/user-action follow-ups.
- `docs/DEPENDENCY_MAP.md`: Step 73 blast radius section added.
- `docs/steps/STEP-73-treksage-bugfix-pass.md`: this file.
- `README.md`: Feature Matrix, Roadmap Status, Database Overview, Key API Surfaces updated.
- `npx gitnexus analyze --force`: re-indexed after new .py/.ts files.

---

## Files Created

| File | Purpose |
|------|---------|
| `services/api/app/modules/trek_intelligence/treksage_agent.py` | TrekSage conversational agent (Haiku + tool-calling) |
| `services/api/app/api/routes/treksage.py` | Chat + history endpoints |
| `services/api/alembic/versions/20260616_0044_step73_treksage_chat.py` | DB migration for chat session tables |
| `services/api/tests/test_treksage.py` | 7 tests for treksage routes (TC-B34–TC-B40) |
| `apps/web-next/app/(public)/treksage/page.tsx` | /treksage public page (server component) |
| `apps/web-next/app/(public)/treksage/TreksageChat.tsx` | Myra-style chat UI (client component) |

## Files Modified

| File | Change |
|------|--------|
| `services/api/app/modules/trek_intelligence/service.py` | `backfill_all_trek_meta`, `_SUMMARY_PROMPT_VERSION`, richer compare prompt, `_QA_SECTION_KEYWORDS`, `_matching_section_for_question`, `_strip_html`, `ask_trek_question` history+section-grounding, `_extract_content_sections`, `_extract_faqs`, `page_to_profile` |
| `services/api/app/modules/trek_intelligence/models.py` | `TreksageChatSession` + `TreksageChatMessage` ORM models |
| `services/api/app/schemas/trek_intelligence.py` | `ChatTurn`, `AskTrekQuestionRequest.history`, `BackfillAllTriggerResponse`, `TrekProfile.content_sections/faqs` |
| `services/api/app/worker/tasks/trek_intelligence_tasks.py` | `backfill_all_trek_meta_task` Celery task |
| `services/api/app/api/routes/admin_treks.py` | `POST /backfill-all` route (before `/{slug}/backfill`) |
| `services/api/app/api/routes/treks.py` | Thread `history` through to service |
| `services/api/app/api/router.py` | Register `treksage_router` |
| `services/api/app/mcp_server.py` | `_compact_profile` strips `content_sections`/`faqs` |
| `services/api/app/db/base.py` | Import new chat ORM models |
| `services/api/tests/test_trek_intelligence.py` | TC-B23–TC-B33 (11 new tests), `_hide_other_trek_guides`/`_restore_trek_guides` helpers |
| `apps/web-next/lib/api.ts` | `ChatTurn`, updated `askTrekQuestion`, `treksageChat`, `fetchTreksageChatHistory`, `triggerTrekBackfillAll`, `TrekProfile.content_sections/faqs` |
| `apps/web-next/components/trek/TrekAskAI.tsx` | History turn tracking + send |
| `apps/web-next/app/(admin)/admin/trek-data/page.tsx` | "Backfill All Treks" button |
| `apps/web-next/app/datacenter/page.tsx` | Rewritten as `?slug=` JSON viewer |
| `apps/web-next/app/datacenter/trek-guide/[slug]/page.tsx` | Rewritten as 308 `permanentRedirect` |
| `apps/web-next/app/sitemap.ts` | Added `/treksage` |
| `apps/mobile/lib/mobileApi.ts` | `MobileChatTurn`, `history` on `ask()` |
| `apps/mobile/components/trek/TrekAskAI.tsx` | Build + send history |
| `docs/URL_MAP.md` | `/treksage` entry, datacenter `?slug=` + 308 redirect entries |

---

## Test Coverage

### New Backend Tests — 18 added (TC-B23 to TC-B40)

Run: `PYTHONPATH=services/api .venv/bin/pytest services/api/tests/test_trek_intelligence.py services/api/tests/test_treksage.py -v`

| ID | Test | File |
|----|------|------|
| TC-B23 | `test_backfill_all_skips_fully_verified_treks` | test_trek_intelligence.py |
| TC-B24 | `test_backfill_all_processes_missing_fields` | test_trek_intelligence.py |
| TC-B25 | `test_backfill_all_never_overwrites_verified` | test_trek_intelligence.py |
| TC-B26 | `test_backfill_all_aggregates_failures` | test_trek_intelligence.py |
| TC-B27 | `test_compare_summary_cache_busted_by_version` | test_trek_intelligence.py |
| TC-B28 | `test_compare_summary_prompt_includes_new_fields` | test_trek_intelligence.py |
| TC-B29 | `test_ask_trek_question_grounds_in_cms_section` | test_trek_intelligence.py |
| TC-B30 | `test_ask_trek_question_history_bypasses_early_return` | test_trek_intelligence.py |
| TC-B31 | `test_ask_trek_question_cache_skipped_with_history` | test_trek_intelligence.py |
| TC-B32 | `test_page_to_profile_includes_content_sections` | test_trek_intelligence.py |
| TC-B33 | `test_compact_profile_excludes_content_sections` | test_trek_intelligence.py |
| TC-B34 | `test_treksage_new_session_created` | test_treksage.py |
| TC-B35 | `test_treksage_existing_session_returned` | test_treksage.py |
| TC-B36 | `test_treksage_chat_tool_dispatch` | test_treksage.py |
| TC-B37 | `test_treksage_chat_round_cap_enforced` | test_treksage.py |
| TC-B38 | `test_treksage_history_endpoint` | test_treksage.py |
| TC-B39 | `test_treksage_history_endpoint_404` | test_treksage.py |
| TC-B40 | `test_treksage_chat_endpoint` | test_treksage.py |

**Suite totals: 683/685 pass. 2 pre-existing failures in `test_refresh.py` (`test_stale_pages_includes_null_last_refreshed`, `test_stale_page_response_shape`) — confirmed pre-existing before any Step 73 edits.**

---

## New Environment Variables

No new environment variables added in this step. All LLM calls use existing `ANTHROPIC_API_KEY` from `core/config.py`.

---

## New DB Tables

| Table | Purpose |
|-------|---------|
| `treksage_chat_sessions` | Persistent anonymous/user chat sessions (keyed by `session_key`) |
| `treksage_chat_messages` | Per-turn message transcript + tool calls JSON for each session |

Migration: `20260616_0044_step73_treksage_chat.py`

---

## Manual / Infra Follow-ups (user-performed)

1. **Run `alembic upgrade head`** — creates `treksage_chat_sessions` + `treksage_chat_messages` tables.
2. **Restart Celery worker** — so the new `trek_intelligence.backfill_all_trek_meta` task is registered.
3. **Click "Backfill All Treks"** in `/admin/trek-data` — triggers bulk backfill across all 51 trek guides; fixes #1/#5/#6 in production. This is the core data fix — nothing in production looks correct until this runs.
4. **Wait ~10 min** for all 51 Haiku calls to complete (worker logs will show progress).
5. After backfill completes, clear the compare summary cache by hitting any 2-trek compare once — the `_SUMMARY_PROMPT_VERSION = "v2"` key ensures new summaries use the richer prompt.

---

## Notes

- **`_QA_SECTION_KEYWORDS` path fix**: the CMS stores section HTML at `content_json["sections"]["packing"]`, NOT at `content_json["packing"]`. `get_trek_content(db, slug, section)` was looking at the wrong path. Fixed by accessing `page.content_json` directly: `content_json.get("sections", {}).get(section_key)`.
- **`_hide_other_trek_guides` test helper**: the 51 production-seeded trek_guide pages in the local dev DB caused `test_backfill_all_processes_missing_fields` to assert `call_count == 1` but actually call 51 times. Fixed by temporarily setting other pages to `status="draft"` before the test and restoring after.
- **Cost note**: `/treksage` chat agent is a live Haiku call per turn (up to 3 tool-call round-trips), unlike the cached Q&A and compare summary from Step 72. This is inherent to a conversational assistant — flagged as an informed cost tradeoff.
- **Pre-existing `test_refresh.py` failures**: these 2 tests failed before Step 73 began (confirmed in baseline run). They are not regressions and should be investigated as a separate issue.

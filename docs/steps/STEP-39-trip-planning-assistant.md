# STEP 39 — Trip Planning Assistant

## Goal
Build an AI-backed conversational trip planning interface: wire the `/plan` page (currently a static stub) to a real backend, add an itinerary builder from the content graph, a custom route suggestion engine, and a "which trek for me" wizard. The output is a structured trip plan delivered to the user (optionally emailed) and captured as a lead.

## Scope

### Backend: trip plan generation
- `TripPlannerAgent` (LangGraph): 4-node graph
  - `gather_constraints` — parse user inputs: region, duration, experience, budget, month, solo/group
  - `select_treks` — query cms_pages + keyword_clusters for matching treks (page_type=trek_guide); rank by constraint fit
  - `build_itinerary` — for the selected trek(s), generate a day-by-day itinerary using page content + content_json
  - `package_response` — format as structured JSON: `{trek_slug, trek_title, itinerary: [{day, title, activities, notes}], cost_estimate, gear_essentials, permit_note, operator_suggestion}`
- `trip_plans` table: id UUID PK, session_id, user_id FK→users SET NULL, inputs JSON, output JSON, trek_slug, created_at
- Alembic migration for `trip_plans`
- `POST /api/v1/plan/generate` — auth optional; accepts `{region, duration_days, experience, month, budget_inr, group_size}`; runs TripPlannerAgent; returns structured plan; stores in trip_plans
- `GET /api/v1/plan/{id}` — retrieve a saved plan (auth optional, session-scoped)
- `POST /api/v1/plan/{id}/email` — send plan to user email (SMTP, graceful if unconfigured)

### "Which trek for me" wizard
- 4-step form: (1) experience level, (2) duration + budget, (3) preferred region / season, (4) group type
- On submission: `POST /plan/generate`; display structured plan output
- Progress bar UI; mobile-responsive step-by-step layout
- Result cards: trek match with difficulty badge, cost range, best month, "View full guide →" link, "Save plan" action

### Itinerary builder
- Day-by-day itinerary rendered from `output.itinerary` array
- Expandable day cards: activities list, altitude gain note, overnight location
- "Download as PDF" — client-side `window.print()` with a print-optimised CSS class (no server PDF generation required)
- "Email me this plan" button — `POST /plan/{id}/email`

### Trek comparison from plan
- If the agent returns 2+ matching treks, render a side-by-side comparison strip before the itinerary (duration, difficulty, cost, season)

### Lead capture integration
- After plan generation, show "Want help booking? Talk to a vetted operator" → pre-fills `POST /api/v1/inquiries` with the trek_slug and plan_id
- Plan generation itself creates a `lead_submission` record (source: `trip_planner`) regardless of whether the user clicks through

### Frontend
- `/plan` — rewrite the static stub as a client component multi-step wizard
- `components/plan/WizardStep.tsx` — individual step wrapper with progress bar
- `components/plan/TrekPlanCard.tsx` — structured plan result card
- `components/plan/ItineraryDay.tsx` — expandable day card

## Preconditions
- Read docs/MASTER_TRACKER.md, PROCESS_GUARDRAILS.md, DEPENDENCY_MAP.md
- Confirm Step 12 complete (LangGraph agent framework)
- Confirm Step 16 complete (cms_pages with content_json)
- Confirm Step 29 complete (operators for suggestion)
- Confirm Step 38 complete (operator inquiry flow for lead capture)

## Dependency Check
- `services/api/app/modules/agents/` — new TripPlannerAgent directory
- `services/api/app/modules/leads/service.py` — `create_lead` (reuse for planner lead capture)
- `services/api/app/modules/cms/service.py` — page search by page_type + cluster
- `apps/web-next/app/(public)/plan/page.tsx` — full rewrite from static stub
- `apps/web-next/lib/api.ts` — add generatePlan, fetchPlan, emailPlan helpers

## Planned Files to Create
- `services/api/alembic/versions/YYYYMMDD_0028_trip_plans.py`
- `services/api/app/modules/agents/trip_planner/__init__.py`
- `services/api/app/modules/agents/trip_planner/agent.py`
- `services/api/app/modules/plan/__init__.py`
- `services/api/app/modules/plan/models.py`
- `services/api/app/modules/plan/service.py`
- `services/api/app/schemas/plan.py`
- `services/api/app/api/routes/plan.py`
- `services/api/tests/test_plan.py`
- `apps/web-next/components/plan/WizardStep.tsx`
- `apps/web-next/components/plan/TrekPlanCard.tsx`
- `apps/web-next/components/plan/ItineraryDay.tsx`

## Planned Files to Modify
- `services/api/app/db/base.py` — TripPlan registered
- `services/api/app/api/router.py` — plan_router registered
- `apps/web-next/app/(public)/plan/page.tsx` — full rewrite
- `apps/web-next/lib/api.ts` — TripPlan interface + generatePlan, fetchPlan, emailPlan helpers

## Files Created
- `services/api/alembic/versions/20260506_0029_trip_plans.py` (note: 0029, not 0028 — 0028 used by operator_marketplace)
- `services/api/app/modules/plan/__init__.py`
- `services/api/app/modules/plan/models.py`
- `services/api/app/modules/plan/service.py`
- `services/api/app/modules/agents/trip_planner/__init__.py`
- `services/api/app/modules/agents/trip_planner/agent.py`
- `services/api/app/schemas/plan.py`
- `services/api/app/api/routes/plan.py`
- `services/api/tests/test_plan.py`
- `apps/web-next/components/plan/WizardStep.tsx`
- `apps/web-next/components/plan/TrekPlanCard.tsx`
- `apps/web-next/components/plan/ItineraryDay.tsx`

## Files Modified
- `services/api/app/db/base.py` — TripPlan registered
- `services/api/app/api/router.py` — plan_router registered
- `apps/web-next/app/(public)/plan/page.tsx` — full rewrite from static stub to 4-step wizard + TrekPlanCard result
- `apps/web-next/lib/api.ts` — ItineraryDay, TripPlanOutput, TripPlan, PlanGeneratePayload interfaces; generatePlan, fetchPlan, emailPlan helpers

## Status
Done

## Notes
- Migration is 0029 (not 0028 as originally planned — 0028 was used by operator_marketplace in Step 38)
- TripPlannerAgent passes DB session through LangGraph state for CMS page queries in `select_treks` node
- Trek scoring: region match in slug (+3) or title (+2); difficulty match (+2); season/month match (+1–2); top-5 candidates kept; highest scorer selected
- LLM max_tokens=3000 to avoid itinerary truncation; markdown fence stripping applied before JSON parse
- Gear list parsed from CMS packing section bullet points (lines starting with -, •, *); falls back to 5 hardcoded essentials
- Lead capture (cta_type=trip_planner) fires only when email is provided — creates LeadSubmission directly without triggering auto-routing or email tagging side effects
- PDF download: window.print() with `print:hidden` Tailwind class on non-print elements
- Pre-existing test failure: test_stale_pages_includes_past_interval in test_refresh.py — unrelated to this step; to be fixed in separate commit

## Notes
- TripPlannerAgent max_tokens: 3000 — itinerary output can be long; set high enough to avoid truncation
- Agent is entirely optional-auth: anonymous users get plans stored by session_id only; logged-in users get plans linked to user_id and visible in account dashboard
- PDF download: use `window.print()` with `@media print` CSS — no server-side PDF library needed at this stage
- "Which trek for me" wizard and the full planning form are the same flow — the wizard is just a stepped UX over the same `POST /plan/generate` endpoint
- Do not build a full trip-booking or payment flow in this step — that is Step 40 (premium) territory
- Plan email uses same SMTP graceful-skip pattern: wrap in try/except, never block the response

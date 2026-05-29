# STEP-67 — CDP Analytics Full Revamp

**Status:** In Progress
**Date Started:** 2026-05-29
**Branch:** main

---

## Scope

Full revamp of the TrekYatra CDP analytics layer (built in Steps 64–65) to reach
CleverTap/MoEngage-grade depth. The current implementation covers basic event ingest,
sessions, identity stitching, funnels, cohorts, and segments. This step expands across
five phases as detailed in the product requirements document.

The revamp covers:
1. **Event Taxonomy Governance** — standardised event dictionary, property schema, test/prod separation
2. **Executive Dashboard** — KPI tiles with deltas + sparklines, real-time feed, alert rail
3. **User 360 Profile** — full timeline, trait attribution, session replay metadata
4. **Event Explorer** — filterable event table, property drill-down, export CSV
5. **Saved Funnel Templates** — 6 pre-built funnel presets for the TrekYatra use case
6. **Configurable Cohort Builder** — custom cohort conditions beyond the current N×M weekly retention
7. **Dynamic Segment Builder UI** — rule builder replacing the static 10-segment list
8. **GSC Intelligence Panel** — deeper GSC data: query clusters, CTR decay, cannibalization flags
9. **Content & Trek Analytics** — per-page view counts, engagement scores, revenue attribution per trek
10. **Engagement Readiness** — segment export hooks, campaign trigger API, suppression rules
11. **AI Insight Cards** — rule-based and LLM-generated insight cards surfaced in the dashboard

---

## Phase Structure

| Phase | Label | Priority | Scope |
|-------|-------|----------|-------|
| 0 | Event Taxonomy | Critical (must-do first) | Dictionary, property validation, test/prod |
| 1 | Core Dashboard + User 360 | MVP | Executive KPIs, User 360, Event Explorer |
| 2 | Advanced Funnels + Cohorts | High | Saved templates, configurable cohorts, segment builder |
| 3 | Content Intelligence | High | Per-page analytics, GSC depth, trek analytics |
| 4 | Engagement Readiness | Medium | Export, campaign hooks, suppression |
| 5 | AI Insights | Low (later) | Insight cards, anomaly detection |

---

## Phase 0 — Event Taxonomy Governance

### 0.1 Event Dictionary Table (`event_definitions`)

New DB table storing the canonical event schema. This is the source of truth for all
analytics events — both for frontend SDK validation and backend catalog queries.

```sql
CREATE TABLE event_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name VARCHAR(120) NOT NULL UNIQUE,
    event_category VARCHAR(60) NOT NULL,  -- navigation | engagement | conversion | system
    description TEXT,
    properties JSONB,          -- JSON schema of expected properties
    is_active BOOLEAN DEFAULT TRUE,
    is_test_only BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

Seed the table with all events currently fired by `lib/analytics.ts`:

| event_name | category | description |
|-----------|----------|-------------|
| `page_view` | navigation | Every page render |
| `trek_view` | engagement | Trek detail page viewed |
| `trek_search` | engagement | Search query executed |
| `trek_saved` | engagement | Trek bookmarked |
| `trek_compared` | engagement | Trek added to compare |
| `trek_shared` | engagement | Trek share button clicked |
| `trek_plan_cta_clicked` | conversion | Plan My Trek button clicked (hero / sidebar / mobile) |
| `plan_wizard_started` | conversion | Plan wizard step 0 reached |
| `plan_wizard_step_1` | conversion | Wizard step 1 (intent) completed |
| `plan_wizard_step_2` | conversion | Wizard step 2 (month) completed |
| `plan_wizard_step_3` | conversion | Wizard step 3 (duration) completed |
| `plan_wizard_step_4` | conversion | Wizard step 4 (experience/fitness) completed |
| `plan_wizard_step_5` | conversion | Wizard step 5 (region) completed |
| `plan_wizard_completed` | conversion | Wizard submitted, plan generated |
| `lead_submitted` | conversion | Lead / enquiry form submitted |
| `newsletter_subscribed` | conversion | Newsletter form submitted |
| `operator_inquiry_sent` | conversion | Operator inquiry form submitted |
| `affiliate_click` | conversion | Affiliate gear link clicked |
| `user_signed_up` | system | New user registration |
| `user_logged_in` | system | Existing user login |
| `user_logged_out` | system | Logout |
| `content_scroll_25` | engagement | 25% scroll depth on article |
| `content_scroll_50` | engagement | 50% scroll depth on article |
| `content_scroll_75` | engagement | 75% scroll depth on article |
| `content_scroll_100` | engagement | 100% scroll depth on article |
| `faq_expanded` | engagement | FAQ accordion item opened |
| `season_tab_changed` | engagement | Seasonal section tab clicked |
| `difficulty_tab_changed` | engagement | Difficulty section tab clicked |
| `compare_view` | engagement | Compare page viewed with treks |
| `packing_checklist_viewed` | engagement | Trek packing page viewed |
| `permit_guide_viewed` | engagement | Trek permit page viewed |
| `cost_guide_viewed` | engagement | Trek cost page viewed |
| `search_result_clicked` | engagement | Search result link clicked |
| `recommendation_clicked` | engagement | Personalised feed card clicked |

### 0.2 Event Property Schema (stored in `properties` JSONB column)

Each event's expected properties defined as a light schema:
```json
{
  "trek_view": {
    "trek_slug": "string (required)",
    "trek_name": "string",
    "region": "string",
    "difficulty": "string",
    "has_cms_page": "boolean"
  },
  "plan_wizard_step_1": {
    "step": "integer",
    "intents": "string[]"
  }
}
```
These schemas are informational (not hard-validated server-side in this step), but used
in the Event Explorer UI to display property labels in a human-readable format.

### 0.3 Test / Production Traffic Separation

The CDP currently has no way to distinguish test traffic (developers, internal team)
from real user traffic. Add:

**Backend:** `is_internal` flag on `analytics_events`:
```sql
ALTER TABLE analytics_events ADD COLUMN is_internal BOOLEAN DEFAULT FALSE;
```
Derived automatically: if `anonymous_id` is in the `internal_ids` array in Settings,
OR if the request origin is `localhost`, mark `is_internal = TRUE`.

**Config (`settings.py`):**
```python
INTERNAL_ANONYMOUS_IDS: list[str] = Field(default_factory=list)  # comma-sep in env
```

**Frontend SDK (`analytics.ts`):**
Add `is_internal: boolean` flag to the event payload sent to `/analytics/event`:
```typescript
const IS_INTERNAL = process.env.NEXT_PUBLIC_IS_INTERNAL === "true" ||
                    typeof window !== "undefined" && window.location.hostname === "localhost";
```
Pass `is_internal: IS_INTERNAL` in the event body.

**Admin filtering:** All CDP admin pages gain a `?exclude_internal=true` (default true)
toggle in the header to allow developers to view their own test events when debugging.

### 0.4 New Alembic Migration

File: `services/api/alembic/versions/YYYYMMDD_0041_cdp_event_definitions_and_internal_flag.py`

```python
# Upgrades:
# 1. CREATE TABLE event_definitions (...)
# 2. ALTER TABLE analytics_events ADD COLUMN is_internal BOOLEAN DEFAULT FALSE
# 3. Seed event_definitions with 35 events above
# 4. CREATE INDEX idx_analytics_events_is_internal ON analytics_events(is_internal)
```

---

## Phase 1 — Executive Dashboard + User 360 + Event Explorer

### 1.1 Executive Dashboard (`/admin/cdp`)

Replace the current basic stats page with a CleverTap-grade executive dashboard.

**KPI Tiles (top row — 8 tiles)**

| KPI | Metric | Delta | Sparkline |
|-----|--------|-------|-----------|
| Daily Active Users | COUNT DISTINCT anonymous_id (last 24h) | vs yesterday | 7-day line |
| Weekly Active Users | COUNT DISTINCT anonymous_id (last 7d) | vs prev 7d | 4-week line |
| Monthly Active Users | COUNT DISTINCT anonymous_id (last 30d) | vs prev 30d | 12-week line |
| Sessions (7d) | COUNT analytics_sessions (last 7d) | vs prev 7d | 7-day line |
| Avg Session Duration | AVG EXTRACT(EPOCH FROM (ended_at - started_at)) | vs prev 7d | 7-day line |
| Total Leads (30d) | COUNT lead_submissions (last 30d) | vs prev 30d | 30-day line |
| Plan Completions (30d) | COUNT analytics_events WHERE event_name='plan_wizard_completed' (30d) | vs prev 30d | 30-day line |
| Scroll Depth 50%+ | COUNT events WHERE event_name='content_scroll_50' (7d) | vs prev 7d | 7-day line |

**Delta colour rule:**
- `> 0` → `text-pine` (green) + ▲ up arrow
- `< 0` → `text-red-400` + ▼ down arrow
- `= 0` → `text-white/40` + → flat arrow

**Sparkline:** 7-point line chart rendered in pure SVG (no chart library dependency).
Path computed from data array → normalized 0–1 → scaled to `width=120 height=40` viewBox.

**Real-time event feed (right sidebar)**
- Last 50 events from `analytics_events` ordered by `created_at DESC`
- Auto-refreshes every 10 seconds (polling, no WebSocket)
- Each row: `[timestamp] [category badge] event_name · page_url`
- Category colour: navigation=blue, engagement=accent, conversion=pine, system=purple

**Alert Rail (below KPIs)**
Inline dismissible alert cards for predefined conditions:
- "Plan completion rate dropped >20% vs last week" → auto-computed
- "0 events in last 2 hours" → detect data pipeline gap
- "New user spike: >50% day-on-day growth" → alert for investigation
Backend: `GET /admin/cdp/alerts` — computes and returns active alert list (max 5).

### 1.2 User 360 Profile (`/admin/cdp/users/[id]`)

Replace the current minimal user profile page with a full timeline.

**Profile card:**
- Name, email, `user_id` (copyable), `anonymous_id` (copyable)
- Signed up at, last seen, total events, total sessions, subscription plan
- Trait badges: top regions (from `user_traits`), difficulty preference, content types consumed
- Source attribution: first touch UTM source/medium/campaign (from `attribution_touchpoints`)

**Activity Timeline:**
- Chronological list of ALL events for this user (paginated 50/page)
- Each event: timestamp, category badge, event_name, properties (expandable JSON block)
- Filter bar: category filter (all / navigation / engagement / conversion / system), date range
- Empty state per filter with "No events matching this filter"

**Session List:**
- All sessions for user: start/end time, duration, device type, page count, UTM source
- Expandable: events within that session

**Funnel Progress:**
- Show which predefined funnels (Phase 2) the user has entered/completed
- E.g., "Plan Wizard Funnel: Entered → Completed step 2 → Dropped off"

### 1.3 Event Explorer (`/admin/cdp/events`)

A searchable, filterable table of all ingested events with property drill-down.

**Controls:**
- Date range picker (from / to)
- Category filter (multi-select checkboxes)
- Event name filter (dropdown from `/admin/cdp/events/catalog`)
- `anonymous_id` / `user_id` free-text search
- Page URL filter (contains)
- Exclude internal events toggle (default: on)

**Table columns:**
`Timestamp | Category | Event Name | User/Session | Page URL | Properties`

Properties column: shows top 2–3 key-value pairs inline; full JSON in expandable row.

**Export:** `GET /admin/cdp/events/export?format=csv` — streaming CSV download
(all matching events, max 10,000 rows).

**Backend endpoints:**
```
GET /admin/cdp/events              → paginated event list (filters: category, event_name, user_id, 
                                     anonymous_id, page_url, date_from, date_to, exclude_internal, page, page_size)
GET /admin/cdp/events/export       → CSV download (same filters, limit 10k)
GET /admin/cdp/alerts              → computed alert list
GET /admin/cdp/kpis                → 8 KPI tiles with deltas + sparkline data
GET /admin/cdp/realtime-feed       → last 50 events
```

---

## Phase 2 — Advanced Funnels + Cohorts + Segment Builder

### 2.1 Saved Funnel Templates

Add 6 TrekYatra-specific pre-built funnel templates to the existing Dynamic Funnel Builder.
Templates are stored in a new `funnel_templates` table OR as seed data in config.

| # | Template Name | Steps |
|---|---------------|-------|
| 1 | Discovery → Plan | `page_view` → `trek_view` → `trek_plan_cta_clicked` → `plan_wizard_completed` |
| 2 | Search → Trek View | `trek_search` → `search_result_clicked` → `trek_view` |
| 3 | Trek View → Save | `trek_view` → `trek_saved` |
| 4 | Trek View → Lead | `trek_view` → `trek_plan_cta_clicked` → `lead_submitted` |
| 5 | New User Activation | `user_signed_up` → `trek_view` → `trek_saved` |
| 6 | Content Engagement | `page_view` → `content_scroll_50` → `content_scroll_100` → `recommendation_clicked` |

**UI:** The funnel builder page gains a "Templates" section at the top — 6 cards with
template name and step count. Clicking "Use template" pre-populates the builder steps.
Users can still modify the template before running.

**Backend:** Seed templates as a constant array in `cdp/service.py`; expose via
`GET /admin/cdp/funnels/templates` returning the list of presets (no DB table needed).

### 2.2 Configurable Cohort Builder

The current cohort page shows a fixed N×M weekly retention heatmap (by first session week).
Expand to support configurable cohort types:

| Cohort Type | Split-by event | Retention event |
|-------------|---------------|----------------|
| New User Retention | `user_signed_up` | Any event (DAU activity) |
| Trek View Retention | `trek_view` (first) | `trek_view` (subsequent) |
| Plan Starter Retention | `plan_wizard_started` | `plan_wizard_completed` |
| Search Retention | `trek_search` | `trek_search` |

**UI:** Cohort page gains a "Cohort type" dropdown + "Retention event" dropdown.
Changing these re-runs the heatmap query via `POST /admin/cdp/cohorts/custom`.

**Backend:** New endpoint `POST /admin/cdp/cohorts/custom` accepts:
```json
{
  "cohort_event": "user_signed_up",
  "retention_event": null,   // null = any activity
  "date_from": "2026-01-01",
  "date_to": "2026-05-01",
  "max_weeks": 9
}
```
Generates the same N×M heatmap structure as the existing cohort endpoint but driven by
the specified events instead of session start.

### 2.3 Dynamic Segment Builder UI

Replace the static 10-segment list with a rule builder that lets admins create custom segments.

**Segment Rule Model:**
```
Segment = {
  name: string,
  description: string,
  conditions: Condition[]   // AND of all conditions
}

Condition = {
  type: "event_count" | "event_property" | "trait" | "inactivity",
  event_name?: string,
  property_key?: string,
  property_value?: string,
  operator: "gte" | "lte" | "eq" | "contains",
  value: string | number,
  time_window_days?: number
}
```

**Supported condition types:**

| Type | Example | SQL translation |
|------|---------|-----------------|
| `event_count` | "Did trek_view ≥ 3 times in last 30 days" | `COUNT(events) >= 3` |
| `event_property` | "trek_view where difficulty = Moderate" | `event_name='trek_view' AND properties->>'difficulty'='Moderate'` |
| `trait` | "User trait: top_region contains Uttarakhand" | `user_traits.trait_value contains 'Uttarakhand'` |
| `inactivity` | "No event in last 14 days" | `MAX(created_at) < NOW() - 14d` |

**UI Layout:**
```
[Segment name input] [Description input]
Conditions:
  [+ Add condition]
    Condition 1: [Event Count ▼] [trek_view ▼] at least [3] times in last [30] days  [×]
    Condition 2: [Trait ▼] [top_region ▼] contains [Uttarakhand]  [×]
[Preview count — live] "Estimated ~142 users"
[Save Segment] [Run & Preview]
```

**Preview:** `POST /admin/cdp/segments/preview` — evaluates conditions, returns user count.
**Save:** `POST /admin/cdp/segments` — persists to `custom_segments` table (new).
**New table:**
```sql
CREATE TABLE custom_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    description TEXT,
    conditions JSONB NOT NULL,
    user_count INTEGER DEFAULT 0,
    last_computed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

The existing static 10 segments remain in the system (they are preserved as "Default segments"),
and the new builder creates "Custom segments". The segments page shows both groups.

---

## Phase 3 — Content Intelligence

### 3.1 Per-Page Analytics

New admin page `/admin/cdp/content` — analytics for every published CMS page.

**Table columns:**
`Page Title | Slug | Type | Views (7d) | Views (30d) | Scroll 50%+ | Scroll 100% | Avg Time | Leads | CMS Published`

Data sourced from `analytics_events` joined to `cms_pages` via `page_url` matching.

**Computed metrics per page:**
- `views_7d` = COUNT events WHERE event_name='page_view' AND page_url LIKE '%/[slug]%' (7d)
- `views_30d` = same for 30d
- `scroll_50_rate` = COUNT(scroll_50 events) / COUNT(page_view events) for that slug
- `scroll_100_rate` = same for scroll_100
- `avg_time_on_page` = not available from current events (requires JS timer event — deferred to Phase 5)
- `leads` = COUNT events WHERE event_name='lead_submitted' AND page_url contains slug

**Sort:** Default by `views_30d DESC`.

**Backend:** `GET /admin/cdp/content/pages` with optional `?sort_by=views_7d&page_type=trek_guide`.

### 3.2 Trek Analytics (`/admin/cdp/content/treks`)

Specific to trek pages — shows trek-level funnel performance:

| Trek | Views | Plan CTAs Clicked | Plan Completions | Save Rate | Conversion Rate |
|------|-------|------------------|--------------------|-----------|-----------------|

Conversion rate = `plan_wizard_completed / trek_view` for that trek slug.

Sorted by conversion rate to show which treks drive the most planning intent.

### 3.3 GSC Intelligence Panel (enhanced `/admin/cdp/gsc`)

Replace the current basic GSC table with:
- **Query clusters** — group similar queries (e.g., all "kedarkantha" queries) using substring matching
- **CTR decay detection** — queries where CTR has dropped >15% week-on-week flagged in amber
- **Position opportunity list** — queries ranked 4–10 (just off page 1) with highest impressions
- **Cannibalization flags** — if 2+ pages compete for the same query (detected by position variance)

Backend adds CTR delta computation to the existing `gsc_performance` table query.

---

## Phase 4 — Engagement Readiness

### 4.1 Segment Export

`GET /admin/cdp/segments/{id}/export?format=csv`
Returns: `user_id, email, anonymous_id, event_count, last_seen, top_region, top_difficulty`

For use with external email tools (Mailchimp, Brevo) or CRM imports.

### 4.2 Campaign Trigger Hooks

New webhook registry for CDP events. When a tracked event matches a rule, fire an outbound
HTTP webhook to a configured URL.

```sql
CREATE TABLE cdp_webhook_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120),
    trigger_event VARCHAR(120),     -- event_name that fires the hook
    condition JSONB,                -- optional property filter
    webhook_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

The CDP event logging service checks active webhook rules after each event is persisted
and dispatches background Celery tasks for matching rules.

`POST /admin/cdp/webhooks` — create rule
`GET  /admin/cdp/webhooks` — list rules
`DELETE /admin/cdp/webhooks/{id}` — delete rule

### 4.3 Suppression Rules

Users who have explicitly opted out (e.g., unsubscribed from email) are marked with a
`suppressed: true` trait. The segment export automatically excludes suppressed users.

Suppression set via `POST /auth/me/suppression` — user-facing endpoint.
Admin override: `GET /admin/cdp/suppressions` — list suppressed users.

---

## Phase 5 — AI Insight Cards (Deferred)

AI-generated insight cards surfaced in the executive dashboard footer.

Examples:
- "Trek views are up 23% this week — Kedarkantha and Hampta Pass are driving the spike."
- "3 users started the plan wizard yesterday but dropped at step 3 (Duration). Review that step's UX."
- "Your Sunday traffic is 40% lower than weekday average — consider scheduling content pushes on weekdays."

**Implementation (Phase 5):**
- `InsightGenerationAgent` — LangGraph 2-node: gather_kpis → generate_insights
- Runs daily via Celery Beat
- `cdp_insights` table stores generated insight cards (text + severity + expires_at)
- `GET /admin/cdp/insights` returns active, non-expired cards

---

## New Files to Create

| File | Purpose |
|------|---------|
| `services/api/alembic/versions/YYYYMMDD_0041_cdp_phase0.py` | Migrations: event_definitions table, is_internal column, custom_segments table, cdp_webhook_rules table |
| `services/api/app/modules/cdp/models.py` (existing — modify) | Add EventDefinition, CustomSegment, CdpWebhookRule ORM models |
| `services/api/app/schemas/cdp.py` (existing — extend) | New Pydantic schemas for all new endpoints |
| `services/api/app/modules/cdp/service.py` (existing — extend) | New service functions per phase |
| `services/api/app/api/routes/cdp.py` (existing — extend) | New endpoints per phase |
| `services/api/app/modules/cdp/webhook_worker.py` | Celery task: dispatch_cdp_webhook |
| `apps/web-next/app/(admin)/admin/cdp/page.tsx` | Executive dashboard (full rewrite) |
| `apps/web-next/app/(admin)/admin/cdp/events/page.tsx` | Event Explorer (new page) |
| `apps/web-next/app/(admin)/admin/cdp/content/page.tsx` | Content analytics overview (new) |
| `apps/web-next/app/(admin)/admin/cdp/content/treks/page.tsx` | Trek analytics table (new) |
| `apps/web-next/app/(admin)/admin/cdp/segments/builder/page.tsx` | Dynamic segment builder (new) |
| `apps/web-next/app/(admin)/admin/cdp/webhooks/page.tsx` | Webhook rules CRUD (new) |
| `apps/web-next/lib/analytics.ts` (existing — extend) | Add `is_internal` flag + 15 new trackEvent calls |
| `services/api/tests/test_cdp_step67.py` | All new backend tests |
| `docs/steps/STEP-67-cdp-analytics-revamp.md` | This file |

---

## Files to Modify

| File | Change |
|------|--------|
| `services/api/app/modules/cdp/models.py` | Add EventDefinition, CustomSegment, CdpWebhookRule models |
| `services/api/app/schemas/cdp.py` | ~20 new Pydantic schemas |
| `services/api/app/modules/cdp/service.py` | ~15 new/replaced service functions |
| `services/api/app/api/routes/cdp.py` | ~12 new endpoints |
| `services/api/app/core/config.py` | `INTERNAL_ANONYMOUS_IDS` setting |
| `services/api/.env.example` | `INTERNAL_ANONYMOUS_IDS=` (empty default) |
| `apps/web-next/app/(admin)/admin/cdp/funnels/page.tsx` | Add Templates section |
| `apps/web-next/app/(admin)/admin/cdp/cohorts/page.tsx` | Cohort type dropdown |
| `apps/web-next/app/(admin)/admin/cdp/segments/page.tsx` | Show custom + default segments |
| `apps/web-next/app/(admin)/admin/cdp/gsc/page.tsx` | Enhanced GSC panel |
| `apps/web-next/app/(admin)/admin/layout.tsx` | Add Events, Content, Content/Treks, Webhooks nav links |
| `apps/web-next/lib/analytics.ts` | `is_internal` flag + new events |
| `docs/MASTER_TRACKER.md` | Step 67 row |
| `docs/DEPENDENCY_MAP.md` | New files and blast radius |
| `docs/IMPLEMENTATION_PLAN.md` | Step 67 marked Done |
| `docs/URL_MAP.md` | New admin URLs |
| `README.md` | Feature matrix, test count, API surfaces |

---

## New Admin URLs

| URL | Page |
|-----|------|
| `/admin/cdp` | Executive dashboard (revamped) |
| `/admin/cdp/events` | Event Explorer with filters + export |
| `/admin/cdp/content` | Per-page content analytics |
| `/admin/cdp/content/treks` | Trek-level funnel analytics |
| `/admin/cdp/segments/builder` | Dynamic segment builder |
| `/admin/cdp/webhooks` | Campaign trigger webhook rules |

---

## New Backend Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/admin/cdp/kpis` | 8 KPI tiles + deltas + sparklines |
| `GET` | `/admin/cdp/realtime-feed` | Last 50 events |
| `GET` | `/admin/cdp/alerts` | Active alert cards |
| `GET` | `/admin/cdp/events` | Paginated event list with filters |
| `GET` | `/admin/cdp/events/export` | CSV export (max 10k rows) |
| `GET` | `/admin/cdp/funnels/templates` | 6 pre-built funnel templates |
| `POST` | `/admin/cdp/cohorts/custom` | Custom cohort heatmap by event |
| `GET` | `/admin/cdp/segments/custom` | List custom segments |
| `POST` | `/admin/cdp/segments/custom` | Create custom segment |
| `POST` | `/admin/cdp/segments/preview` | Estimate user count for rule set |
| `GET` | `/admin/cdp/segments/{id}/export` | Export segment as CSV |
| `GET` | `/admin/cdp/content/pages` | Per-page analytics |
| `GET` | `/admin/cdp/content/treks` | Trek funnel analytics |
| `GET` | `/admin/cdp/webhooks` | List webhook rules |
| `POST` | `/admin/cdp/webhooks` | Create webhook rule |
| `DELETE` | `/admin/cdp/webhooks/{id}` | Delete webhook rule |

---

## New Frontend Events to Wire

These `trackEvent` calls must be added to the frontend in this step:

| Event | Where to add |
|-------|-------------|
| `trek_plan_cta_clicked` | Trek detail sidebar `<Link href="/plan">` onClick — `TrekCTAs.tsx` already has Plan button; add track call |
| `trek_saved` | `TrekCTAs.tsx` `handleSave()` after successful bookmark |
| `trek_compared` | `TrekCTAs.tsx` Compare button onClick |
| `trek_shared` | `TrekCTAs.tsx` `handleShare()` |
| `faq_expanded` | `FAQAccordion.tsx` — on accordion item open |
| `season_tab_changed` | `SeasonalTreksSection.tsx` — on tab click |
| `difficulty_tab_changed` | `DifficultyTabsSection.tsx` — on tab click |
| `search_result_clicked` | `/search/page.tsx` — on result link click |
| `recommendation_clicked` | `PersonalisedFeed.tsx` — `FeedCard` onClick |
| `compare_view` | `/compare/page.tsx` — on page mount with treks |
| `packing_checklist_viewed` | `trek/[slug]/packing/page.tsx` — page mount |
| `permit_guide_viewed` | `trek/[slug]/permits/page.tsx` — page mount |
| `cost_guide_viewed` | `trek/[slug]/costs/page.tsx` — page mount |

---

## DB Migrations

Alembic version: `YYYYMMDD_0041_cdp_phase0.py`

```python
# Operations:
op.create_table("event_definitions", ...)
op.add_column("analytics_events", sa.Column("is_internal", sa.Boolean, default=False))
op.create_index("idx_analytics_events_is_internal", "analytics_events", ["is_internal"])
op.create_table("custom_segments", ...)
op.create_table("cdp_webhook_rules", ...)
# Seed event_definitions with 35 base events
```

---

## Implementation Order (Per CLAUDE.md Step 2)

1. **DB migration** — `0041_cdp_phase0` (event_definitions, is_internal, custom_segments, webhook_rules)
2. **Backend models** — EventDefinition, CustomSegment, CdpWebhookRule in `models.py`
3. **Backend schemas** — all new Pydantic models in `schemas/cdp.py`
4. **Backend service** — Phase 0→3 service functions (Phase 4 webhook worker as separate Celery task)
5. **Backend routes** — all new endpoints in `routes/cdp.py`
6. **Backend tests** — `test_cdp_step67.py` (minimum 20 new tests)
7. **Backend build validation** — full suite passes
8. **Frontend analytics.ts** — `is_internal` flag + 13 new trackEvent wires
9. **Frontend admin pages** — executive dashboard, event explorer, content pages, segment builder, webhooks
10. **Frontend build validation** — `next build` zero errors
11. **GitNexus re-index**

---

## Notes

- **No WordPress dependency.** All CDP changes are within the TrekYatra FastAPI + Next.js stack only.
- **Phased delivery within this step:** Phase 0 and Phase 1 are mandatory for the first commit. Phase 2 (funnels, cohorts, segment builder) is the second commit. Phase 3 (content intelligence) is the third. Phase 4 (engagement readiness) is the fourth. Phase 5 (AI insights) is deferred to a future step.
- **Performance concern on `events` table:** As events grow, unindexed queries on `analytics_events` will degrade. Add composite indexes: `(event_name, created_at)`, `(anonymous_id, created_at)`, `(page_url, created_at)`. Include these in the `0041` migration.
- **Sparkline SVG:** Use a pure SVG `<polyline>` with a linear path — no recharts or victory dependency. Points are normalized from the data array.
- **`is_internal` detection in SDK:** Only set to `true` on localhost. Never set it to `true` in production builds by default. The `NEXT_PUBLIC_IS_INTERNAL` env var allows QA/staging environments to be flagged.
- **Segment builder preview query performance:** Limit preview evaluation to the last 90 days to keep query times under 2s on the current dataset.
- **Route ordering:** All new static routes (`/events/export`, `/segments/custom`, `/content/pages`, etc.) must be registered BEFORE dynamic routes (`/segments/{id}`, `/events/{id}`) in `routes/cdp.py`. Revisit route ordering after adding new endpoints.

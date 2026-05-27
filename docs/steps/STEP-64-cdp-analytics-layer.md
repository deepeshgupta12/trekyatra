# Step 64 — Complete CDP + Analytics Layer

## Status: Done

## Overview

A full Customer Data Platform (CDP) built first-party on top of the existing backend.
Captures every meaningful user interaction across the website, stitches anonymous events
to identified users, powers funnel/cohort analysis in the admin dashboard, integrates
with GA4 and GSC, and provides a complete behavioral history for every signed-up user.

---

## What You Listed + What's Missing

### ✅ Your List
| Feature | Status in Spec |
|---------|---------------|
| Site-wide event tracking (category / name / value) | Phase 1 |
| GA4 integration | Phase 2 |
| GSC (Google Search Console) integration | Phase 2 |
| Funnels | Phase 3 |
| Cohorts | Phase 3 |
| User details (who interacted) | Phase 1 + 3 |
| Signed up + signed in users (complete history) | Phase 1 + 3 |

### ❓ What's Missing (Critical)

| Missing Item | Why It Matters | Phase |
|-------------|----------------|-------|
| **Identity stitching** — anonymous → identified user merge | Without this, all pre-signup events (e.g., user viewed Kedarkantha 5 times before signing up) are orphaned. This is the core of a CDP. | Phase 1 |
| **Session layer** — session_id, session duration, pages/session | Funnels and cohorts are meaningless without session boundaries. You can't know if two events were same visit or two weeks apart. | Phase 1 |
| **UTM / attribution capture** — source, medium, campaign, content, term | You need to know if a user came from Google organic, an Instagram ad, or an email campaign. First-touch + last-touch attribution. | Phase 1 |
| **User traits / properties** — trek preferences, regions, difficulty, LTV | CDP is not just events. User-level properties let you build segments: "show beginner treks to users who always click easy difficulty". | Phase 1 |
| **Privacy + consent (GDPR / DPDP India 2023)** | India's Digital Personal Data Protection Act 2023 requires user consent for tracking. A cookie banner + consent record per user is non-negotiable before launch. | Phase 1 |
| **Trek-specific engagement events** — viewed, saved, compared, packing, permits | Generic page views don't tell you which trekkers are considering which treks. You need trek-specific events for lead scoring. | Phase 2 |
| **Plan My Trek funnel events** — wizard step completions → result → lead | The Plan wizard is your highest-intent conversion path. Every step drop-off is money left on the table. | Phase 2 |
| **Scroll depth + engagement time per page** | Content performance metric. You don't know if users read the full guide or bounce after the hero. | Phase 2 |
| **Revenue + lead attribution** — which content path drove each lead/purchase | You need to know "Valley of Flowers permit guide → 40% of operator leads for VoF operator". | Phase 3 |
| **Server-side GA4 forwarding (Measurement Protocol)** | Ad blockers kill ~30% of client-side GA4 hits. Server-side forwarding recovers them. | Phase 2 |
| **Real-time event stream in admin** | Operations needs a live feed to verify instrumentation is working on production. | Phase 3 |
| **Custom user segments** — admin-defined filters | "Users who viewed 3+ treks, never submitted a lead, visited in the last 30 days." Used for re-engagement email campaigns. | Phase 3 |
| **Data export** — CSV + webhook for external BI | You will eventually want to run this through Metabase or a data warehouse. Export API now saves migration pain later. | Phase 3 |
| **Email attribution** — link Brevo/Mailchimp open+click to user records | Closes the loop: email sent → opened → visited site → lead submitted. | Phase 4 |
| **Heatmap / session recording integration (Microsoft Clarity — free)** | Shows exactly where users click, scroll, and rage-click on trek pages. No custom build needed. | Phase 4 |
| **A/B experiment assignment tracking** | Future-proofing. A/B tests are useless if you can't attribute conversions to experiment variants. | Phase 4 |
| **Anomaly alerts** — notify when conversion drops >20% week-over-week | You won't notice a broken checkout or a dropped GA4 tag without automated alerts. | Phase 4 |

---

## Event Taxonomy

### Event Schema (all events share this shape)

```json
{
  "event_id":       "uuid",
  "event_category": "engagement | acquisition | conversion | navigation | content | search | system",
  "event_name":     "string (snake_case)",
  "event_value":    "number | null",
  "event_properties": {},
  "session_id":     "uuid",
  "user_id":        "uuid | null",
  "anonymous_id":   "string (localStorage/cookie persisted)",
  "page_url":       "string",
  "page_type":      "string | null",
  "referrer":       "string | null",
  "utm_source":     "string | null",
  "utm_medium":     "string | null",
  "utm_campaign":   "string | null",
  "utm_content":    "string | null",
  "utm_term":       "string | null",
  "device_type":    "desktop | mobile | tablet",
  "created_at":     "timestamptz"
}
```

### Standard Event Catalogue

#### Navigation / Acquisition
| Category | Event Name | Key Properties | Value |
|----------|-----------|----------------|-------|
| acquisition | `page_viewed` | page_url, page_type, referrer, utm_* | — |
| acquisition | `session_started` | session_id, is_new_user, source | — |
| navigation | `nav_link_clicked` | label, href | — |
| navigation | `search_opened` | from_page | — |

#### Content Engagement
| Category | Event Name | Key Properties | Value |
|----------|-----------|----------------|-------|
| content | `trek_viewed` | trek_slug, trek_state, trek_difficulty, trek_duration | — |
| content | `trek_saved` | trek_slug | — |
| content | `trek_unsaved` | trek_slug | — |
| content | `trek_compared` | trek_slugs[] | — |
| content | `packing_guide_viewed` | trek_slug | — |
| content | `permit_guide_viewed` | trek_slug | — |
| content | `cost_guide_viewed` | trek_slug | — |
| content | `scroll_depth_reached` | page_url, page_type, depth_pct (25/50/75/100) | depth_pct |
| content | `cta_clicked` | cta_label, cta_location, page_url | — |
| content | `news_article_viewed` | article_slug, trek_slug | — |
| content | `guide_section_clicked` | trek_slug, section_id | — |

#### Search
| Category | Event Name | Key Properties | Value |
|----------|-----------|----------------|-------|
| engagement | `search_performed` | query, results_count | results_count |
| engagement | `search_result_clicked` | query, clicked_slug, clicked_page_type, result_position | result_position |
| engagement | `search_zero_results` | query | — |
| engagement | `autocomplete_selected` | typed_query, selected_title, selected_slug | — |

#### Plan My Trek Funnel
| Category | Event Name | Key Properties | Value |
|----------|-----------|----------------|-------|
| engagement | `plan_wizard_started` | — | — |
| engagement | `plan_wizard_step_completed` | step (1–6), step_name | step |
| engagement | `plan_wizard_abandoned` | last_step, time_spent_seconds | last_step |
| conversion | `plan_result_viewed` | recommendations_count, top_trek_slug | — |
| conversion | `plan_result_trek_clicked` | trek_slug, match_score, rank | match_score |
| conversion | `plan_lead_submitted` | trek_slug, operator_slug | — |

#### Conversion
| Category | Event Name | Key Properties | Value |
|----------|-----------|----------------|-------|
| conversion | `signup_completed` | method (email/google), referrer, utm_source | — |
| conversion | `signin_completed` | method | — |
| conversion | `lead_submitted` | trek_slug, operator_slug, source_page | — |
| conversion | `operator_profile_viewed` | operator_slug, trek_slug | — |
| conversion | `operator_cta_clicked` | operator_slug, cta_type | — |
| conversion | `product_viewed` | product_slug, product_type | — |
| conversion | `checkout_started` | product_slug, amount | amount |
| conversion | `purchase_completed` | product_slug, amount, currency | amount |
| conversion | `newsletter_signup_submitted` | source_page, plan_trek_slug | — |
| conversion | `premium_upgrade_started` | plan_type | — |
| conversion | `premium_upgrade_completed` | plan_type, amount | amount |

---

## Architecture

### Backend

```
analytics_events          — core event store (replaces/extends search_events)
analytics_sessions        — session boundaries (start, end, pages, duration)
user_traits               — user-level properties (denormalized snapshot)
user_journey              — ordered event sequence per user (pre-built for admin)
attribution_touchpoints   — UTM + referrer per session per user (first + last touch)
```

### Anonymous → Identified Stitching (Identity Resolution)

When an anonymous user signs up:
1. `anonymous_id` (cookie-based UUID, persisted) is sent with signup event
2. Backend finds all `analytics_events` where `anonymous_id` matches
3. Sets `user_id` on those historical events retroactively
4. Creates `user_traits` row with first_seen_at from earliest anon event
5. All future events use both `anonymous_id` + `user_id`

### Session Layer

- Session = new `anonymous_id` visit where last event was > 30 min ago
- Session ends client-side: `visibilitychange` + `beforeunload` → POST `/analytics/session-end`
- Session properties: duration_seconds, pages_visited, entry_page, exit_page, conversion (bool)

### UTM / Attribution

- On page load: read `?utm_*` params from URL
- Store in `sessionStorage` (survives tab refresh, not cross-tab)
- Also store FIRST-touch attribution in `localStorage` (never overwritten after first set)
- Both sent with every event — first_touch_utm + session_utm
- `attribution_touchpoints` table: session_id, user_id (may be null), utm_*, referrer, landed_at

---

## Integrations

### GA4 (Google Analytics 4)

**Current state:** GA4 script loaded via `next/script` (commit f33f7b0), Measurement ID `G-XM61V2PPDK`.

**Enhancements:**
1. Custom GA4 events mirroring the event catalogue above via `gtag('event', ...)` 
2. GA4 `user_id` set after login (`gtag('set', 'user_properties', {user_id})`) for cross-device tracking
3. Server-side Measurement Protocol forwarding (Phase 2) for ad-blocker bypass
4. GA4 ecommerce events for product purchases (`purchase`, `begin_checkout`)
5. GA4 Conversions configured: `signup_completed`, `lead_submitted`, `purchase_completed`

### GSC (Google Search Console)

**Current state:** GSC verified ✅, sitemap submitted (2026-05-15).

**Integration approach:** GSC does NOT have a real-time API for hits. Pull nightly:
- GSC Search Analytics API → read impressions, clicks, CTR, average position per URL + query
- Store in `gsc_performance` table: `page_url`, `query`, `clicks`, `impressions`, `position`, `date`
- Admin dashboard: GSC performance table (top queries, top pages, ranking changes)
- Join `gsc_performance` with `analytics_events` to see: "users who landed on /trek/kedarkantha from keyword X"

### Microsoft Clarity (Heatmaps — Phase 4)

Free. Drop-in script tag. No custom build. Records scrolls, clicks, rage-clicks, session replays.
Configure privacy rules: mask form fields (email, phone, passwords).

---

## Admin Dashboard — CDP Views

### 1. Event Stream (Real-time)
Live feed of events as they arrive. Filter by event_category, event_name, page_type.
Shows: anonymous_id (truncated), user_id, event_name, properties, timestamp.
Useful for verifying instrumentation on production.

### 2. User Profiles
Per-user view accessible at `/admin/cdp/users/{user_id}`:
- Identity: email, signup date, signin count, last seen
- Attribution: first-touch + last-touch UTM, referrer
- Trek interests: treks viewed (with count), saved, compared
- Conversion history: leads submitted, products purchased
- Full event timeline (paginated, filterable by category)
- Segment membership

### 3. Funnel Analysis
Configurable multi-step funnels. Pre-built:

| Funnel | Steps |
|--------|-------|
| Signup funnel | page_viewed (any) → signup_completed |
| Lead funnel | trek_viewed → operator_profile_viewed → lead_submitted |
| Plan → Lead | plan_wizard_started → plan_result_viewed → plan_lead_submitted |
| Purchase funnel | product_viewed → checkout_started → purchase_completed |
| Newsletter funnel | page_viewed → newsletter_signup_submitted |

Each funnel shows: entries per step, conversion rate per step, drop-off rate, median time between steps.

### 4. Cohort Analysis
Group users by acquisition week/month. Track retention (% who return in week N).

| Cohort Type | Description |
|-------------|-------------|
| Signup cohort | Users signed up in week X — what % return in weeks 1, 2, 4, 8? |
| Content cohort | Users who first visited via trek guide — vs via search — vs via news article |
| Source cohort | Users from organic vs paid vs email — which has higher retention? |

### 5. Segment Builder
Admin defines segments with conditions. Segments are recomputed nightly.

Example segments:
- "High-intent trekkers" — viewed 3+ trek pages, visited in last 14 days, never submitted a lead
- "Returning planners" — completed Plan My Trek wizard 2+ times
- "Organic SEO users" — first_touch_source = 'google' AND first_touch_medium = 'organic'

Segments used for: targeted email sequences (Step 31 integration), personalization.

### 6. GSC Performance Table
Top organic queries, landing pages, click-through rates, position changes.
Filter by: page_type (trek_guide, news_article, packing_list), date range.

### 7. Content Attribution
Which content drives conversions?
Table: page_url → leads generated → purchases driven → signups from that page.

---

## Privacy + Consent (GDPR / India DPDP Act 2023)

### What's Required
- Cookie consent banner on first visit (before any analytics fires)
- Consent stored per user: `analytics_consent`, `marketing_consent`
- Data deletion endpoint: `DELETE /auth/me/data` — removes all analytics_events for that user_id
- Data export endpoint: `GET /auth/me/data-export` — returns all stored data as JSON
- Anonymization: on account deletion, replace PII fields with `[deleted]`
- Retention policy: analytics_events older than 2 years auto-deleted (Celery beat task)

### Consent Banner
- Shown on first visit for new visitors
- Two options: "Accept analytics" / "Decline"
- Choice stored in `localStorage` AND sent to backend if user signs up later
- GA4 and first-party tracking ONLY fire after `analytics_consent = true`

---

## Database Migrations

| Migration | Table | Description |
|-----------|-------|-------------|
| 0037_analytics_events | `analytics_events` | Core event store with anonymous_id, session_id, user_id, category, name, value, properties JSONB, utm_*, device_type |
| 0038_analytics_sessions | `analytics_sessions` | Session boundaries: start/end, pages, duration, entry/exit page, conversion flag |
| 0039_user_traits | `user_traits` | Denormalized user snapshot: trek_interests[], regions[], difficulty_pref, total_events, total_sessions, last_seen_at, first_seen_at, first_touch_utm |
| 0040_attribution_touchpoints | `attribution_touchpoints` | UTM + referrer per session, first_touch bool |
| 0041_gsc_performance | `gsc_performance` | Nightly GSC import: page_url, query, clicks, impressions, ctr, position, date |

---

## Files to Create (Backend)

### Migrations
- `services/api/alembic/versions/20260527_0037_analytics_events.py`
- `services/api/alembic/versions/20260527_0038_analytics_sessions.py`
- `services/api/alembic/versions/20260527_0039_user_traits.py`
- `services/api/alembic/versions/20260527_0040_attribution_touchpoints.py`
- `services/api/alembic/versions/20260527_0041_gsc_performance.py`

### Models
- `services/api/app/modules/analytics/models.py` — AnalyticsEvent, AnalyticsSession, UserTrait, AttributionTouchpoint, GscPerformance

### Service Layer
- `services/api/app/modules/analytics/service.py` — log_event, start_session, end_session, stitch_identity, get_user_profile, get_funnel, get_cohort, get_segments, update_user_traits

### API Routes
- `services/api/app/api/routes/analytics.py`
  - `POST /analytics/event` — ingest single event (public, no auth)
  - `POST /analytics/events/batch` — batch ingest (public, no auth)
  - `POST /analytics/session` — start/end session
  - `GET /admin/cdp/users` — list users with traits + segment membership
  - `GET /admin/cdp/users/{user_id}` — full user profile + event timeline
  - `GET /admin/cdp/funnels/{funnel_name}` — funnel step conversion data
  - `GET /admin/cdp/cohorts` — cohort retention table
  - `GET /admin/cdp/events/stream` — recent events (paginated)
  - `GET /admin/cdp/segments` — list segments with user counts
  - `GET /admin/cdp/gsc` — GSC performance data
  - `DELETE /auth/me/data` — DPDP data deletion (add to auth routes)
  - `GET /auth/me/data-export` — DPDP data export (add to auth routes)

### Celery Tasks
- `services/api/app/worker/tasks/analytics.py`
  - `analytics.nightly_gsc_import` — pull GSC API data nightly
  - `analytics.nightly_user_traits_refresh` — recompute user_traits from raw events
  - `analytics.nightly_segment_refresh` — recompute segment membership
  - `analytics.monthly_retention_cleanup` — delete events > 2 years old

### Tests
- `services/api/tests/test_analytics_cdp.py` — event ingest, session, identity stitch, funnel, cohort

## Files to Create (Frontend)

### Data Layer (lib)
- `apps/web-next/lib/analytics.ts` — client-side CDP: `trackEvent(category, name, value?, properties?)`, `trackPageView()`, `startSession()`, `endSession()`, `getAnonymousId()`, `setUserId()`, anonymous_id cookie management, UTM capture, GA4 mirroring, consent gate

### Components
- `apps/web-next/components/analytics/AnalyticsProvider.tsx` — context provider: wraps app, fires session_started + page_viewed on route change, listens for `visibilitychange`
- `apps/web-next/components/analytics/ConsentBanner.tsx` — GDPR/DPDP consent UI: "Accept analytics / Decline"; persists consent in localStorage + backend if user is signed in
- `apps/web-next/components/analytics/ScrollDepthTracker.tsx` — `IntersectionObserver`-based 25/50/75/100% depth events per page

### Admin Pages
- `apps/web-next/app/(admin)/admin/cdp/page.tsx` — CDP overview: KPIs (MAU, DAU, signups, leads), event volume chart
- `apps/web-next/app/(admin)/admin/cdp/users/page.tsx` — user list with search + segment filter
- `apps/web-next/app/(admin)/admin/cdp/users/[id]/page.tsx` — individual user profile + timeline
- `apps/web-next/app/(admin)/admin/cdp/funnels/page.tsx` — funnel selector + conversion table
- `apps/web-next/app/(admin)/admin/cdp/cohorts/page.tsx` — cohort retention heatmap
- `apps/web-next/app/(admin)/admin/cdp/segments/page.tsx` — segment list + builder
- `apps/web-next/app/(admin)/admin/cdp/gsc/page.tsx` — GSC performance table + top queries
- `apps/web-next/app/(admin)/admin/cdp/events/page.tsx` — real-time event stream

## Files to Modify

### Backend
- `services/api/app/api/router.py` — register analytics_router, update auth_router with data-deletion endpoints
- `services/api/app/db/base.py` — import new models
- `services/api/app/worker/celery_app.py` — add analytics beat tasks (nightly GSC, user traits, segment refresh, monthly cleanup)
- `services/api/app/api/routes/auth.py` — add DELETE /auth/me/data + GET /auth/me/data-export

### Frontend
- `apps/web-next/app/layout.tsx` — wrap with AnalyticsProvider + ConsentBanner
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — add `trek_viewed` event on mount
- `apps/web-next/app/(public)/search/page.tsx` — already logs search events; add `search_zero_results`, `autocomplete_selected` events
- `apps/web-next/app/(public)/plan/page.tsx` — add wizard step events
- `apps/web-next/app/(admin)/admin/layout.tsx` — add CDP nav section

---

## Phased Delivery

### Phase 1 — Core Infrastructure (Week 1)
- DB migrations (0037–0040): events, sessions, traits, attribution
- `analytics.ts` client library (anonymous_id, UTM, consent gate, trackEvent, GA4 mirror)
- `POST /analytics/event` + `POST /analytics/events/batch` backend endpoints
- Session start/end
- Identity stitching on signup
- ConsentBanner component (DPDP compliance)
- AnalyticsProvider wrapped in layout
- Page view + session tracking working across all pages

### Phase 2 — Trek + Funnel Instrumentation (Week 2)
- Trek-specific events: trek_viewed, trek_saved, trek_compared
- Plan My Trek funnel events (all 6 wizard steps + result + lead)
- Scroll depth tracker (IntersectionObserver)
- Search events: zero_results, autocomplete_selected
- GA4 enhanced events (user_id, ecommerce, conversions)
- Server-side GA4 Measurement Protocol forwarding
- GSC API nightly import + gsc_performance table

### Phase 3 — Admin CDP Dashboard (Week 3)
- CDP admin section (nav link added)
- CDP overview page (KPIs + event volume)
- User profiles: list + individual detail + timeline
- Funnel analysis: 5 pre-built funnels
- Cohort retention table
- Segment builder (basic AND conditions)
- GSC performance page
- Real-time event stream
- Data deletion + export endpoints (DPDP)

### Phase 4 — Attribution, Alerts, External Integrations (Week 4)
- Revenue + lead attribution (content path → conversion)
- Email attribution (Brevo webhook → analytics event)
- Microsoft Clarity script integration (heatmaps)
- Nightly anomaly detection: flag when conversion drops >20% WoW
- Admin alert notification (email or Slack webhook)
- A/B experiment assignment schema (schema only, no UI yet)
- CSV data export for BI tools

---

## Dependencies

| Dependency | Status |
|------------|--------|
| PostgreSQL with JSONB support | ✅ Live |
| Redis (Celery) | ✅ Live |
| GA4 Measurement ID (G-XM61V2PPDK) | ✅ Set in DO |
| GSC verified + sitemap submitted | ✅ Done (2026-05-15) |
| ANTHROPIC_API_KEY | ⚠️ Pending (needed for event categorization AI — optional) |
| GSC Search Analytics API OAuth credentials | 🔲 New requirement — see Notes |
| Google Analytics Admin API (for server-side event push) | 🔲 New requirement |
| Microsoft Clarity project ID | 🔲 New requirement (free) |

### GSC API Setup Required
The GSC Search Analytics API requires OAuth2 service account credentials:
1. Google Cloud Console → Create service account
2. Grant service account "Read" access on GSC property
3. Download JSON key → add as `GSC_SERVICE_ACCOUNT_JSON` env var

---

## Acceptance Criteria

### Phase 1
- [ ] `trackEvent("content", "trek_viewed", null, {trek_slug: "kedarkantha"})` writes to `analytics_events` table
- [ ] Anonymous user visits site → `anonymous_id` cookie set → session created
- [ ] User signs up → all prior anon events retroactively linked to `user_id`
- [ ] GA4 receives `trek_viewed` event (verify in GA4 DebugView)
- [ ] Consent banner appears on first visit; analytics do NOT fire before consent

### Phase 2
- [ ] Plan My Trek wizard: each step fires `plan_wizard_step_completed`
- [ ] Trek page fires `scroll_depth_reached` at 25/50/75/100% milestones
- [ ] Server-side GA4 Measurement Protocol confirms events in GA4 even with ad blocker enabled
- [ ] GSC nightly import runs and populates `gsc_performance` table

### Phase 3
- [ ] `/admin/cdp/users/{id}` shows full event timeline for any user
- [ ] Lead funnel (trek_viewed → operator_viewed → lead_submitted) shows correct conversion %
- [ ] Signup cohort W1 shows X% retention in week 2
- [ ] Real-time event stream updates within 5 seconds of client event

### Phase 4
- [ ] Content attribution table shows which trek pages drive most leads
- [ ] Admin receives email alert when weekly signups drop >20%
- [ ] CSV export of all events for a date range downloads correctly

---

## Key Design Decisions

1. **First-party over third-party CDP**: No Segment/Amplitude/Mixpanel. We own the data, no per-event pricing, no vendor lock-in. GA4 for marketing attribution only.

2. **JSONB properties field**: Schema-flexible. New event properties don't require migrations. Query with `properties ->> 'trek_slug'`.

3. **Dual identity (anonymous_id + user_id)**: anonymous_id is always set (cookie-based). user_id is null until signup. Both are stored on every event. Stitching is a retroactive UPDATE, not a join-time operation.

4. **Client-side + server-side hybrid**: Most events fired client-side for real-time UX. Server-side GA4 forwarding for reliability. No event should be ONLY server-side (too slow for UX instrumentation).

5. **Consent gates GA4 AND first-party**: Both stop without consent. Not just GA4. India DPDP compliance requires consent for any behavioral data collection.

6. **Batch ingest endpoint**: The client SDKs sends events in batches of up to 20, flushed every 5 seconds or on `visibilitychange`. Reduces API call volume 20x vs per-event calls.

---

## Implementation Notes — 2026-05-27

### Files Created (Backend)
- `services/api/alembic/versions/20260527_0036_cdp_analytics_events.py` — analytics_events table
- `services/api/alembic/versions/20260527_0037_cdp_analytics_sessions.py` — analytics_sessions table
- `services/api/alembic/versions/20260527_0038_cdp_user_traits.py` — user_traits table
- `services/api/alembic/versions/20260527_0039_cdp_attribution_touchpoints.py` — attribution_touchpoints table
- `services/api/alembic/versions/20260527_0040_cdp_gsc_performance.py` — gsc_performance table
- `services/api/app/modules/cdp/__init__.py`
- `services/api/app/modules/cdp/models.py` — AnalyticsEvent, AnalyticsSession, UserTrait, AttributionTouchpoint, GscPerformance
- `services/api/app/modules/cdp/service.py` — log_event, batch_log_events, start_session, end_session, stitch_identity, list_users, get_user_profile, get_funnel, get_cohorts, get_event_stream, get_segments, get_gsc_data, refresh_user_traits
- `services/api/app/schemas/cdp.py` — all request/response Pydantic schemas
- `services/api/app/api/routes/cdp.py` — 12 endpoints (public + admin)
- `services/api/app/worker/tasks/cdp.py` — 3 Celery tasks (trait refresh, GSC import, cleanup)
- `services/api/tests/test_cdp.py` — 24 tests, all passing

### Files Modified (Backend)
- `services/api/app/db/base.py` — registered 5 CDP models
- `services/api/app/api/router.py` — registered CDP public and admin routers
- `services/api/app/worker/celery_app.py` — registered CDP tasks module + 3 beat schedules
- `services/api/app/core/config.py` — added ga4_measurement_id, ga4_api_secret, gsc_service_account_json
- `services/api/.env.example` — documented CDP env vars
- `services/api/app/api/routes/auth.py` — added DPDP GET /me/data-export and DELETE /me/data endpoints

### Files Created (Frontend)
- `apps/web-next/lib/analytics.ts` — full CDP client SDK (batch flush, session mgmt, UTM capture, consent)
- `apps/web-next/components/analytics/AnalyticsProvider.tsx` — route-change page view tracking
- `apps/web-next/components/analytics/ConsentBanner.tsx` — DPDP consent UI
- `apps/web-next/components/analytics/ScrollDepthTracker.tsx` — IntersectionObserver scroll depth
- `apps/web-next/app/(admin)/admin/cdp/page.tsx` — CDP overview dashboard
- `apps/web-next/app/(admin)/admin/cdp/users/page.tsx` — paginated user list
- `apps/web-next/app/(admin)/admin/cdp/users/[id]/page.tsx` — user detail profile
- `apps/web-next/app/(admin)/admin/cdp/funnels/page.tsx` — funnel visualiser
- `apps/web-next/app/(admin)/admin/cdp/cohorts/page.tsx` — weekly retention cohorts
- `apps/web-next/app/(admin)/admin/cdp/segments/page.tsx` — audience segment cards
- `apps/web-next/app/(admin)/admin/cdp/gsc/page.tsx` — GSC performance table
- `apps/web-next/app/(admin)/admin/cdp/events/page.tsx` — live event stream

### Files Modified (Frontend)
- `apps/web-next/components/Providers.tsx` — wired AnalyticsProvider + ConsentBanner
- `apps/web-next/app/(admin)/admin/layout.tsx` — added CDP nav group
- `apps/web-next/components/monetization/AffiliateCard.tsx` — updated trackEvent to 4-arg signature
- `apps/web-next/components/monetization/NewsletterCapture.tsx` — updated trackEvent to 4-arg signature
- `apps/web-next/components/monetization/LeadForm.tsx` — updated trackEvent to 4-arg signature

### Test Results
- 24 CDP tests pass (test_cdp.py)
- Full suite: 568 passed / 2 pre-existing test_refresh.py failures (pre-Step 64, not introduced here)
- `next build` passes with zero TypeScript errors

### DB Migrations Run
All 5 CDP migrations applied: 0036 → 0037 → 0038 → 0039 → 0040

### New Env Vars Required
- `GA4_MEASUREMENT_ID` — GA4 property ID (optional, graceful skip if unset)
- `GA4_API_SECRET` — GA4 Measurement Protocol API secret (optional)
- `GSC_SERVICE_ACCOUNT_JSON` — Google Search Console service account JSON (optional)

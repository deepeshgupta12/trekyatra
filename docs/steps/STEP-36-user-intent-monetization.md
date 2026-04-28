# STEP 36 — User-Intent Aware Monetization

## Goal
Classify visitor intent per page visit and dynamically select the most relevant monetisation module (affiliate card, lead form, newsletter, or product upsell). Builds on the recommendation engine and user profiles to show the right CTA to the right user.

## Scope

### Intent classification
- `IntentClassifierAgent`: given page_type + user_profile (if logged in) + page content signals → classify intent:
  - `research`: user exploring options → serve affiliate comparison cards
  - `booking_ready`: user with specific trek interest → serve lead form CTA
  - `inspiration`: generic browsing → serve newsletter capture
  - `buyer`: past purchase or downloads history → serve product upsell
- Intent signal inputs: page_type, url path, trek_interest tag, user_profile.trek_experience, bookmark history
- Output: `{intent: string, confidence: float, recommended_module: string}`
- Computed server-side on page request; stored in `page_intent_sessions` table (session_id, page_slug, intent, confidence, module_shown, converted)

### Dynamic monetisation module selection
- `MonetizationSlot` React component: server component that reads intent from API, renders appropriate module
  - `affiliate`: renders AffiliateCard carousel (existing)
  - `lead`: renders LeadForm (existing)
  - `newsletter`: renders NewsletterCapture (existing)
  - `product`: renders digital product card (Step 34)
- A/B test flag: `MONETIZATION_AB_TEST` env var — when enabled, randomly assign 50% to intent-based, 50% to static (page_type default)

### Personalised affiliate recommendations
- `get_affiliate_recommendations(user_id, page_slug)` — combine intent + Step 35 similarity to select the best 3 affiliate products for this user on this page
- Affiliate product catalog (`affiliate_products` table): title, description, affiliate_url, affiliate_program, category[], price_range
- Populated via admin import (CSV or manual entry)

### Conversion tracking
- On module render: fire `trackEvent("monetization_impression", {module, intent, page_slug})`
- On CTA click: fire `trackEvent("monetization_click", {module, intent, page_slug})`
- `page_intent_sessions.converted = True` when lead submitted or affiliate clicked on that session

### Admin UI
- `/admin/monetization` (already exists as stub): rewrite with real data — intent distribution chart, conversion rate by module, top converting pages

### Backend
- Alembic migration: `page_intent_sessions` table, `affiliate_products` table
- `GET /api/v1/intent/{slug}` — returns intent classification for current user + page (auth optional)
- `GET /api/v1/admin/monetization/stats` — intent distribution + conversion rates

## Preconditions
- Read docs/MASTER_TRACKER.md, PROCESS_GUARDRAILS.md, DEPENDENCY_MAP.md
- Confirm Step 35 complete (recommendations + user_profiles)
- Confirm Step 33 complete (user bookmarks as intent signal)
- Confirm Step 34 complete (product module for buyer intent)

## Planned Files to Create
- `services/api/alembic/versions/YYYYMMDD_0025_intent_sessions.py`
- `services/api/app/modules/agents/intent/agent.py`
- `services/api/app/modules/monetization/__init__.py`
- `services/api/app/modules/monetization/models.py` — PageIntentSession, AffiliateProduct
- `services/api/app/modules/monetization/service.py`
- `services/api/app/api/routes/monetization.py`
- `services/api/app/schemas/monetization.py`
- `services/api/tests/test_intent.py`
- `apps/web-next/components/monetization/MonetizationSlot.tsx`

## Planned Files to Modify
- `apps/web-next/app/(admin)/admin/monetization/page.tsx` — real data
- `services/api/app/db/base.py`
- `services/api/app/api/router.py`
- `apps/web-next/lib/api.ts`

## Status
pending

## Notes
- IntentClassifierAgent uses a short LLM call (< 200 tokens) with a cached system prompt — add Anthropic prompt caching header to reduce cost per request.
- A/B test: log variant in page_intent_sessions.ab_variant; compare conversion rates by variant in admin stats.
- Affiliate product catalog starts small (20–50 products); import via admin CSV upload UI (multipart/form-data endpoint).

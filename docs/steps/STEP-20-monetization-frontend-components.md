# STEP 20 — Monetization Frontend Components

## Goal
Build and integrate the full set of revenue-generating frontend components: display ad slots, affiliate modules, lead forms, newsletter capture, and trust/disclosure blocks. Monetization must be live and measurable from the moment the site launches.

## Scope

### Display Ad Components
- `InArticleAdSlot` — respects reading flow; positioned after H2 sections
- `SidebarAdSlot` — sticky on desktop scroll
- `FooterAdSlot` — below fold, non-intrusive
- All slots use a standard ad unit `div` with data attributes; AdSense script injected globally
- Skeleton placeholder renders at correct size before ad loads (prevents CLS)

### Affiliate Components
- `AffiliateCard` — single product card: image, title, short description, "Check Price" CTA, disclosure note
- `AffiliateRail` — horizontal scrollable rail of 3–5 AffiliateCards
- `ComparisonTable` — 2–4 product comparison table with per-feature checkmarks and a "Best for" column
- `GearRecommendation` — inline gear mention with affiliate link and minimal disclosure

### Lead Generation Components
- `LeadForm` — name, email, phone, trek interest, message; submits to POST /api/v1/leads
- `OperatorCard` — operator name, region, trek types, inquiry CTA that opens LeadForm
- `ConsultationCTA` — sticky side panel or inline CTA for custom trek planning inquiry

### Newsletter Components
- `NewsletterCapture` — name + email form; submits to POST /api/v1/newsletter/subscribe
- `LeadMagnetCapture` — newsletter form with a free resource offer (e.g., "Get the free packing list")
- `InlineNewsletterBlock` — mid-article placement variant

### Trust and Disclosure Components
- `AffiliateDisclosure` — "This page contains affiliate links" notice (top of commercial pages)
- `DisclosureBlock` — full-length compliance disclosure (affiliate + ad + AI-assisted notice)
- `SafetyDisclaimer` — "Information may change — verify before travel" notice for safety content
- `TrustSignals` — bar with trust indicators (updated date, author name, fact-checked badge)
- `StickyMobileCTA` — bottom-fixed mobile CTA (e.g., "Get a free quote" or "Check best price")

### Backend: Lead and newsletter submission APIs
- POST /api/v1/leads — create lead submission record (name, email, phone, trek_interest, source_page, source_cluster, cta_type)
- POST /api/v1/newsletter/subscribe — create newsletter subscriber record (email, source_page, lead_magnet)
- Both already have table stubs in data model scope; add ORM + migration + routes if not yet created

## Preconditions
- Read docs/MASTER_TRACKER.md
- Read docs/PROCESS_GUARDRAILS.md
- Read docs/DEPENDENCY_MAP.md
- Confirm Step 18 complete (content page templates in place to insert components into)
- AdSense publisher ID and affiliate program IDs available (or use placeholder values for now)

## Dependency Check
- `apps/web-next/app/(public)/treks/[slug]/page.tsx` — components inserted into page layout (additive)
- New backend routes for leads and newsletter (additive)
- New Alembic migration if lead_submissions and newsletter_subscribers tables don't exist yet
- No changes to existing auth, content, or publish routes

## Planned Files to Create
- `apps/web-next/components/monetization/InArticleAdSlot.tsx`
- `apps/web-next/components/monetization/SidebarAdSlot.tsx`
- `apps/web-next/components/monetization/FooterAdSlot.tsx`
- `apps/web-next/components/monetization/AffiliateCard.tsx`
- `apps/web-next/components/monetization/AffiliateRail.tsx`
- `apps/web-next/components/monetization/ComparisonTable.tsx`
- `apps/web-next/components/monetization/GearRecommendation.tsx`
- `apps/web-next/components/monetization/LeadForm.tsx`
- `apps/web-next/components/monetization/OperatorCard.tsx`
- `apps/web-next/components/monetization/ConsultationCTA.tsx`
- `apps/web-next/components/monetization/NewsletterCapture.tsx`
- `apps/web-next/components/monetization/LeadMagnetCapture.tsx`
- `apps/web-next/components/monetization/InlineNewsletterBlock.tsx`
- `apps/web-next/components/trust/AffiliateDisclosure.tsx`
- `apps/web-next/components/trust/DisclosureBlock.tsx`
- `apps/web-next/components/trust/SafetyDisclaimer.tsx`
- `apps/web-next/components/trust/TrustSignals.tsx`
- `apps/web-next/components/trust/StickyMobileCTA.tsx`
- `services/api/app/api/routes/leads.py`
- `services/api/app/api/routes/newsletter.py`
- `services/api/alembic/versions/20260422_0008_leads_newsletter.py` (if tables don't exist)

## Planned Files to Modify
- `apps/web-next/app/(public)/treks/[slug]/page.tsx` — insert InArticleAdSlot, AffiliateRail, TrustSignals, StickyMobileCTA
- `apps/web-next/app/(public)/packing/[slug]/page.tsx` — insert AffiliateRail, ComparisonTable, NewsletterCapture
- `apps/web-next/app/layout.tsx` — add AdSense script (conditionally based on env)
- `services/api/app/api/router.py` — register leads and newsletter routers
- `docs/MASTER_TRACKER.md`
- `docs/DEPENDENCY_MAP.md`

## Validation Commands
```bash
cd apps/web-next && npm run build
cd apps/web-next && npm run dev
open http://localhost:3000/treks/<slug>
# Verify: ad slots render (skeleton visible without AdSense in dev), affiliate cards, trust bar, sticky mobile CTA

# Lead submission
curl -X POST http://localhost:8000/api/v1/leads \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"test@example.com","trek_interest":"kedarkantha","source_page":"/treks/kedarkantha"}'

# Newsletter subscribe
curl -X POST http://localhost:8000/api/v1/newsletter/subscribe \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","source_page":"/packing/kedarkantha-packing-list"}'

PYTHONPATH=services/api .venv/bin/pytest services/api/tests/ -v
```

## Status
Done

## Files Created
### Backend
- `services/api/app/modules/leads/models.py`
- `services/api/app/modules/leads/service.py`
- `services/api/app/modules/newsletter/models.py`
- `services/api/app/modules/newsletter/service.py`
- `services/api/app/schemas/leads.py`
- `services/api/app/schemas/newsletter.py`
- `services/api/app/api/routes/leads.py`
- `services/api/app/api/routes/newsletter.py`
- `services/api/alembic/versions/20260427_0011_leads_newsletter.py`
- `services/api/tests/test_leads_newsletter.py`

### Frontend
- `apps/web-next/components/monetization/InArticleAdSlot.tsx`
- `apps/web-next/components/monetization/SidebarAdSlot.tsx`
- `apps/web-next/components/monetization/FooterAdSlot.tsx`
- `apps/web-next/components/monetization/AffiliateCard.tsx`
- `apps/web-next/components/monetization/AffiliateRail.tsx`
- `apps/web-next/components/monetization/ComparisonTable.tsx`
- `apps/web-next/components/monetization/GearRecommendation.tsx`
- `apps/web-next/components/monetization/LeadForm.tsx`
- `apps/web-next/components/monetization/OperatorCard.tsx`
- `apps/web-next/components/monetization/ConsultationCTA.tsx`
- `apps/web-next/components/monetization/NewsletterCapture.tsx`
- `apps/web-next/components/monetization/LeadMagnetCapture.tsx`
- `apps/web-next/components/monetization/InlineNewsletterBlock.tsx`
- `apps/web-next/components/trust/DisclosureBlock.tsx`
- `apps/web-next/components/trust/TrustSignals.tsx`
- `apps/web-next/components/trust/StickyMobileCTA.tsx`

## Files Modified
- `services/api/app/db/base.py` — LeadSubmission + NewsletterSubscriber registered
- `services/api/app/api/router.py` — leads_router + newsletter_router added
- `apps/web-next/lib/api.ts` — submitLead() + subscribeNewsletter() helpers added
- `apps/web-next/app/layout.tsx` — conditional AdSense script in <head>
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — InArticleAdSlot, AffiliateRail, TrustSignals, StickyMobileCTA inserted
- `apps/web-next/app/(public)/packing/[slug]/page.tsx` — AffiliateRail, NewsletterCapture inserted

## Notes
- Trek page actual path is `trek/[slug]` (singular), not `treks/[slug]` as originally in spec — corrected
- AffiliateDisclosure and SafetyDisclaimer already existed in `components/content/` from Step 18 — not duplicated
- Newsletter subscription is idempotent: POST returns `already_subscribed: true` on duplicate (no error)
- StickyMobileCTA: `lg:hidden`, localStorage dismissal for 7 days, X button in corner
- Email validation uses custom `@field_validator` (plain str + @/. check) — avoids `email-validator` package at test time; package still added to pyproject.toml for future EmailStr use
- NEXT_PUBLIC_ADSENSE_ID env var controls whether AdSense script is injected; undefined = dev = placeholders
- `next build` clean: 127 static pages, zero TypeScript errors
- 182/182 backend tests pass

# TrekYatra Pre-Launch Checklist

> This document tracks every item that must be resolved before the website goes live.
> It is the authority for production readiness. Update status as items are completed.
> Last updated: 2026-05-07

---

## Status Legend
- `[ ]` — Not started
- `[~]` — In progress
- `[x]` — Complete
- `[DEFERRED]` — Explicitly deferred to post-launch iteration

---

## 1. Auth & User Accounts

| # | Item | Status | Notes |
|---|------|--------|-------|
| A01 | Password reset flow (forgot-password + reset endpoints + frontend) | `[x]` | HMAC stateless token, 1h TTL, graceful SMTP |
| A02 | Email verification on signup | `[x]` | Graceful (skips if SMTP not configured) |
| A03 | Account settings page wired to real API (display_name, full_name) | `[x]` | PATCH /account/me |
| A04 | Account enquiries page wired to leads API | `[x]` | GET /account/leads filtered by user email |
| A05 | Mobile OTP login | `[DEFERRED]` | Low priority for v1 launch; placeholder retained |
| A06 | Google OAuth end-to-end live test | `[ ]` | Requires live GOOGLE_CLIENT_ID/SECRET in production |
| A07 | Session expiry + silent refresh | `[~]` | Cookie-based sessions exist; refresh() in auth context |

---

## 2. Content Pipeline (SEO Readiness)

| # | Item | Status | Notes |
|---|------|--------|-------|
| C01 | Run full content pipeline end-to-end (trigger → brief → draft → publish) | `[ ]` | Requires ANTHROPIC_API_KEY in .env |
| C02 | Publish ≥ 20 trek guide CMS pages before launch | `[ ]` | Pipeline must run first |
| C03 | Sitemap.xml includes published CMS pages | `[x]` | Dynamic sitemap from CMS API |
| C04 | JSON-LD schema on all published pages | `[x]` | Step 19 — Article, FAQ, Breadcrumb |
| C05 | Canonical tags on all public pages | `[x]` | Step 19 |
| C06 | robots.txt | `[x]` | Step 19 |
| C07 | Affiliate catalog populated in admin | `[ ]` | Admin must manually add via /admin/monetization |
| C08 | Digital products catalog populated | `[ ]` | Admin must add via /admin/products |
| C09 | At least 3 operators registered in admin | `[ ]` | Admin must add via /admin/operators |
| C10 | Homepage content visible (trek cards, images) | `[x]` | Static trek fallback always shows |

---

## 3. Frontend Pages

| # | Item | Status | Notes |
|---|------|--------|-------|
| F01 | Homepage search bar wired | `[x]` | Navigates to /search with query params |
| F02 | /compare — dynamic trek selector | `[x]` | Dropdown-based comparison |
| F03 | /itineraries — CMS-powered with fallback | `[x]` | Fetches page_type=itinerary; empty state |
| F04 | /costs — CMS-powered with fallback | `[x]` | Fetches page_type=cost_guide; empty state |
| F05 | /gear — CMS-powered + affiliate products | `[x]` | Fetches page_type=gear_guide + public affiliates |
| F06 | /beginner — CMS-powered with fallback | `[x]` | Fetches page_type=beginner_guide |
| F07 | /safety — CMS-powered with fallback | `[x]` | Fetches page_type=safety_guide |
| F08 | /account/settings — wired to API | `[x]` | PATCH /account/me; display_name, full_name |
| F09 | /account/enquiries — wired to leads API | `[x]` | GET /account/leads filtered by email |
| F10 | /account/compare — saved comparisons | `[DEFERRED]` | Low priority; static stub retained |
| F11 | MonetizationSlot on trek detail page | `[ ]` | GatedContent and MonetizationSlot wiring |
| F12 | GatedContent on premium pages | `[ ]` | Check is_gated from CMS response |
| F13 | Trek alert delivery (email when page updated) | `[DEFERRED]` | Subscriptions stored; delivery deferred |

---

## 4. Admin CMS

| # | Item | Status | Notes |
|---|------|--------|-------|
| D01 | Operators admin — agreement tab | `[x]` | API exists; UI tab added |
| D02 | Operators admin — review moderation list + delete | `[x]` | Crown + Languages buttons in CMS |
| D03 | CMS page draft preview | `[x]` | "View live" link on each CMS row |
| D04 | Bulk publish / unpublish | `[DEFERRED]` | Low priority for v1 |
| D05 | Admin system logs page | `[DEFERRED]` | Low priority for v1 |

---

## 5. Testing

| # | Item | Status | Notes |
|---|------|--------|-------|
| T01 | Backend test suite — all passing | `[x]` | 472/472 pass |
| T02 | Frontend build — zero errors | `[x]` | 178 static pages |
| T03 | Playwright E2E — homepage, search, auth, plan wizard | `[x]` | Basic suite installed and running |
| T04 | Load testing (k6/Locust) | `[DEFERRED]` | Pre-launch performance testing |
| T05 | Cross-browser testing (Safari, Firefox) | `[ ]` | Manual check before launch |
| T06 | Mobile browser testing (iOS Safari, Android Chrome) | `[ ]` | Manual check before launch |

---

## 6. Production Infrastructure (DO WHEN MOVING TO PRODUCTION)

> All items in this section are DEFERRED until the production environment is set up.
> Document the approach here so it can be executed in one sprint.

| # | Item | Status | Notes |
|---|------|--------|-------|
| P01 | Production hosting (backend API) | `[DEFERRED]` | Recommended: Railway / Render / Fly.io for FastAPI |
| P02 | Production hosting (frontend) | `[DEFERRED]` | Recommended: Vercel for Next.js |
| P03 | Managed PostgreSQL (with pgvector) | `[DEFERRED]` | Recommended: Supabase / Neon / AWS RDS |
| P04 | Managed Redis | `[DEFERRED]` | Recommended: Upstash / Railway Redis |
| P05 | Docker production image (arm64 + amd64) | `[DEFERRED]` | Multi-arch build for cloud deploy |
| P06 | GitHub Actions CI/CD pipeline | `[DEFERRED]` | On push to main: test → build → deploy |
| P07 | SSL / custom domain | `[DEFERRED]` | Configure in hosting provider |
| P08 | Object storage for product files | `[DEFERRED]` | Recommended: Cloudflare R2 / AWS S3 |
| P09 | CDN | `[DEFERRED]` | Vercel Edge / Cloudflare |
| P10 | Automated database backups | `[DEFERRED]` | Managed DB backup policy |
| P11 | Log aggregation | `[DEFERRED]` | Recommended: Logtail / Datadog |
| P12 | Secrets manager | `[DEFERRED]` | Railway env vars / Doppler / AWS SSM |
| P13 | Environment variables configured in production | `[DEFERRED]` | See Section 7 below |
| P14 | Celery worker deployed | `[DEFERRED]` | Worker process separate from API |
| P15 | Celery beat deployed | `[DEFERRED]` | Beat scheduler for daily/weekly tasks |
| P16 | Health check monitoring | `[DEFERRED]` | UptimeRobot / Betterstack on /api/v1/health |

---

## 7. Integrations — Configure When Moving to Production

> All API keys are currently in test/fallback mode. Configure these for production launch.
> Never commit real keys to git — use the hosting provider's secret manager.

| # | Integration | Current State | Required Action |
|---|-------------|--------------|-----------------|
| I01 | Anthropic Claude | Rule-based fallback | Set `ANTHROPIC_API_KEY` in production env |
| I02 | OpenAI Embeddings | Similarity fallback | Set `OPENAI_API_KEY` in production env |
| I03 | Google OAuth | Configured locally | Create production OAuth app; set `GOOGLE_CLIENT_ID/SECRET` |
| I04 | Razorpay | Test mode | Create production account; set `RAZORPAY_KEY_ID/SECRET` |
| I05 | Stripe | Test redirect | Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PREMIUM_PRICE_ID_MONTHLY/ANNUAL` |
| I06 | SMTP | Email skipped | Set `SMTP_HOST/PORT/USER/PASSWORD`; recommended: SendGrid / Resend |
| I07 | Mailchimp/Brevo | Skipped | Set `NEWSLETTER_PLATFORM` + API key when audience reaches >100 subs |
| I08 | Google Analytics 4 | Script injected | Set `NEXT_PUBLIC_GA4_ID` |
| I09 | Google AdSense | Dev placeholder | Set `NEXT_PUBLIC_ADSENSE_ID`; must meet traffic threshold first |
| I10 | Google Search Console | Not integrated | Submit sitemap after launch; monitor impressions |
| I11 | Stripe CLI (local dev) | Not configured | `stripe listen --forward-to localhost:8000/api/v1/subscriptions/webhook` |

---

## 8. Pre-Launch Content Checklist (Manual — Owner does this)

| # | Item | Status |
|---|------|--------|
| M01 | Run content pipeline: trigger trend discovery → cluster → brief → approve → write → publish for ≥ 20 treks | `[ ]` |
| M02 | Review and approve all AI-generated briefs | `[ ]` |
| M03 | Review all AI-generated drafts (flag YMYL claims) | `[ ]` |
| M04 | Add affiliate products to catalog (/admin/monetization) | `[ ]` |
| M05 | Add at least 3 digital products (/admin/products) | `[ ]` |
| M06 | Add at least 5 operators (/admin/operators) | `[ ]` |
| M07 | Run seasonal hub regeneration | `[ ]` |
| M08 | Seed email sequences (/admin/email-sequences → Seed button) | `[ ]` |
| M09 | Verify SMTP works by triggering a test lead | `[ ]` |
| M10 | Verify Google OAuth on production domain | `[ ]` |
| M11 | Submit sitemap to Google Search Console | `[ ]` |
| M12 | Test payment flow end-to-end with Razorpay test keys | `[ ]` |
| M13 | Test Stripe subscription checkout with Stripe test keys | `[ ]` |

---

## 9. Final Go/No-Go Gate

All of the following must be `[x]` before launching:

- [ ] A01, A02, A03, A04 — Auth flows complete
- [ ] C01, C02, C03 — Content pipeline run + ≥20 pages published + sitemap live
- [ ] F01–F09 — All public pages functional (no dead buttons or empty stubs)
- [ ] T01, T02, T03 — Backend tests, build, and E2E passing
- [ ] P01–P07 — Production hosting, SSL, domain configured
- [ ] I01–I06 — Core integrations live (Anthropic, SMTP, Google OAuth, payments)
- [ ] M01–M09 — Content and admin seeding done

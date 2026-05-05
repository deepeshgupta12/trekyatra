# STEP 40 — Premium Subscription Layer

## Goal
Add a subscription tier system: premium content gating, Stripe recurring billing, a premium user dashboard, and exclusive content types (paid compendiums, expert route guides). Builds on the digital product checkout (Step 34, Razorpay one-time) and adds a recurring subscription layer via Stripe.

## Scope

### Subscription tiers
- Two tiers: `free` (default) and `premium`
- `subscriptions` table: id UUID PK, user_id FK→users CASCADE, stripe_customer_id, stripe_subscription_id, plan (free/premium), status (active/cancelled/past_due/trialing), current_period_end TIMESTAMP, created_at, updated_at
- Alembic migration
- `users` table: add `subscription_plan` (String, default "free") for fast read without joining subscriptions table

### Stripe integration
- `POST /api/v1/subscriptions/create-checkout` — creates Stripe Checkout Session (monthly/annual plan); returns `checkout_url`
- `POST /api/v1/subscriptions/webhook` — Stripe webhook handler: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`; updates `subscriptions` table + `users.subscription_plan`
- `GET /api/v1/subscriptions/status` — returns current subscription status for authenticated user
- `POST /api/v1/subscriptions/cancel` — cancel at period end (Stripe cancel_at_period_end)
- Stripe webhook secret verified via `stripe.Webhook.construct_event` (HMAC)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PREMIUM_PRICE_ID_MONTHLY`, `STRIPE_PREMIUM_PRICE_ID_ANNUAL` in `.env.example` + `core/config.py`

### Premium content gating
- `is_premium` boolean column on `cms_pages` (Alembic migration)
- Public CMS API: if `cms_pages.is_premium = True` and request user is `free` → return page with `content_html = None`, `is_gated = True` in response
- Frontend: `GatedContent` component — shows teaser intro, blurred content overlay, and "Upgrade to Premium" CTA
- Admin CMS page editor: toggle `is_premium` per page

### Exclusive content types
- New `page_type` values: `premium_compendium`, `expert_guide`
- These are created via the standard content pipeline but marked `is_premium = True` automatically
- Admin can also manually set any cms_page as premium

### Premium user dashboard
- `/account/premium` — subscription status card (plan, renewal date, cancel link), access to premium content list, download history enriched with premium items
- `/premium` — public marketing page: tier comparison table, CTA to subscribe, sample premium content teasers

### Frontend components
- `GatedContent` — blurred overlay + upgrade CTA (client component, reads `useAuth()` for plan check)
- `SubscriptionStatusCard` — shows plan badge, period end, cancel/upgrade actions
- `PricingTable` — monthly vs annual toggle, feature checklist per tier, Stripe checkout CTA
- `PremiumBadge` — small badge component used on content cards and admin pages

## Preconditions
- Read docs/MASTER_TRACKER.md, PROCESS_GUARDRAILS.md, DEPENDENCY_MAP.md
- Confirm Step 34 complete (Razorpay checkout pattern to follow for Stripe)
- Confirm Step 33 complete (user accounts, auth dependency)
- Confirm Step 16 complete (cms_pages model)

## Dependency Check
- `services/api/app/modules/auth/dependencies.py` — `get_current_user` (used for subscription status)
- `services/api/app/modules/cms/models.py` — add `is_premium` column
- `services/api/app/modules/cms/service.py` — gate content in `get_page_by_slug`
- `apps/web-next/lib/auth-context.tsx` — expose `subscription_plan` from user profile
- `apps/web-next/lib/api.ts` — add subscription helpers

## Planned Files to Create
- `services/api/alembic/versions/YYYYMMDD_0029_subscriptions.py`
- `services/api/app/modules/subscriptions/__init__.py`
- `services/api/app/modules/subscriptions/models.py`
- `services/api/app/modules/subscriptions/service.py`
- `services/api/app/schemas/subscriptions.py`
- `services/api/app/api/routes/subscriptions.py`
- `services/api/tests/test_subscriptions.py`
- `apps/web-next/app/(public)/premium/page.tsx`
- `apps/web-next/app/(public)/account/premium/page.tsx`
- `apps/web-next/components/subscription/GatedContent.tsx`
- `apps/web-next/components/subscription/SubscriptionStatusCard.tsx`
- `apps/web-next/components/subscription/PricingTable.tsx`
- `apps/web-next/components/subscription/PremiumBadge.tsx`

## Planned Files to Modify
- `services/api/app/modules/cms/models.py` — add `is_premium` bool column
- `services/api/app/modules/cms/service.py` — gate content_html when is_premium and user is free
- `services/api/app/modules/auth/models.py` — add `subscription_plan` to User
- `services/api/app/db/base.py` — Subscription registered
- `services/api/app/api/router.py` — subscriptions_router registered
- `services/api/app/core/config.py` — Stripe settings added
- `services/api/.env.example` — STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PREMIUM_PRICE_ID_MONTHLY, STRIPE_PREMIUM_PRICE_ID_ANNUAL
- `apps/web-next/lib/api.ts` — Subscription, SubscriptionStatus interfaces; createSubscriptionCheckout, fetchSubscriptionStatus, cancelSubscription helpers
- `apps/web-next/lib/auth-context.tsx` — expose subscription_plan from /account/me or /subscriptions/status
- `apps/web-next/app/(admin)/admin/cms/page.tsx` — is_premium toggle per page
- `apps/web-next/.env.local.example` — NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

## Files Created
(to be filled when step is executed)

## Files Modified
(to be filled when step is executed)

## Status
pending

## Notes
- Stripe webhook must be registered in Stripe Dashboard pointing to `POST /api/v1/subscriptions/webhook`
- In test mode: use Stripe CLI (`stripe listen --forward-to localhost:8000/api/v1/subscriptions/webhook`) to receive webhook events locally
- Grace period: if `invoice.payment_failed` fires, do not immediately revoke access — set status to `past_due` and give 3-day grace window before downgrading
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` needed on frontend to load Stripe.js for the checkout redirect
- Content gating is enforced server-side in the CMS API — not just a frontend UI trick; the `content_html` field is nulled out in the response for free users on premium pages
- Razorpay (Step 34) handles one-time digital product purchases; Stripe handles recurring subscriptions — both coexist independently

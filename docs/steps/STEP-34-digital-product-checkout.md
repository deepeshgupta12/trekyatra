# STEP 34 — Digital Product Checkout and File Delivery

## Goal
Build a digital product catalog, payment integration (Stripe or Razorpay), and post-purchase file delivery. The first direct revenue stream from the platform (beyond affiliate commissions and lead fees).

## Scope

### Digital product catalog
- `digital_products` table: id, slug, title, description, price_inr, file_path (S3 key or local path), preview_image_url, active, created_at
- `GET /api/v1/products` — public product list (active only)
- `GET /api/v1/products/{slug}` — product detail
- Admin CRUD: `GET/POST/PATCH/DELETE /api/v1/admin/products`

### Payment integration
- Primary: Razorpay (India-first); fallback: Stripe (international)
- `PAYMENT_PROVIDER` env var: `razorpay` | `stripe`
- `POST /api/v1/checkout/create-order` — creates payment order (Razorpay order_id or Stripe PaymentIntent)
- `POST /api/v1/checkout/verify` — verifies webhook signature, creates `user_orders` row, triggers file delivery
- `user_orders` table: id, user_id, product_id, order_id (provider), amount_inr, status (pending/paid/refunded), paid_at

### File delivery
- On successful payment: generate a time-limited signed download URL (S3 presigned URL or local signed token, 24h TTL)
- `POST /api/v1/account/downloads/{order_id}/url` — return signed download URL
- Download URL appended to `user_downloads` row (Step 33)
- Email confirmation sent via SMTP with download link

### Frontend
- `/products` page (already exists as stub from Step 08) — wire to real API, product cards with Buy button
- `/products/[slug]` page — product detail + Razorpay/Stripe embed
- `/success/checkout` page (already exists as stub) — show download link + account link
- `/account/downloads` (Step 33) — integrated with real download URL generation

### Admin UI
- `/admin/products` (new page): product list, add/edit form, sales count per product
- `/admin/orders` (new page): order list with status filter

## Preconditions
- Read docs/MASTER_TRACKER.md, PROCESS_GUARDRAILS.md, DEPENDENCY_MAP.md
- Confirm Step 33 complete (user_downloads table, account module)
- Razorpay or Stripe account credentials in .env

## Dependency Check
- `app/modules/account/models.py` — UserDownload (FK to user_orders)
- `app/modules/users/models.py` — User (FK for user_orders)
- `app/api/routes/auth.py` — `get_current_user` dependency

## Planned Files to Create
- `services/api/alembic/versions/YYYYMMDD_0023_digital_products.py`
- `services/api/app/modules/products/__init__.py`
- `services/api/app/modules/products/models.py` — DigitalProduct, UserOrder
- `services/api/app/modules/products/service.py` — create_order, verify_payment, generate_download_url
- `services/api/app/api/routes/products.py` (public + admin)
- `services/api/app/api/routes/checkout.py`
- `services/api/app/schemas/products.py`
- `services/api/tests/test_products.py`
- `apps/web-next/app/(public)/products/[slug]/page.tsx`
- `apps/web-next/app/(admin)/admin/products/page.tsx`
- `apps/web-next/app/(admin)/admin/orders/page.tsx`

## Planned Files to Modify
- `apps/web-next/app/(public)/products/page.tsx` — wire to real API
- `apps/web-next/app/(public)/success/checkout/page.tsx` — show download link
- `services/api/app/db/base.py`
- `services/api/app/api/router.py`
- `services/api/.env.example` — PAYMENT_PROVIDER, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, STRIPE_SECRET_KEY
- `apps/web-next/.env.local.example` — NEXT_PUBLIC_RAZORPAY_KEY_ID, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- `apps/web-next/lib/api.ts`

## Status
pending

## Notes
- File storage in V3: local filesystem path (in `/data/products/`) with a signed HMAC token for download URL — no S3 required initially.
- Razorpay webhook signature verification uses HMAC-SHA256 of `razorpay_order_id|razorpay_payment_id` — store signature in user_orders for audit.
- Never commit real payment credentials. Use test-mode keys in development.

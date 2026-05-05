# STEP 38 — Operator Marketplace Layer

## Goal
Build a public-facing operator marketplace: operator listing and comparison pages, a booking inquiry flow direct to operators, ratings and reviews, and a revenue-share / lead-fee tracking structure. Step 29 created the admin operator management layer and lead routing; this step surfaces it publicly and adds the commercial infrastructure.

## Scope

### Public operator listing
- `/operators` page — grid of active operators with region, trek types, rating, and "Request info" CTA
- `/operators/[slug]` page — operator detail: bio, covered regions, trek types, reviews, inquiry form
- `operators` table already exists (Step 29); add `slug`, `logo_url`, `website_url`, `description_long`, `rating_avg` (float), `review_count` columns
- Alembic migration for new columns

### Booking inquiry flow
- `POST /api/v1/inquiries` — creates a `lead_submission` linked to an operator (`operator_id` FK on `lead_submissions`, nullable)
- On `/operators/[slug]`, the inquiry form pre-fills operator context and submits to this endpoint
- Inquiry confirmation email to user (SMTP, graceful if unconfigured)
- Admin notification to operator email via SMTP (same graceful pattern as Step 22)

### Operator ratings and reviews
- `operator_reviews` table: id UUID PK, operator_id FK→operators CASCADE, user_id FK→users SET NULL, rating (1–5 int), body TEXT, created_at
- Public: `GET /api/v1/operators/{slug}/reviews` — paginated list
- Authenticated user: `POST /api/v1/operators/{slug}/reviews` — one review per user per operator (unique constraint)
- Admin: `DELETE /api/v1/admin/operators/reviews/{id}` — moderation
- Rating average computed and stored on `operators.rating_avg` on every review insert/delete via service layer

### Revenue share / lead-fee structure
- `operator_agreements` table: id UUID PK, operator_id FK→operators CASCADE, lead_fee_inr (float), revenue_share_pct (float, nullable), active bool, notes TEXT, created_at
- Alembic migration
- `lead_fee_inr` charged when a lead is routed to this operator (tracked, not billing)
- Admin: `GET/POST /admin/operators/{id}/agreement`, `PATCH /admin/operators/{id}/agreement`
- Revenue attribution: when a lead for operator X converts, record `lead_fee_inr` in `revenue_attributions` for that operator's pages

### Admin extensions
- `/admin/operators` (existing from Step 29) — add agreement tab per operator, review list with delete
- KPI strip: total operators, total inquiries, avg rating, projected lead revenue

### Frontend components
- `OperatorCard` — logo, name, region tags, rating stars, CTA button
- `OperatorGrid` — responsive card grid
- `OperatorReviewList` — paginated reviews with star rating
- `OperatorInquiryForm` — pre-fills trek interest, operator context; calls `POST /inquiries`

## Preconditions
- Read docs/MASTER_TRACKER.md, PROCESS_GUARDRAILS.md, DEPENDENCY_MAP.md
- Confirm Step 29 complete (operators table, admin management, lead routing)
- Confirm Step 22 complete (lead_submissions table, SMTP notification pattern)
- Confirm Step 20 complete (LeadForm component pattern to follow)

## Dependency Check
- `services/api/app/modules/operators/models.py` — Operator model (extend, do not replace)
- `services/api/app/modules/leads/models.py` — LeadSubmission (add operator_id FK)
- `services/api/app/api/router.py` — register new public operators router
- `apps/web-next/lib/api.ts` — add operator + review + inquiry helpers

## Planned Files to Create
- `services/api/alembic/versions/YYYYMMDD_0027_operator_marketplace.py`
- `services/api/app/modules/operators/review_service.py`
- `services/api/app/modules/operators/agreement_service.py`
- `services/api/app/schemas/operators.py` — extend with OperatorReview, OperatorAgreement schemas
- `services/api/app/api/routes/operators_public.py`
- `services/api/tests/test_operators_marketplace.py`
- `apps/web-next/app/(public)/operators/page.tsx`
- `apps/web-next/app/(public)/operators/[slug]/page.tsx`
- `apps/web-next/components/operators/OperatorCard.tsx`
- `apps/web-next/components/operators/OperatorGrid.tsx`
- `apps/web-next/components/operators/OperatorReviewList.tsx`
- `apps/web-next/components/operators/OperatorInquiryForm.tsx`

## Planned Files to Modify
- `services/api/app/modules/operators/models.py` — slug, logo_url, website_url, description_long, rating_avg, review_count
- `services/api/app/modules/leads/models.py` — operator_id FK nullable
- `services/api/app/api/routes/operators.py` — add review + agreement admin endpoints
- `services/api/app/api/router.py` — operators_public_router registered
- `apps/web-next/app/(admin)/admin/operators/page.tsx` — agreement tab + review moderation
- `apps/web-next/lib/api.ts` — OperatorReview, OperatorAgreement, fetchOperators, fetchOperator, submitInquiry, fetchReviews, submitReview helpers
- `apps/web-next/app/(public)/layout.tsx` — add Operators to main nav if appropriate

## Files Created
(to be filled when step is executed)

## Files Modified
(to be filled when step is executed)

## Status
pending

## Notes
- Operator slugs: auto-generated from operator name (slugify); must be unique; stored on the operators table
- Rating average is denormalised for read performance — recomputed on every review write via the service layer, not in a separate job
- Lead fee tracking is informational only at this stage — no real payment collection from operators
- Operator inquiry emails must respect the same graceful SMTP skip pattern as Step 22 and Step 31: wrap in try/except, never block the HTTP response
- Do not build a full billing system — lead_fee_inr is a tracker for the revenue dashboard; actual invoicing is out of scope for this step

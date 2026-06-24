# STEP-78 — Web Trip Reports & Trail Conditions

**Status:** Done — 2026-06-24
**Phase:** Community / UGC
**Paired with:** STEP-M17 (mobile — consumes the same backend)
**Dependencies:** Auth system (Step 02), Trek detail page `/trek/[slug]` (Step 18+), Admin panel (Step 30+)

---

## Scope

This step delivers the **entire shared backend** (DB migration, ORM models, Pydantic schemas, service layer, API routes, backend tests) for Trip Reports — used by BOTH web and mobile. It also delivers the **web-specific surfaces**:

1. A **"Trail Conditions" section** appended to `/trek/[slug]` page — condition summary banner + last 5 approved reports with photo gallery/lightbox + auth-gated "Add report" form inline.
2. An **admin moderation queue** at `/admin/reports` — approve/reject pending reports with optional reason.

Photo gallery/lightbox is in scope for web (full-screen image modal with prev/next navigation).

---

## New URLs (per CLAUDE.md §17 — confirmed)

| URL | Type | Notes |
|-----|------|-------|
| `/admin/reports` | Admin page | Moderation queue — pending/approved/rejected filter tabs |
| `/api/v1/public/treks/{slug}/reports` | Public GET | Paginated approved reports + condition_summary envelope |
| `/api/v1/reports` | Auth POST | Submit a new report (status=pending) |
| `/api/v1/reports/media/upload` | Auth POST | Upload photo → DO Spaces → CDN URL |
| `/api/v1/reports/{id}` | Auth DELETE | Delete own pending report |
| `/api/v1/admin/reports` | Admin GET | Moderation queue (filterable by status) |
| `/api/v1/admin/reports/{id}/moderate` | Admin PATCH | Approve or reject a report |

No new public page URL — reports are a section within the existing `/trek/[slug]` page.

---

## Files to Create

### Backend
| File | Purpose |
|------|---------|
| `services/api/alembic/versions/20260624_0046_trip_reports.py` | Migration: `trip_reports` + `trek_media` tables + indexes |
| `services/api/app/modules/reports/models.py` | ORM: `TripReport`, `TrekMedia` |
| `services/api/app/modules/reports/schemas.py` | Pydantic: `ReportIn`, `ReportOut`, `MediaUploadOut`, `ReportPageOut`, `ModerationIn` |
| `services/api/app/modules/reports/service.py` | Service: `create_report`, `get_reports_for_trek`, `upload_media`, `moderate_report`, `delete_report`, `get_moderation_queue`, `get_condition_summary` |
| `services/api/app/api/routes/reports.py` | All report routes (public + auth + admin) |
| `services/api/tests/test_reports_m17.py` | 8 backend tests |

### Web Frontend
| File | Purpose |
|------|---------|
| `apps/web-next/components/trek/TrekReportsSection.tsx` | Full reports section: ConditionSummaryBanner + ReportsList + AddReportForm; embedded in trek detail page |
| `apps/web-next/components/trek/ConditionSummaryBanner.tsx` | Condition pill strip: % Open/Caution/Closed + count + freshness |
| `apps/web-next/components/trek/TripReportCard.tsx` | Individual report card: user, date, condition badge, text, photo thumbs |
| `apps/web-next/components/trek/AddReportForm.tsx` | Inline collapsible form — trail date, condition, title, body, up to 3 photos |
| `apps/web-next/components/trek/PhotoGallery.tsx` | Full-screen lightbox modal (dialog + keyboard nav ← → Esc, image counter) |
| `apps/web-next/lib/reports.ts` | API client: `fetchReports(slug, page)`, `submitReport(payload)`, `uploadPhoto(file)`, `deleteReport(id)` |
| `apps/web-next/app/(admin)/admin/reports/page.tsx` | Admin moderation queue page |

## Files to Modify

| File | Change |
|------|--------|
| `services/api/app/db/base.py` | Import `TripReport`, `TrekMedia` models |
| `services/api/app/api/router.py` | Register `reports_router` before existing dynamic routes |
| `services/api/app/core/config.py` | Add `do_spaces_key`, `do_spaces_secret`, `do_spaces_bucket`, `do_spaces_region`, `do_spaces_cdn_endpoint` settings |
| `services/api/.env.example` | Document all 5 DO Spaces vars |
| `apps/web-next/app/(public)/trek/[slug]/page.tsx` | Add `<TrekReportsSection slug={slug} />` before `<StickyMobileCTA>` |
| `apps/web-next/app/(admin)/admin/layout.tsx` (or sidebar) | Add "Reports" nav link under Community section |
| `docs/URL_MAP.md` | Add all 7 new URLs above |

---

## Database

### `trip_reports`
```sql
CREATE TABLE trip_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    trek_slug       VARCHAR(200) NOT NULL,
    title           VARCHAR(255),
    body            TEXT NOT NULL,
    condition       VARCHAR(32) NOT NULL CHECK (condition IN ('open','caution','closed','unknown')),
    trek_date       DATE NOT NULL,
    status          VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    moderated_by    UUID REFERENCES users(id) ON DELETE SET NULL,
    moderated_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reports_trek_slug  ON trip_reports(trek_slug);
CREATE INDEX idx_reports_status     ON trip_reports(status);
CREATE INDEX idx_reports_created_at ON trip_reports(created_at DESC);
```

### `trek_media`
```sql
CREATE TABLE trek_media (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id    UUID REFERENCES trip_reports(id) ON DELETE CASCADE,
    user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
    trek_slug    VARCHAR(200) NOT NULL,
    url          TEXT NOT NULL,
    s3_key       TEXT NOT NULL,
    width        INTEGER,
    height       INTEGER,
    file_size    INTEGER,
    uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_media_report_id ON trek_media(report_id);
CREATE INDEX idx_media_trek_slug ON trek_media(trek_slug);
```

---

## Backend Routes

```python
# Public
GET  /api/v1/public/treks/{slug}/reports
     → ReportPageOut { items: list[ReportOut], condition_summary, total, page, has_more }
     Only approved reports. Default page_size=10.

# Auth required
POST   /api/v1/reports
       body: ReportIn { trek_slug, title?, body, condition, trek_date, photo_urls: list[str] }
       → ReportOut (status=pending, 201)

POST   /api/v1/reports/media/upload
       multipart: file (JPEG/PNG/WebP, max 5MB)
       → { url: str, key: str }
       Upload to DO Spaces at reports/{user_id}/{uuid4()}.jpg
       Resize to max 1920px wide server-side (Pillow)

DELETE /api/v1/reports/{id}
       → 204. Own pending reports only; cannot delete approved.

# Admin
GET  /api/v1/admin/reports?status=pending|approved|rejected&page=1
     → { items: list[ReportOut], total, page, has_more }

PATCH /api/v1/admin/reports/{id}/moderate
      body: ModerationIn { action: "approve"|"reject", reason?: str }
      → ReportOut (updated status + moderated_by + moderated_at)
```

### Condition Summary (included in public list response)
```python
# condition_summary in ReportPageOut
{
  "total_reports": 10,
  "open_pct": 80,
  "caution_pct": 15,
  "closed_pct": 5,
  "unknown_pct": 0,
  "last_report_date": "2026-02-12"
}
# Computed from last 10 approved reports for the trek slug
```

---

## Service Layer

```python
# modules/reports/service.py

def create_report(db, user_id, report_in: ReportIn) -> TripReport:
    # Insert with status=pending; link photo_urls as TrekMedia rows

def get_reports_for_trek(db, trek_slug, page=1, page_size=10) -> ReportPageOut:
    # Query approved reports ordered by created_at DESC
    # Compute condition_summary from last 10 approved

def upload_media(db, user_id, file: UploadFile) -> MediaUploadOut:
    # Validate content_type in (image/jpeg, image/png, image/webp)
    # Validate size <= 5MB
    # Resize to max 1920px wide with Pillow
    # Upload to DO Spaces via boto3 (s3 compatible)
    # Insert TrekMedia row (report_id=None until report submitted)
    # Return CDN URL

def moderate_report(db, report_id, admin_user_id, action, reason) -> TripReport:
    # Set status=approved|rejected, moderated_by, moderated_at

def delete_report(db, report_id, user_id) -> None:
    # Only own + pending; raise 403 if approved

def get_moderation_queue(db, status="pending", page=1) -> dict:
    # Filterable by status; include user email + trek_slug + media count
```

### DO Spaces Storage
```python
# Use boto3 with endpoint_url=f"https://{region}.digitaloceanspaces.com"
# Key pattern: reports/{user_id}/{uuid4()}.jpg
# ACL: public-read (CDN serves directly)
# CDN URL: {DO_SPACES_CDN_ENDPOINT}/reports/{user_id}/{filename}
```

---

## Web: Trek Detail Reports Section

Inserted in `/trek/[slug]/page.tsx` just before `<StickyMobileCTA>`:

```tsx
{/* Trail Conditions — UGC Reports */}
<section id="trail-conditions" className="mt-16 border-t border-foreground/10 pt-12">
  <TrekReportsSection slug={params.slug} />
</section>
```

### TrekReportsSection layout
```
Trail Conditions
─────────────────────────────
ConditionSummaryBanner
  ● Open 80%  ⚠ Caution 15%  ✗ Closed 5%
  Based on 10 reports  ·  Last updated 12 Feb 2026

TripReportCard
  [avatar initials] Priya S.  ·  Open  ·  12 Feb 2026
  "Great conditions, summit clear"
  Trail was perfect...
  [photo thumb] [photo thumb]   ← click → PhotoGallery lightbox

[Load more reports]  (if has_more)

─────────────────────────────
[+ Add your report]   ← auth-gated; expands AddReportForm inline
```

### PhotoGallery (web lightbox)
- Full-screen `<dialog>` element (accessible, backdrop click to close)
- Keyboard navigation: `←` / `→` arrows, `Esc` to close
- Image counter "2 / 3" top-right
- Previous/Next buttons on sides
- No external lightbox dependency — built with Tailwind + `<dialog>` + React state

### AddReportForm (web inline)
- Collapsible — hidden until user clicks "+ Add your report"
- Auth-gate: if not logged in, shows "Sign in to add a report" prompt instead
- Fields: Trek date (max=today), Condition radio group, Title (optional), Body textarea (50–2000 chars, live char counter), Photo upload (max 3, JPEG/PNG/WebP, max 5MB each)
- Submit → POST /api/v1/reports → success banner "Your report is under review"

---

## Admin Moderation Queue (`/admin/reports`)

```
[Page: "Trip Reports — Moderation"]
[Pending: 3]  [Approved: 47]  [Rejected: 5]   ← status filter tabs

[Report row — card]
  @Priya S.  ·  Kedarkantha  ·  ● Open  ·  2 photos  ·  12 Feb 2026
  "Great conditions, summit clear..."
  [Approve]  [Reject ↓ (reason textarea)]
```

Uses admin design system (dark theme `bg-[#14161f]` cards, `border-white/10`, status badge pattern from CLAUDE.md §15).

---

## Backend Tests

| ID | Test name | Verifies |
|----|-----------|---------|
| TC-B-M17-01 | `test_create_report` | POST /reports returns 201, status=pending |
| TC-B-M17-02 | `test_pending_report_not_in_public` | Public list only returns approved reports |
| TC-B-M17-03 | `test_approve_report` | PATCH /admin/reports/{id}/moderate action=approve → status=approved |
| TC-B-M17-04 | `test_approved_report_in_public` | Approved report visible in public list |
| TC-B-M17-05 | `test_media_upload_accepts_jpeg` | POST /reports/media/upload with JPEG → 200 + CDN URL |
| TC-B-M17-06 | `test_media_upload_rejects_pdf` | Non-image content type → 400 |
| TC-B-M17-07 | `test_condition_summary` | Public list returns condition_summary with correct pct breakdown |
| TC-B-M17-08 | `test_delete_own_report` | User can delete own pending report (204); cannot delete approved (403) |

Run: `PYTHONPATH=services/api .venv/bin/pytest services/api/tests/test_reports_m17.py -v`

---

## Web Frontend Test Cases

### TC-F-W17-01: Trek detail — reports section renders
**URL:** http://localhost:3000/trek/kedarkantha
**Steps:** Scroll to bottom of trek detail page.
**Expected:** "Trail Conditions" section visible with ConditionSummaryBanner (or "No reports yet" if empty).

### TC-F-W17-02: Add report — not logged in
**Steps:** Click "+ Add your report".
**Expected:** "Sign in to add a report" prompt shown; form does not expand.

### TC-F-W17-03: Add report — logged in happy path
**Steps:** Sign in, visit trek detail, click "+ Add your report", fill all required fields, submit.
**Expected:** Success banner "Your report is under review"; form collapses; report NOT visible in list yet (pending).

### TC-F-W17-04: Photo upload + gallery
**Steps:** In AddReportForm, upload 2 photos. Submit report. Admin approves. Reload trek detail.
**Expected:** Approved report card shows 2 photo thumbs. Click a thumb → full-screen PhotoGallery opens. ← → keys navigate. Esc closes.

### TC-F-W17-05: Admin moderation queue
**URL:** http://localhost:3000/admin/reports
**Steps:** Pending reports listed. Click Approve.
**Expected:** Report status changes to Approved; disappears from Pending tab; appears in Approved tab.

### TC-F-W17-06: Condition summary updates
**Steps:** Approve 5 reports with varying conditions (Open ×3, Caution ×1, Closed ×1).
**Expected:** ConditionSummaryBanner shows ≈60% Open, ≈20% Caution, ≈20% Closed.

### TC-F-W17-07: Mobile layout (375px)
**Steps:** Resize browser to 375px, visit trek detail.
**Expected:** Reports section renders correctly, ConditionSummaryBanner readable, photo thumbs visible, Add Report button visible.

---

## Implementation Order

Follow CLAUDE.md §2 strictly:

1. Migration → run `alembic upgrade head`
2. ORM models → `models.py` + register in `db/base.py`
3. Pydantic schemas → `schemas.py`
4. Service layer → `service.py` (including DO Spaces upload)
5. Routes → `routes/reports.py` + register in `router.py`
6. Backend tests → all 8 pass
7. `make test` clean
8. Frontend lib → `lib/reports.ts`
9. Frontend components → TrekReportsSection, ConditionSummaryBanner, TripReportCard, AddReportForm, PhotoGallery
10. Trek detail page → add `<TrekReportsSection>`
11. Admin page → `/admin/reports`
12. Admin sidebar link
13. `next build` clean
14. MD file updates + `docs/URL_MAP.md`
15. GitNexus re-index

**Then** proceed to STEP-M17 mobile implementation.

---

## Env Vars

| Var | File | Notes |
|-----|------|-------|
| `DO_SPACES_KEY` | `services/api/.env` + `.env.example` | DO Spaces access key |
| `DO_SPACES_SECRET` | `services/api/.env` + `.env.example` | DO Spaces secret key |
| `DO_SPACES_BUCKET` | `services/api/.env` + `.env.example` | Bucket name (e.g. `trekyatra-media`) |
| `DO_SPACES_REGION` | `services/api/.env` + `.env.example` | Region (e.g. `blr1`) |
| `DO_SPACES_CDN_ENDPOINT` | `services/api/.env` + `.env.example` | CDN base URL (e.g. `https://cdn.trekyatra.co.in`) |

These were flagged as needed before M17 in `docs/MASTER_TRACKER.md`. Add to `config.py` `Settings` class with `Optional[str] = None` defaults (so tests pass without real DO Spaces credentials; mock storage in tests).

---

## Notes

- Media upload uses `boto3` with `endpoint_url` pointing to DO Spaces (S3-compatible). Add `boto3` + `Pillow` to `requirements.txt` if not already present.
- For backend tests, mock the DO Spaces upload (`unittest.mock.patch` the boto3 `put_object` call) so tests don't require real credentials.
- Router registration: `reports_router` must be added in `router.py` before any wildcard/dynamic routes that could shadow `/reports/{id}`.
- `trek_media` rows are created with `report_id=None` on upload (before form submit). They are linked to a `TripReport` on report creation. Orphaned rows (upload without submit) are cleaned by a DO Spaces lifecycle rule on `reports/` prefix TTL 24h — set manually in DO Spaces console.

---

## Files Created

*(populated on completion)*

## Files Modified

*(populated on completion)*

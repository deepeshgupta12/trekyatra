# STEP-M17 — Trip Reports & Photos

**Status:** Pending
**Phase:** Community
**Dependencies:** STEP-M02 (auth), STEP-M05 (trek detail — reports visible there), STEP-M16 (check-in unlocks report prompt)
**Backend step:** Yes — new DB tables (`trip_reports`, `trek_media`), media upload endpoint, admin moderation queue

---

## Scope

User-generated condition reports with optional photo uploads. Reports are visible on Trek Detail screens (below the official content), providing crowdsourced trail condition data. Photos are stored in S3-compatible object storage and served via CDN. An admin moderation queue allows approving/rejecting reports before they go live. This is the primary UGC surface in V5 — keep it simple: title, condition rating, date, text, up to 3 photos.

---

## Files to Create

### Backend
| File | Purpose |
|------|---------|
| `services/api/alembic/versions/YYYYMMDD_0046_trip_reports.py` | Migration: `trip_reports` + `trek_media` tables |
| `services/api/app/modules/reports/models.py` | ORM: `TripReport`, `TrekMedia` |
| `services/api/app/modules/reports/schemas.py` | Pydantic: `ReportIn`, `ReportOut`, `MediaOut`, `ReportPageOut` |
| `services/api/app/modules/reports/service.py` | Service: `create_report`, `get_reports_for_trek`, `upload_media`, `moderate_report` |
| `services/api/app/api/routes/reports.py` | Public + auth + admin report routes |
| `services/api/tests/test_reports_m17.py` | Backend report tests |

### Mobile
| File | Purpose |
|------|---------|
| `apps/mobile/app/(tabs)/browse/[slug]/reports.tsx` | Trek reports list screen (linked from trek detail) |
| `apps/mobile/components/reports/TripReportCard.tsx` | Report card: user, date, condition badge, text, photos |
| `apps/mobile/components/reports/AddReportSheet.tsx` | Submit report bottom sheet |
| `apps/mobile/components/reports/PhotoPicker.tsx` | Up to 3 photos from camera/library |
| `apps/mobile/hooks/useReports.ts` | Fetch reports, submit report, upload photos |

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
    condition       VARCHAR(32) NOT NULL,  -- open | caution | closed | unknown
    trek_date       DATE NOT NULL,          -- date user was on the trail
    status          VARCHAR(32) NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
    moderated_by    UUID REFERENCES users(id) ON DELETE SET NULL,
    moderated_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reports_trek_slug ON trip_reports(trek_slug);
CREATE INDEX idx_reports_status ON trip_reports(status);
CREATE INDEX idx_reports_created_at ON trip_reports(created_at DESC);
```

### `trek_media`
```sql
CREATE TABLE trek_media (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id    UUID REFERENCES trip_reports(id) ON DELETE CASCADE,
    user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
    trek_slug    VARCHAR(200) NOT NULL,
    url          TEXT NOT NULL,          -- CDN URL
    s3_key       TEXT NOT NULL,
    width        INTEGER,
    height       INTEGER,
    file_size    INTEGER,               -- bytes
    uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_media_report_id ON trek_media(report_id);
CREATE INDEX idx_media_trek_slug ON trek_media(trek_slug);
```

---

## Backend Routes

```python
# public
GET    /api/v1/public/treks/{slug}/reports        → get approved reports for trek (paginated)

# auth required
POST   /api/v1/reports                            → create_report (pending status)
POST   /api/v1/reports/media/upload               → upload photo (returns CDN URL)
DELETE /api/v1/reports/{id}                       → delete own report

# admin
GET    /api/v1/admin/reports?status=pending       → moderation queue
PATCH  /api/v1/admin/reports/{id}/moderate        → approve | reject
```

### Media Upload

```python
@router.post("/reports/media/upload")
async def upload_media(
    file: UploadFile,
    current_user: User = Depends(require_auth),
):
    """Upload photo. Max 5MB. Resize to max 1920x1440 before storing."""
    if file.content_type not in ('image/jpeg', 'image/png', 'image/webp'):
        raise HTTPException(400, "Only JPEG/PNG/WebP accepted")
    if file.size > 5 * 1024 * 1024:
        raise HTTPException(400, "Max file size 5MB")

    key = f"reports/{current_user.id}/{uuid4()}.jpg"
    url = await storage_service.upload(file, key)
    return {"url": url, "key": key}
```

Storage service: wraps `boto3` S3 client or Cloudflare R2. URL pattern: `https://cdn.trekyatra.co.in/reports/{key}`.

---

## Mobile: Add Report Sheet

```
"Add a trip report"
────────────────────────────────
Trek             [auto-filled from context]
Date on trail *  [date picker — max: today]
Condition *      [Trail is: ● Open  ○ Caution  ○ Closed  ○ Unknown]
Title            [optional, short]
Your experience  [multiline text — 50 to 2000 chars] *
Photos           [+ Add photos] (up to 3)
                 [thumb1] [thumb2] [+ Add]
────────────────────────────────
[Submit report]
```

After submit: "Your report is under review. It will appear once approved (usually within 24h)."

---

## Photo Picker Component

```typescript
// components/reports/PhotoPicker.tsx
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

async function pickPhoto(): Promise<string> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.85,
    allowsEditing: true,
    aspect: [4, 3],
  });

  if (result.canceled) return null;

  // Resize to max 1280px wide before upload
  const resized = await ImageManipulator.manipulateAsync(
    result.assets[0].uri,
    [{ resize: { width: 1280 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );

  return resized.uri;
}
```

Photos uploaded immediately on selection (before form submit), returning a CDN URL. If submit is cancelled, orphaned objects are cleaned up by a daily S3 lifecycle rule (`reports/temp/` prefix TTL = 24h).

---

## Trek Reports Screen

```
[Page: "Trip Reports — Kedarkantha"]
[Condition summary banner]
  ● 80% Open  ⚠ 15% Caution  ✗ 5% Closed
  (Based on last 10 reports)
────────────────────────────────
[ReportCard]
  [User avatar] Priya S.  · 12 Feb 2026
  ● Open   · "Great conditions, summit clear"
  Trail was perfect. Snow started at 10,000ft...
  [photo thumb] [photo thumb]
[ReportCard]
  ...
────────────────────────────────
[+ Add your report]  (CTA at bottom, auth-gated)
```

Condition summary: computed from last 10 approved reports for the trek (backend aggregation in service layer).

---

## Trek Detail Integration

On Trek Detail screen (STEP-M05), add a "Conditions" section below the main tabs:
```tsx
<Pressable onPress={() => router.push(`/browse/${slug}/reports`)}>
  <ConditionSummaryBadge condition={latestCondition} reportCount={reportCount} />
  <Text>See {reportCount} trip reports →</Text>
</Pressable>
```

Backend: `GET /public/treks/{slug}/reports` returns first page with `condition_summary` in the response envelope.

---

## Admin Moderation Queue

Extend the existing admin panel (`/admin/reports`):

```
[Page: "Trip Reports — Moderation"]
[Pending: 3]  [Approved: 47]  [Rejected: 5]
────────────────────────────────
[Report row]
  @Priya  · Kedarkantha  · Open  · 2 photos
  "Great conditions, summit clear..."
  [Approve]  [Reject]
```

`PATCH /admin/reports/{id}/moderate` body: `{ "action": "approve" | "reject", "reason": "..." }`.

---

## useReports Hook

```typescript
export function useReports(trekSlug: string) {
  const { data, isLoading, fetchNextPage } = useInfiniteQuery({
    queryKey: ['reports', trekSlug],
    queryFn: ({ pageParam = 1 }) =>
      api.get(`/public/treks/${trekSlug}/reports?page=${pageParam}`),
    getNextPageParam: (last) => last.has_more ? last.page + 1 : undefined,
  });

  return {
    reports: data?.pages.flatMap(p => p.items) ?? [],
    conditionSummary: data?.pages[0]?.condition_summary,
    isLoading,
    loadMore: fetchNextPage,
  };
}

export function useSubmitReport() {
  return useMutation({
    mutationFn: async (payload: ReportPayload) => {
      // Upload photos first, collect CDN URLs
      const photoUrls = await Promise.all(
        payload.localUris.map(uri => uploadPhoto(uri))
      );
      return api.post('/reports', { ...payload, photo_urls: photoUrls });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports'] }),
  });
}
```

---

## Backend Tests

| Test ID | Verifies |
|---------|---------|
| TC-B-M17-01 | `test_create_report` — POST /reports returns 201, status=pending |
| TC-B-M17-02 | `test_pending_report_not_in_public` — public list only returns approved |
| TC-B-M17-03 | `test_approve_report` — PATCH /admin/reports/{id}/moderate returns 200, status=approved |
| TC-B-M17-04 | `test_approved_report_in_public` — approved report visible in public list |
| TC-B-M17-05 | `test_media_upload_accepts_jpeg` — POST /reports/media/upload with JPEG returns CDN URL |
| TC-B-M17-06 | `test_media_upload_rejects_pdf` — non-image returns 400 |
| TC-B-M17-07 | `test_condition_summary` — public list returns condition_summary aggregation |
| TC-B-M17-08 | `test_delete_own_report` — user can delete own pending report; cannot delete approved |

---

## Verification (Manual)

1. **TC-M17-01**: Trek detail shows "See N trip reports" link (or "No reports yet")
2. **TC-M17-02**: Tap link → Reports screen loads with condition summary banner
3. **TC-M17-03**: "Add your report" (logged-in) → sheet opens → fill fields → submit → "Under review" message
4. **TC-M17-04**: Add photos in sheet → thumbs preview before submit
5. **TC-M17-05**: Admin approves report → appears in trek reports list immediately
6. **TC-M17-06**: Pending report NOT visible to other users
7. **TC-M17-07**: Condition summary updates after multiple approved reports

---

## Notes

- Reports are moderated (not auto-published) to prevent spam and misinformation about trail conditions — getting trail condition wrong could be dangerous
- `expo-image-manipulator` must be in dependencies — not included in base Expo SDK 51
- S3 lifecycle rule for orphaned uploads: configure `reports/` prefix with `AbortIncompleteMultipartUpload` after 1 day and an expiry rule for objects with no associated `trek_media` row (implemented via Lambda or manual cleanup task)
- Report photos are served from `cdn.trekyatra.co.in` — ensure CORS headers set correctly for the mobile app bundle origin
- Max 3 photos per report — enough for trail conditions context; no gallery feature needed in V5

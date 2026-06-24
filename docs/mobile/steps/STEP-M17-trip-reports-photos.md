# STEP-M17 — Trip Reports & Photos (Mobile)

**Status:** Pending
**Phase:** Community
**Dependencies:** STEP-M02 (auth), STEP-M05 (trek detail — Reports tab added here), STEP-M16 (check-in unlocks report prompt)
**Backend step:** STEP-78 (shared backend — M17 mobile consumes the same API)
**Paired with:** STEP-78 (web) — backend implemented once, shared by both

---

## Scope

User-generated trail condition reports with optional photo uploads, accessible as a **new "Reports" tab on the Trek Detail screen**. Reports are crowdsourced trail condition data (open/caution/closed/unknown), moderated before going live. Photos are stored in DO Spaces and served via CDN. **Photo gallery/lightbox is in scope** — full-screen swipeable viewer when tapping any report photo thumbnail. This step covers only the **mobile surfaces** — the backend (DB migration, service, routes, tests) is implemented in STEP-78 so it ships once and works for both web and mobile.

---

## Changes from Original Step Doc

1. **Reports as a tab** — not a standalone screen. `apps/mobile/app/(tabs)/browse/[slug]/reports.tsx` is NOT created. Reports live as the 5th tab inside the existing TrekDetailScreen. The `TrekTabBar` type extends from `"guide" | "packing" | "permits" | "costs"` to add `"reports"`.
2. **Photo gallery/lightbox** — full-screen swipeable photo viewer (FlatList + pagingEnabled + expo-image) when tapping any photo thumbnail in TripReportCard.
3. **No new route file** — the browse `_layout.tsx` does NOT need a new `Stack.Screen` for reports.

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/mobile/components/reports/TripReportCard.tsx` | Report card: user avatar, date, condition badge, text, photo thumbs; tap thumb → PhotoGallery |
| `apps/mobile/components/reports/AddReportSheet.tsx` | Submit report bottom sheet — trail date, condition picker, title, body (50–2000 chars), up to 3 photos |
| `apps/mobile/components/reports/PhotoPicker.tsx` | Pick up to 3 photos from camera/library; resize to 1280px max before upload; show inline thumbs with remove button |
| `apps/mobile/components/reports/PhotoGallery.tsx` | Full-screen swipeable lightbox modal (Modal + FlatList pagingEnabled + expo-image); shows index indicator + close button |
| `apps/mobile/components/reports/ConditionSummaryBanner.tsx` | Compact banner: % Open/Caution/Closed from last 10 approved reports + report count |
| `apps/mobile/hooks/useReports.ts` | `useReports(trekSlug)` paginated fetch; `useSubmitReport()` mutation — upload photos then POST report |

## Files to Modify

| File | Change |
|------|--------|
| `apps/mobile/components/trek/TrekTabBar.tsx` | Add `"reports"` to `TrekTab` union + TABS array (5th tab); optional count badge on label |
| `apps/mobile/app/(tabs)/browse/[slug]/index.tsx` | Add `"reports"` to `activeTab` state; render Reports tab content: ConditionSummaryBanner + FlatList of TripReportCard + AddReportSheet trigger |

---

## Mobile: Reports Tab Layout

```
TrekDetailScreen
  ├── TrekTabBar  [Guide] [Packing] [Permits] [Costs] [Reports ●3]
  └── (when Reports tab active)
      ConditionSummaryBanner
        ● Open 80%  ⚠ Caution 15%  ✗ Closed 5%
        Based on 10 recent reports
      ─────────────────────────────
      TripReportCard
        [avatar] Priya S.  ·  12 Feb 2026
        ● Open  · "Great conditions, summit clear"
        Trail was perfect. Snow started at 10,000ft...
        [photo thumb] [photo thumb]   ← tap → PhotoGallery full-screen
      TripReportCard ...
      ─────────────────────────────
      [+ Add your report]  (auth-gated CTA at bottom)
```

Tab badge: if `conditionSummary.total_reports > 0`, show count dot next to "Reports" label.

---

## Add Report Sheet Fields

```
Trail date *      [date picker — max: today]
Condition *       [● Open  ○ Caution  ○ Closed  ○ Unknown]
Title             [optional, max 255 chars]
Your experience * [multiline, 50–2000 chars]
Photos            [+ Add photos] up to 3
                  [thumb1 ×] [thumb2 ×] [+ Add]
─────────────────────────────
[Submit report]
```

Post-submit toast: "Your report is under review. It will appear once approved (usually within 24h)."

---

## Photo Gallery (Lightbox)

```typescript
// components/reports/PhotoGallery.tsx
// Full-screen Modal + FlatList (horizontal, pagingEnabled)
// Displays: close (×) button top-right, index indicator "1 / 3"
// expo-image supports pinch-to-zoom natively
// Props: photos: string[] (CDN URLs), initialIndex: number, visible: boolean, onClose: () => void
// No external carousel dependency
```

---

## PhotoPicker Component

```typescript
// Max 3 photos; tap + to add one at a time (additive)
// On pick: expo-image-manipulator resize to max width 1280px, compress 0.8, JPEG output
// Upload immediately on pick → returns CDN URL stored in form state
// Remove button (×) on each thumb removes from local state only (orphaned CDN objects cleaned by DO Spaces lifecycle rule, TTL 24h)
// Deps needed in package.json: expo-image-picker, expo-image-manipulator
```

---

## useReports Hook

```typescript
export function useReports(trekSlug: string) {
  // useInfiniteQuery: ['reports', trekSlug]
  // GET /api/v1/public/treks/{trekSlug}/reports?page=N
  // returns: { reports, conditionSummary, isLoading, loadMore, hasMore }
}

export function useSubmitReport() {
  // useMutation
  // 1. Upload photos in parallel (Promise.all each localUri → POST /api/v1/reports/media/upload → CDN URL)
  // 2. POST /api/v1/reports { trek_slug, title, body, condition, trek_date, photo_urls }
  // 3. Invalidate ['reports', trekSlug] on success
}
```

---

## Env Vars Required (set in STEP-78 backend)

| Var | Purpose |
|-----|---------|
| `DO_SPACES_KEY` | DO Spaces access key |
| `DO_SPACES_SECRET` | DO Spaces secret |
| `DO_SPACES_BUCKET` | Bucket name (e.g. `trekyatra-media`) |
| `DO_SPACES_REGION` | Region (e.g. `blr1`) |
| `DO_SPACES_CDN_ENDPOINT` | CDN base URL (e.g. `https://cdn.trekyatra.co.in`) |

---

## Mobile Manual Test Cases

| ID | Test | Pass criteria |
|----|------|--------------|
| TC-M17-01 | Trek detail → tap "Reports" tab | Reports tab renders; ConditionSummaryBanner or "No reports yet" empty state |
| TC-M17-02 | Scroll to bottom of reports list | Next page fetched (infinite scroll) |
| TC-M17-03 | Tap "+ Add your report" (not logged in) | Auth prompt shown; sheet does not open |
| TC-M17-04 | Tap "+ Add your report" (logged in) | AddReportSheet slides up |
| TC-M17-05 | Fill required fields + submit | Toast "under review" shown; sheet closes; reports list invalidated |
| TC-M17-06 | Add 3 photos | All 3 thumbs shown; + Add button hidden after 3rd |
| TC-M17-07 | Tap a photo thumb in TripReportCard | PhotoGallery full-screen modal opens; swipe between photos |
| TC-M17-08 | ConditionSummaryBanner percentages | Match conditionSummary from API (Open/Caution/Closed/Unknown) |
| TC-M17-09 | Tab count badge | If total_reports > 0, badge visible on Reports tab label |
| TC-M17-10 | 375px layout | Tab bar fits all 5 tabs without overflow; no label truncation |

---

## Notes

- `expo-image-manipulator` and `expo-image-picker` must be present in `apps/mobile/package.json` before implementing PhotoPicker — check before starting
- Backend API is shared with web — implement STEP-78 backend first, then wire mobile
- Photos stored in DO Spaces at `reports/{user_id}/{uuid}.jpg`; served via `DO_SPACES_CDN_ENDPOINT`
- Orphaned uploads (user picks photo then cancels form) cleaned by DO Spaces lifecycle rule on `reports/` prefix TTL 24h — configure manually in DO Spaces console; no backend task needed
- Five tabs may be slightly tight at 375px — use `fontSize: 12` for tab labels if 13 wraps

---

## Status

- [x] Backend (STEP-78) shipped and API confirmed working
- [x] expo-image-picker + expo-image-manipulator in package.json
- [x] TrekTabBar updated (TrekTab type + TABS array)
- [x] TripReportCard created
- [x] ConditionSummaryBanner created
- [x] AddReportSheet created
- [x] PhotoPicker created
- [x] PhotoGallery lightbox created
- [x] useReports hook created
- [x] Trek detail [slug].tsx wired (Reports tab content + AddReportSheet)
- [ ] All TC-M17-01 through TC-M17-10 pass on simulator (iOS + Android) — pending user validation
- [x] `npx tsc --noEmit` clean

**Completed: 2026-06-24**

## Files Created

- `apps/mobile/hooks/useReports.ts`
- `apps/mobile/components/reports/ConditionSummaryBanner.tsx`
- `apps/mobile/components/reports/TripReportCard.tsx`
- `apps/mobile/components/reports/PhotoGallery.tsx`
- `apps/mobile/components/reports/PhotoPicker.tsx`
- `apps/mobile/components/reports/AddReportSheet.tsx`

## Files Modified

*(populated on completion)*

# STEP-M08 — Trek Comparison

**Status:** Done (2026-06-18)
**Phase:** Shipped
**Dependencies:** STEP-M07 (explore — trek selection UI), STEP-M02 (auth for saving comparisons)

---

## Scope

Native trek comparison tool. Users pick **2 or 3 treks** and see a side-by-side attribute comparison (mirrors web `/compare` which supports up to 3 treks — Step 44). Saved comparisons sync with the web account via the existing `/api/v1/account/comparisons` endpoint.

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/mobile/app/(tabs)/browse/compare.tsx` | Compare entry — pick first trek |
| `apps/mobile/app/(tabs)/browse/compare/select.tsx` | Trek picker (second trek) |
| `apps/mobile/app/(tabs)/browse/compare/result.tsx` | Side-by-side comparison result |
| `apps/mobile/app/(tabs)/saved/comparisons.tsx` | Saved comparisons list |
| `apps/mobile/components/compare/CompareAttributeTable.tsx` | Scrollable attribute comparison table |
| `apps/mobile/components/compare/CompareHeroRow.tsx` | Two trek hero images side-by-side |
| `apps/mobile/components/compare/CompareScoreBadge.tsx` | Winner badge per attribute |
| `apps/mobile/hooks/useComparisons.ts` | CRUD for saved comparisons |

---

## Comparison Flow

```
Browse tab → [⊕ Compare treks] button in header

Step 1: Pick first trek
  → Search or browse from trek list
  → Tap trek → selected (shown in slot 1)

Step 2: Pick second trek
  → Same search/browse, same UI
  → Tap trek → selected (shown in slot 2)

Step 3 (optional): Add third trek
  → [+ Add trek] button appears after 2 treks selected
  → Tap to pick 3rd trek (max 3, mirrors web limit)

Result screen:
  [Trek A hero] ←→ [Trek B hero] ←→ [Trek C hero (optional)]
  [Attribute table — scroll vertically, swipe horizontally for 3rd column]
  [Save comparison button]
  [Share comparison]
```

---

## Comparison Attribute Table

| Attribute | Trek A | Trek B |
|-----------|--------|--------|
| Difficulty | ●●○ Moderate | ●●● Challenging |
| Duration | 6 days | 8 days |
| Max Altitude | 12,500 ft | 14,100 ft |
| Best Season | Dec–Apr | Jun–Sep |
| State | Uttarakhand | Himachal Pradesh |
| Permit Required | No | No |
| Beginner Friendly | ✓ | ✗ |
| Estimated Cost | ₹8,000–12,000 | ₹10,000–15,000 |

Winner badges (green checkmark) shown per attribute where one trek clearly wins.

**Swipe to compare:** On mobile, columns can be independently scrolled horizontally when table is wide.

---

## Saved Comparisons

- `GET /api/v1/account/comparisons` → list of saved pairs
- `POST /api/v1/account/comparisons` → save { name, slugs: [slug1, slug2, slug3?] } — backend supports up to 3 slugs
- `DELETE /api/v1/account/comparisons/{id}` → remove
- Listed in `Saved → Comparisons` tab
- Requires auth — non-auth users see "Sign in to save comparisons" nudge

---

## Verification

1. **TC-M08-01**: Pick two treks → comparison result renders with all attributes
2. **TC-M08-02**: Winner badges show for attributes where one trek is clearly better
3. **TC-M08-03**: Tap "+ Add trek" → pick third trek → 3-column comparison renders (horizontal swipe)
4. **TC-M08-04**: Save comparison → appears in Saved → Comparisons screen
5. **TC-M08-05**: Delete saved comparison → removed from list
6. **TC-M08-06**: Not signed in → save button shows sign-in prompt

## Implementation Notes (2026-06-18)

**Files Modified:**
- `apps/mobile/app/(tabs)/(home)/compare.tsx` — winner badges via `getWinnerIdx()` for budget/permit/suitability/crowd_level fields; Save Comparison button (auth-gated Alert + POST /api/v1/account/comparisons); `savedId` state turns button green on success
- `apps/mobile/lib/mobileApi.ts` — added `apiDelete()` helper; `SavedComparison` interface; `accountApi` object with `listComparisons`, `saveComparison`, `deleteComparison`

**Files Created:**
- `apps/mobile/hooks/useComparisons.ts` — CRUD hook: list (on mount), save, remove
- `apps/mobile/app/(tabs)/saved/_layout.tsx` — Stack navigator (index + comparisons screens)
- `apps/mobile/app/(tabs)/saved/index.tsx` — Saved tab root with Comparisons entry card
- `apps/mobile/app/(tabs)/saved/comparisons.tsx` — FlatList of saved comparisons with delete + Open (navigates to compare screen with preselected first slug)

**Files Deleted:**
- `apps/mobile/app/(tabs)/saved.tsx` — replaced by directory stack

**Build:** `npx tsc --noEmit` → 0 errors

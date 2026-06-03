# STEP-M16 — Trek Check-ins & History

**Status:** Pending
**Phase:** Community
**Dependencies:** STEP-M02 (auth), STEP-M05 (trek detail — check-in from there), STEP-M10 (account — history visible there)
**Backend step:** Yes — new DB table (`user_trek_history`), new routes

---

## Scope

Lets users log personal trek completions with date, rating, and notes. Displays a chronological timeline in the Account tab. Awards simple milestone badges ("First Trek", "10 Treks Done") to drive engagement. The check-in CTA appears on the Trek Detail screen for logged-in users. Data is private (user-only) — no public leaderboard.

---

## Files to Create

### Backend
| File | Purpose |
|------|---------|
| `services/api/alembic/versions/YYYYMMDD_0045_user_trek_history.py` | Migration: `user_trek_history` + `user_badges` tables |
| `services/api/app/modules/checkins/models.py` | ORM: `UserTrekHistory`, `UserBadge` |
| `services/api/app/modules/checkins/schemas.py` | Pydantic: `CheckInIn`, `CheckInOut`, `BadgeOut`, `HistoryPageOut` |
| `services/api/app/modules/checkins/service.py` | Service: `create_checkin`, `get_user_history`, `compute_badges` |
| `services/api/app/api/routes/checkins.py` | Routes: POST/GET/DELETE checkins, GET badges |
| `services/api/tests/test_checkins_m16.py` | Backend checkin tests |

### Mobile
| File | Purpose |
|------|---------|
| `apps/mobile/app/(tabs)/account/history.tsx` | Trek history timeline screen |
| `apps/mobile/components/checkins/CheckInSheet.tsx` | Bottom sheet: date picker, rating, notes, submit |
| `apps/mobile/components/checkins/CheckInCard.tsx` | Trek history list item |
| `apps/mobile/components/checkins/BadgeRow.tsx` | Horizontal badge strip |
| `apps/mobile/hooks/useCheckins.ts` | Fetch history, create checkin, badge state |

---

## Database

### `user_trek_history`
```sql
CREATE TABLE user_trek_history (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trek_slug    VARCHAR(200) NOT NULL,
    trek_name    VARCHAR(255),
    completed_at DATE NOT NULL,
    rating       SMALLINT CHECK (rating BETWEEN 1 AND 5),
    notes        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, trek_slug, completed_at)
);
CREATE INDEX idx_history_user_id ON user_trek_history(user_id);
CREATE INDEX idx_history_completed_at ON user_trek_history(completed_at DESC);
```

### `user_badges`
```sql
CREATE TABLE user_badges (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_key  VARCHAR(64) NOT NULL,   -- first_trek | five_treks | ten_treks | himalayan_starter
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, badge_key)
);
```

---

## Badge Definitions

| Badge Key | Criteria | Label | Icon |
|-----------|---------|-------|------|
| `first_trek` | 1st check-in created | First Summit | 🏔 |
| `five_treks` | 5 total check-ins | Five Peaks | ⛰ |
| `ten_treks` | 10 total check-ins | Mountain Veteran | 🌄 |
| `himalayan_starter` | Any Himalayan trek checked in | Himalayan Explorer | 🏕 |

Badge computation runs in `create_checkin` service after insert — synchronous, no Celery task needed.

---

## Backend Routes

```python
# routes/checkins.py

POST   /api/v1/account/checkins          → create_checkin (auth required)
GET    /api/v1/account/checkins          → get_user_history (paginated, auth required)
DELETE /api/v1/account/checkins/{id}    → delete_checkin (auth required, own records only)
GET    /api/v1/account/badges           → get_user_badges (auth required)
```

### Request Schema (`CheckInIn`)
```python
class CheckInIn(BaseModel):
    trek_slug:    str
    trek_name:    str
    completed_at: date
    rating:       Optional[int] = Field(None, ge=1, le=5)
    notes:        Optional[str] = Field(None, max_length=1000)
```

### Response Schema (`CheckInOut`)
```python
class CheckInOut(BaseModel):
    id:           UUID
    trek_slug:    str
    trek_name:    str
    completed_at: date
    rating:       Optional[int]
    notes:        Optional[str]
    created_at:   datetime
    new_badges:   List[BadgeOut] = []  # badges newly awarded by this checkin
```

---

## Trek History Screen

```
[Page title: "My Trek Log"]
────────────────────────────────────
[Badge strip — horizontal scroll]
  [🏔 First Summit]  [⛰ Five Peaks]
────────────────────────────────────
[Completed 12 treks]
────────────────────────────────────
[2026 ▾]
  Feb 2026
    [CheckInCard]
      Kedarkantha
      ⭐⭐⭐⭐⭐  · Completed 15 Feb 2026
      "Amazing winter trek, snow was perfect"
    [CheckInCard]
      ...

  Jan 2026
    ...
────────────────────────────────────
[+ Log a trek]  (FAB — floating action button)
```

History grouped by month, sorted newest first. The FAB opens `CheckInSheet` with trek search.

---

## Check-in Sheet (Bottom Sheet)

```
"Log a Trek"
────────────────────────────────
Trek *        [Search & select ▼]
Completed on  [date picker — max: today]
Rating        [⭐☆☆☆☆ tap to rate]
Notes         [optional, multiline]
────────────────────────────────
[Save check-in]
```

Trek selection: search field calling `GET /api/v1/public/treks?q=` — returns static + CMS treks. After submit: if new badges awarded, show animated badge toast before closing sheet.

---

## Check-in CTA on Trek Detail

In [STEP-M05-trek-detail-screen.md], the sticky CTA bar has a "Plan" button. Add a second action:

```tsx
{isAuthenticated && (
  <Pressable onPress={() => openCheckInSheet(trek.slug, trek.name)}>
    <Text>✓ Log this trek</Text>
  </Pressable>
)}
```

Pre-fills trek_slug and trek_name in the sheet. Sheet opens from Trek Detail via bottom-sheet ref passed down through a context or via a global sheet portal.

---

## Hooks

```typescript
// hooks/useCheckins.ts
export function useCheckins() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['checkins'],
    queryFn: () => api.get('/account/checkins'),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CheckInPayload) => api.post('/account/checkins', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
      queryClient.invalidateQueries({ queryKey: ['badges'] });
    },
  });

  return { history: data?.items ?? [], isLoading, createCheckin: createMutation.mutate, refetch };
}

export function useBadges() {
  return useQuery({
    queryKey: ['badges'],
    queryFn: () => api.get('/account/badges'),
  });
}
```

---

## Badge Toast (New Badge Awarded)

After a successful check-in, if `new_badges.length > 0`:

```tsx
// Show animated badge popup before closing sheet
new_badges.forEach((badge, i) => {
  setTimeout(() => {
    Toast.show({
      type: 'badge',
      text1: `🏅 New badge: ${badge.label}`,
      text2: badge.description,
      visibilityTime: 3000,
    });
  }, i * 1200);
});
```

Uses `react-native-toast-message` with a custom `badge` template.

---

## Backend Tests

| Test ID | Verifies |
|---------|---------|
| TC-B-M16-01 | `test_create_checkin` — POST /account/checkins returns 201 with CheckInOut |
| TC-B-M16-02 | `test_duplicate_checkin_rejected` — same trek + date returns 409 |
| TC-B-M16-03 | `test_first_trek_badge_awarded` — first check-in returns `new_badges: [{key: "first_trek"}]` |
| TC-B-M16-04 | `test_five_treks_badge` — 5th check-in triggers five_treks badge |
| TC-B-M16-05 | `test_history_paginated` — GET /account/checkins returns paginated list |
| TC-B-M16-06 | `test_delete_own_checkin` — DELETE returns 204 |
| TC-B-M16-07 | `test_cannot_delete_other_user_checkin` — DELETE with wrong user returns 403 |

---

## Verification (Manual)

1. **TC-M16-01**: Tap "Log this trek" on trek detail → CheckInSheet opens with trek pre-filled
2. **TC-M16-02**: Fill date + rating + notes → Save → card appears in history
3. **TC-M16-03**: First check-in → "First Summit" badge toast + badge visible in badge strip
4. **TC-M16-04**: Duplicate trek + same date → validation error shown
5. **TC-M16-05**: History screen groups entries by month, newest first
6. **TC-M16-06**: Swipe left on a check-in card → delete confirmation → removed from list
7. **TC-M16-07**: Account tab shows trek count in stats strip (from M10)

---

## Notes

- `completed_at` is a `DATE` (not TIMESTAMP) — users log treks retroactively; time of day is irrelevant
- Rating is optional — many users won't bother; don't make it required
- Notes max 1000 chars — prevents abuse, keeps storage manageable
- Badge logic is intentionally simple (count-based) — no gamification depth needed for V5
- The "Log a Trek" FAB must not appear on the Trek Detail CTA bar until STEP-M16 is implemented — ensure the conditional `isAuthenticated` gate is respected

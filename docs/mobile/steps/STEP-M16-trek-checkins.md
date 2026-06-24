# Step M16 — Trek Check-ins & History

**Status:** Done  
**Completed:** 2026-06-24  

---

## Scope

Users can log completed treks (date, duration, rating, notes) and view their history in a dedicated screen with stats and badges. Trek detail screen shows a "You've done this trek" banner for completed treks.

---

## Files Created

| File | Purpose |
|------|---------|
| `services/api/alembic/versions/20260623_0048_user_trek_history.py` | user_trek_history table + 3 indexes |
| `services/api/tests/test_checkin_m16.py` | 8 backend tests (TC-B-M16-01–08) |
| `apps/mobile/hooks/useCheckin.ts` | createCheckin, getHistory, getStats, isDone |
| `apps/mobile/components/account/TrekHistoryCard.tsx` | History list item with rating stars/chips |
| `apps/mobile/components/account/CheckinSheet.tsx` | Modal bottom sheet for check-in |
| `apps/mobile/app/(tabs)/account/history.tsx` | History screen with stats, badges, FlatList |

---

## Files Modified

| File | Change |
|------|--------|
| `services/api/app/modules/mobile/models.py` | UserTrekHistory ORM model added |
| `services/api/app/db/base.py` | UserTrekHistory imported and registered |
| `services/api/app/schemas/mobile.py` | CheckinIn/CheckinOut/TrekHistoryStatsOut schemas added |
| `services/api/app/modules/mobile/service.py` | create_checkin, get_user_history, has_user_done_trek, get_history_stats, badge rules |
| `services/api/app/api/routes/mobile.py` | 4 new checkin routes added |
| `apps/mobile/app/(tabs)/account/_layout.tsx` | history Stack.Screen added |
| `apps/mobile/components/account/AccountDashboard.tsx` | Trek History menu row added |
| `apps/mobile/app/(tabs)/(home)/trek/[slug].tsx` | isDone check, CTA, banner, CheckinSheet wired |

---

## API Routes (all require bearer auth)

| Method | Path | Notes |
|--------|------|-------|
| POST | /api/v1/mobile/checkin | 201 Created; body: CheckinIn |
| GET | /api/v1/mobile/checkin | Returns list (limit/offset query params) |
| GET | /api/v1/mobile/checkin/stats | TrekHistoryStatsOut with badges |
| GET | /api/v1/mobile/checkin/done/{trek_slug} | Returns {"done": true/false} |

---

## Trek Badges

| Badge | Condition |
|-------|-----------|
| First Trek | >= 1 check-in |
| 5-Trek Club | >= 5 check-ins |
| 10-Trek Veteran | >= 10 check-ins |
| Himalayan Explorer | >= 5 treks in Himalayan states |
| Monsoon Warrior | Any trek in Jun/Jul/Aug |
| High Altitude Ace | Any trek >= 14,000 ft |

---

## Backend Test Cases

Run: `PYTHONPATH=services/api .venv/bin/pytest services/api/tests/test_checkin_m16.py -v`

### TC-B-M16-01: test_create_checkin_stores_row
Verifies: create_checkin saves row, returns correct user_id/trek_slug/rating/duration_days

### TC-B-M16-02: test_get_user_history_isolation
Verifies: each user sees only their own entries; sorted newest-first

### TC-B-M16-03: test_has_user_done_trek
Verifies: returns True for completed trek, False for unrelated slug

### TC-B-M16-04: test_get_history_stats_and_badges
Verifies: total_treks, total_days, states_visited, First Trek/5-Trek Club/High Altitude Ace badges

### TC-B-M16-05: test_api_create_checkin
Verifies: POST /api/v1/mobile/checkin returns 201 with correct shape

### TC-B-M16-06: test_api_get_checkin_history
Verifies: GET /api/v1/mobile/checkin returns list containing the user's entry

### TC-B-M16-07: test_api_get_stats
Verifies: GET /api/v1/mobile/checkin/stats returns badges including "First Trek"

### TC-B-M16-08: test_api_done_flag
Verifies: GET /api/v1/mobile/checkin/done/{slug} returns {done: true} for completed, {done: false} for other

---

## Frontend Test Cases (Mobile)

### TC-F-M16-01: Log a trek (happy path)
1. Sign in; navigate to any trek detail page
2. Tap "I did this trek — log it" banner
3. Fill in date, duration (5), tap 4 stars, add a note; tap "Save check-in"
Expected: Success flash "Trek logged!" appears; banner changes to "✓ You've done this trek"

### TC-F-M16-02: History screen shows entry
1. After TC-F-M16-01, go to Account → Trek History
Expected: The logged trek appears in the list with date, duration chip, state chip, star rating

### TC-F-M16-03: Stats and badges appear
1. After logging at least 1 trek, open Account → Trek History
Expected: "Treks done" stat >= 1; "First Trek" badge visible

### TC-F-M16-04: Already done banner persists across app restarts
1. Log a trek; force-close the app; reopen; navigate to the same trek detail
Expected: "✓ You've done this trek" banner shown (not the CTA)

### TC-F-M16-05: Empty state
1. Sign in with a fresh account; go to Account → Trek History
Expected: "No treks logged yet" empty state with explanation text

### TC-F-M16-06: Mobile layout (375px / small screen)
1. On a small device or narrow viewport, open the History screen
Expected: Stats row wraps correctly; badges wrap into multi-line; no horizontal overflow

---

## Notes

- Migration applies cleanly after M14 (0046) and M15 (0047).
- `user_trek_history` has FK → users ON DELETE CASCADE.
- `extra JSONB` column reserved for future metadata (gear lists, photos, GPS tracks).

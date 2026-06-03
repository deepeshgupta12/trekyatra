# STEP-69C — Post-Production Fixes #2 (Compare Count, Search Compare Suggestion, Email Verification on Signup)

**Status:** Done
**Date:** 2026-06-03
**Branch:** main
**Commit:** (see git log)

---

## Scope

Three production bugs identified during Step 69 review:

| Issue | Description |
|-------|-------------|
| #6 | Account dashboard "Compare Lists" tile hardcoded to "0" — never showed real saved comparison count |
| #7 | Search page had no compare CTA — missed conversion opportunity when user searches for a trek |
| #9 | Email verification never sent on signup — `signup_email` route only dispatched welcome email, never triggered verification |

---

## Files Modified

### Backend
| File | Change |
|------|--------|
| `services/api/app/api/routes/auth.py` | Added auto-send verification email in `signup_email` (after welcome email block); uses `create_email_verification_token` + `_send_verification_email_helper`; graceful try/except so SMTP failure never breaks signup |
| `services/api/tests/test_email_step68.py` | Added TC-B09: `test_signup_email_sends_verification_on_register` — patches `_send_verification_email_helper`, calls signup, asserts mock called once with correct email |

### Frontend
| File | Change |
|------|--------|
| `apps/web-next/app/(public)/account/page.tsx` | Added `fetchComparisons` import; added `compareCount` state; added `fetchComparisons()` to `Promise.all` in `loadData`; changed stats tile value from hardcoded `"0"` to `String(compareCount)` |
| `apps/web-next/app/(public)/search/page.tsx` | Added `allLoadedTreks` state (captures full merged CMS trek list after Fuse rebuild); added `compareMatch` useMemo (similarity: same difficulty+state → same difficulty → second result → first fuzzy); added compare suggestion UI card between exact results and semantic results |

---

## Implementation Notes

### Issue #6 — Compare count
`loadData` already fetched bookmarks/downloads/alerts in a `Promise.all`. Added `fetchComparisons()` as a fourth entry and wired `cp.length` to new `compareCount` state. The `/account/compare` page and sidebar nav were already correct from Step 44.

### Issue #7 — Search compare suggestion
`_trekFuse` is a module-level variable not exposed as React state. Solution: added `allLoadedTreks` state set alongside the `_trekFuse` rebuild inside the data-loading `useEffect`. `compareMatch` useMemo then computes a similar trek from the top exact result using:
1. Same difficulty + same state
2. Fallback: same difficulty only
3. Fallback: second exact result
4. Fallback: first fuzzy result

UI card appears only when `showTreks && compareMatch` — never shown on empty/semantic-only results. Uses `GitCompare` icon + accent color matching existing design system.

### Issue #9 — Email verification on signup
Root cause: `signup_email` only called `send_welcome_email_task.delay()`. Fix: added synchronous `_send_verification_email_helper()` call immediately after, wrapped in `try/except Exception` so SMTP misconfiguration (common in dev/staging) never surfaces as a signup error. Used `token_str` (not `token`) to avoid collision with the session `token` variable already in scope.

---

## Tests

### Backend (9 total in test_email_step68.py)
```
TC-B01 PASS — send_verification requires auth (401)
TC-B02 PASS — send_verification 400 if already verified
TC-B03 PASS — send_verification 200 when SMTP not configured (graceful)
TC-B04 PASS — verify_email valid token marks user verified
TC-B05 PASS — verify_email invalid token returns 400
TC-B06 PASS — verify_email wrong typ token returns 400
TC-B07 PASS — send_trek_alerts_task {sent: False} when SMTP not configured
TC-B08 PASS — create/parse_email_verification_token round-trip
TC-B09 PASS — signup_email auto-sends verification email (NEW)
```

Full suite: 608 passed, 1 skipped (2 test_refresh.py failures are pre-existing flaky ordering issue, pass in isolation)

### Frontend
`next build` ✅ zero TypeScript errors, zero build errors

---

## No Migrations Required
No new DB tables or columns. All changes query existing data or modify existing routes.

---

## Blast Radius

| Symbol | Risk | Upstream Impact |
|--------|------|----------------|
| `signup_email` (auth.py:83) | LOW | Only adds a try/except email send — signup 201 response unchanged |
| `loadData` (account/page.tsx) | LOW | Leaf component; compareCount drives one stat tile only |
| `compareMatch` useMemo (search/page.tsx) | LOW | New derived state; only adds a UI card; no changes to existing search logic |

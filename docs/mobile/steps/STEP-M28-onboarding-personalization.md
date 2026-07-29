# STEP-M28 — v1.1 Redesign, Phase 5: Onboarding + Personalization

**Status:** Built (2026-07-29). Decisions used: new `user_preferences` table; onboarding anchors,
behavior reweights.

## Built
Backend:
- `user_preferences` table (migration 0057) keyed by **user_id OR anonymous_id** (nullable both;
  Postgres NULL-distinct uniques) + `device_id`. Model in account/models.py, registered db/base.py.
- Service: `get_preferences` / `upsert_preferences` (adopts anon row on login) / `merge_anon_into_user`.
- Routes: authed GET/PUT `/account/preferences` (+ `?anonymous_id` triggers merge); **public**
  GET/PUT `/app/preferences` (anon, no auth). Schemas + 6 tests (incl. anon persistence + merge).

Mobile:
- `lib/preferences.ts` — local (AsyncStorage) + backend anon row (persists uninstall via SecureStore
  anon id) + user row; `savePreferences` / `restorePreferences` / `mergePreferencesOnLogin`.
- `app/(auth)/onboarding.tsx` — 4-step skippable wizard (Experience → Difficulty → Regions → Vibe),
  registered in (auth)/_layout; welcome "Get started" routes to it.
- `usePreferences` hook; Home blends prefs (regions/difficulties) into useHomeData + greeting region.
- Analytics: onboarding_step / onboarding_completed / onboarding_skipped.

## Owner requirements handled
- **Repeat user (email) with prior prefs → onboarding skipped:** logged-in restore pulls the user row;
  if `onboarding_completed`, local is marked done → wizard never shows.
- **Survive uninstall:** anon id lives in SecureStore/Keychain (survives uninstall) → backend anon row
  restored on reinstall → personalized Home + skip onboarding. device_id captured.
- **Cross-web:** prefs keyed by user_id → web + app share the record; anon row merges into user on login.

**Original spec (retained below).**

---

# Original spec (locked 2026-07-29)

## Goal
Post-splash, skippable 4-step onboarding (Experience → Difficulty → Regions → Vibe) that
personalizes the Home for logged-out AND logged-in, new AND repeat users, cross-synced with web.

## Two signal sources
- **Explicit — onboarding prefs** (experience, difficulty[], regions[], vibe[]): what the user says.
  Local (logged-out) → synced to account on login.
- **Implicit — behavior profile** (recentViews, topRegions, topDifficulties): what the user does.
  Already backend-synced cross-platform (`useBehaviorProfile`). Overlays the existing Home A/B/C/D
  state machine (logged-in × has-behavior).

## Personalization matrix
| User | Onboarding | Home |
|------|-----------|------|
| Logged-out · new | Done | Personalize from **local prefs** (regions/difficulty/vibe); anonymous recs seeded by prefs |
| Logged-out · new | Skipped | Generic + "Personalize your feed" card → opens onboarding |
| Logged-out · repeat | any | Blend **local behavior** (recently-viewed, top-regions from anon id) + prefs if present |
| Logged-in · new | Done | Prefs **synced to account** → personalized; same on web next login |
| Logged-in · new | Skipped | Named greeting, generic + personalize prompt |
| Logged-in · repeat | any | **Full**: behavior (cross-synced) + prefs; recently-viewed reflects web+app |

## Storage & cross-device sync
- Onboarding prefs: **local (AsyncStorage)** so logged-out is personalized immediately; on login/signup
  **merge → backend** keyed by `user_id`.
- Behavior profile: backend-synced by `user_id` (logged-in) / `anonymous_id` (logged-out, device-local).
- **Cross-sync (repeat, logged-in):** prefs + behavior both keyed by `user_id` → web + app read the same
  record; onboard once anywhere. If onboarded on **web**, app pulls prefs + **skips re-onboarding**.
- Logged-out = per-device only (no identity to sync); merges into account on login.

## Blending / precedence
1. Regions: onboarding first → behavior top-regions → all.
2. Difficulty: onboarding anchors; behavior reweights.
3. Vibe → curation (high-altitude prioritizes high-altitude; scenic → photo-forward).
4. Experience: beginners → more safety surfacing + difficulty ceiling.
5. **Explicit vs implicit:** onboarding anchors the initial order; behavior weight grows with views
   (repeat user who onboarded "Easy" but opens "Hard" starts seeing Hard). recentViews always shown.

## Build checklist
- **Backend:** `user_preferences` (migration + GET/PUT `/account/preferences` + merge-on-login) —
  recommended over extending `behavior_profile` (prefs are explicit+stable, behavior is derived+churny);
  recommendations API accepts prefs to seed; tests.
- **Mobile:** onboarding slides → write prefs (local + sync); `usePreferences` hook; Home applies the
  blend; "Personalize your feed" re-entry for skippers; re-onboarding guard (show once, respect synced
  web prefs).
- **Analytics:** onboarding_step, onboarding_completed, onboarding_skipped, personalization_applied.

## Open decisions (confirm at build time)
1. Precedence — "onboarding anchors, behavior reweights" (recommended) vs onboarding always dominates.
2. Storage — new `user_preferences` table (recommended) vs extend `behavior_profile`.

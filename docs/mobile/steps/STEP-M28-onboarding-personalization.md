# STEP-M28 — v1.1 Redesign, Phase 5: Onboarding + Personalization (SPEC — not yet built)

**Status:** Planned (spec locked 2026-07-29). Build after M26 (Explore/Search) + M27 (Trek detail).

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

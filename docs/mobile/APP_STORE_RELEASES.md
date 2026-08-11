# TrekYatra — App Store / EAS Release Log

Single source of truth for every EAS build and its App Store Connect (ASC) submission status.
**Update this file on every `eas build` and every `eas submit`** (see the rule in the root
`CLAUDE.md` §18). Bundle ID `in.co.trekyatra.app` · ASC App ID `6795408094` · Apple Team `CQ3B698U57`
· EAS project `6f97fbb4-7f04-47a8-8bb7-f6d2629f72e2` · channel `production`.

> Build numbers are managed **remotely** by EAS since 1.1.0 (5) (`eas.json`
> `cli.appVersionSource: "remote"` + production `autoIncrement: true`) — the next production build
> auto-increments (expected: 6). The local `ios.buildNumber` in `app.config.ts` is now ignored.

## Releases

| Version (build) | buildNumber | EAS Build ID | Submitted to ASC | ASC status | Date | Notes |
|-----------------|-------------|--------------|------------------|-----------|------|-------|
| 1.1.0 (5) | 5 | `1c4a8825-929b-4d58-bb79-3e29b15f090d` | ✅ Yes — resubmitted `6d0479fc-…` | **Rejected (2026-08-11)** — 2.1.0 + 5.1.1 (ATT now resolved) | 2026-07-31 → 2026-08-11 | ATT/tracking issue RESOLVED (Device ID removed from ASC label). NEW rejection needs a rebuild: **5.1.1** = no in-app account deletion (only Sign out + data-delete that keeps account active; no `DELETE /auth/me`). **2.1.0** = Premium shown ("You're Premium!") with no purchasable IAP (iOS forces isPremium=true but still surfaces premium/subscription UI). **Both need code + a NEW build (→ 6).** |
| 1.1.0 (4) | 4 | `e4bdb9ab-8c33-4d01-97bb-4136a22b79f3` | ⚠️ Attempted — **failed** | Rejected at upload (duplicate build number) | 2026-07-31 | `eas submit` failed: "build number 4 already used". Its build number was consumed on ASC → superseded by (5). |
| 1.1.0 (3) | 3 | `d216a1c6-a554-4e0c-9b95-6a735598fe2d` | ❌ No | — | 2026-07-31 | Built for owner device-test only (STEP-M30 N01–N13). |
| 1.1.0 (2) | 2 | `84e2d0f9-e457-4ef7-86ad-580376e151b5` | ❌ No | — | 2026-07-30 | Built for owner device-test only (STEP-M29 fixes). Owner reported 15 issues → STEP-M30. |
| 1.1.0 (1) | 1 | `4e801301` (short) | ✅ Yes | Superseded | 2026-07-29 | First 1.1.0 submission (redesign, STEP-M24–M28). Owner device-test surfaced 27 defects → STEP-M29. |

## Legend
- **ASC status**: Waiting for Review · In Review · Rejected · Pending Developer Release · Ready for
  Sale · Superseded (a newer build was submitted for the same version).

## Rejection log
- **2026-08-07 — build 1.1.0 (5) rejected — ATT / App Privacy mismatch.** Apple: privacy info in ASC
  says the app collects data used to track, but there's no AppTrackingTransparency permission request.
  Investigation: app has NO third-party ad/analytics/data-broker SDKs, NO IDFA, NO ATT usage; all
  analytics are first-party to `api.trekyatra.co.in`; binary privacy manifest declares
  `NSPrivacyTracking:false` + every collected type `NSPrivacyCollectedDataTypeTracking:false`
  (Email/App-Functionality, Coarse Location/App-Functionality, Product Interaction/Analytics).
  → The app does **not** track; the ASC App Privacy questionnaire was mis-set with a data type
  "Used to Track You." **Resolution (Apple Option 1, no rebuild):** in ASC → App Privacy, set every
  data type "used to track" = No; reply in Resolution Center (first-party analytics only, no ad SDKs,
  no IDFA, manifest NSPrivacyTracking=false); resubmit existing build (5).
  - **2026-08-07 — RESOLVED & RESUBMITTED.** All App Privacy "used to track" toggles set to No; Resolution
    Center reply posted; same build (5) resubmitted (Submission `6d0479fc-a49a-4ffe-b1c3-6c8a95134cd7`) →
    **Waiting for Review**. No rebuild, no new build number consumed.
  - **2026-08-11 — REJECTED AGAIN (same 5.1.2 ATT auto-reject).** Message again points to the ASC App
    Privacy info still indicating tracking → the label change did NOT take effect. Prime suspects (check
    in order): (1) App Privacy edits were **not Published** (summary still shows a "Data Used to Track You"
    section); (2) a data type still lists an **advertising purpose** (Third-Party Advertising / Developer's
    Advertising or Marketing) which ASC treats as tracking even with the tracking toggle off — remove it;
    (3) one data type (esp. **Identifiers/Device ID** or Purchases) still has "used to track" = Yes.
    Action: verify + **Publish** label shows "Data Not Used to Track You", remove any advertising purpose,
    Cancel Submission → resubmit build (5), and post an escalation reply asking Apple to name the specific
    data element they read as tracking + request manual review. Still NO rebuild required.
  - **2026-08-11 — ROOT CAUSE FOUND (ASC label over-declared vs code).** Owner's App Privacy screenshots show
    14 declared data types; the binary manifest declares only 3. Verified against code — 3 are WRONG and must
    be removed: (a) **Device ID** — app has no hardware Device ID; identity is an app-generated
    `Crypto.randomUUID()` in SecureStore (lib/identity.ts), already declared as User ID. Device ID
    linked+Analytics is the classic ATT tracking trigger → **remove**. (b) **Precise Location** — app uses
    `Location.Accuracy.Balanced` (~coarse) (lib/location.ts) → **remove**. (c) **Browsing History** — app
    collects only in-app views (=Product Interaction), not external web history → **remove**. Keep (all real,
    none tracking): Email, Name, Phone Number, Coarse Location, Product Interaction, Photos/Videos, User ID,
    Search History, Crash/Performance/Other Diagnostic (Sentry). Action: delete those 3 types, set every
    remaining type "used to track"=No, Publish, Cancel+resubmit (5). FUTURE build: reconcile the binary
    privacy manifest (currently 3 types) to the real set (rebuild — not needed for this resubmit).
  - **2026-08-11 — ATT RESOLVED, but NEW rejection (build 5): 2.1.0 + 5.1.1 (needs a rebuild).** The
    tracking/ATT issue is gone (Device ID removal worked). Apple's 4 screenshots (Settings ×2, Premium,
    Sign-in) point to two code issues:
    • **5.1.1 (Privacy - Data Collection & Storage) = no in-app ACCOUNT deletion.** App supports account
      creation (email/Google/Apple) but Settings only has Sign out + a "Delete my data" that keeps the
      account active (privacy.tsx). Backend has only `DELETE /auth/me/data` (data), no account delete.
      FIX: add backend `DELETE /auth/me` (delete/anonymize account) + a "Delete Account" button in Settings
      (confirm → delete → sign out).
    • **2.1.0 (App Completeness) = Premium shown with no purchasable IAP.** iOS forces isPremium=true for all
      (usePremium.ts, deliberate "no paid on iOS v1") yet still shows the Premium menu + "You're Premium! …
      Thank you for your support" card + subscription/auto-renew copy → Apple reads advertised-but-unbuyable
      paid features as incomplete. FIX: remove the Premium/subscription surface entirely on iOS (menu entry,
      screen, auto-renew text, web-premium link) since everything ships free on iOS.
    Both require code changes + a NEW production build (→ build 6, EAS auto-increments) + resubmit.
  - **2026-08-11 — FIXES IMPLEMENTED in repo (pending build 6).** 5.1.1: backend `DELETE /auth/me`
    (`auth.service.delete_account` — anonymise PII + is_active=False + deleted_at + purge identities/
    sessions/CDP; migration `20260811_0060`) + "Delete account" button in mobile Settings. 2.1.0: Premium
    menu row hidden on iOS (AccountDashboard) + `premium.tsx` redirects away on iOS. Backend tests +2, tsc
    ✅, full suite green. **Owner to run: `eas build --profile production --platform ios` (→ build 6) →
    `eas submit` → resubmit.** Also run `alembic upgrade head` on the API (adds `users.deleted_at`).
- One version train (e.g. `1.1.0`) requires a **unique build number** per upload; a consumed build
  number can never be reused (why (4) → (5)).

## How to append a row
1. After `eas build --profile production --platform ios`: add a row with the new Version/build,
   buildNumber (from the EAS build page), and EAS Build ID; ASC = ❌ No.
2. After `eas submit --profile production --platform ios --id <BUILD_ID>`: update that row's
   "Submitted to ASC" (Submission ID), ASC status, and date.
3. When ASC status changes (In Review → Ready for Sale, or Rejected), update the row.

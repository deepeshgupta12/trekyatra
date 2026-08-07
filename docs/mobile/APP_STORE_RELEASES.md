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
| 1.1.0 (5) | 5 | `1c4a8825-929b-4d58-bb79-3e29b15f090d` | ✅ Yes — Submission `2b4bc63b-a781-4085-a82f-7e1eba501a26` | **Rejected (2026-08-07)** — ATT / App Privacy | 2026-07-31 → 2026-08-07 | Submitted 07-31; rejected 08-07. Reason: ASC App Privacy label declares data "Used to Track You" but app has no AppTrackingTransparency prompt. **Root cause = ASC privacy-label mismatch, NOT a code bug** — the binary already declares `NSPrivacyTracking:false` + all 3 collected types `Tracking:false` (app.config.ts). App has no ad/analytics/data-broker SDKs, no IDFA; analytics are first-party only. **Fix (no rebuild): correct App Privacy in ASC so no data type is "used to track," reply in Resolution Center, resubmit build (5).** |
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
- One version train (e.g. `1.1.0`) requires a **unique build number** per upload; a consumed build
  number can never be reused (why (4) → (5)).

## How to append a row
1. After `eas build --profile production --platform ios`: add a row with the new Version/build,
   buildNumber (from the EAS build page), and EAS Build ID; ASC = ❌ No.
2. After `eas submit --profile production --platform ios --id <BUILD_ID>`: update that row's
   "Submitted to ASC" (Submission ID), ASC status, and date.
3. When ASC status changes (In Review → Ready for Sale, or Rejected), update the row.

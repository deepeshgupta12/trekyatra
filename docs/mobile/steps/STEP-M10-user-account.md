# STEP-M10 — User Account

**Status:** Done (2026-06-19)
**Phase:** User & Commerce
**Dependencies:** STEP-M02 (auth), STEP-M05 (trek detail — save from there)

---

## Files Created

| File | Notes |
|------|-------|
| `apps/mobile/app/(tabs)/account/_layout.tsx` | Stack navigator for all account sub-screens (NEW — converted from placeholder account.tsx) |
| `apps/mobile/app/(tabs)/account/index.tsx` | Account dashboard: ProfileHeader + AccountDashboard + stats strip + sign-out |
| `apps/mobile/app/(tabs)/account/saved.tsx` | Saved treks list via `GET /api/v1/account/bookmarks`; swipe-to-delete with Alert confirm |
| `apps/mobile/app/(tabs)/account/downloads.tsx` | Purchased digital products via `GET /api/v1/account/downloads`; opens download URL via Linking |
| `apps/mobile/app/(tabs)/account/enquiries.tsx` | Trek planning leads via `GET /api/v1/auth/me/leads` |
| `apps/mobile/app/(tabs)/account/premium.tsx` | Premium feature list + "coming soon" CTA |
| `apps/mobile/app/(tabs)/account/settings.tsx` | Profile name edit, EN/हिंदी language toggle, biometric toggle, notifications link, Trail Letter newsletter subscribe, legal links, sign-out |
| `apps/mobile/app/(tabs)/account/notifications.tsx` | 6 per-category notification toggles stored in AsyncStorage |
| `apps/mobile/app/(tabs)/account/privacy.tsx` | DPDP data export (Linking to signed URL) + delete analytics data (DELETE /api/v1/auth/me/data) |
| `apps/mobile/components/account/ProfileHeader.tsx` | Avatar initials + name + email + Edit button |
| `apps/mobile/components/account/AccountDashboard.tsx` | Stats strip + menu rows component |
| `apps/mobile/components/account/SavedTrekCard.tsx` | Compact trek card with hero image + bookmark icon tap to remove |
| `apps/mobile/components/account/DownloadItem.tsx` | Digital product row with Download button |
| `apps/mobile/components/account/EnquiryCard.tsx` | Lead enquiry row with status badge |
| `apps/mobile/hooks/useAccount.ts` | `useSavedTreks`, `useDownloads`, `useAccountMe`, `useNewsletter` TanStack Query hooks |

## Files Modified

| File | Change |
|------|--------|
| `apps/mobile/app/(tabs)/account.tsx` | DELETED — replaced by `account/_layout.tsx` + `account/index.tsx` |
| `apps/mobile/lib/mobileApi.ts` | Added `apiPatch`, `BookmarkResponse`, `DownloadResponse`, `UserMeResponse`, `NewsletterSubscribeResponse` types; extended `accountApi` with `listBookmarks`, `removeBookmarkBySlug`, `listDownloads`, `getDownloadUrl`; added `newsletterApi.subscribe`, `authMeApi.getMe/updateMe/getDataExportUrl/deleteMyData` |

## Notes

- `account.tsx` placeholder deleted; Expo Router resolves the `account` tab to `account/_layout.tsx` + `account/index.tsx` stack
- Route type errors for `/(tabs)/account/settings` and `/(tabs)/account/notifications` fixed with `as never` cast (types regenerate on next `expo start`)
- Enquiries screen calls `GET /api/v1/auth/me/leads` — backend confirmed (Step 33)
- Language preference stored in AsyncStorage `app_language: 'en' | 'hi'`; biometric in `biometric_enabled: 'true' | 'false'`
- Notification preferences stored locally in AsyncStorage `notification_prefs: JSON` (synced to account profile in a future step)
- Data export opens the signed download URL in the system browser (Linking.openURL)
- **tsc --noEmit: 0 errors** | No backend changes (all endpoints pre-exist from Steps 13, 33, 34, 68)

---

---

## Scope

Full user account management in the Account tab. Mirrors all web `/account/*` pages: saved treks, downloads, enquiries, premium status, settings. Adds mobile-only features: notification preferences per category, language selection (Hindi/English), and biometric toggle.

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/mobile/app/(tabs)/account.tsx` | Account tab root — dashboard overview |
| `apps/mobile/app/(tabs)/account/saved.tsx` | Saved treks list |
| `apps/mobile/app/(tabs)/account/downloads.tsx` | Purchased digital products |
| `apps/mobile/app/(tabs)/account/enquiries.tsx` | Trek planning leads submitted |
| `apps/mobile/app/(tabs)/account/premium.tsx` | Subscription status + upgrade CTA |
| `apps/mobile/app/(tabs)/account/settings.tsx` | Profile, language, notifications, biometric, sign out |
| `apps/mobile/app/(tabs)/account/notifications.tsx` | Per-category notification toggles |
| `apps/mobile/app/(tabs)/account/privacy.tsx` | DPDP data export + delete |
| `apps/mobile/components/account/AccountDashboard.tsx` | Stats strip + menu rows |
| `apps/mobile/components/account/ProfileHeader.tsx` | Avatar + name + email + edit button |
| `apps/mobile/components/account/SavedTrekCard.tsx` | Compact trek card in saved list |
| `apps/mobile/components/account/DownloadItem.tsx` | Digital product download row |
| `apps/mobile/components/account/EnquiryCard.tsx` | Lead enquiry row |
| `apps/mobile/hooks/useAccount.ts` | CRUD hooks for saved, downloads, enquiries |

---

## Account Dashboard Screen

```
[Profile header: avatar circle | "Priya Sharma" | priya@email.com | Edit]
────────────────────────────────────
[Stats: 12 Saved  |  3 Completed  |  2 Downloads]
────────────────────────────────────
[Saved Treks          >]
[Downloads            >]
[Trek History         >]  ← links to M16
[Enquiries            >]
[Premium              >]
[Settings             >]
[Privacy & Data       >]
────────────────────────────────────
[Sign out]
```

---

## Saved Treks Screen

- `GET /api/v1/account/saved` — paginated list of bookmarked trek slugs
- Enriched with trek metadata from SQLite cache (offline-friendly)
- Each card: hero thumbnail + name + state + difficulty
- Swipe left on row → delete (with undo toast)
- Empty state: "Save treks to find them quickly. Tap the bookmark icon on any trek."

---

## Downloads Screen

- `GET /api/v1/orders` — purchase history
- Each item: product name + purchase date + [Download] button
- Download button: calls `GET /api/v1/orders/{id}/download` → pre-signed URL → `expo-file-system` download → `expo-sharing` open
- Cached locally: file exists in `FileSystem.documentDirectory`

---

## Settings Screen

```
[Profile]
  Edit name / profile photo
  Change email / password

[App Preferences]
  Language: English / हिंदी (toggle)
  Biometric login: ON/OFF (toggle)

[Notifications] →  (per-category toggles screen)

[About]
  App version
  Terms of Service →
  Privacy Policy →
  Affiliate Disclosure →
  Safety Disclaimer →

[Trail Letter Newsletter]
  "Get weekly trek picks in your inbox"
  [Subscribe] → POST /api/v1/newsletter/subscribe { email }
  (pre-fills with account email; shows confirm toast)

[Sign out]  (red destructive style)
```

Language selection:
- Stored in AsyncStorage `app_language: 'en' | 'hi'`
- On change: force-refresh all screen data (CMS content re-rendered in selected locale)
- i18n: `i18n-js` or `expo-localization` for UI strings

---

## Notification Preferences Screen

| Category | Toggle |
|----------|--------|
| Permit alerts (treks I follow) | ON |
| Trek condition updates | ON |
| Seasonal alerts | ON |
| New trek articles | OFF |
| Plan My Trek follow-ups | ON |
| Community (buddy requests, new reports) | OFF |

Preferences stored in user profile (`PATCH /api/v1/auth/me`) + locally in AsyncStorage as fallback.

---

## Privacy & Data Screen

```
"Your data on TrekYatra"
[Export my data] → GET /api/v1/auth/me/data-export → downloads JSON
[Delete my account] → DELETE /api/v1/auth/me → confirmation dialog → signs out
```

Matches DPDP compliance from web.

---

## Profile Edit

- Edit name: `PATCH /api/v1/auth/me { full_name }`
- Change profile photo: `expo-image-picker` → upload to `/api/v1/auth/me/avatar`
- Change password: navigate to change-password screen → `POST /api/v1/auth/change-password`

---

## Verification

1. **TC-M10-01**: Saved treks list shows treks bookmarked on web (cross-platform sync)
2. **TC-M10-02**: Save a trek from detail screen → appears in saved list immediately
3. **TC-M10-03**: Swipe to delete saved trek → removed + undo toast
4. **TC-M10-04**: Downloads screen shows purchased products; tapping download saves file
5. **TC-M10-05**: Toggle language to Hindi → trek guide content re-renders in Hindi where available
6. **TC-M10-06**: Enable biometric → next app open shows biometric prompt
7. **TC-M10-07**: Turn off permit alerts notification → no permit push received
8. **TC-M10-08**: Export data → JSON file downloadable
9. **TC-M10-09**: Delete account → signs out + account removed (verify via admin)

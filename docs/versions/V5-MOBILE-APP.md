# V5 — TrekYatra Mobile App

## Status: Roadmap (Post-V4 Website Completion)

## Prerequisites Before Starting V5
This version begins only after ALL of the following are confirmed:
- [ ] Site is fully functional (V0–V4 complete, Steps 1–44 done)
- [ ] All known bugs and pending items resolved
- [ ] Content pipeline running with ≥50 published CMS pages
- [ ] Admin panel fully operational (operators, products, affiliate catalog seeded)
- [ ] Minimum 3 months of production traffic data available
- [ ] Google Search Console verified and sitemap indexed

---

## Product Vision
A native mobile companion to the TrekYatra web platform, targeting Indian trekkers on Android and iOS. The app provides offline-first content access, real-time trek conditions, permit alerts, and a social layer — capabilities the web platform cannot deliver at native quality.

---

## V5 Architecture Decision
**Technology:** React Native with Expo (shares component logic with Next.js; TypeScript throughout)
**Backend:** Same FastAPI backend (extend existing API with mobile-specific endpoints)
**Auth:** Extend existing JWT/cookie auth to support mobile Bearer tokens

---

## Phase 1 — Core Content App (MVP)
### Features
- Offline-first trek guides (downloaded to device, readable without signal)
- Trek search and browse (all published CMS pages)
- Bookmark + save trek (synced with web account)
- Trip planning wizard (native UX for the existing `/plan` flow)
- Push notifications: permit updates, seasonal alerts, trek condition changes
- Trek alert subscriptions (currently stored in `trek_alerts`, no delivery — mobile activates this)

### Backend extensions needed
- `POST /auth/mobile/token` — issue long-lived mobile Bearer token
- `GET /mobile/sync` — incremental sync of CMS pages since last_sync timestamp
- `POST /mobile/device` — register device for push notifications (FCM/APNs)
- `POST /mobile/push` — send push notification to subscribers

### Tech stack additions
- **Push:** Firebase Cloud Messaging (Android) + APNs (iOS)
- **Offline storage:** SQLite via expo-sqlite
- **OTA updates:** Expo EAS Update

---

## Phase 2 — Trekker Community Layer
### Features
- Trek check-ins: mark treks as completed (new `user_trek_history` table)
- Trip reports: short user-generated trail condition updates (moderated)
- Photo sharing: attach photos to trek pages (operator moderation)
- Trek buddy matching: connect with trekkers planning the same trek
- Ratings & reviews for treks (distinct from operator reviews)

### Backend extensions needed
- `user_trek_history` table + CRUD
- `trip_reports` table + moderation queue in admin
- `trek_media` table (photos, captions, user_id)
- `buddy_requests` table + match algorithm

---

## Phase 3 — Monetisation in App
### Features
- In-app purchase: digital products (packing checklists, itinerary templates) via Razorpay/Apple/Google IAP
- Premium subscription (Stripe/Apple/Google) — same content gating as web
- Affiliate deep links: Amazon affiliate links open native shopping flow
- Operator bookings: direct inquiry to operators from app

### Notes
- Apple/Google take 30% cut on IAP — price products accordingly
- Consider web-only premium to avoid platform fees

---

## Phase 4 — Contextual Intelligence
### Features
- Live trek conditions: integrate with IMD weather API + crowdsourced reports
- Permit alerts: scrape official permit portals + push notification when permit windows open
- "Nearby treks": GPS-based trek suggestions when user is in a trekking region
- AR compass: augmented reality peak identification (optional / if feasible)

---

## Milestone Targets (indicative — to be refined once V4 is complete)
| Milestone | Target |
|-----------|--------|
| V5 kickoff decision | After V4 complete + 3 months traffic |
| Phase 1 MVP (internal alpha) | 3 months after kickoff |
| Phase 1 public beta (TestFlight/Play Store) | 5 months |
| Phase 2 community features | 8 months |
| Phase 3 monetisation | 10 months |
| Phase 4 contextual | 12 months |

---

## Key Decisions (to be made at V5 kickoff)
1. React Native + Expo vs. Flutter vs. PWA-first
2. Shared component library with web vs. separate native design system
3. App Store developer accounts (Apple $99/year, Google $25 one-time)
4. CI/CD for mobile: Expo EAS Build vs. self-hosted Fastlane
5. Minimum OS targets: Android 10+ (API 29+), iOS 15+

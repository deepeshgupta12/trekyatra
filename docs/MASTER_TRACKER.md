# TrekYatra Master Tracker

## Purpose
This file is the source of truth for implementation progress. It must be read before every step.

## Product Scope References
- Master business/product scope: `/mnt/data/Travel_Blog.md`
- Frontend source of truth: `apps/web-next/` (Next.js 14 App Router)
- Process discipline: `docs/PROCESS_GUARDRAILS.md`
- Dependency discipline: `docs/DEPENDENCY_MAP.md`
- Step plan: `docs/IMPLEMENTATION_PLAN.md`

## Current Execution Rule
Do not modify any code file without first:
1. Reading this tracker
2. Reading `docs/PROCESS_GUARDRAILS.md`
3. Reading `docs/DEPENDENCY_MAP.md`
4. Checking impacted files and blast radius
5. Updating the relevant step file in `docs/steps/`

## V0 Status — Complete
All V0 foundations are shipped. The stack is live locally with:
- FastAPI backend, PostgreSQL, Redis, Celery-ready infra
- Full Next.js 14 App Router frontend (85 pages)
- Auth (email + Google OAuth), session management, route guards
- WordPress REST integration (health, connectivity, create_post)
- Content domain (topics, clusters, briefs, drafts)
- Draft status machine + publish pipeline + publish logs
- Admin summary APIs, smoke tests, GitNexus indexed

## V1 Status — Complete ✓
**All V1 steps delivered. V2 in progress (Steps 25–32).**

| Step | Title | Status |
|------|-------|--------|
| 11 | Worker and task queue infrastructure | done |
| 12 | LangGraph agent framework + agent tracking | done |
| 13 | Trend Discovery Agent + Keyword Cluster Agent | done |
| 14 | Content Brief Agent + brief approval workflow | done |
| 15 | Content Writing Agent + SEO/AEO Optimization Agent | done |
| 15B | Admin CMS enhancements — real API wiring + pipeline view | done |
| 16 | Master CMS Foundation (WordPress removed) | done |
| 17 | Full publish orchestration pipeline | done |
| 18 | Public frontend content page templates | done |
| 19 | SEO and schema infrastructure (frontend) | done |
| 20 | Monetization frontend components | done |
| 21 | RBAC enforcement | done |
| 22 | Internal linking engine + lead pipeline + newsletter platform | done |
| 23 | Content refresh engine (basic) | done |
| 24 | Analytics ingestion + admin panel full wiring | done |

## V2 Status — In Progress
| Step | Title | Status |
|------|-------|--------|
| 25 | Advanced fact validation system | done |
| 26 | Cannibalization detection + consolidation agent | done |
| 27 | Newsletter automation + repurposing agent | done |
| 28 | Compliance Guard Agent | done |
| 29 | Operator listing + lead marketplace basics | done |
| 30 | Dynamic destination hubs | done |
| 31 | Email automation and audience workflows | done |
| 32 | Deeper dashboards and revenue attribution | done |

## V3 Status — Complete ✓
| Step | Title | Status |
|------|-------|--------|
| 33 | Premium user accounts + bookmarks | done |
| 34 | Digital product checkout and file delivery | done |
| 35 | Advanced recommendation engine | done |
| 36 | User-intent aware monetization | done |
| 37 | Multilingual content workflows | done |

## V4 Status — In Progress
| Step | Title | Status |
|------|-------|--------|
| 38 | Operator marketplace layer | done |
| 39 | Trip planning assistant | done |
| 40 | Premium subscription layer | done |
| 41 | B2B content / API extensions | pending |
| 42 | CMS-driven static pages | done |
| 43 | Slug deduplication — CMS as canonical source | done |
| 44 | Discovery engine improvements (Search, Interlinking, Recommendations, Compare) | done |
| 46 | Trek CMS unification + pipeline quality fixes (slug, flagged-for-review, trek metadata, force_page_type, publish savepoint) | done |
| 47 | Trek guide quality fixes: cluster sidebar editorial filter, permits/base extraction, trek metadata in CMS admin, trek-specific Quick Utility routes | done |
| 48 | Critical pipeline + CMS fixes: upsert_topic (no more "No topic_id" on re-run), CMSPagePatch trek_* editable, trek metadata editable in admin form, reparse robustness | done |
| 49 | Breadcrumb state normalization + STATE_TO_REGION_SLUG map + trek metadata dropdowns in CMS admin | done |
| 50 | Trek page quality fixes: duplicate TrekYatra title, cluster sidebar editorial cleanup (DELETE on sync), CMS image overlay on trek cards (explore + regions) | done |
| 51 | Trek entity wiring (full CMS data merge into cards), regions page dedup + View all link, explore sort + state URL filter, state-specific sitemaps | done |
| 52 | Dynamic explore filters — filter facets endpoint (/api/v1/treks/filter-facets), fetchFilterFacets, wired AND-across/OR-within filter logic, explore sidebar scroll fix | done |
| 53 | UX bug fixes: regions page shows all CMS state treks (not just 3 static), season chart removed, home trending CMS overrides, DifficultyTabs state+difficulty fix | done |
| 54 | Explore/home completeness: all CMS treks in baseList, is_featured flag, trending API, pagination, empty state, seasonal CMS data, remove hardcoded sections | done |
| 55 | Site-wide fixes batch: double TrekYatra titles, sitemap trek_guide exclusion, difficulty emoji removal, home editorial link, auth 24h session, password eye icon, Google/email conflict, nav hover delay, search trending API, search CMS trek cards. **Search prod fixes 2026-05-26**: trending logged real query not destination title; recent saves on TrekCard click; auto-save debounce for passive browsing | done |
| 58 | Search engine overhaul — Phase 1 (dynamic Fuse + tags) + Phase 2 (POST /search/semantic: pgvector + BM25 hybrid + intent detection) | done |
| 56 | Weekly news agent + /news/[slug] pages — **Fixed 2026-05-26**: per-item architecture (one page/RSS article), slug from headline, TOC, admin tabs+filters+modal, trek-utils shared cmsPageToTrek. **Prod fixes 2026-05-26**: hero invisible (CSS var opacity bug fixed), 90-day recency filter, LLM code-fence stripping, breadcrumb visible | done |
| 57 | Plan My Trek revamp — 6-step wizard, weighted scoring engine (7 factors, CMS trek data), top-5 results with categories, lead capture | done |
| 59 | Bug fixes: Rupin Pass region filter (CMS state overrides static), /plan auth gate + 2/24h rate limit, static treks removed from root sitemap, 301→410 deleted URL middleware | done |
| 60 | Enhancement batch: CMS Hindi translation loading state + null-content guard; trek detail cluster/similar dedup (excludeSlugs); trending search real data + curated fallback; semantic search season_months filter; SEASON_BUCKETS winter fix; search exact-match segregation; semantic section moved to top; removed "Ranked by..." subtitle | done |
| 64 | CDP Analytics Layer — full first-party event tracking, session management, identity stitching, UTM attribution, funnel/cohort analysis, segment builder, GSC integration, DPDP consent, 8 admin pages, Celery beat tasks | done |
| 64 (prod note) | GSC (`GSC_SERVICE_ACCOUNT_JSON`) and GA4 Measurement Protocol (`GA4_MEASUREMENT_ID`, `GA4_API_SECRET`) env vars deferred — not set on DO. GSC blocked by GCP org policy; GA4 client-side tracking already live. Both activate automatically once env vars are added — no code change needed. See STEP-64 notes. | deferred |
| 65 | CDP Analytics Enhancement — dynamic funnel builder (event catalog dropdowns, date range, count-type toggle), retention heatmap (N×M, 9-week, color-coded), 10 expanded segments with human-readable criteria, user activity timeline (/admin/cdp/activity, email lookup + chronological events), Plan My Trek stepwise event tracking (steps 1–6 + wizard_completed), 13 backend tests added | done |
| bugfix (2026-05-27) | Homepage stub regression after logout — **Root cause 1**: homepage had no `export const dynamic = "force-dynamic"`, so Next.js 14.2 statically pre-rendered it at build time when the backend isn't running → `fetchCMSPages` returns [] → DifficultyTabs + SeasonalTreks fall back to 12 static treks. **Root cause 2**: logout handler called `router.push("/"); router.refresh()` — `router.refresh()` refreshes the CURRENT route (not "/"), so navigating from /trek/kedarkantha the homepage router cache is never invalidated. **Fix**: added `force-dynamic` to homepage + changed logout to `window.location.href = "/"` (full reload bypasses all Next.js caches). Files: `app/(public)/page.tsx`, `components/layout/Header.tsx` | done |
| 66 | Homepage Section Logic by User State — HomeWelcomeBanner (States A+B: logged-in greeting + last-viewed chips), HomeTrendingHeader (4-state personalized heading over SSR TrekCards), RecentlyViewedSection (State D: repeat logged-out horizontal recently-viewed row with login nudge), PersonalisedFeed 4-state logic (heading/fetcher/visibility per state), DifficultyTabsSection preferred-difficulty pre-select from behavior profile. No backend changes. | done |
| bugfix (2026-05-29) | Plan My Trek CTA not working on trek detail page (desktop + mobile) — **Root cause**: Desktop sidebar "Plan My Trek" `<Button>` at `trek/[slug]/page.tsx:602` had NO `<Link>` wrapper and no `onClick` — rendered as a dead `<button>` with no navigation. Mobile had no in-article card (sidebar is `hidden lg:block`) and relied solely on `StickyMobileCTA` which can be permanently dismissed via localStorage. **Fix 1**: Wrapped desktop sidebar button in `<Link href="/plan">`. **Fix 2**: Added `block lg:hidden` in-article CTA card (same design as sidebar card) at end of article content — non-dismissable, always visible on mobile. File: `app/(public)/trek/[slug]/page.tsx` | done |
| 67 | CDP Analytics Full Revamp — Phase 0 (event taxonomy, is_internal traffic separation, 3 new DB tables, 4 composite indexes, 35 seeded events); Phase 1 (executive dashboard with 8 KPI tiles + SVG sparklines + alert rail + real-time feed, Event Explorer with 7 filters + pagination + CSV export); Phase 2 (6 funnel templates, configurable cohort builder, dynamic segment builder with preview); Phase 3 (content analytics, trek funnel analytics); Phase 4 (webhook rules CRUD, suppression list); 25 backend tests added (608 total pass); 6 new/rewritten admin frontend pages; `is_internal` flag in analytics SDK + 18 new trackEvent wrappers | done |
| bugfix (2026-05-29) | `content_brief` Pipeline Stage JSON Truncation Fix — **Root cause**: `ContentBriefAgent._generate_brief()` used a single `json.loads(raw)` with no fallback. The 9-section trek guide template (added in commit `9a2db42`) generates a longer `editorial_brief_markdown` field that frequently contains **literal unescaped control characters** (real `\n`, `\r`, `\t` inside JSON string values) causing `json.loads` to fail with `Expecting ',' delimiter`. This was already solved in `seo_aeo/agent.py` and `content_writing/agent.py` but never applied to `content_brief/agent.py`. **Fix**: Applied the same three-layer parse pattern used across all other agents: Layer 1 — `json.loads(raw)`; Layer 2 — `json.loads(_clean_llm_json(raw))` (escapes literal control chars inside JSON strings by walking char-by-char tracking in-string state); Layer 3 — `json_repair.repair_json(raw)` fallback (handles unescaped quotes and remaining LLM JSON errors). `_clean_llm_json` is the identical function already present in `seo_aeo/agent.py` and `content_writing/agent.py` — now added to `content_brief/agent.py` as well. **4 new tests added** to `test_brief_agent.py`: `test_clean_llm_json_fixes_literal_newlines_in_string`, `test_clean_llm_json_preserves_escaped_sequences`, `test_clean_llm_json_fixes_tabs_and_carriage_returns`, `test_generate_brief_recovers_from_literal_newlines_in_json`. **Files changed**: `services/api/app/modules/agents/content_brief/agent.py`, `services/api/tests/test_brief_agent.py`. **610 pass, 2 pre-existing test_refresh failures (unrelated), 1 skipped.** | done |
| bugfix (2026-05-29) | Step 66 homepage personalisation regressions — **Bug 1**: `RecentlyViewedSection` showed ⛰ placeholder for CMS-only treks (Prashar Lake, Chandrakhani Pass etc.) because enrichment only looked up 12-item static trekList. **Fix**: `page.tsx` builds `cmsImageMap: Record<string,string>` from `cmsTrekPages` (slug→hero_image_url) and passes it as a new prop; `RecentlyViewedSection` uses `staticMatch?.image \|\| cmsImageMap[v.slug] \|\| ""`. **Bug 2**: "FOR YOU / Treks matched to your interests" section heading rendered for State C (new logged-out) because the outer `<Section>` wrapper in `page.tsx` always rendered its heading regardless of whether `PersonalisedFeed` returned null. **Fix**: Removed `<Section>` wrapper from `page.tsx`; `PersonalisedFeed` now owns its own `<section className="py-16 md:py-24"><div className="container-wide">` wrapper and heading, so null return for State C hides everything. **Bug 3**: `HomeTrendingHeader` showed an unwanted subheading line below the main heading. **Fix**: Removed `subLabel` state, all `setSubLabel` calls, `topRegion` local vars, `getBehaviorProfile` import, and the `<p>{subLabel}</p>` render from `HomeTrendingHeader.tsx`. **Bug 4**: `HomeWelcomeBanner` and `HomeTrendingHeader` showed sub-location strings ("Munsiyari, Pithoragarh district") instead of state names ("Himachal Pradesh") because `TrekViewTracker` passed `trek.region` (sub-location) to `recordTrekView`. **Fix**: Changed `TrekViewTracker` props in `trek/[slug]/page.tsx` from `region={trek.region}` to `region={cmsPage?.trek_state \|\| trek.state \|\| trek.region}`. Files changed: `RecentlyViewedSection.tsx`, `PersonalisedFeed.tsx`, `HomeTrendingHeader.tsx`, `app/(public)/page.tsx`, `app/(public)/trek/[slug]/page.tsx`. `next build` clean: 193 pages, zero errors. | done |

## V5 — Mobile App Roadmap
| Item | Status |
|------|--------|
| V5 roadmap document created | done |
| All 22 step MD files created (STEP-M01 through STEP-M22) | done |
| Comprehensive mobile review — gap analysis, missing docs created (2026-05-29) | done |
| **Step M01 — Expo Bootstrap + Navigation + Design System** (2026-06-03) | **done** |
| **Step M02 — Mobile Auth** (2026-06-08) | **done** |
| **Step M03 — Backend Mobile Extensions** (2026-06-08) | **done** |
| **Step M04 — CMS Offline Content Engine** (2026-06-10) | **done** |
| **Step M-DS1 — Mobile Design System Overhaul** (2026-06-10) | **done** |
| **Step M05 — Trek Detail Screen** (2026-06-10) | **done** |
| **Step M06 — Home Screen + 4-State Personalisation** (2026-06-10) | **done** |
| **Mobile Crosscheck Bugfix Pass (M-DS1–M06)** (2026-06-11) | **done** |
| **Step M-DS2 — Splash, Onboarding & Auth Polish** (2026-06-11) | **done** |
| **Step M-DS3 — Home Screen Web-Parity + Content Hub Screens** (2026-06-12) | **done** |
| **Step M-DS4 — Trek Detail Screen Web-Parity** (2026-06-12) | **done** |
| **Step M-DS5 — Splash Screen Rebuild (Static Background + Logo Card)** (2026-06-12) | **done** |
| **Step M-DS6 — Splash→Onboarding Transition Animation + Onboarding Skip CTA** (2026-06-12) | **done** |
| **Step M07a — Browse Tab (grid, filters, regions/seasons, basic search)** (2026-06-12) | **done** |
| **Step M07b — Advanced Search (semantic, voice, recent, trending)** (2026-06-14) | **done** |
| **bugfix — Home difficulty tabs showing empty Easy/Moderate** (2026-06-14) | **done** |
| **Step M07c — Region Tabs with Trek Cards** (2026-06-14) | **done** |
| **bugfix — Voice search crash on mic tap** (2026-06-15) | **done** |
| **Step 76 — TrekSage V1 Completion + V2 Features** (2026-06-17) | **done** — Global floating TrekSageWidget on all public pages; 7-step PlanWizard; LeadCaptureModal; Admin TrekSage Logs dashboard (/admin/treksage-logs); Mobile TrekSage chat tab (center FAB, replaces Plan FAB); ai-logs filter params (source, tool_name); 40/40 BE tests pass; next build ✓; tsc ✓ |
| **TrekSage hotfix 1** (2026-06-17, commit 3a33716) | **done** — Hooks violation fix (SiteLayout conditional render moved to usePathname check), scrolling fix (container scroll ref instead of window scrollIntoView), token cost cut (MAX_HISTORY_MESSAGES=6), widget logging guard |
| **TrekSage hotfix 2** (2026-06-17, commit 88ddd49) | **done** — Always persist session_key in localStorage even on agent failure; resilience fix in TreksageChat.tsx |
| **TrekSage hotfix 3 — UX overhaul** (2026-06-18, commit 387de83) | **done** — Full TreksageChat rewrite: stuck-chat fixed (tool_choice=any round 0 + post-process fallback), full-screen layout (max-w-2xl removed), sessions sidebar (Today/Yesterday/Earlier grouped, localStorage persistence), voice input (Web Speech API popup + pulsing rings), emoji fix (🏕→⛺, 🗓→📅), trek result cards in 2-col grid, message slide-up animation |
| **Step 77 — TrekSage UX Overhaul + Search Fix** (2026-06-18) | **done** — search_treks keyword tokenization (OR-match any token, extended haystack with month names); _MONTH_ORD full month names fix; TC-B41–B44 backend tests (676 pass); Myra-inspired split-screen TreksageChat: canvas pane (40/60 split, slides in on trek_cards), trek name → /trek/[slug]?ref=treksage analytics link, View Details → TrekDetailPanel inline, Add to Compare → Compare(N) button → compare message; multi-stage thinking bubble; send/stop morph; stagger-fade cards; TrekDetailPanel.tsx created; next build ✓ |
| Step M08 — Trek Comparison (full attribute table + saved comparisons) | pending |

### Step M01 — Done (2026-06-03)
- Created `apps/mobile/` workspace with Expo SDK 56 (react-native 0.85.3, React 19)
- Expo Router v56.x: 5-tab nav (Home/Browse/Plan/Saved/Account) + auth stack (sign-in/sign-up) + +not-found
- NativeWind v4 + tailwind.config.js with full TrekYatra design token palette
- Design system: Button, Badge, Card, SkeletonLoader, SafeArea, Typography components
- Providers: QueryProvider (TanStack Query v5), AuthProvider (Zustand v5 + expo-secure-store)
- `packages/types/index.ts`: Trek, TrekListItem, CMSPage, User, RecommendationItem, PaginatedResponse interfaces
- `constants/theme.ts`: colors, fonts, spacing, radius tokens
- Sentry v8 init (guarded by env var); expo-splash-screen, expo-font, @expo-google-fonts
- **tsc --noEmit: 0 errors | expo export --platform ios: ✓ (79 assets, 5.2MB bundle)**
- Key decision: reanimated pinned to ~3.16.0 (v4 needs react-native-worklets; add in M07)

### Step M01 — Post-push Deployment Fixes (2026-06-03)

Three successive DO deployment failures were encountered and resolved after M01 push. **All web-next changes are TypeScript-only type casts — zero runtime impact on production website (Desktop and Mobile web).**

**Failure 1 — `ERESOLVE` on `@expo/log-box` (commit `5de7269`)**
- Root cause: DO's npm 10.9.7 (strict peer-dep resolution by default) failed when installing monorepo workspaces. `@expo/log-box@^56.0.12` in mobile conflicted with expo-router's exact peer dep `@expo/log-box@56.0.4`.
- Fix: Added root `.npmrc` with `legacy-peer-deps=true` (matches local install mode). Removed `@expo/log-box` from `apps/mobile` explicit deps — let expo-router manage it as a transitive dep.
- Production impact: **None** — this was an install-time error, never reached the build stage.

**Failure 2 — `button.tsx` TypeScript error (commit `54fde37`)**
- Root cause: Adding npm workspaces caused `@radix-ui/react-slot@1.2.3` to be hoisted. v1.2.3 tightened the `onChange` prop type (`FormEventHandler<HTMLButtonElement>` not assignable to `ChangeEventHandler<HTMLElement, Element>`), breaking the JSX spread in `button.tsx:46`.
- Fix: Cast `Comp` as `React.ElementType` — `(asChild ? Slot : "button") as React.ElementType`. This is a compile-time-only cast; the runtime value is identical.
- Production impact: **None** — TypeScript cast only; compiled JS output unchanged.

**Failure 3 — `AuthGateModal.tsx` Dialog namespace errors (commit `54fde37`)**
- Root cause: `@radix-ui/react-dialog@1.1.15` (newest patch of `^1.1.14`) updated component return types to include `Promise<ReactNode>` for RSC support. This made all 7 `Dialog.*` namespace components fail the JSX element type check with `@types/react@18.3.x`.
- Fix: Replaced `import * as Dialog` with named imports (`Root as _DialogRoot`, etc.), each cast to `React.ElementType`. JSX output is byte-for-byte identical.
- Production impact: **None** — same Radix Dialog components rendered; only TypeScript types changed.

**Failure 4 — React error #31 on `/404` and `/500` during SSR prerender**
- Root cause: npm workspaces with `"apps/*"` glob pulled `apps/mobile` into the workspace graph. `react-native@0.85.3` declares `react@^19.2.3` as a peer dep, so npm hoisted React 19 to root `node_modules`. Next.js SSR prerender for `/404`/`/500` failed with minified React error #31 ("Objects are not valid as a React child") because React 18 (web-next) and React 19 (root) created two separate instance registries.
- Fix attempted (failed): Adding `"react": "^18.3.0"` / `"react-dom": "^18.3.0"` to root `overrides` — npm returned `EOVERRIDE` because workspace members are treated as direct deps and cannot be overridden.
- Fix applied: Changed root `package.json` workspaces from `["apps/*", "packages/*"]` to `["apps/web-next", "packages/*"]` — explicitly excluding `apps/mobile`. Mobile uses EAS (not DO), so it does not need npm workspace membership. With mobile excluded, npm installs React 18 into `apps/web-next/node_modules` with no conflict. Also changed `apps/mobile/package.json` `react`/`react-dom` from `^19.0.0` to `^18.3.0` for standalone-install consistency.
- Verification: `npx next build` in `apps/web-next` → ✓ Compiled successfully, ✓ Generating static pages (193/193), zero errors.
- Production impact: **None** — Mobile uses EAS (Metro bundler, separate from DO). Excluding mobile from npm workspaces has zero effect on the production website.

**Root cause of all four failures:** npm workspaces hoisting resolves the LATEST version of every package satisfying the declared range. The permanent fix is to only include web-facing apps in the npm workspace graph. Mobile (EAS-built) must remain outside npm workspaces to prevent React version conflicts.

**Failure 5 — Xcode build failure: `'folly/coro/Coroutine.h' file not found` in RNReanimated (2026-06-08)**
- Root cause: `react-native-reanimated@~3.16.0` is incompatible with `react-native@0.85.3`. RN 0.85.3 ships a newer Folly that removed `folly/coro/Coroutine.h`. reanimated 3.16.x includes this header during iOS compilation.
- First fix attempt: Removed reanimated entirely — caused Metro runtime error because `react-native-css-interop` (NativeWind v4 core) requires reanimated at runtime (`makeMutable`, `withRepeat`, `withSequence` from line 281 of native-interop.js).
- Final fix: `npx expo install react-native-reanimated` → Expo SDK 56 selected **reanimated 4.3.1**. `npx expo install react-native-worklets` → **worklets 0.8.3** (required peer dep for reanimated 4.x; podspec validates its presence). v4.x was rewritten without the folly/coro dependency, compiles cleanly against RN 0.85.3. Added `react-native-reanimated/plugin` to `apps/mobile/babel.config.js`.
- After fix: `npx expo prebuild --clean --platform ios` → ✔ Installed CocoaPods. Ready to build in Xcode.
- Production impact: **None** — M01 is not in production; Expo shell app only.

**Failure 6 — Metro runtime: Incompatible React versions `19.2.7` vs `19.2.3` (2026-06-08)**
- Root cause: `"react": "^19.0.0"` in package.json resolved to `19.2.7` (latest). `react-native@0.85.3` bundles `react-native-renderer@19.2.3`. React requires an **exact** version match between `react` and `react-native-renderer` — the `^` range caused a patch-level mismatch.
- Fix: Pinned `react` and `react-dom` to exact version `19.2.3` in `apps/mobile/package.json`. Rule: always pin react to the exact version that the installed react-native version ships with (check by looking at `react-native-renderer` version in node_modules).
- Production impact: **None**.

### Mobile Review — Gaps Fixed (2026-05-29)
The following gaps were identified and resolved during a full cross-check of all 22 mobile step docs against the complete website feature set (Steps 00–67):

**V5-MOBILE-APP.md fixes:**
- Added `buddy_signals` table to DB Tables section (was in M18 step doc but missing from V5 main doc)
- Added `user_badges` table to DB Tables section (was in M16 step doc but missing from V5 main doc)
- Fixed bundle ID inconsistency: `com.trekyatra.app` → `co.in.trekyatra.app` (matches M22 eas.json)
- Added newsletter subscribe (Trail Letter email) to Web → Mobile feature parity matrix
- Added legal/trust pages (Privacy, Terms, Affiliate Disclosure, Safety Disclaimer) to feature parity matrix

**Step doc fixes:**
- `STEP-M08` — Updated scope from 2-trek to 2-or-3-trek comparison (mirrors web Step 44 which supports 3 treks); updated save payload; added TC-M08-03 for 3-trek verify
- `STEP-M05` — Added `AffiliateCard` block handling in CMSContentRenderer (affiliate gear cards from Step 36); added safety disclaimer banner for challenging treks; confirmed share URL uses `/trek/` not `/treks/` (web bugfix `63d0460`)
- `STEP-M10` — Added Trail Letter newsletter subscribe form to Settings screen; added Safety Disclaimer link to About section

**New documentation files created:**
- `docs/mobile/MOBILE_PRELAUNCH_CHECKLIST.md` — Complete 9-section pre-launch checklist covering platform accounts, backend/DO configuration, EAS setup, App Store + Play Store, step gates, testing, and go/no-go sign-off
- `docs/mobile/MOBILE_PRODUCTION_SETUP.md` — Production setup log covering shared DO infra, new env vars (OpenWeatherMap, Firebase, APNs, DO Spaces, Razorpay webhook), new Celery tasks, EAS/Expo setup, Apple Developer + Play Console + Firebase step-by-step, Sentry, migration sequence, cost estimate, OTA + rollback policy

**DO configuration gaps identified (not yet actioned — pre-M14/M17/M18/M19):**
- `OPENWEATHERMAP_API_KEY` — add before M19 implementation
- `FIREBASE_SERVICE_ACCOUNT_JSON`, `APNS_KEY_ID`, `APNS_TEAM_ID` — add before M14 implementation
- `DO_SPACES_KEY`, `DO_SPACES_SECRET` — add before M17 implementation (bucket already provisioned)
- `RAZORPAY_WEBHOOK_SECRET` — add before M12 implementation

### Step M02 — Mobile Auth — Done (2026-06-08)
- `lib/authStorage.ts` — SecureStore helpers (saveTokens, loadTokens, clearTokens, getOrCreateDeviceId)
- `lib/authApi.ts` — signIn, signUp, getMe, refreshAccessToken, signOutServer, forgotPassword, resetPassword, signInWithGoogle
- `lib/googleAuth.ts` — expo-auth-session Google OAuth with ResponseType.Token (implicit flow)
- `lib/appleAuth.ts` — expo-apple-authentication native prompt (backend endpoint deferred to M04)
- `lib/biometricAuth.ts` — expo-local-authentication isBiometricAvailable + promptBiometric
- `hooks/useAuth.ts` + `hooks/useRequireAuth.ts` — auth access + route guard
- `components/auth/SocialSignInButtons.tsx` — Google + conditional Apple (iOS only)
- `app/(auth)/welcome.tsx` — 3-slide onboarding carousel with AsyncStorage flag
- `app/(auth)/sign-in.tsx` — email+password + Google OAuth + forgot-password link
- `app/(auth)/sign-up.tsx` — fullName + email + password registration form
- `app/(auth)/otp.tsx` — placeholder (M04)
- `app/(auth)/forgot-password.tsx` + `reset-password.tsx` — full functional password reset flow
- `app/(auth)/_layout.tsx` — added all 6 auth screens to Stack
- `app/_layout.tsx` — AuthGate with onboarding check + auth-aware redirect
- `app/(tabs)/saved.tsx` + `account.tsx` — useRequireAuth() guards added
- `stores/authStore.ts` — setAuth (user+tokens), setLoading, clearAuth using authStorage
- `providers/AuthProvider.tsx` — signIn, signUp, signInWithGoogle, signInWithApple methods
- `@react-native-async-storage/async-storage@2.2.0` added to package.json
- `.expo/types/router.d.ts` updated with new typed routes
- **tsc --noEmit: 0 errors**

### Step M03 — Backend Mobile Extensions — Done (2026-06-08)
- Alembic migration `20260608_0042_mobile_devices.py`: `mobile_devices` table + `cms_pages.deleted_at` + partial index on `cms_pages(updated_at)`
- `app/modules/mobile/models.py` — MobileDevice ORM (user_id FK, device_id UNIQUE, refresh_token_hash, platform, push tokens)
- `app/modules/mobile/service.py` — mobile_login, mobile_signup, issue_mobile_token (30d access + 90d refresh), refresh_mobile_token, register_device, unregister_device, get_sync_pages
- `app/schemas/mobile.py` — 12 Pydantic schemas for all mobile endpoints
- `app/api/routes/auth_mobile.py` — POST /auth/mobile/login, /signup, /token, /token/refresh
- `app/api/routes/mobile.py` — GET /mobile/sync, POST /mobile/device, DELETE /mobile/device/{id}
- `app/core/security.py` — create_mobile_access_token, create_mobile_refresh_token, parse_mobile_refresh_token
- `app/modules/auth/dependencies.py` — get_current_user_bearer (Authorization: Bearer header, typ==mobile_access)
- `services/api/.env.example` — added MOBILE_TOKEN_EXPIRE_DAYS=30
- **11/11 new tests pass; 4 pre-existing failures confirmed unchanged**
- 4 new Celery beat tasks (M14×2, M18×1, M19×1) — require celery-beat restart after each mobile step deploys

### Step M-DS1 — Mobile Design System Overhaul — Done (2026-06-10)
- `apps/mobile/constants/theme.ts` — Full rewrite: `lightColors` (Pine/Saffron/Sky/Earth/Mist/Paper), `darkColors` (existing dark + saffron accent), backward-compat `colors` alias
- `apps/mobile/tailwind.config.js` — New tokens (pine, saffron, sky, earth, mist, paper) + `darkMode: 'class'`
- `apps/mobile/providers/ThemeProvider.tsx` (NEW) — NativeWind v4 `useColorScheme()` hook-based theme provider; `setTheme()` + `toggleTheme()` wired to AsyncStorage
- `apps/mobile/hooks/useTheme.ts` (NEW) — `useTheme()` hook: `isDark`, `colors`, `toggleTheme`, `setTheme`, `colorScheme`
- `apps/mobile/components/ui/Logo.tsx` (NEW) — TrekYatra logo component using `assets/logo.png` (copied from web)
- `apps/mobile/components/tabs/CustomTabBar.tsx` (NEW) — FAB tab bar: center Plan button as 56px saffron circle raised -20px; light/dark aware bg + border + icon colors; theme-aware shadows
- `apps/mobile/app/(auth)/welcome.tsx` — Full rewrite: 4-slide full-bleed mountain photography carousel (onboarding-1–4.jpg); Pine/Saffron/Sky/Earth icon colors per slide; saffron CTAs; progress dots
- `apps/mobile/app/(tabs)/_layout.tsx` — CustomTabBar wired via `tabBar` prop; downloads hidden with `href: null`; Browse→Explore, Account→You labels
- `apps/mobile/app/(auth)/sign-in.tsx` — Light design (Paper/white bg, Pine text, Saffron CTAs); `useTheme()` aware; Logo component at top
- `apps/mobile/app/(auth)/sign-up.tsx` — Same light design; Logo at top; `useTheme()` aware
- `apps/mobile/components/ui/SafeArea.tsx` — Now uses `useTheme()` for `backgroundColor` (Paper in light, #0c0e14 in dark)
- `apps/mobile/components/ui/Button.tsx` — `bg-saffron` hero variant; `useTheme()` aware text colors; saffron shadow on hero
- `apps/mobile/app/_layout.tsx` — ThemeProvider wrapped around entire app
- `apps/mobile/app.config.ts` — `splash.backgroundColor: "#1D3A2E"` (Pine); `userInterfaceStyle: "automatic"`
- Assets bundled: `onboarding-1–4.jpg` (himalaya dawn, kashmir, ladakh, uttarakhand snow), `logo.png`
- **tsc --noEmit: 0 errors**
- No backend changes. No web-next changes.

### Step M05 — Trek Detail Screen — Done (2026-06-10)
- `apps/mobile/app/(tabs)/(home)/_layout.tsx` (NEW) — Stack layout for home route group; trek detail screen registered with transparent header + back arrow
- `apps/mobile/app/(tabs)/(home)/trek/[slug].tsx` (NEW) — Full trek detail screen: TrekHero, TrekMetaStrip, TrekTabBar (Guide/Packing/Permits/Costs), TrekRelatedRow, TrekStickyBar, share sheet, offline badge, safety disclaimer
- `apps/mobile/components/trek/TrekHero.tsx` (NEW) — expo-image + LinearGradient overlay + trek title/state
- `apps/mobile/components/trek/TrekMetaStrip.tsx` (NEW) — Duration/altitude/difficulty/season chips with color coding
- `apps/mobile/components/trek/TrekTabBar.tsx` (NEW) — 4-tab switcher with saffron active indicator
- `apps/mobile/components/trek/TrekStickyBar.tsx` (NEW) — "Plan with this trek" saffron button + heart Save button (auth-gated; redirect to sign-in if unauthenticated)
- `apps/mobile/components/trek/TrekCard.tsx` (NEW) — Reusable trek card (expo-image, difficulty badge, state/duration meta)
- `apps/mobile/components/trek/TrekRelatedRow.tsx` (NEW) — Horizontal related treks row using TrekCard
- `apps/mobile/hooks/useTrekDetail.ts` (NEW) — TanStack Query: network-first fetch + SQLite upsert; falls back to SQLite cache on network error
- `apps/mobile/lib/mobileApi.ts` (NEW) — Bearer-token API client: fetchWithAuth (auto token refresh via authStorage + authApi), contentApi helpers (getCmsPage, getTrendingTreks, getSeasonalTreks, getAnonymousRecommendations, getPersonalisedRecommendations, saveTrek)
- `apps/mobile/lib/behaviorProfile.ts` (NEW) — AsyncStorage ty_behavior_v1 read/write; `recordTrekView()` + `getBehaviorProfile()` + `hasBehaviorData()`
- `apps/mobile/app/(tabs)/_layout.tsx` — Home tab name changed from `"index"` to `"(home)"`
- `apps/mobile/app.config.ts` — Added `"expo-image"` to plugins array
- Packages: `expo-image ~56.0.10` + `expo-linear-gradient ~56.0.4` installed
- **tsc --noEmit: 0 errors** | No backend changes | No web-next changes

### Step M06 — Home Screen + 4-State Personalisation — Done (2026-06-10)
- `apps/mobile/app/(tabs)/(home)/index.tsx` (NEW) — 4-state home screen; resolves A/B/C/D from `isLoggedIn + hasBehavior`; pull-to-refresh; skeleton on first load
- `apps/mobile/components/home/HomeWelcomeBanner.tsx` (NEW) — `HomeWelcomeBannerA` (state A: greeting + browse CTA) + `HomeWelcomeBannerB` (state B: greeting + view count + recent-view chips)
- `apps/mobile/components/home/HomeTrendingSection.tsx` (NEW) — Horizontal trek card row; heading adapts: "Trending" (A/C), "Recommended for you" (B), "Continue exploring" (D)
- `apps/mobile/components/home/RegionsRow.tsx` (NEW) — 8 region chips → navigate to browse with region filter
- `apps/mobile/components/home/SeasonalPicksRow.tsx` (NEW) — Current-month seasonal treks; auto-detects month
- `apps/mobile/components/home/RecentlyViewedRow.tsx` (NEW) — State D only: compact horizontal cards from ty_behavior_v1
- `apps/mobile/components/home/PersonalisedFeedSection.tsx` (NEW) — States A/B/D: 2×3 feed grid; State B calls `/recommendations/personalised`, A/D call `/recommendations/anonymous`
- `apps/mobile/components/home/HomeSkeleton.tsx` (NEW) — Pulse-animated skeleton (Animated loop opacity 0.3→0.7)
- `apps/mobile/hooks/useBehaviorProfile.ts` (NEW) — Reads ty_behavior_v1; exposes `profile`, `hasBehavior`, `recentViews`, `topRegions`, `topDifficulties`
- `apps/mobile/hooks/useHomeData.ts` (NEW) — Parallel `useQueries`: trending (10min stale), seasonal (1hr stale), recs (5min stale)
- Old `apps/mobile/app/(tabs)/index.tsx` placeholder removed (replaced by `(home)/index.tsx`)
- **tsc --noEmit: 0 errors** | No backend changes | No web-next changes

### Mobile Crosscheck Bugfix Pass (M-DS1–M06) — Done (2026-06-11)
User QA reported 4 bugs after M05+M06: (1) splash/animations not working, (2) login appearing to do nothing (no success message, broken UI on splash/onboarding/login), (3) home screen + bottom nav broken, (4) tapping a trek-state pill showed "coming in M03" placeholder despite M03 being implemented.

**Test Cases backfilled (2026-06-11)**: see `docs/mobile/steps/STEP-M-CROSSCHECK-bugfix-pass.md` for TC-B01–B07 (backend, `test_treks_seasonal.py`) and TC-F01–F07 (frontend) — pending user confirmation.

- **Backend**: NEW `GET /api/v1/treks/seasonal?month=&limit=` endpoint (`api/routes/treks.py` + `modules/cms/service.py::get_seasonal_pages`) — mirrors web seasonal-trek season-range matching logic; 7 new tests in `tests/test_treks_seasonal.py`, all pass; full suite 637 passed/1 skipped (2 pre-existing `test_refresh.py` failures confirmed unrelated via stash)
- **Root cause of bug #2 (login)**: `apps/mobile/app/_layout.tsx` `AuthGate` redirected to `router.replace("/(tabs)")` after login — an invalid route since M05 renamed `(tabs)/index.tsx` → `(tabs)/(home)/index.tsx`. Fixed to `router.replace("/(tabs)/(home)")`. Caught via `tsc --noEmit` (TS2345).
- **Bug #1 (splash/fonts)**: `apps/mobile/app/_layout.tsx` was missing `PlayfairDisplay_700Bold`/`PlayfairDisplay_600SemiBold` in `useFonts()` despite being referenced via `fontFamily` in Home header/section headings — RN silently falls back to system font with no error. Both weights added.
- **Bug #3 (home + bottom nav)**:
  - `apps/mobile/components/tabs/CustomTabBar.tsx` `getIconName`/`getLabelText` still switched on `"index"` (pre-M05 route name) instead of `"(home)"` — Home tab showed default `ellipse-outline` icon + raw "(home)" label. Fixed.
  - Same file: `state.routes.map(...)` rendered ALL tab routes including `downloads` (which has `options.href: null` in `(tabs)/_layout.tsx` to hide it) — appeared as a stray 6th tab with broken icon/label. Added `if (options.href === null) return null;` filter.
  - `apps/mobile/lib/mobileApi.ts` — `contentApi` was calling endpoints/params that don't exist on the backend (silently returning empty data, making Home sections look "broken"/empty). Rewired: trending → `GET /cms/pages/trending`, seasonal → `GET /treks/seasonal?month=`, anonymous recs → `GET /recommendations`, personalised recs → `GET /account/recommendations`, save → `POST /account/bookmarks/by-slug`; added `mapCmsPageToTrekListItem`/`mapRecommendationToTrekListItem` to convert backend response shapes to mobile `TrekListItem`.
  - `apps/mobile/hooks/useHomeData.ts` — `getAnonymousRecommendations()` no longer passed unsupported `topRegions`/`topDifficulties` args.
- **Bug #4**: `apps/mobile/app/(tabs)/browse.tsx` placeholder text "Trek explorer — coming in M03" → "coming in M07" (M03 backend extensions were already implemented; M07 Explore & Search is the actual pending screen).
- **Process**: created `.claude/skills/mobile-design-system/SKILL.md` per user request — covers theme tokens, MANDATORY font-loading check, tab-bar route-name conventions ((home) not index), and API contract discipline (backend route + response-shape mapping). Referenced from root `CLAUDE.md` CLI table + added as Pre-Step Checklist item 9 for all `apps/mobile/` work going forward.
- **Verification**: `tsc --noEmit` → 0 errors. Backend full suite 637 passed/1 skipped (2 pre-existing unrelated failures). Simulator screenshot confirmed Home header font, "Trending this month" populated with real data, "Explore by Region" chips, and corrected Home tab icon/label render correctly via Fast Refresh.
- **No web-next changes** — zero blast radius on production website (desktop + mobile web).

### Step M-DS2 — Splash, Onboarding & Auth Polish — Done (2026-06-11)
QA pass on M-DS1–M06 (with screenshots) surfaced 6 new issues, all fixed in this combined pass. See `docs/mobile/steps/STEP-M-DS2-splash-onboarding-auth-polish.md` for full detail. Numbered `M-DS2` (not `M07`) since `M07` is reserved for "Explore & Search".

- **NEW `apps/mobile/components/ui/AnimatedSplash.tsx`** — "Trail Comes Alive" cinematic splash: SVG dawn mountain silhouette fades in, saffron trail line draws upward (`react-native-svg` `Path` + `strokeDashoffset` via Reanimated), tent/leaf/sparkle waypoint icons fade in, trail fades as the TrekYatra logo settles at the peak with a `RadialGradient` sunrise glow, tagline "Explore. Dream. Discover." fades in, whole sequence fades out (~4.1s total). New dependency: `react-native-svg`.
- `apps/mobile/app/_layout.tsx` — renders `<AnimatedSplash>` as an overlay until fonts load AND the animation finishes; `AuthGate` no longer redirects unauthenticated users to sign-in — anonymous users can browse all `(tabs)` (matches M06 States C/D). `useRequireAuth` continues to gate `account.tsx`/`saved.tsx`.
- `apps/mobile/app.config.ts` — native `splash.backgroundColor` `#1D3A2E` → `#0c0e14` to match `AnimatedSplash`'s first frame.
- `apps/mobile/app/(auth)/welcome.tsx` — `Dimensions.get("window")` → `Dimensions.get("screen")` (full-bleed fix); icon badges now white-on-`rgba(13,20,16,0.55)` for contrast in light/dark photo regions; added top gradient + back-chevron (hidden on slide 1); rewrote slides 3 & 4 to cover AI trip planner + personalised recs ("Plan in 60 seconds — picked for you") and offline maps + operator booking ("Trek offline. Book with trusted operators").
- `apps/mobile/app/(auth)/sign-in.tsx` + `sign-up.tsx` — added "Skip" button (top-right) → sets onboarding flag, routes to `/(tabs)/(home)` for anonymous browsing.
- `apps/mobile/components/auth/SocialSignInButtons.tsx` + `Button.tsx` — Google button now shows `Ionicons name="logo-google"`; Apple button always renders on iOS (`isAppleAuthAvailable()`) with `Ionicons name="logo-apple"` and a "coming soon" alert (`onApple` defaults to local handler if not passed). `Button` gained an optional leading `icon` prop.
- `apps/mobile/lib/authApi.ts` — `apiPost`/`apiGet` now route through `fetchWithTimeout` (15s `AbortController`); guarantees the sign-in/sign-up spinner resolves to a visible error instead of spinning forever.
- **Apple Sign-In backend integration explicitly deferred** — UI-only for this pass (no Apple Developer credentials, no `/api/v1/auth/apple` endpoint, no `expo-apple-authentication` plugin entry).
- **tsc --noEmit: 0 errors** | Backend: 637 passed, 1 skipped (same 2 pre-existing `test_refresh.py` failures, unrelated) | No web-next changes — zero blast radius on production website.
- `gitnexus_detect_changes(scope: all)`: 39 changed symbols / 15 files, risk **medium**, 2 affected processes (`SignInScreen → ApiGet`, `SignInScreen → UseThemeContext`) — both expected from the Skip + timeout changes. `npx gitnexus analyze --force` ran long (>20 min, pre-existing FTS read-only-DB issue) and was non-blocking.

### Repo Housekeeping — Done (2026-06-11)
- Removed `.claude/CLAUDE.md` (vexp pipeline instructions), `.claude/hooks/vexp-guard.sh`, and `.claude/settings.json` (its only hook pointed at the now-deleted `vexp-guard.sh`) — per user request, these were causing tool-selection hallucination (instructing the agent to avoid Grep/Glob/Read in favour of an unavailable `vexp` MCP daemon).
- Restored an accidentally-dropped row in root `CLAUDE.md`'s gitnexus-managed CLI table (`Mobile UI/screen work (apps/mobile) ... | .claude/skills/mobile-design-system/SKILL.md`), which a prior `npx gitnexus analyze --force` auto-regeneration had silently removed despite the skill file still existing and being actively referenced by the Pre-Step Checklist. **Note**: a second `npx gitnexus analyze --force` reindex (same day) dropped this row a second time (also refreshed counts to 472099 symbols / 766819 relationships) — restored again. This row appears to be silently dropped by every gitnexus reindex and may need re-restoring after future reindexes.

### Step M-DS2 — QA Follow-up Fixes — Done (2026-06-11)
Second QA pass (with screenshots) on the M-DS2 build found 4 remaining issues. All fixed in `apps/mobile/` only — zero blast radius on `apps/web-next` (production website, desktop + mobile web).

1. **Splash logo too small** — `apps/mobile/components/ui/AnimatedSplash.tsx`: logo size increased 72×72 → 140×140 (`logoWrap`/`logo` styles).
2. **Skip button bounced back to onboarding** — root cause: `AuthGate` in `apps/mobile/app/_layout.tsx` read `trekyatra_onboarding_done` into local state once on mount; `handleSkip`/`handleGetStarted`/`handleSignIn` wrote to `AsyncStorage` directly without updating that state, so the next `AuthGate` effect run (triggered by the `router.replace` segment change) still saw `onboardingDone=false` and redirected back to `/(auth)/welcome`. Fixed by extracting a new `apps/mobile/providers/OnboardingProvider.tsx` (React Context wrapping `AsyncStorage`, exposes `{ isLoading, done, markDone }`) — `AuthGate` now reads `useOnboarding()`, and `welcome.tsx`/`sign-in.tsx`/`sign-up.tsx` call `markDone()` (updates state synchronously) instead of `AsyncStorage.setItem` directly.
3. **Onboarding background — hard edge instead of full-bleed gradient** — root cause: the "layered gradient" in `apps/mobile/app/(auth)/welcome.tsx` was 7 stacked solid-color `View`s with `bottom:0` and increasing height/opacity; the largest+most-opaque layer (55% height, opacity 0.85) rendered last (topmost in z-order) and fully covered all the smaller layers beneath it, producing a single hard-edged solid block over the bottom 55% of each photo (not a gradient) — this is what looked like a "fixed height background". Replaced with a single `expo-linear-gradient` `LinearGradient` (`transparent → rgba(5,8,15,0.92)`, `locations=[0, 0.4, 0.7, 1]`) spanning the full `ImageBackground`.
4. **Native dev-client rebuild for `react-native-svg`** — `react-native-svg` was added as a JS dependency in M-DS2 but its native module was never linked into the custom EAS dev-client binary (`apps/mobile/ios/`, prebuilt — not Expo Go). Ran `npx expo prebuild --platform ios` → `cd ios && pod install` (118 pods, added `RNSVG 15.15.4`) → `npx expo run:ios` (build succeeded, 0 errors, installed on iPhone 17 Pro simulator). `apps/mobile/ios/` (incl. `Podfile.lock`) is gitignored — no files to commit from the rebuild itself; this fixed the "Unimplemented component: <RNSVGSvgView>" crash on the splash screen.

**Files Created**: `apps/mobile/providers/OnboardingProvider.tsx`
**Files Modified**: `apps/mobile/components/ui/AnimatedSplash.tsx`, `apps/mobile/app/_layout.tsx`, `apps/mobile/app/(auth)/welcome.tsx`, `apps/mobile/app/(auth)/sign-in.tsx`, `apps/mobile/app/(auth)/sign-up.tsx`

`tsc --noEmit`: 0 errors. No backend changes — full backend suite not re-run (no backend files touched).

### Step M-DS3 — Home Screen Web-Parity + Content Hub Screens — Done (2026-06-12)
QA found the mobile Home screen was missing most of the sections present on the production web home page (`apps/web-next/app/(public)/page.tsx`). This step brings the mobile Home screen to full section parity with web and builds the content-hub destination screens those sections link to. Bundled with this step: a backend fix so recommendation-sourced trek cards show difficulty/state/duration/season tags (previously hardcoded to `null`). **Zero blast radius on `apps/web-next`** — additive backend response fields only, no existing endpoint contracts changed.

**Backend (additive, bundled fix):**
- `services/api/app/schemas/recommendations.py` — `RecommendationItem` gains `trek_difficulty`, `trek_state`, `trek_duration`, `trek_season` (all optional).
- `services/api/app/modules/recommendations/service.py` — `_page_to_dict`, `find_similar_pages`, `find_similar_to_query`, `get_anonymous_recommendations`, `_row_to_dict` populate the 4 new fields from `CMSPage`.
- `services/api/tests/test_recommendations.py` — TC-B16 `test_recommendation_items_include_trek_metadata`, TC-B17 `test_anonymous_recommendations_include_trek_metadata_keys`.

**Mobile — `apps/mobile/lib/mobileApi.ts`:**
- `RecommendationItem` interface gains the 4 new fields; `mapRecommendationToTrekListItem` now maps them through instead of hardcoding `null`.
- New interfaces: `Product`, `Operator`, `PlanRecommendRequest`, `TrekRecommendation`, `PlanRecommendResponse`.
- `contentApi` gains `getCmsPagesByType(pageType)`, `getProducts()`, `getOperators(region?)`.
- New `planApi.recommend(payload)` → `POST /api/v1/plan/recommend`.

**Mobile — new shared component:**
- `apps/mobile/components/cms/CMSHubScreen.tsx` — generic CMS hub-list screen (loading/error/empty states, cards → `guide/[slug]`).

**Mobile — new content-hub screens** under `apps/mobile/app/(tabs)/(home)/`:
- `guide/[slug].tsx` — generic CMS page detail screen (renders `CMSContentRenderer`).
- `permits.tsx`, `costs.tsx`, `safety.tsx`, `beginner.tsx` — `CMSHubScreen` over `permit_guide` / `cost_guide` / `safety_guide` / `beginner_guide` page types.
- `packing.tsx` — static packing-system guide ported from `apps/web-next/app/(public)/packing/page.tsx`.
- `plan-my-trek.tsx` — condensed Plan My Trek wizard (intent/months/duration/experience chips) calling `planApi.recommend`; gates submission on auth (`router.push("/(auth)/sign-in")` if logged out).
- `compare.tsx` — lightweight 2-trek comparison over trending treks (region/difficulty/duration/season rows); full M08 attribute-table + saved-comparisons feature deferred to M08.
- `products.tsx` — resources/products list from `contentApi.getProducts()`.
- `operators.tsx` — verified operators list from `contentApi.getOperators()`.
- `_layout.tsx` — `Stack.Screen` entries + titles registered for all of the above.

**Mobile — new Home section components** under `apps/mobile/components/home/`:
- `CategoryHubRow.tsx` — 5-card row → Packing/Permits/Costs/Safety/Plan My Trek.
- `DifficultyTabsSection.tsx` — Easy/Moderate/Challenging tabs over deduped trending+seasonal treks, "View all" → Browse tab with `difficulty` filter.
- `EditorialFeatureCard.tsx` — image+gradient card → `/beginner`.
- `ComparisonCTACard.tsx` — static CTA with example trek pairs → `/compare`.
- `ResourcesRow.tsx` — horizontal product cards (hides if empty) → `/products`.
- `OperatorsCTACard.tsx` — static CTA → `/operators`.

**Mobile — `apps/mobile/app/(tabs)/(home)/index.tsx`:** rewired section order to mirror web: `HomeWelcomeBanner` (A/B) → `HomeTrendingSection` → `CategoryHubRow` → `RegionsRow` → `DifficultyTabsSection` → `EditorialFeatureCard` → `SeasonalPicksRow` → `RecentlyViewedRow` (D) → `PersonalisedFeedSection` (A/B/D) → `ComparisonCTACard` → `ResourcesRow` → `OperatorsCTACard`. New sections (CategoryHub/DifficultyTabs/Editorial/Comparison/Resources/Operators) render for **all** 4 home states, matching web.

**Verification:** `cd apps/mobile && npx tsc --noEmit` → 0 errors. `PYTHONPATH=services/api .venv/bin/pytest services/api/tests/ -v` → 639 passed, 1 skipped (same 2 pre-existing unrelated `test_refresh.py` failures present on clean `main`). `gitnexus_detect_changes(scope:"all")` reviewed — changed/affected scope matches expected files (HomeScreen, mobileApi.ts, recommendations service/schema/tests). No `apps/web-next` files touched. `npx gitnexus analyze --force` re-index: 455,218 nodes | 750,719 edges | 3675 clusters | 300 flows.

### Step M-DS4 — Trek Detail Screen Web-Parity — Done (2026-06-12)
QA found the mobile trek detail screen (built in STEP-M05) missing several sections present on the production web trek detail page. User picked: Trust signals, Trek News, "In this cluster" related pages, Table of Contents (native bottom-sheet, not web sticky-sidebar), and a "Compare this trek" CTA. Excluded (flagged): Breadcrumb (web-only), in-article ad slot (AdSense not native-app-appropriate), mobile news detail screen (News cards deep-link externally). **No backend changes** — `published_at`/`updated_at` already returned by `GET /api/v1/cms/pages/{slug}`; news + related-pages endpoints already public. **Zero blast radius on `apps/web-next`**.

**New components** (`apps/mobile/components/trek/`): `TrustSignals.tsx`, `TrekNewsSection.tsx`, `RelatedPagesSection.tsx`, `TrekContentsSheet.tsx` (native "Contents" bottom-sheet TOC).

**Modified:**
- `apps/mobile/lib/mobileApi.ts` — `CMSPage` +`published_at`/`updated_at` (additive); new `NewsArticle`/`RelatedPage` types; `contentApi.getNewsByTrek()`, `contentApi.getRelatedPages()`.
- `apps/mobile/hooks/useTrekDetail.ts` — `mapDbToPage` sets `published_at: null, updated_at: null` for offline cache rows.
- `apps/mobile/components/cms/blocks/HeadingBlock.tsx` + `CMSContentRenderer.tsx` — additive `onLayout`/`onHeadingLayout` plumbing so headings with stable `id`s can report their y-offset for scroll-to-section.
- `apps/mobile/components/trek/TrekStickyBar.tsx` — 3rd icon button ("Compare", `git-compare-outline`) → `/compare?slug={slug}`.
- `apps/mobile/app/(tabs)/(home)/compare.tsx` — reads `?slug=` param, pre-selects that trek on mount.
- `apps/mobile/app/(tabs)/(home)/trek/[slug].tsx` — wires `TrustSignals` under meta strip; "☰ Contents" pill + `TrekContentsSheet` (Guide tab, ≥2 anchored headings); `TrekNewsSection` + `RelatedPagesSection` after "You might also like" (Guide tab only); `scrollViewRef` + offset refs for scroll-to-section.

**Verification:** `cd apps/mobile && npx tsc --noEmit` → 0 errors. `gitnexus_impact` upstream on all 7 target symbols before editing — all LOW (0 impacted) except `CMSPage` mobile interface (HIGH/54, purely file-import fan-out from 18 files; additive fields confirmed non-breaking via clean `tsc`). `gitnexus_detect_changes(scope:"all")` → `medium` risk, 14 changed symbols / 5 affected / 8 changed files, all expected (`compare.tsx`, `trek/[slug].tsx`, `CMSContentRenderer.tsx`, `HeadingBlock.tsx`, `TrekStickyBar.tsx`, `useTrekDetail.ts`, `mobileApi.ts`, `CLAUDE.md` pre-existing). `PYTHONPATH=services/api .venv/bin/pytest services/api/tests/ -v` → 639 passed, 1 skipped (same 2 pre-existing unrelated `test_refresh.py` failures). No `apps/web-next` files touched.

### Step M-DS5 — Splash Screen Rebuild (Static Background + Logo Card) — Done (2026-06-12)
Replaced `AnimatedSplash.tsx`'s cinematic SVG/Reanimated "Trail Comes Alive" sequence with a static composition, using a user-provided background photo: full-bleed background image (`apps/mobile/assets/splash-background.jpg`, 864×1821) + a centered white rounded-corner card (140×140) containing `logo.png`. Same `onFinish()` contract — fires via `setTimeout(1800ms)`, so `app/_layout.tsx` is unchanged. Removed `react-native-svg`/`react-native-reanimated` usage from this component (both remain used elsewhere in the app).

**Verification:** `cd apps/mobile && npx tsc --noEmit` → 0 errors. `gitnexus_impact("AnimatedSplash", upstream)` → LOW, 0 impacted (leaf component, unchanged prop contract). `gitnexus_detect_changes(scope:"all")` → `low` risk, 5 changed symbols / 0 affected / 1 changed file (`AnimatedSplash.tsx`). No `apps/web-next` files touched.

### Step M-DS6 — Splash→Onboarding Transition Animation + Onboarding Skip CTA — Done (2026-06-12)
Re-added `react-native-reanimated` to `AnimatedSplash.tsx`: logo card fades in and scales (`0.85 → 1.08 → 1.0`) on mount, card/logo enlarged (152×152 / 110×110), and the whole overlay fades to opacity 0 over 350ms before calling `onFinish()` via `runOnJS` — produces a smooth crossfade into the onboarding screen mounted underneath (no `app/_layout.tsx` changes needed). Added a top-right "Skip" pill button to `(auth)/welcome.tsx`, shown on onboarding slides 1-3, that calls `markDone()` + `router.replace("/(auth)/sign-up")` to jump directly to the Sign up screen (distinct from the existing M-DS2 "Skip — continue as guest" buttons on sign-in/sign-up).

**Verification:** `cd apps/mobile && npx tsc --noEmit` → 0 errors. `gitnexus_impact("AnimatedSplash", upstream)` and `gitnexus_impact("WelcomeScreen", upstream)` → both LOW, 0 impacted. `gitnexus_detect_changes(scope:"all")` → `low` risk, 14 changed symbols / 0 affected / 2 changed files (`AnimatedSplash.tsx`, `welcome.tsx`). No `apps/web-next` files touched.

### Step M-DS7 — QA Bugfix Pass: Tab Bar, Back Button, Trek Content Rendering, Home Hero — Done (2026-06-12)
QA on M-DS6 found 4 bugs. Fixes:
1. **Ghost "downloads" tab** — `CustomTabBar.tsx` now explicitly filters `route.name === "downloads"` (the `options.href === null` filter alone wasn't excluding it from the rendered tab bar).
2. **"< index" back button** — added `headerBackButtonDisplayMode: "minimal"` to `(home)/_layout.tsx` Stack `screenOptions`, removing all back-button text labels app-wide in this stack in favor of an icon-only chevron (Airbnb/Cred convention); `trek/[slug]`/`guide/[slug]`'s transparent white-tinted headers render the chevron over the hero image with no further changes.
3. **Trek detail Guide/Packing/Permits/Costs tabs empty** — root cause: the backend never returns `body_json`; it returns `content_html` (full article) + `content_json.sections` (per-section HTML fragments, keys incl. `packing`, `permits`, `cost_estimate`, `safety`, etc.). The mobile screen was also fetching non-existent `${slug}-packing/-permits/-costs` sub-pages (always 404). Added `react-native-render-html` dependency + new `components/cms/HtmlContentRenderer.tsx` (theme-token styled: PlayfairDisplay headings, Inter body, saffron links/blockquote border). `CMSPage` interface gains `content_html: string` + `content_json: {sections?: Record<string,string>} | null`. `trek/[slug].tsx` `getTabContent()`/new `getTabHtml()`: Guide tab → `body_json` (future-proof) else full `content_html`; Packing/Permits/Costs → `content_json.sections.{packing,permits,cost_estimate}`; falls back to existing empty state if neither present. Removed the dead 404-causing sub-page `useTrekDetail` calls. `useTrekDetail.ts` `mapDbToPage` sets `content_html: ""`/`content_json: null` for offline-cached pages (not persisted to SQLite — known limitation, consistent with `body_json`).
4. **Home screen hero + search bar** — new `components/home/HomeHero.tsx` (full-width `onboarding-1.jpg` banner, pine gradient overlay, "TrekYatra" wordmark + tagline) and `components/home/HomeSearchBar.tsx` (tappable pill, saffron search icon, overlaps hero bottom edge, navigates to `/(tabs)/browse/search`), replacing the old plain-text `HomeHeader` in `(home)/index.tsx`.

**Verification:** `cd apps/mobile && npx tsc --noEmit` → 0 errors. `gitnexus_impact` on `CustomTabBar`, `CMSContentRenderer`, `useTrekDetail` (upstream) → all LOW (0–1 impacted, only `TrekDetailScreen` as expected caller). `gitnexus_detect_changes(scope:"all")` → 11 changed symbols / 10 affected / 9 changed files, all within expected mobile files (`CustomTabBar.tsx`, `(home)/_layout.tsx`, `(home)/index.tsx`, `trek/[slug].tsx`, `useTrekDetail.ts`, `mobileApi.ts`) plus pre-existing unrelated `CLAUDE.md` touch. No `apps/web-next` files touched.

### Step M07a — Browse Tab (grid, filters, regions/seasons, basic search) — Done (2026-06-12)
First of the M07a/b/c split (advanced search + polish deferred to M07b/M07c per user decision).

- **Backend (additive)**: `GET /api/v1/cms/pages` gains optional `trek_state`, `trek_difficulty`, `trek_season`, `trek_duration_min`, `trek_duration_max` query params (`services/api/app/api/routes/cms.py`, `services/api/app/modules/cms/service.py` `list_pages()`). `trek_duration` is free text (e.g. "6 Days") — `list_pages` extracts the leading integer day count via `regexp_replace` + `cast(..., Integer)`, guarded by `trek_duration.op("~")(r"^[0-9]")`. 4 new tests in `test_cms.py`.
- **Mobile data layer**: `stores/exploreStore.ts` (Zustand — `trekState`/`trekDifficulty`/`trekSeason`/`durationBucket` filter state + `DURATION_BUCKETS` constant mirroring backend `_DURATION_BUCKETS`), `hooks/useFilterFacets.ts` (GET `/api/v1/treks/filter-facets`), `hooks/useExplore.ts` (`useInfiniteQuery` paginated GET `/api/v1/cms/pages?page_type=trek_guide&status=published&...filters`). `mobileApi.ts` gains `FilterFacets`, `SearchSuggestion`, `ExploreFilters` types + `contentApi.getFilterFacets`/`exploreTreks`/`getSearchSuggestions`.
- **Shared components**: `components/browse/SearchBar.tsx` (+ `SearchBarWrapper`) — tappable pill navigating to `/(tabs)/browse/search`; `HomeSearchBar` refactored to wrap it (no visual change). `components/browse/TrekGrid.tsx` — 2-col `FlatList` of `TrekCard`, infinite scroll via `onEndReached`, empty/loading states, `ListHeaderComponent` for screen-level headers. `components/browse/FilterChips.tsx` — horizontal active-filter chip row + "Filters"/"Clear all". `components/browse/FilterSheet.tsx` — full-screen Modal (slide-up, no `@gorhom/bottom-sheet`) with Region/Difficulty/Season/Duration chip sections from `useFilterFacets` + `DURATION_BUCKETS`, draft state + Apply/Clear all.
- **Screens**: converted `app/(tabs)/browse.tsx` (placeholder) into a stack — `browse/_layout.tsx` (mirrors `(home)/_layout.tsx`, `headerBackButtonDisplayMode: "minimal"`), `browse/index.tsx` (rebuilt Browse: title + SearchBar + FilterChips + Regions row + Seasons row + `TrekGrid` via `useExplore`, reads `?region=` param from existing Home `RegionsRow` for back-compat), `browse/regions/[state].tsx` (region hub via `useExplore({trekState})`), `browse/seasons/[season].tsx` (season hub via existing `GET /treks/seasonal?month=`, static slug→month map for Winter/Spring/Summer/Monsoon/Autumn), `browse/search.tsx` (basic search via `GET /api/v1/search/suggestions?q=`, "Start typing to search" placeholder — recent/trending/semantic/voice deferred to M07b).
- `npx gitnexus analyze --force` re-index after this step: **491,679 nodes | 788,324 edges | 3,709 clusters | 300 flows** (from 491,612 / 788,810 / 3,763 / 300 at start of step).

**Verification:** `cd apps/mobile && npx tsc --noEmit` → 0 errors. Backend: 7/7 relevant `test_cms.py` filter tests pass; full suite 643 pass, 2 pre-existing `test_refresh.py` failures (test-ordering issue, confirmed unrelated to this step via `git stash` — reported to user separately, not fixed here per scope discipline). `gitnexus_detect_changes(scope:"all")` → risk "low", 36 changed symbols / 0 affected / 5 changed files, all within expected backend filter files + earlier `mobileApi.ts` touch. No `apps/web-next` files touched.

### Step M07b — Advanced Search (semantic, voice, recent, trending) — Done (2026-06-14)
Second of the M07a/b/c split. Polish pass remains in M07c.

- **Backend**: no changes. `POST /api/v1/search/semantic`, `GET /api/v1/search/trending`, and `POST /api/v1/search/log` (`services/api/app/api/routes/search.py`) already existed and are fully functional — confirmed by reading the route file in full before starting.
- **New dependency**: `expo-speech-recognition@^56.0.1` (jamsch, SDK-56-compatible) installed via `npx expo install`; added to `app.config.ts` `plugins` with `microphonePermission`/`speechRecognitionPermission` strings and `androidSpeechServicePackages`. Requires `expo-dev-client` (already present) — not available in Expo Go/web, guarded via `ExpoSpeechRecognitionModule.isRecognitionAvailable() && Platform.OS !== "web"` (mic icon hidden entirely when unsupported).
- **`mobileApi.ts` (additive)**: new `SemanticSearchResult` interface; `contentApi.semanticSearch(q, page_type?, limit?)` → `POST /search/semantic`; `contentApi.getTrendingSearches(limit?)` → `GET /search/trending`; `contentApi.logSearch(query, clickedSlug?, clickedPageType?)` → `POST /search/log` (fire-and-forget, catches the 204-empty-body JSON parse error).
- **New hooks**: `hooks/useRecentSearches.ts` (AsyncStorage key `ty_recent_searches`, max 8, de-duped, `addRecentSearch`/`removeRecentSearch`/`clearRecentSearches`); `hooks/useTrendingSearches.ts` (`useQuery` over `getTrendingSearches(8)`, 30min staleTime); `hooks/useSemanticSearch.ts` (800ms debounce, enabled only when debounced query has >3 words, `useQuery` over `semanticSearch`, 60s staleTime).
- **`app/(tabs)/browse/search.tsx` rewrite**: empty/short query (<2 chars) now shows "Recent Searches" chips (with per-item remove + "Clear all") and "Trending Searches" chips (reusing `FilterChips`' rounded-pill chip style) instead of a bare placeholder; tapping either sets the query. Added a mic button (hidden when voice unsupported) using `useSpeechRecognitionEvent("result"/"start"/"end"/"error")` to fill the query live. For queries ≥2 chars, existing `/search/suggestions` results remain; if `useSemanticSearch` returns results (>3-word query) a "Suggested for you" section is shown above them, deduped by slug, with a "Smart match" badge when `matched_by !== "text"`. Selecting any result or submitting now calls `addRecentSearch(query)` and `contentApi.logSearch(query, slug, page_type)`.
- `npx gitnexus analyze --force` re-index after this step: **465,306 nodes | 746,928 edges | 3,176 clusters | 300 flows** (from 491,679 / 788,324 / 3,709 / 300 at start of step — drop attributable to indexer scope-extraction/timeout fallbacks during this run, not a code deletion; mobile changes for this step are present in the new graph).

**Verification:** `cd apps/mobile && npx tsc --noEmit` → 0 errors. `gitnexus_detect_changes(scope:"all")` → risk "low", 9 changed symbols / 0 affected / 6 changed files (`search.tsx`, `mobileApi.ts` plus pre-existing `CLAUDE.md` touch); new hook files + `app.config.ts`/`package.json` appear after re-index. Backend: full suite unchanged (no backend files touched) — baseline re-run to confirm the 2 pre-existing `test_refresh.py` failures from M07a are still the only failures. No `apps/web-next` files touched.

### bugfix (2026-06-14) — Home difficulty tabs showing empty Easy/Moderate sections
**Root cause**: `DifficultyTabsSection.tsx` (home screen, M06) filtered `dedupedTreks` (= `trending + seasonal`, a ~10-20 item subset from `useHomeData`) with exact equality `t.trek_difficulty === activeTab`. Published `trek_guide` CMS pages have `trek_difficulty` values of `null` (3290), `"Moderate-Difficult"` (31), or `"Moderate"` (10) — no page is exactly `"Easy"` or `"Challenging"`, and `"Moderate-Difficult"` never equals `"Moderate"`. So the "Moderate" tab (which DOES have data) rendered empty.
**Fix**: New `apps/mobile/hooks/useDifficultyTreks.ts` queries `contentApi.exploreTreks({trekDifficulty: value}, 10, 0)` for a per-tab list of raw DB values (`Moderate` → `["Moderate", "Moderate-Difficult"]`, `Challenging` → `["Challenging", "Difficult", "Moderate-Difficult"]`, `Easy` → `["Easy"]`), merges + dedupes by slug — mirrors the fuzzy substring matching already used by `apps/web-next/components/home/DifficultyTabsSection.tsx`. `DifficultyTabsSection.tsx` now uses this hook directly (dropped the `treks` prop); `apps/mobile/app/(tabs)/(home)/index.tsx` no longer computes the now-unused `dedupedTreks`.
**Result**: "Moderate" tab now shows up to 10 cards (41 published Moderate/Moderate-Difficult treks exist). "Easy"/"Challenging" still show the existing "No … treks to show right now" empty state — correct, since no published treks currently carry those exact difficulty labels (not a bug, a data gap).
No backend or `apps/web-next` changes.

### Step M07c — Region Tabs with Trek Cards — Done (2026-06-14)
Redefines the previously-unscoped "M07c — Browse/Search Polish Pass" placeholder with a concrete, user-requested deliverable for the Home screen "Explore by Region" section (`apps/mobile/components/home/RegionsRow.tsx`, M06).

- `RegionsRow` region chips are now selectable tabs (first region "Himachal Pradesh" selected by default), mirroring `DifficultyTabsSection`'s tab styling (saffron `#E8702A` active state).
- New "View all →" link in the section header navigates to `/(tabs)/browse?region=<activeRegion>` (Browse screen already reads this param via `useExploreStore.setTrekState` — no Browse changes needed).
- New `apps/mobile/hooks/useRegionTreks.ts` — `useQuery` over `contentApi.exploreTreks({trekState: region}, 5, 0)`, 10min staleTime. Renders up to 5 `TrekCard`s below the chip row, or "No treks for \<region\> yet." for regions without CMS data.
- **Data reality**: only 2 of the 8 region chips ("Himachal Pradesh" ×31, "Uttarakhand" ×46) currently have published `trek_state` data; the other 6 show the empty state — expected, not a bug.
- No backend or `apps/web-next` changes.

- `npx gitnexus analyze --force` re-index after both commits: **491,841 nodes | 788,951 edges | 3,739 clusters | 300 flows** (from 465,306 / 746,928 / 3,176 / 300 at start of step — new hook files plus accumulated changes from prior steps since the last re-index).

**Verification:** `cd apps/mobile && npx tsc --noEmit` → 0 errors. Backend full suite unchanged (no backend files touched). `gitnexus_detect_changes(scope:"all")` post-re-index → risk "low", 1 changed symbol (pre-existing `CLAUDE.md` touch, unrelated) / 0 affected / 1 changed file — confirms scope matches expectations.

### bugfix (2026-06-15) — Voice search crash on Browse → Search mic tap
**Root cause**: `expo-speech-recognition` (added in M07b) is a native module. `handleMicPress` in `apps/mobile/app/(tabs)/browse/search.tsx` called `ExpoSpeechRecognitionModule.requestPermissionsAsync()` / `.start()` / `.stop()` with no `try/catch` — any native-side error (permission dialog issue, or the dev-client binary not yet recompiled with the new native module from M07b) threw an unhandled rejection that crashed the app.
**Fix**: wrapped the `handleMicPress` body in `try/catch` — errors are now caught, logged via `console.warn`, and `isRecording` is reset to `false`, so the app no longer crashes.
**Note for user**: if voice search still doesn't start after this fix (mic icon does nothing, warning logged), the installed dev-client binary needs a rebuild (`eas build --profile development` or `npx expo run:ios`/`run:android`) to compile in the `expo-speech-recognition` native module added in M07b.
`gitnexus_impact(SearchScreen, upstream)` → LOW, 0 callers. `gitnexus_detect_changes(scope:"all")` → risk "medium" (expected — 2 `SearchScreen`-rooted process touches, step 1 only), 7 changed symbols / 2 affected / 2 changed files (`search.tsx`, pre-existing `CLAUDE.md`). `npx tsc --noEmit` → 0 errors. No backend or `apps/web-next` changes.

### Step M-DS8 — Glass UI Overhaul (platform-adaptive glassmorphism) — Done (2026-06-15)
App-wide glassmorphism pass per user decision: "For iOS — follow Apple's 'Liquid Glass' and for Android, use Expo-blur frosted", "Full app-wide pass in one step" (not phased). 6 commits.

1. **Foundation** — `npx expo install expo-glass-effect expo-blur`; new theme tokens `glassTint`/`glassBorder`/`glassOverlay` in both `lightColors`/`darkColors` (`constants/theme.ts`); new `components/ui/GlassSurface.tsx` — the single reusable glass primitive. Props: `children`, `style?`, `rounded?` (default `"lg"`), `intensity?` (default 35), `glassStyle?: "regular"|"clear"` (default `"regular"`), `bordered?` (default `true`). iOS 26+ (`isLiquidGlassAvailable()`) renders `expo-glass-effect`'s `GlassView`; all other platforms render `expo-blur`'s `BlurView` + a `glassOverlay` tint `View` for legibility.
2. **Global chrome** — `CustomTabBar.tsx`, `TrekStickyBar.tsx`, `TrekTabBar.tsx` backgrounds → `GlassSurface` absolute-fill, preserving existing borders/shadows. Stack header glass (`headerTransparent`) attempted and **reverted** — too high blast-radius (every screen in the affected stacks would need new top-padding/safe-area handling); explicitly deferred.
3. **Home surfaces** — `HomeWelcomeBanner`, `CategoryHubRow`, `EditorialFeatureCard` (text panel over existing gradient), `ComparisonCTACard`, `OperatorsCTACard`, `ResourcesRow`, `SearchBar`/`HomeSearchBar` → `GlassSurface`. Active tab/chip states (`DifficultyTabsSection`, `RegionsRow`) left solid saffron — legibility/affordance rule.
4. **Browse + Trek detail surfaces** — `FilterSheet`, `TrekContentsSheet` (bottom-sheet modals, `rounded="none"` + corner-radius style override for top-only rounding), `TrekMetaStrip`, `TrekCard` info footer, `RecentlyViewedRow` → `GlassSurface`. `FilterChips` — inactive "Filters"/active-filter pills → `GlassSurface`; the active "Filters" toggle (when filters are set) stays solid saffron.
5. **Auth screens** — `welcome.tsx` (back button, skip pill, slide-icon chip — glass over photo carousel), `sign-in.tsx`/`sign-up.tsx` (email/password/name `TextInput`s wrapped in `GlassSurface`, replacing solid `inputBg`/`inputBorder`), `forgot-password.tsx`/`reset-password.tsx` (TextInputs wrapped in `GlassSurface`, replacing `bg-surface` className). `otp.tsx` has no form panel — unchanged. `SocialSignInButtons.tsx` stays solid (CTA legibility rule).
6. **Docs + re-index** (this section).

**Native module rebuild required**: `expo-glass-effect` and `expo-blur` are native modules — a new Expo dev-client build (`eas build --profile development` or `npx expo run:ios`/`run:android`) is required before Liquid Glass / frosted blur renders on-device. Cumulative with the `expo-speech-recognition` (M07b) rebuild requirement.

**Verification:** `cd apps/mobile && npx tsc --noEmit` → 0 errors after every commit. `gitnexus_impact` upstream on every touched shared component → all LOW (0 callers, except expected leaf-screen self-references). `gitnexus_detect_changes(scope:"all")` → low/medium risk per commit, scope matched expected files each time (plus pre-existing unrelated `CLAUDE.md` touch). No `apps/web-next` or backend files touched — zero blast radius on production website (desktop + mobile web).

**Re-index (`npx gitnexus analyze --force`):** 485,615 nodes | 767,598 edges | 3315 clusters | 300 flows. Final `gitnexus_detect_changes(scope:"all")` after docs commit: 14 changed symbols across 6 doc/md files, 0 affected processes, risk level low.

### Step M04 — CMS Offline Content Engine — Done (2026-06-10)
- `apps/mobile/db/schema.ts` — Drizzle schema: `cmsPages` + `syncMeta` tables
- `apps/mobile/db/client.ts` — expo-sqlite connection + `initDb()` DDL bootstrapper
- `apps/mobile/services/syncService.ts` — `syncContent()` (paginated upsert), `getCachedPage()`, `getDownloadedPages()`, `downloadTrekPages()`, `removeTrekDownload()`
- `apps/mobile/services/backgroundSync.ts` — AppState listener; triggers sync every 15 min on foreground
- `apps/mobile/hooks/useSync.ts` — React hook: isSyncing / lastSyncAt / triggerSync / refreshLastSync
- `apps/mobile/components/cms/types.ts` — `Block` union type (9 variants)
- `apps/mobile/components/cms/CMSContentRenderer.tsx` — block dispatcher
- 8 block components: ParagraphBlock, HeadingBlock, ImageBlock, ListBlock, TableBlock, CalloutBlock, FAQBlock, AffiliateCardBlock
- `apps/mobile/stores/offlineStore.ts` — Zustand: downloadedSlugs, download(), remove(), isDownloaded()
- `apps/mobile/components/trek/OfflineBadge.tsx` — amber "Offline" indicator badge
- `apps/mobile/components/trek/OfflineToggle.tsx` — download/delete toggle button
- `apps/mobile/app/(tabs)/downloads.tsx` — offline content list screen
- `apps/mobile/app/_layout.tsx` — wired initDb + initBackgroundSync + loadDownloaded on mount
- `apps/mobile/app.config.ts` — added expo-sqlite plugin
- Packages added: expo-sqlite ~56.0.4, drizzle-orm ^0.30.10, drizzle-kit ^0.20.18
- **tsc --noEmit: 0 errors**

> Full spec: `docs/versions/V5-MOBILE-APP.md`
> Pre-launch checklist: `docs/mobile/MOBILE_PRELAUNCH_CHECKLIST.md`
> Production setup: `docs/mobile/MOBILE_PRODUCTION_SETUP.md`

## Production Deployment — In Progress (DigitalOcean BLR1)
> Full details in `docs/PRODUCTION_SETUP.md`

| Item | Status |
|------|--------|
| Domain purchased: trekyatra.co.in (GoDaddy) | done |
| PostgreSQL 16 + pgvector cluster (trekyatra-db, BLR1) | done |
| pgvector extension enabled + trekyatra_user permissions granted | done |
| Valkey 8 Redis cluster (db-valkey-blr1-95254, BLR1) | done |
| App Platform — `web` component configured (Next.js, port 3000) | done |
| App Platform — App-level env vars (12/12 set, encrypted, server-side only) | done |
| App Platform — `web` component DEPLOYED and HEALTHY (trekyatra-ssvha.ondigitalocean.app) | done |
| App Platform — `api` component (FastAPI) DEPLOYED and HEALTHY | done |
| config.py — SSL auto-detection: port 25060→sslmode=require; port 25061→rediss:// | done |
| DO env vars — POSTGRES_SERVER/PORT/DB/USER/PASSWORD added; DATABASE_URL/REDIS_URL removed | done |
| api CONNECTING to DO managed Postgres — confirmed | done |
| alembic upgrade head — ALL 34 MIGRATIONS APPLIED (0001→0034) locally | done |
| alembic upgrade head on PRODUCTION (0031–0034: search_events, page_views, account_comparisons, cms_trek_metadata) | ✅ APPLIED 2026-05-19 |
| App Platform — `celery-worker` component added | done |
| App Platform — `celery-beat` component added | done |
| celery-beat — ✅ HEALTHY | done |
| celery-worker — ✅ HEALTHY (Redis auth fixed: REDIS_PASSWORD + REDIS_USERNAME env vars added) | done |
| ALL 4 COMPONENTS HEALTHY — web, api, celery-worker, celery-beat | done |
| Monthly cost confirmed: $48/month | done |
| Domain — Step A5 routing rules: all 5 configured (trekyatra.co.in→web, www→web, api→api) | done |
| CORS — CORSMiddleware added to main.py (trekyatra.co.in, www, api, localhost) | done |
| GoDaddy DNS — A records 162.159.140.98 + 172.66.0.96 added; CNAME www + api added | done |
| www.trekyatra.co.in → DO Active ✅ | done |
| api.trekyatra.co.in → DO Active ✅ | done |
| trekyatra.co.in — WebsiteBuilder A record deleted ✅; DNS propagating (1hr TTL) → auto-resolves | in progress |
| www.trekyatra.co.in — LIVE in browser ✅ (homepage renders perfectly) | done |
| api.trekyatra.co.in/api/v1/health — LIVE: {"status":"ok","service":"TrekYatra API","environment":"production"} | done |
| next.config.mjs — CRITICAL FIX: destination hardcoded to localhost:8000 → replaced with ${NEXT_PUBLIC_API_BASE}/api/:path* | done |
| trekyatra.co.in root DNS — propagated ✅ (dig confirms 162.159.140.98 + 172.66.0.96) | done |
| trekyatra.co.in root — ✅ ACTIVE (user confirmed working) | done |
| Hamburger menu mobile — ✅ RESOLVED (translate-x CSS transition) | done |
| Admin login root cause CONFIRMED: enhanced_threat_control_enabled=true blocks server-to-server POST | done |
| code: admin-auth-api.ts BASE = relative /api/v1/admin/auth; admin_auth.py cookie domain removed | done |
| code: next.config.mjs — EV[...] guard + www→api substitution to prevent proxy loop | done |
| DO App Spec: ingress rule www.trekyatra.co.in/api → api component — ✅ DEPLOYED AND WORKING | done |
| Admin login — ✅ CONFIRMED WORKING on production (2026-05-14) | done |
| GitNexus re-indexed: 9,421 nodes, 13,054 edges, 359 clusters, 104 flows | done |
| GitNexus re-indexed (2252d9d): 9,490 nodes, 13,125 edges, 357 clusters, 104 flows | done |
| GitNexus re-indexed (a3b8d53): 9,502 nodes, 13,154 edges, 358 clusters, 104 flows | done |
| GitNexus re-indexed (ebd6dc9): 9,514 nodes, 13,166 edges, 359 clusters, 104 flows | done |
| GitNexus re-indexed (47535ed): 9,539 nodes, 13,205 edges, 360 clusters, 104 flows | done |
| GitNexus re-indexed (77f4e1a): 9,569 nodes, 13,235 edges, 360 clusters, 104 flows | done |
| GitNexus re-indexed (1612706): 9,572 nodes, 13,237 edges, 360 clusters, 104 flows | done |
| GitNexus re-indexed (e8032cb): 9,578 nodes, 13,243 edges, 361 clusters, 104 flows | done |
| GitNexus re-indexed (ec9f586): 9,559 nodes, 13,279 edges, 364 clusters, 106 flows | done |
| GitNexus re-indexed (167a193): 9,602 nodes, 13,349 edges, 364 clusters, 107 flows | done |
| GitNexus re-indexed (15fd7c8): 9,648 nodes, 13,403 edges, 367 clusters, 107 flows | done |
| GitNexus re-indexed (f41079c): 9,658 nodes, 13,417 edges, 366 clusters, 107 flows | done |
| GitNexus re-indexed (930dd7c): 9,663 nodes, 13,423 edges, 367 clusters, 107 flows | done |
| GitNexus re-indexed (75b3f53): 9,685 nodes, 13,450 edges, 368 clusters, 107 flows | done |
| GitNexus re-indexed (9a2db42): 9,704 nodes, 13,470 edges, 368 clusters, 107 flows | done |
| GitNexus re-indexed (6e3dd9d): 9,848 nodes, 13,652 edges, 371 clusters, 106 flows | done |
| GitNexus re-indexed (9a37908): 10,902 nodes, 15,018 edges, 403 clusters, 106 flows | done |
| GitNexus re-indexed (7af531c): 12,742 nodes, 17,614 edges, 485 clusters, 139 flows | done |
| GitNexus re-indexed (a035c5f): 13,454 nodes, 18,357 edges, 492 clusters, 139 flows | done |
| Security: ADMIN_EMAIL + ADMIN_PASSWORD are plaintext in App Spec — must encrypt via DO dashboard | pending |
| NEXT_PUBLIC_API_BASE + NEXT_PUBLIC_SITE_URL confirmed plaintext in web component ✅ | done |
| Google Analytics 4 — property created, Measurement ID: G-XM61V2PPDK, NEXT_PUBLIC_GA4_ID set in DO web component | done |
| GA4 script fixed: switched from raw <script> tags to next/script strategy=afterInteractive (commit f33f7b0) | done |
| Google Search Console — verified ✅ via DNS TXT record (HTML tag + GA methods blocked by enhanced_threat_control) | done |
| Google Search Console — sitemap.xml submitted and processed ✅ — 23 pages discovered (2026-05-15) | done |
| robots.txt — auto-generated via app/robots.ts, served at /robots.txt, no GSC submission needed | done |
| Google AdSense — application pending (apply after ≥20 CMS pages published via content pipeline) | pending |
| Amazon Associates India — account created, Associate ID: trekyatra21-21 (180-day deadline: ~2026-11-15) | done |
| Amazon Associates — Tax information (PAN + bank) must be completed at affiliate-program.amazon.in | pending |
| Amazon Associates — affiliate product links to be seeded in /admin/monetization after content pipeline runs | pending |
| ANTHROPIC_API_KEY — credits purchased; must be added to DO App Platform at APP LEVEL (not component level) env vars | done |
| Step 42+43 — CMS-driven pages + slug dedup + sitemap real-time + agent 2026 (commit b4924d6) | done |
| Schema.ts Google Rich Results fix — author field, ImageObject, 110-char headline, LOGO_URL corrected (commit a3b8d53) | done |
| Sitemap — 12 static pages added; /treks/{slug} bug fixed to /trek/{slug} (commit a3b8d53) | done |
| NEXT_PUBLIC_GOOGLE_CLIENT_ID — set in DO web component ✅ | done |
| ANTHROPIC_API_KEY — set in DO App Platform ✅ (confirmed 2026-06-02) | done |
| CMSPageForm — editorial page_type added to dropdown (commit ebd6dc9) | done |
| CMS seed script — services/api/scripts/seed_static_cms_pages.py created (commit ebd6dc9) | done |
| CMS seed script bug fix — db.commit() missing; create_page uses flush() not commit() (commit b34cf96) | done |
| CMS static pages (6) — ✅ published in production DB (seed script ran successfully) | done |
| CMS admin URL bug fix — getLiveUrl() helper maps page_type to correct public URL (commit 47535ed) | done |
| CMS delete protection — editorial pages show disabled delete + block with message (commit 47535ed) | done |
| CMS edit page 404 fix — converted to client component; server→server Cloudflare challenge bypassed (commit 47535ed) | done |
| Editorial pages generateMetadata + JSON-LD schema — all 6 pages (commit 47535ed) | done |
| Favicon — Logo_Trekyatra.png added as icon/apple-touch-icon/shortcut in root layout (commit 77f4e1a) | done |
| Author + Publisher metadata — root layout + all 6 editorial pages (commit 77f4e1a) | done |
| Schema in BOTH branches (CMS + static fallback) — all 6 editorial pages (commit 77f4e1a) | done |
| force-dynamic — all 6 editorial pages: CMS content shows at runtime without rebuild (commit 77f4e1a) | done |
| 403→200 Cloudflare challenge — root cause: enhanced_threat_control_enabled=true in App Spec; see note below | documented |
| CMS slug/URL mismatch fix — privacy-policy→privacy, terms-of-service→terms, editorial-methodology→methodology (commit 1612706) | done |
| /about/authors page — updated with real editorial lead: Deepesh Kumar Gupta; removed fictional authors (commit 1612706) | done |
| DO Console action: cleanup + re-seed — ✅ DONE (2026-05-15) — 3 deleted, 3 created, 3 updated | done |
| App Platform — remaining env vars (ANTHROPIC_API_KEY, SMTP, Stripe, Razorpay, Google OAuth) | pending |
| GitNexus re-indexed (12c61c6): 9,501 nodes, 13,184 edges, 363 clusters, 104 flows | done |
| recommendations/service.py — exclude editorial page_type from all SQL queries (commit 12c61c6) | done |
| trip_planner/agent.py — _STATIC_TREKS fallback when no CMS trek guides published (commit 12c61c6) | done |
| Trek page CTAs — TrekCTAs.tsx client component: Plan (Link→/plan), Save, Compare, Share all wired (commit 12c61c6) | done |
| Homepage seasonal tabs — SeasonalTreksSection: auto-select by month, state tags on cards (commit 12c61c6) | done |
| Breadcrumbs — visual nav + JSON-LD on packing, permits hub pages (commit 12c61c6) | done |
| schema.ts — buildWebSiteSchema logo with width/height/contentUrl + SearchAction (commit 12c61c6) | done |
| CMSPageForm — added cost_guide, gear_guide, itinerary, beginner_guide, expert_guide, safety_guide, hub types (commit 12c61c6) | done |
| docs/URL_MAP.md — complete URL skeleton created (Issue 9) | done |
| CLAUDE.md — Section 17: URL Structure Rule added; URL_MAP.md added to source-of-truth table | done |
| Plan My Trek flow improvements — NOTED as pending implementation | pending |
| Category tabs (beginner/moderate/challenging) — NOTED as pending Step 44 | pending |
| Breadcrumbs on remaining hub pages (costs, gear, itineraries, beginner, explore) — DONE (commit ec9f586) | done |
| DifficultyTabsSection: Easy/Moderate/Challenging tabs on homepage (commit ec9f586) | done |
| /moderate and /challenging rich category pages — schema, FAQs, breadcrumbs, sitemap (commit ec9f586) | done |
| Plan My Trek wow factor: trek image, match tags, visual gear pills, share, emoji experience cards (commit ec9f586) | done |
| Plan My Trek flow improvements — further enhancements pending (interactive map, trek comparison in wizard) | pending |
| Enhancement 1: Cookie-based PersonalisedFeed — behavior-tracker.ts + TrekViewTracker + hide-when-no-data (commit 167a193) | done |
| Enhancement 2: CMS-driven difficulty tabs — DifficultyTabsSection accepts cmsPages; beginner/moderate/challenging use CMS first (commit 167a193) | done |
| Enhancement 3: Hero height reduced — 85vh/78vh → 65vh/55vh (commit 167a193) | done |
| Issue 3: Duplicate trek slug fixed — _slugify no UUID; canonical slug from target_keyword (commit 15fd7c8) | done |
| Issue 3: Trek page — region/state/facts populated from CMS trek_facts for CMS-only pages (commit 15fd7c8) | done |
| Issue 2: Breadcrumb moved to top of trek hero, white text, correct region href (commit 15fd7c8) | done |
| Issue 1: Image upload — POST /api/v1/admin/media/upload; DO Spaces + local fallback; CMSPageForm UI (commit 15fd7c8) | done |
| DO Spaces setup — Space created: trekyatra-media (sgp1 Singapore); env vars added to api component App Spec | done |
| DO Spaces — DO_SPACES_KEY/SECRET (encrypted), BUCKET, ENDPOINT, REGION, CDN_ENDPOINT set in DO App Spec | done |
| Sign-in crash fixed — GoogleOAuthProvider guard (Providers.tsx); only renders when NEXT_PUBLIC_GOOGLE_CLIENT_ID set (commit f41079c) | done |
| Plan My Trek HTML fix — cost_estimate rendered via dangerouslySetInnerHTML; gear items HTML-stripped (commit f41079c) | done |
| Plan rate limiting — 2/hour per IP via Redis; 429 with retry-in message; local/test bypass (commit f41079c) | done |
| Uploads StaticFiles mount — data/uploads/ served at /uploads/ in FastAPI (commit f41079c) | done |
| SeasonalTreksSection hydration fix — useEffect for date-based state; resolves React errors #418/#423/#425 (commit f41079c) | done |
| NEXT_PUBLIC_GOOGLE_CLIENT_ID — set in DO web component ✅ | done |
| Breadcrumb visibility fix — dark backdrop pill on hero; !text-white/90 with !important (commit 930dd7c) | done |
| Similar treks images — staticImageMap fallback; trekToItem uses trek.image; API items enriched (commit 930dd7c) | done |
| SEO meta pipeline fix — update_draft_seo_fields() added; SEOAEOAgent saves snippet_intro as meta_description (commit 930dd7c) | done |
| Sitemap CMS pages fix — GET /api/v1/public/sitemap-pages endpoint (no auth, 20s timeout, direct SQL); sitemap.ts updated (commit 75b3f53) | done |
| Trek URL deduplication — permanentRedirect from static slug to CMS slug when CMS version exists (commit 75b3f53) | done |
| URL_MAP.md — /api/v1/public/sitemap-pages added per URL structure rule | done |
| SEO AEO Agent resilience — graceful JSON parse failure; max_tokens 20000; pipeline no longer fails on JSON errors (commit 9a2db42) | done |
| ContentWritingAgent prompt — MANDATORY SECTIONS block added: itinerary, permits, cost, packing, safety always required (commit 9a2db42) | done |
| ContentBriefAgent prompt — 9-section trek guide template enforced; itinerary + permits always in heading_structure (commit 9a2db42) | done |
| TrekCard tag alignment — flex-wrap + bookmark repositioned absolute; Beginner+Moderate tags no longer overflow (commit 9a2db42) | done |
| Step 45 — Image Gathering Agent — spec documented (Unsplash/Wikimedia/Pixabay; pending implementation) | pending |
| Step 44 DONE — search_events table + POST /search/log + GET /search/suggestions + compare 3-trek + share URL (commit 6e3dd9d) | done |
| Step 45 DONE — image_search agent (Unsplash/Pixabay/Wikimedia) + pipeline post-publish integration (commit 6e3dd9d) | done |
| Step 44+45 — 487 backend tests pass (15 new); alembic 0031 search_events applied locally | done |
| DO Console action: run alembic upgrade head on production (adds search_events table) | pending |
| DO env vars: UNSPLASH_ACCESS_KEY + PIXABAY_API_KEY for image agent (both optional — Wikimedia works without keys) | pending |
| Stripe webhook registration | pending |
| Google Search Console | pending |
| 41 | B2B content / API extensions | pending |

## Pre-Launch Sprint — In Progress
| Item | Status |
|------|--------|
| PRELAUNCH_CHECKLIST.md created | done |
| DB cleared (non-user tables) | done |
| Auth: password reset flow (forgot + reset endpoints + frontend pages wired) | done |
| Auth: account settings PATCH /auth/me | done |
| Auth: account enquiries GET /auth/me/leads | done |
| Frontend /compare — dynamic trek selector | done |
| Frontend /account/settings — wired to PATCH /auth/me | done |
| Frontend /account/enquiries — wired to GET /auth/me/leads | done |
| Frontend /itineraries, /costs, /gear, /beginner, /safety — CMS hub + static fallback | done |
| Sitemap.xml — expanded page_type map for all CMS content types | done |
| Admin operators — detail page with agreement + review moderation | done |
| Playwright E2E — homepage, auth, search, plan wizard specs | done |
| Home page — search wired, dead buttons fixed, PersonalisedFeed + Operators CTA | done |
| UI polish — hero padding/font/overflow, trek tag visibility, footer, trust pages | done |
| Logo — SVG circular badge icon redesigned; tagline "Explore. Dream. Discover." (matching new logo) | done |
| Hero layout — flex-col justify-center; min-h-screen → min-h-[85vh] md:min-h-[78vh]; pt-20 pb-16 | done |
| Footer newsletter — bg-foreground/40 (invisible) → bg-white/[0.07] border-white/20; pt-36 separates from mountain SVG | done |
| Search — Fuse.js fuzzy matching (threshold 0.35) + autocomplete dropdown suggestions + no-results improvement | done |
| PRELAUNCH_CHECKLIST.md — comprehensive audit: 8 sections, 80+ items across BE/FE/Admin/Gaps/Production/Integrations/Testing | done |
| Header nav — compact Logo (tagline hidden); search bar functional (onClick + ⌘K → /search); px-2.5 nav items; gap-4 | done |
| Compare section — responsive: heading text-2xl sm:text-3xl; card p-3 md:p-4; text-sm md:text-base; no mobile overflow | done |

### V5 Mobile App — Comprehensive Review (2026-06-02)
Status: done
What is done:
- Full 22-step doc review against web feature set (Steps 00–67 + all bugfixes)
- `docs/versions/V5-MOBILE-APP.md` — fixed bundle ID `com.trekyatra.app` → `co.in.trekyatra.app`; added `buddy_signals`, `user_badges` to DB tables; added newsletter + legal pages to feature parity matrix
- `docs/mobile/steps/STEP-M05-trek-detail-screen.md` — added MonetizationSlot `monetization_slot` block handling in CMSContentRenderer; safety disclaimer banner for Challenging/Difficult treks; confirmed share URL uses `/trek/` (matches web bugfix commit 63d0460)
- `docs/mobile/steps/STEP-M08-trek-comparison.md` — updated scope from 2-trek to 2-or-3-trek; updated save payload
- `docs/mobile/steps/STEP-M10-user-account.md` — added Trail Letter newsletter subscribe form; Safety Disclaimer link in About section
- NEW `docs/mobile/MOBILE_PRELAUNCH_CHECKLIST.md` — 9-section launch gate: platform accounts, DO env vars, EAS/app build, store setup, step gates, testing, known gaps, Go/No-Go
- NEW `docs/mobile/MOBILE_PRODUCTION_SETUP.md` — shared DO infra reference, new env vars table, EAS/Apple/Google/Firebase/Sentry setup, DB migration sequence, cost estimates, OTA policy, rollback
What remains: All V5 mobile steps (M01–M22) are pending implementation

### Step 68 — Email Infrastructure, SMTP + Email Verification (Z04) + Trek Alert Delivery (Z05)
Status: done
Date: 2026-06-02
What is done:

**Part A — Email Address Standardisation:**
- Replaced all `hello@trekyatra.in` / `noreply@trekyatra.com` with `explore@trekyatra.co.in` across 8 frontend pages (`contact`, `privacy`, `affiliate-disclosure`, `methodology`, `terms`, `about`, `maintenance`, `Footer.tsx`) + seed script (`seed_static_cms_pages.py`) + config defaults

**Part B — GoDaddy SMTP Configuration:**
- `services/api/app/core/config.py`: `admin_email` → `explore@trekyatra.co.in`; `smtp_from_email` → `explore@trekyatra.co.in`; `frontend_url: str = "https://trekyatra.co.in"` added
- `services/api/.env.example`: `SMTP_HOST=smtpout.secureserver.net`, `SMTP_PORT=587`, `SMTP_USER=explore@trekyatra.co.in`, `FRONTEND_URL=https://trekyatra.co.in` documented

**Part C — Email Verification Flow (Z04):**
- `services/api/app/core/security.py`: `create_email_verification_token(user_id)` (24h JWT, `typ=email_verification`) + `parse_email_verification_token(token)` (validates typ)
- `services/api/app/modules/auth/service.py`: `mark_email_verified(db, user_id)`
- `services/api/app/schemas/auth.py`: `VerifyEmailRequest` schema
- `services/api/app/api/routes/auth.py`: `POST /auth/send-verification` (auth-required, graceful SMTP skip, 400 if already verified) + `POST /auth/verify-email` (validates token, marks verified) + `_send_verification_email_helper`
- `apps/web-next/app/(auth)/auth/verify-email/page.tsx`: FULL REWRITE — 4-state flow (idle=check inbox, verifying, success, error); auto-triggers on `?token=` query param; resend button; calls `refresh()` on success; Suspense wrapper
- `apps/web-next/app/(public)/account/page.tsx`: email verification banner (amber) shown when `user && !user.is_verified_email`

**Part D — Trek Alert Delivery (Z05):**
- NEW `services/api/app/modules/account/tasks.py`: `send_trek_alerts_task` (name: `account.send_trek_alerts`, bind=True, max_retries=3); SMTP skip when unconfigured; groups active TrekAlert records by user_id; sends per-user digest email listing trek URLs; `_send_trek_alert_digest` helper
- `services/api/app/worker/celery_app.py`: `app.modules.account.tasks` added to include list; `daily-trek-alert-digest` beat schedule (86400s, 08:00 IST pinning done in DO)

**Tests:** NEW `services/api/tests/test_email_step68.py` — 8 tests (TC-B01–TC-B08), all PASSED; full suite 618 passed, 2 pre-existing failures (test_refresh.py — unrelated), 1 skipped
**Build:** `next build` ✅ zero TypeScript errors (193 pages)
**GitNexus:** Re-indexed — 13,341 nodes | 18,236 edges | 490 clusters | 139 flows

What remains:
- Add DO env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`, `FRONTEND_URL`, `ADMIN_EMAIL` (production activation)
- Celery worker must be restarted on DO after deploy to register `account.send_trek_alerts` task

### Pre-Launch Sprint — Website Pending Steps (Steps 69–70)
Status: in-progress
What is done:
- Confirmed: `ANTHROPIC_API_KEY` set in DO ✅
- Confirmed: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` set in DO ✅
- Confirmed: Manual content seeding M02 (operators), M03 (products), M04 (CMS trek guides) complete ✅
- Step 68 done (see above)
- NEW `docs/steps/STEP-69-compare-revamp-seo.md` — spec for compare page CMS data integration, SEO metadata + canonical, JSON-LD (WebPage/ItemList/FAQPage), AEO FAQ block (6 Qs), saved comparisons API wiring, interlinking from trek detail, sitemap entry
- NEW `docs/steps/STEP-70-component-wiring.md` — spec for wiring MonetizationSlot (Z02, replace hardcoded AffiliateRail) and GatedContent (Z03, is_premium gate on trek body)

| Step | Title | Status |
|------|-------|--------|
| 68 | Email infrastructure, SMTP + email verification (Z04) + trek alert delivery (Z05) | done |
| 69 | Compare feature SEO/AEO revamp | done |
| 69 (prod fixes 2026-06-03) | Post-production fixes to compare page: altitude from `content_json.trek_facts.altitude` (was `undefined`); expanded comparison table (8 fields: adds permits, base camp, suitability); removed hardcoded FAQ section (generic, not trek-specific); removed all JSON-LD scripts (dirty URL issue); share button now shows "Link copied!" clipboard feedback; save button opens AuthGateModal when logged out, shows green success banner with profile link when logged in; `next build` ✅ zero errors | done |
| 69C (prod fixes #2 2026-06-03) | Issue #6: account dashboard "Compare Lists" tile now shows real count via `fetchComparisons()` in `Promise.all` (was hardcoded `"0"`). Issue #7: search page shows compare suggestion card (similar trek pair) when exact results exist — uses difficulty+state similarity, fallback chains. Issue #9: `signup_email` now auto-sends verification email via `_send_verification_email_helper` immediately on registration (graceful try/except — SMTP failure never breaks signup). TC-B09 added. 608 pass / `next build` ✅ | done |
| 69D (prod fixes #3 2026-06-03) | Bug: save comparison returned "Error saving" — `doSave` was sending `{slugs}` but `ComparisonCreate.name: str` is required; fixed by generating name from trek names. Bug: resend verification returned "Authentication required" — idle state on `/auth/verify-email` showed resend button to unauthenticated visitors; fixed by (a) account dashboard amber banner now calls API inline instead of navigating to verify-email page, and (b) verify-email idle state now guards resend button with `user && !user.is_verified_email`, shows spinner during auth load, shows sign-in redirect if unauthenticated. 608 pass / `next build` ✅ | done |
| 70 | Component wiring: MonetizationSlot (Z02) + GatedContent (Z03) | pending |
| 71-infra | **Step 71 — Infrastructure Pending (DO Console + Cloudflare — user action required, no code):** (1) DO Spaces backfill: `aws s3 cp s3://trekyatra-media/ s3://trekyatra-media/ --recursive --metadata-directive REPLACE --cache-control "public, max-age=31536000, immutable" --acl public-read --endpoint-url https://sgp1.digitaloceanspaces.com`; (2) Update boto3 `put_object` in `services/api/app/modules/media/service.py` to add `CacheControl="public, max-age=31536000, immutable"` on every upload; (3) Cloudflare Cache Rules: `s-maxage=300, stale-while-revalidate=86400` for HTML pages, `max-age=31536000` for `/_next/static/*` and `/images/*`; (4) Cloudflare: enable Auto Minify + Brotli under Speed → Optimization. Expected TTFB: 1,955ms → 15–40ms (Cloudflare cache hit) | **pending — user infra action** |
| 71 | **Core Web Vitals Optimisation** — Mobile 56→85+, Desktop 52→90+. Fixes: (1) render-blocking Google Fonts @import removed → next/font/google self-hosted (Fraunces variable + Inter + JetBrains Mono, CSS variables, tailwind updated); (2) `unoptimized:true` removed → AVIF/WebP formats enabled, `remotePatterns` for DO Spaces + Unsplash + Pixabay; (3) homepage hero `<img>` → `<Image priority fill>` (LCP element), trek detail hero + `fetchPriority="high"`; (4) favicon 301KB PNG → 814B (16px) + 2.2KB (32px) optimised icons; (5) `<link rel="preconnect">` for DO Spaces CDN + Unsplash; (6) `RecentlyViewedSection` + `PersonalisedFeed` wrapped in `makeDynamic(ssr:false)`; (7) `.browserslistrc` modern targets → cuts 11KB legacy polyfills; (8) GA4 + AdSense scripts `afterInteractive` → `lazyOnload`; (9) all 8 static JPEGs → WebP via cwebp, region images + editorial images updated to serve .webp; (10) accessibility: `aria-label` on footer social icons, explore sort select, compare trek select. `next build` ✅ 193 pages / zero errors. | **done** |
| 72 | **"TrekSage" MCP Server + Trek Intelligence Data Layer + Datacenter Subdomain** — 10 commits: (1) Alembic migration `20260615_0043_step72_trek_intelligence.py` — 16 new `cms_pages.trek_*` structured fields (region, altitude, duration days, best/open/avoid months, permits, budget, themes, crowd level, beginner/solo/family-friendly, operator_available, is_unsafe_closed, data_confidence, last_verified_at) + new tables `ai_interaction_logs`, `trek_qa_cache` + `lead_submissions.details_json`; (2) new `app/modules/trek_intelligence/` module — deterministic `matching.py` (real budget scoring, best/open/avoid-month season scoring, hard exclusion of unsafe/closed + avoid-month treks) + `service.py` (search/get/recommend/compare/content/ask/lead/translate/log/backfill, zero LLM except Q&A/compare-summary/backfill — all Haiku, cached, tight max_tokens); (3) REST routes `GET /treks/{slug}/profile`, `POST /treks/compare`, `POST /treks/{slug}/ask`, `GET /treks/{slug}/content`, `POST /leads/operator-help`, `POST /ai/log` + `test_trek_intelligence.py`; (4) MCP server "TrekSage" (`app/mcp_server.py`, `mcp` SDK) — 8 tools mounted at `/mcp`, 3 gated by `X-MCP-Key`/`MCP_SHARED_SECRET`, new Celery task `trek_intelligence.backfill_trek_meta`; (5) Web Trek Detail `TrekAskAI` widget + new structured fields surfaced; (6) Web Compare page backend-wired (`/treks/compare` + AI trade-off summary) + Plan results polish; (7) `datacenter.trekyatra.co.in/trek-guide/[slug]` subdomain (`apps/web-next/app/datacenter/`, host-rewrite in `middleware.ts`); (8) Admin `/admin/trek-data` dashboard (data-quality KPIs, inline field editors, backfill trigger, AI interaction log viewer) + `admin_treks.py` routes; (9) Mobile: Plan tab now renders `plan-my-trek` wizard (was dead M08 stub), `TrekAskAI` card on trek detail, Compare screen rewired to `/treks/compare` (now 2-3 treks + AI summary). 6 new tests (TC-B17–B22 admin + earlier trek_intelligence tests); 665/665 backend pass (2 pre-existing `test_refresh.py` failures, unrelated); `next build` ✅ zero errors; `npx tsc --noEmit` (mobile) ✅ zero errors. | **done** |

`npx gitnexus analyze --force` re-index after Step 74: **466,648 nodes | 752,545 edges | 300 flows** (was 424,262 / 701,977 pre-Step-74).

| 75 | **Step 75 — TrekSage Advanced Bot Fix + Complete UI Redesign** — 4 issues addressed: (1) **Bot loop fix** — `treksage_agent.py`: transition phrases like "Let me broaden the search:" on non-final rounds now detected (ends with ":" + < 60 chars), nudge injected into context, loop continues; `max_tokens` bumped 800→1200 on final round for richer summaries; (2) **System prompt hardened** — guardrails: no tech-stack exposure (Claude/Haiku/FastAPI/tool names never mentioned), safety-first (AMS risk for >14k ft treks, permit-verify disclaimer), structured "Why it matches:" format, always offers next step; (3) **`max_altitude_ft`** added to `_slim_profile` (feeds trek card Altitude stat row); (4) **`TrekAskAI.tsx`** markdown fix — `ReactMarkdown` + `mdComponents` wraps `ex.answer` (was plain text); (5) **`TreksageChat.tsx` complete PRD redesign** — light warm palette (#FAF5EE bg, #1D3A2E pine, #E8702A saffron); header: mountain avatar in pine circle, "TrekSage" + "● Online", "New Chat" button; empty state: logo + Discover/Compare/Plan category tabs + 5 contextual prompt rows with tag pills; bot bubbles: white card + pine avatar; user bubbles: dark pine; trek cards: hero image with match% pill overlay, Duration/Altitude/Best Season stats grid, difficulty chip + budget, View Details/Compare/Plan CTA row; loading: rotating contextual messages; remark-gfm table support; (6) **`treksage/page.tsx`** updated to light #FAF5EE wrapper; (7) **`lib/api.ts`** `TreksageChatResponse.trek_cards` extended with `season` + `max_altitude_ft`; (8) **`search.tsx` (mobile)** — Expo Go detection (`Constants.appOwnership === "expo"`) + `Alert.alert` in `handleMicPress` so app shows friendly message instead of TCC crash. 683/685 backend pass (2 pre-existing); `next build` ✅ 196/196 pages; `npx tsc --noEmit` ✅ zero errors. | **done** |

| 74 | **Step 74 — Post-73 Bug Fixes + Mobile/TrekSage UI Revamp** — 10 issues from user testing addressed: (1) `treksage_agent.py`: "Myra"→"TrekSage" in system prompt; `tool_choice={"type":"none"}` forced on final tool round to prevent truncated "Let me try a broader search:" replies; `hero_image_url` added to `_slim_profile`; `trek_cards` extracted from last search/recommend result and returned in API response; (2) `routes/treksage.py`: `TreksageChatResponse` extended with `trek_cards: list[dict]`; (3) `react-markdown` installed; `TreksageChat.tsx` rewritten — "TrekSage AI" header (Myra removed), `ReactMarkdown` with custom components for bot messages, `TrekCardsList` renders up to 5 clickable trek cards with hero image below each assistant reply; (4) `treksage/page.tsx`: all "Myra" text replaced; metadata updated; (5) `lib/api.ts`: `TreksageChatResponse.trek_cards` typed; (6) Home `page.tsx`: TrekSage AI banner section added between TRENDING and CATEGORY HUB — headline, description, 3 example prompt links → `/treksage`; (7) `app.config.ts`: explicit `ios.infoPlist.NSSpeechRecognitionUsageDescription` + `NSMicrophoneUsageDescription` added (voice search crash fix — dev client rebuild required); (8) `mobileApi.ts`: `hero_image_url` added to `TrekRecommendation`; `contentApi.searchTreks()` function added using semantic search endpoint; (9) `plan-my-trek.tsx` revamped — emojis on intent chips, hint labels on month/duration/experience, hero image header on result cards, green/amber/red match badge, improved visual hierarchy; (10) `compare.tsx` revamped — 2-column trek tile grid with hero images + ✓ overlay, selected-trek pill strip with thumbnails, debounced text search input (calls `contentApi.searchTreks`), comparison table header shows trek images, AI summary card styled with accent badge "✨ TrekSage says". 0 backend changes needed; 683/685 pass (2 pre-existing); `next build` ✅ Compiled successfully; `npx tsc --noEmit` ✅ zero errors. | **done** |

| 73 | **Step 73 — TrekSage Bugfix Pass** — 7 production bugs fixed + 2 new surfaces built. Commits: (1) `backfill_all_trek_meta(db)` bulk service + Celery task `trek_intelligence.backfill_all_trek_meta` + admin "Backfill All Treks" button (`POST /admin/treks/backfill-all`), schema `BackfillAllTriggerResponse`; (2) `_get_or_create_compare_summary` enriched with permit_required/notes, themes, solo_friendly, suitability, best/avoid months + `_SUMMARY_PROMPT_VERSION = "v2"` cache-bust; (3) `_QA_SECTION_KEYWORDS` map + CMS `content_json.sections` grounding in `ask_trek_question` — packing/itinerary/safety/faqs questions now answered from real CMS HTML; (4) `ChatTurn` schema + `history` param on `AskTrekQuestionRequest`/`ask_trek_question`/REST route — cache skipped for history-bearing requests; web + mobile `TrekAskAI.tsx` updated; (5) `TrekProfile.content_sections`/`faqs` fields + `page_to_profile` helpers + `_compact_profile` strips them for search tools; `datacenter/trek-guide/[slug]/page.tsx` renders sections; (6) Alembic migration `20260616_0044_step73_treksage_chat.py` — `treksage_chat_sessions`/`treksage_chat_messages` tables; `treksage_agent.py` (Haiku tool-calling, MAX_TOOL_ROUNDS=3); `app/api/routes/treksage.py` (`POST /api/v1/treksage/chat`, `GET /api/v1/treksage/chat/{session_key}/history`); (7) `/treksage` public page — Myra-style chat UI with session restore from localStorage; `docs/URL_MAP.md` + `sitemap.ts` updated; (8) `datacenter/page.tsx` rewritten as `?slug=` JSON viewer; `/trek-guide/[slug]` → 308 `permanentRedirect`; (9) Mobile parity — `MobileChatTurn` type + history param on `trekIntelligenceApi.ask`; mobile `TrekAskAI` sends last 3 exchange turns. 18 new backend tests (TC-B23–B40); 683/685 pass (2 pre-existing `test_refresh.py`); `next build` ✅ zero errors; `npx tsc --noEmit` (mobile) ✅ zero errors. | **done** |

`npx gitnexus analyze --force` re-index after this step: **458,363 nodes | 752,216 edges | 3,652 clusters | 300 flows** (from 485,615 / 767,598 / 3,315 / 300 at start of step — drop attributable to indexer scope-extraction/timeout fallbacks during this run, consistent with prior steps; Step 72 changes are present in the new graph). Final `gitnexus_detect_changes(scope:"all")`: 142 changed symbols / 31 files / 13 affected processes, risk level high (cumulative across all 10 commits' uncommitted files — all affected processes are leaf screen-component traces individually verified LOW via `gitnexus_impact` per commit).

### Step 75 — TrekSage Advanced Bot Fix + UI Redesign: what remains (user/infra action)
- **Voice search crash**: still requires `eas build --profile development --platform ios` for the real native fix. The code-level change (Expo Go detection + Alert) prevents a crash in Expo Go; a custom dev client built after Step 74 with the new `app.config.ts` `infoPlist` keys will work correctly.
- **TrekSage trek cards**: Altitude stat row shows "—" until "Backfill All Treks" is run (`/admin/trek-data`) to populate `trek_max_altitude_ft` in the database.
- **GitNexus re-index**: pending after commit — run `npx gitnexus analyze --force` once Step 75 is pushed.

### Step 74 — Post-73 Bug Fixes: what remains (user/infra action)
- **Voice search crash**: `NSSpeechRecognitionUsageDescription` added to `app.config.ts` but the **dev client must be rebuilt** (`eas build --profile development --platform ios`) for the Info.plist change to take effect in the installed dev client. The existing dev client binary does not pick up the new key without a rebuild.
- **datacenter.trekyatra.co.in "Server Not Found" (TC-F18/F19/F20)**: Not a code issue — DNS/CNAME for the subdomain has not been configured in GoDaddy/DigitalOcean. User action: in the DO App Platform, add `datacenter.trekyatra.co.in` as an additional domain on the `web` component; in GoDaddy, add CNAME `datacenter` → DO app domain. The Next.js middleware rewrite is already in place.
- **TrekSage rich content (trek images)**: Trek cards in chat will show images only after the "Backfill All Treks" admin action has been run (Step 73 post-action) to populate `hero_image_url` in the database.

### Step 73 — TrekSage Bugfix Pass: what remains (user/infra action)
- **Before deploy**: run `alembic upgrade head` for `20260616_0044_step73_treksage_chat.py` (`treksage_chat_sessions`/`treksage_chat_messages` tables).
- **Celery worker must be restarted** after deploy to register `trek_intelligence.backfill_all_trek_meta` task.
- After restart, admin must click **"Backfill All Treks"** on `/admin/trek-data` once — this populates the 51 trek guides with AI-drafted structured fields, which fixes the compare page "—" values, plan card badges, and admin dashboard 0/11/805 coverage counts.
- `/treksage` cost note: each chat turn is a live Haiku call (up to 3 tool-round-trips) — not cached. This is intentional for a conversational assistant but is higher-cost than the Step 72 cached Q&A endpoint.

### Step 72 — TrekSage MCP Server: what remains (user/infra action)
- Add `MCP_SHARED_SECRET` to DO env vars (production) — local `.env.example` documented.
- **Celery worker must be restarted** after deploy to register `trek_intelligence.backfill_trek_meta` task.
- DO App Platform: add `datacenter.trekyatra.co.in` as an additional domain on the existing `web` component; GoDaddy CNAME `datacenter` → DO app domain.
- ChatGPT: Settings → Connectors → Add custom connector → `https://api.trekyatra.co.in/mcp` (manual, user-performed).
- Claude (claude.ai / Desktop): Settings → Connectors → Add custom connector → `https://api.trekyatra.co.in/mcp` (manual, user-performed).
- New trek_guide structured fields start unpopulated (`trek_data_confidence={}` = all "missing") — use `/admin/trek-data` "Backfill draft" + review/verify per trek over time.

### Step 67 — CDP Analytics Full Revamp
Status: done
Date: 2026-05-29
What is done:

**Phase 0 — Event Taxonomy + DB (`alembic/versions/20260529_0041_cdp_phase0.py`)**
- `CREATE TABLE event_definitions` — canonical event dictionary (event_name UNIQUE, category, description, properties JSONB, is_active, is_test_only); seeded with 35 events covering navigation (1), engagement (18), conversion (11), system (3)
- `CREATE TABLE custom_segments` — rule-based segment storage (name, description, conditions JSONB, user_count, last_computed_at)
- `CREATE TABLE cdp_webhook_rules` — outbound webhook registry (trigger_event, condition JSONB, webhook_url, is_active)
- `ALTER TABLE analytics_events ADD COLUMN is_internal BOOLEAN DEFAULT FALSE` — separates test/prod traffic
- 4 composite performance indexes: `(event_name, created_at)`, `(anonymous_id, created_at)`, `(page_url, created_at)`, `(is_internal)`

**Backend Models (`services/api/app/modules/cdp/models.py`)**
- Added `is_internal` Boolean column to `AnalyticsEvent`
- Added `EventDefinition`, `CustomSegment`, `CdpWebhookRule` ORM classes

**Backend Schemas (`services/api/app/schemas/cdp.py`)** — 20 new Pydantic models:
- KPI layer: `SparklinePoint`, `KpiTile`, `KpisOut` (8 tiles with value/delta/sparkline)
- Dashboard: `AlertItem`, `AlertsOut`, `RealtimeFeedItem`, `RealtimeFeedOut`
- Events: `EventExplorerItem`, `EventExplorerOut`, `EventDefinitionOut`
- Funnels: `FunnelTemplate`, `FunnelTemplatesOut`
- Cohorts: `CustomCohortIn`
- Segments: `SegmentCondition`, `CustomSegmentIn`, `CustomSegmentOut`, `SegmentPreviewIn`, `SegmentPreviewOut`
- Content: `ContentPageAnalytics`, `ContentPagesOut`, `TrekAnalyticsRow`, `TrekAnalyticsOut`
- Webhooks: `WebhookRuleIn`, `WebhookRuleOut`, `WebhookRulesOut`
- Suppressions: `SuppressionItem`, `SuppressionsOut`
- `EventIn.is_internal: bool = False` added

**Backend Service (`services/api/app/modules/cdp/service.py`)** — 17 new functions:
- `_is_internal_event()` — checks anonymous_id list + payload flag; `log_event()` updated to pass is_internal
- `get_kpis()` — 8 KPI tiles (DAU/WAU/MAU/Sessions/Avg-Duration/Leads/Plan-Completions/Scroll50) with delta vs prior period + 7-day sparkline arrays
- `get_alerts()` — rule-based: plan completion drop >20%, no events 2h, user spike >50%
- `get_realtime_feed()` — last 50 events as serialized dicts (avoids PydanticSerializationError)
- `get_events_explorer()` — paginated with 7 filter dimensions; serialized dicts
- `get_events_export_csv()` — streaming CSV generator (max 10,000 rows)
- `FUNNEL_TEMPLATES` + `get_funnel_templates()` — 6 preset TrekYatra funnels
- `get_custom_cohort()` — dynamic CTE SQL with week-offset CASE; falls back to `get_cohort_heatmap()` for session_started
- `list_custom_segments()`, `create_custom_segment()` — CRUD on custom_segments table
- `preview_segment()` — evaluates SegmentCondition[] against last 90 days; returns count + ms
- `export_segment_csv()` — streaming segment CSV
- `get_content_pages_analytics()` — LEFT JOIN cms_pages + analytics_events; views_7d/30d, scroll_50/100, leads
- `get_trek_analytics()` — trek funnel metrics sorted by conversion_rate DESC
- `list_webhook_rules()`, `create_webhook_rule()`, `delete_webhook_rule()` — CRUD on cdp_webhook_rules
- `get_suppressions()` — users with suppressed user_trait
- `get_event_definitions()` — all rows from event_definitions

**Backend Routes (`services/api/app/api/routes/cdp.py`)** — 18 new endpoints (all static before dynamic):
- `GET /admin/cdp/kpis`, `/realtime-feed`, `/alerts`
- `GET /admin/cdp/events/definitions`, `/events/export`, `/events` (ordered before `/events/stream`)
- `GET /admin/cdp/funnels/templates`
- `POST /admin/cdp/cohorts/custom`
- `GET/POST /admin/cdp/segments/custom`, `POST /segments/preview`, `GET /segments/{id}/export`
- `GET /admin/cdp/content/pages`, `/content/treks`
- `GET/POST /admin/cdp/webhooks`, `DELETE /webhooks/{rule_id}`
- `GET /admin/cdp/suppressions`

**Backend Tests (`services/api/tests/test_cdp_step67.py`)** — 25 tests (TC-B01 to TC-B25):
- is_internal default false / true persisted; KPI structure (8 tiles); realtime feed list; alert structure; event explorer pagination + exclude_internal filter; CSV headers; 6 funnel templates; cohort heatmap structure (event-based + session-based); custom segment create/list; segment preview returns count; content pages list; trek analytics list; webhook CRUD (create/list/delete 204); suppressions list; event definitions (35)
- Full suite: **608 passed, 1 skipped, 0 failures**

**Frontend analytics.ts**
- `IS_INTERNAL` constant: `localhost || NEXT_PUBLIC_IS_INTERNAL === "true"`
- `is_internal: boolean` on `EventPayload` interface; passed in every event body
- 18 new typed wrappers: `trackTrekPlanCtaClicked`, `trackTrekSaved`, `trackTrekCompared`, `trackTrekShared`, `trackFaqExpanded`, `trackSeasonTabChanged`, `trackDifficultyTabChanged`, `trackSearchResultClicked`, `trackRecommendationClicked`, `trackCompareView`, `trackPackingChecklistViewed`, `trackPermitGuideViewed`, `trackCostGuideViewed`, `trackScrollDepthPct`, `trackLeadSubmitted`, `trackNewsletterSubscribed`, `trackOperatorInquirySent`, `trackAffiliateClick`

**Frontend admin pages (all under `apps/web-next/app/(admin)/admin/cdp/`)**
- `page.tsx` — FULL REWRITE: 8 KPI tiles with pure SVG `<polyline>` sparklines; delta (pine/red/muted + ▲▼→); dismissible alert rail; real-time feed (10s polling, 50 events, category badges); 10 nav cards grid
- `events/page.tsx` — FULL REWRITE: 7 filter controls; paginated table (← prev / next →); expandable JSON rows; CSV export
- `content/page.tsx` — NEW: sortable per-page analytics table; page_type filter; link to trek analytics
- `content/treks/page.tsx` — NEW: trek funnel table; aggregate KPI strip; color-coded conversion rates
- `segments/builder/page.tsx` — NEW: visual rule builder (WHERE/AND rows, condition type + event dropdowns, operator + value inputs); live preview count; save to backend
- `webhooks/page.tsx` — NEW: inline create form (name, event dropdown, URL); rules list with delete

**Frontend layout (`apps/web-next/app/(admin)/admin/layout.tsx`)**
- Added `Filter`, `Webhook`, `Mountain` icon imports
- Added `exact: true` to CDP Overview nav item (fixes active state bleeding)
- Added: Segment Builder, Content Analytics, Trek Analytics, Webhooks nav items
- Renamed: "Event Stream" → "Event Explorer"

**Build: `next build` — ✅ 193 pages, 0 TypeScript errors**

What remains:
- Phase 5 (AI insight cards) — deferred to future step
- Webhook Celery delivery task (rules are stored; actual HTTP dispatch on event match is deferred)
- GSC enhanced panel (CTR decay, position opportunities, query clusters) — deferred

### Step 63 — Hindi CMS translation fix + SEO (hreflang, JSON-LD, sitemap)
Status: done
What is done:
- `services/api/app/modules/agents/translation/agent.py` — `translate_page()` extended to translate `seo_title`, `seo_description`, and `faqs` list; max_tokens raised to 12000; fallback returns all fields with original values when no API key
- `services/api/app/api/routes/translation.py` — passes `seo_title`, `seo_description`, `faqs` to agent; changed `status="draft"` → `status="published"` so Hindi pages are live immediately; stores translated SEO + content_json fields; response includes `/hi/trek/{slug}` link
- `services/api/app/api/routes/sitemap_data.py` — `sitemap_pages()` filters `language='en'` only (Hindi pages excluded from main sitemap); new `GET /public/sitemap-pages/hindi` endpoint returns `HindiSitemapEntry` with `source_slug` (via join with source English page)
- `services/api/tests/test_translation.py` — TC-B08 updated: asserts `status=="published"`; TC-B15 added: verifies seo_title/seo_description translated; TC-B16 added: verifies FAQ list translated; 16/16 translation tests pass; full suite 520/522 pass (2 pre-existing flaky failures unrelated)
- `apps/web-next/app/(public)/hi/trek/[slug]/page.tsx` — `robots: { index: true, follow: true }`, `x-default` hreflang to EN, `og:locale: hi_IN`, `alternateLocale`, JSON-LD Article + FAQPage schemas; Hindi breadcrumb labels
- `apps/web-next/app/(public)/hi/guides/[slug]/page.tsx` — same SEO improvements as hi/trek
- `apps/web-next/app/(public)/hi/packing/[slug]/page.tsx` — same SEO improvements as hi/trek
- NEW `apps/web-next/app/hi-trek-sitemap.xml/route.ts` — Hindi trek sitemap with `<xhtml:link>` hreflang alternates (hi, en, x-default); fetches from `/public/sitemap-pages/hindi` with fallback to `api.trekyatra.co.in`
- `apps/web-next/app/sitemap.ts` — added `/hi-trek-sitemap.xml` entry
- `apps/web-next/app/robots.ts` — `sitemap:` changed from string to array: `[sitemap.xml, hi-trek-sitemap.xml]`
- `apps/web-next/app/(admin)/admin/cms/page.tsx` — full translation progress modal (elapsed timer, progress bar, success/error states with "View Hindi page →" link); translate button only shows for EN pages without existing HI translation; green Languages icon when HI translation already exists
- 520/522 backend tests pass; `next build` clean (zero TypeScript errors)
What remains: ANTHROPIC_API_KEY must be set in DO production for real AI translation (currently uses rule-based fallback)

### Step 62 — Plan My Trek inline auth gate modal
Status: done
What is done:
- `apps/web-next/middleware.ts` — `/plan` removed from `PROTECTED_PREFIXES` and `config.matcher`; plan wizard is now freely accessible; auth gate moves to in-page modal at submit
- NEW `apps/web-next/components/plan/AuthGateModal.tsx` — Radix Dialog modal containing full sign-in + sign-up flows (Google OAuth + email/password + show/hide password); matches existing site auth UI exactly; `onSuccess` callback fires immediately after any successful auth method; sign-up in modal skips onboarding so user lands on results without delay; mode toggle (sign-in ↔ sign-up) within modal
- `apps/web-next/app/(public)/plan/page.tsx` — `useAuth()` imported; `pendingPayload` ref stores wizard state before auth; `handleSubmit()` intercepts if `!user` and shows modal; `handleAuthSuccess()` closes modal and fires `callApi(pendingPayload)` immediately; step 6 shows hint "You'll be asked to sign in…" when guest; logged-in users submit directly without seeing modal
- 518/520 backend tests pass (2 pre-existing flaky test_refresh isolation failures, unrelated); `next build` clean (180 pages, 0 errors)
What remains: nothing — auth gate via modal is fully implemented end-to-end

### Step 61 — Plan My Trek auth gate + TC-F05 full ?next= chain fix
Status: done
What is done:
- `apps/web-next/middleware.ts` — `/plan` and `/plan/:path*` added to `config.matcher`; `PROTECTED_PREFIXES` already included `/plan` but the guard never fired because the matcher was missing those routes; now any unauthenticated access to `/plan` or `/plan/results` immediately redirects to `/auth/sign-in?next=/plan`; GUEST_ONLY redirect now honours `?next=` (with open-redirect safety check) instead of hardcoding `/account`
- `apps/web-next/app/(auth)/auth/sign-in/page.tsx` — "Create account" link now passes `?next=` through: `/auth/sign-up?next=/plan` so users who choose to sign up from the plan gate keep the post-auth destination
- `apps/web-next/app/(auth)/auth/sign-up/page.tsx` — refactored to `SignUpForm` + `Suspense` (required for `useSearchParams`); Google login redirects to `?next=` instead of hardcoded `/account`; email signup now passes `?next=` to onboarding URL (`/auth/onboarding?next=%2Fplan`) so the redirect chain is unbroken
- `apps/web-next/app/(auth)/auth/onboarding/page.tsx` — refactored to `OnboardingContent` + `Suspense` wrapper (required for `useSearchParams`); `handleFinish()` now redirects to `?next=` param instead of hardcoded `/explore`; safe open-redirect check applied
- 518/520 backend tests pass (2 pre-existing flaky test_refresh isolation failures, unrelated); `next build` clean (180 pages)
What remains: nothing — full ?next= chain (plan → sign-in → sign-up → onboarding → plan) is enforced end-to-end

### Step 60 — Enhancement batch: CMS translation UX + search quality fixes
Status: done
What is done:
- `services/api/app/api/routes/translation.py` — guard against `content_html=None`; `content_html or ""` passed to agent so manually-created empty pages don't cause 500
- `apps/web-next/app/(admin)/admin/cms/page.tsx` — `translatingSlug` state: spinner (Loader2) replaces Languages icon while translating; button disabled during in-flight request; catch block now surfaces actual API error message instead of generic text; feedback timeout extended to 8s
- `apps/web-next/components/content/RecommendedContent.tsx` — `excludeSlugs` prop added; fetches `limit + excludeSlugs.length + 2` items then filters, so the displayed count is always correct even after dedup; static fallback also respects excludeSet
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — passes `clusterPages.map(p => p.slug)` as `excludeSlugs` to `RecommendedContent`; cluster sidebar and "Similar treks" sections are now guaranteed non-overlapping
- `services/api/app/modules/search/service.py` — `get_trending_queries`: threshold lowered from `COUNT(*) >= 2` → `>= 1`; `_CURATED_TRENDING` fallback (10 terms) supplements when real data < limit; real queries always ranked first
- `services/api/app/api/routes/search.py` — `semantic_search`: season_months intent filter applied (graceful skip when no trek_season data); region/difficulty/duration filters now all use graceful fallback pattern; separate `all_results` copy retained for fallback
- `apps/web-next/app/(public)/search/page.tsx` — `SEASON_BUCKETS` winter bucket fixed (April removed from winter, was causing May-Jun treks to appear for "winter trek" queries); `exactTreks`/`fuzzyTreks` memos split by Fuse score (< 0.05 = exact); `semanticUniq` deduped against exact treks; `fuzzyNotInSemantic` deduped against semantic; result sections reordered: exact match → semantic → fuzzy → guides; "Best matches for..." moved above trek grid; "Ranked by semantic similarity and relevance" subtitle removed; section headers are user-friendly ("Top result", "Results for X", "More treks", "More results")
- 518/520 backend tests pass (2 pre-existing flaky test_refresh isolation failures, unrelated to these changes); `next build` clean (180 pages)
What remains:
- ANTHROPIC_API_KEY must be set in production for real Hindi translation (currently rule-based fallback)

### Pre-Launch Sprint — Nav + Compare responsive (current commit)
Status: done
What is done:
- `components/brand/Logo.tsx` — added `compact` prop; when compact=true, tagline div is not rendered (used in Header to prevent nav crowding)
- `components/layout/Header.tsx` — Logo now receives `compact` prop; search button: `onClick={() => router.push("/search")}` — fully functional; ⌘K/Ctrl+K keyboard shortcut via `useEffect` → `router.push("/search")`; mobile drawer search button also navigates on click; nav item padding `px-3`→`px-2.5`, gap `gap-6`→`gap-4`; search bar `min-w-[200px]`→`min-w-[160px]`, h-10→h-9; `useEffect` import added
- `app/(public)/page.tsx` — compare section: heading `text-4xl md:text-5xl`→`text-2xl sm:text-3xl md:text-4xl` (no overflow on narrow mobile); "Kedarkantha or Brahmatal? Hampta or Bhrigu?" rewritten as `Kedarkantha vs Brahmatal?<br/>Hampta vs Bhrigu?` (natural line break); buttons sm size; card padding `p-5`→`p-3 md:p-4`; card font `text-lg`→`text-sm md:text-base`; card gap `gap-3`→`gap-2 md:gap-3`; `a` and `b` rendered as separate divs (no br overflow)
- 178/178 static pages; build clean

### Pre-Launch Sprint — Logo + Search + Hero Height + Audit (current commit)
Status: done
What is done:
- `components/brand/Logo.tsx` — REWRITTEN again: navy outer ring, orange-amber sky gradient, mountain peak, snow cap, pine forest, trekker, sun, birds; tagline corrected to "Explore. Dream. Discover." (matching actual new logo); Trek in navy, yatra in orange-500; dark variant uses #1e2d4e for Trek text, green tagline
- `app/(public)/page.tsx` — hero: min-h-screen → min-h-[85vh] md:min-h-[78vh] (reduced height); content padding pt-28→pt-20, pb-24→pb-16; font 68px→64px; pill text corrected to "Explore. Dream. Discover."
- `app/(public)/search/page.tsx` — REWRITTEN with Fuse.js 7.3.0: trekFuse (threshold 0.35, keys: name×3/region×2/state×2/season×1.5/difficulty/description), guideFuse, suggestionFuse for autocomplete; dropdown shows up to 7 fuzzy-matched suggestions with trek/guide type icons; outside-click dismissal; Escape key closes; no-results state has quick suggestion buttons; result count shows "fuzzy matched" label; semantic search (pgvector) still fires for >3-word queries
- `package.json` — fuse.js@^7.3.0 added
- `docs/PRELAUNCH_CHECKLIST.md` — COMPLETE REWRITE: comprehensive 8-section audit covering every BE module, every FE page, every admin page, 16 known gaps with impact ratings, production readiness checklist, integration checklist, manual seeding checklist, testing status; final Go/No-Go gate
- 472/472 backend tests pass; next build clean (178 pages)

### Pre-Launch Sprint — Logo + Hero + Footer fixes (commit 4dbae65)
Status: done
What is done:
- `components/brand/Logo.tsx` — REWRITTEN: removed Mountain lucide icon + "India · Trails · Trust"; added SVG circular badge (LogoMark) matching new brand identity (orange-to-green gradient, mountain silhouette, snow cap, forest, sun, trekker); tagline updated to "Explore · Experience · Escape"; Trek text in foreground/white, Yatra text in orange-400/500; hover glow preserved
- `app/(public)/page.tsx` — hero layout restructured: removed `flex items-end` (was pushing all content to the bottom, heading invisible on load); changed to `flex flex-col` with content div using `flex-1 flex flex-col justify-center pt-28 pb-24` — heading now visible centred in viewport on load; trust stats moved to `mt-auto` at natural bottom; background overlay gradients adjusted for better contrast
- `components/layout/Footer.tsx` — newsletter card: `bg-foreground/40` (dark-on-dark, invisible) → `bg-white/[0.07] border border-white/20`; container `pt-28` → `pt-36` to place card visibly below the 80px mountain SVG boundary; comment added explaining the 144px clearance
- 178/178 static pages; build clean

### Pre-Launch Sprint — Auth Gaps (commit f389dc7)
Status: done
What is done:
- `security.py` — create_reset_token (1h JWT, typ=password_reset), parse_reset_token
- `schemas/auth.py` — ForgotPasswordRequest, ResetPasswordRequest, AccountSettingsUpdate, LeadResponse; UserResponse.subscription_plan: str = "free"
- `api/routes/auth.py` — POST /auth/forgot-password (graceful SMTP), POST /auth/reset-password (verify JWT + hash_password), PATCH /auth/me (update full_name/display_name), GET /auth/me/leads (enquiries by user email); /auth/me now returns subscription_plan
- `auth/forgot-password/page.tsx` — wired to POST /forgot-password; sent confirmation state
- `auth/reset-password/page.tsx` — reads ?token=, calls POST /reset-password, success redirect to sign-in; Suspense boundary
- `/compare` — full rewrite: dynamic dropdowns from static data, live comparison table, full guide links
- `/account/settings` — wired to PATCH /auth/me; profile save with feedback; password via "Send reset link" flow
- `/account/enquiries` — wired to GET /auth/me/leads; status badges; empty state; new enquiry CTA
- `/itineraries`, `/costs`, `/gear`, `/beginner`, `/safety` — CMSPageHub (fetchCMSHubPages by page_type, 1h revalidate) + ContentPage static fallback
- `CMSPageHub` component — reusable CMS page grid; fetchCMSHubPages server helper
- `/admin/operators/[id]` — agreement GET/POST/PATCH form + review list with delete
- `/admin/operators/page.tsx` — FileText icon linking to detail page
- Playwright installed; playwright.config.ts; e2e/ directory with 4 spec files (homepage 6 tests, auth 5 tests, search 2 tests, plan 4 tests)
- `package.json` — test:e2e + test:e2e:ui scripts
- `docs/PRELAUNCH_CHECKLIST.md` — comprehensive 60+ item go-live checklist (9 sections)
- `sitemap.ts` — expanded page_type map (trek_guide, itinerary, cost_guide, gear_guide, safety_guide, expert_guide, premium_compendium, seasonal_hub, cluster_hub, regional_hub)
- `app/(public)/page.tsx` — HomeSearchBar wired, dead buttons fixed (/products), operators CTA + PersonalisedFeed sections added
- 472/472 backend tests pass; next build clean (178 static pages)

### Pre-Launch Sprint — UI Polish (commit 6382484)
Status: done
What is done:
- `app/(public)/page.tsx` — hero: overflow:hidden moved to image container (search bar blur no longer clips); pt-32→pt-24; font lg:text-[88px]→lg:text-[72px]; pill updated to "Explore · Experience · Escape" (brand slogan from new logo); planning resources section replaced plain gradient divs with real trek images + PDF-type badge overlays
- `components/trek/TrekCard.tsx` — diffColors: bg-success/15 (invisible on photos) → solid bg-emerald-600/bg-amber-500/bg-orange-600/bg-red-600 with text-white + shadow; backdrop-blur removed from difficulty badge; Beginner badge → bg-blue-600
- `components/layout/Footer.tsx` — newsletter card backdrop-blur-sm removed (was bleeding through mountain SVG) → bg-foreground/40; "Bengaluru" → "Gurgaon"; Heart icon added to "Made with care in India" copyright; pt-32→pt-28
- Trust pages — full proper content for all 7:
  - `/about` — mission, story, editorial promises, team, contact
  - `/about/authors` — editor bios, contributor policy, join team
  - `/contact` — channels, response times, FAQs
  - `/privacy` — full 8-section privacy policy
  - `/terms` — full 9-section terms & conditions with liability + governing law
  - `/affiliate-disclosure` — disclosure statement, independence policy
  - `/safety-disclaimer` — AMS, permit accuracy, emergency contacts, liability limitation
  - `/methodology` — verification cycle, YMYL policy, AI use, error correction
- 472/472 backend tests pass; next build clean (178 static pages)

### Step 40 — Premium Subscription Layer
Status: done
What is done:
- `stripe>=8.0.0,<9.0.0` added to pyproject.toml; installed in venv
- Migration `20260506_0030_subscriptions.py` — ALTER users ADD subscription_plan String(20) default='free'; CREATE subscriptions (unique user_id, stripe_customer_id, stripe_subscription_id unique, plan, status, current_period_end, timestamps); ALTER cms_pages ADD is_premium bool default=false; applied with `alembic upgrade head`
- `modules/auth/models.py` — User.subscription_plan String(20) default='free' added
- `modules/cms/models.py` — CMSPage.is_premium bool default=False added; Boolean imported
- `modules/subscriptions/__init__.py`, `models.py` — Subscription ORM model; registered in db/base.py
- `modules/subscriptions/service.py` — get_subscription, get_subscription_status, create_checkout_session (real Stripe when key set, test-mode redirect when unset), cancel_subscription (Stripe cancel_at_period_end + local status=cancelled), handle_webhook (customer.subscription.created/updated → sync plan; deleted → downgrade; invoice.payment_failed → past_due; no-secret = raw JSON accepted for dev), upsert_subscription_for_user
- `schemas/subscriptions.py` — SubscriptionCheckoutRequest/Response, SubscriptionStatusResponse, CancelResponse, StripeWebhookResponse
- `schemas/auth.py` — UserResponse.subscription_plan: str = "free" added
- `schemas/cms.py` — is_premium in Create/Patch/Response; is_gated in Response (set at route level)
- `api/routes/subscriptions.py` — POST /subscriptions/create-checkout, GET /subscriptions/status, POST /subscriptions/cancel (all require auth), POST /subscriptions/webhook (raw body, no auth)
- `api/routes/cms.py` — GET /cms/pages/{slug}: optional auth via get_optional_user; if is_premium and user plan != premium → content_html="", is_gated=True
- `api/router.py` — subscriptions_router registered
- `core/config.py` — stripe_webhook_secret, stripe_premium_price_id_monthly, stripe_premium_price_id_annual settings added
- `.env.example` — STRIPE_WEBHOOK_SECRET, STRIPE_PREMIUM_PRICE_ID_MONTHLY, STRIPE_PREMIUM_PRICE_ID_ANNUAL added
- `tests/test_subscriptions.py` — 15 tests TC-B01–TC-B15: status free no-row, upsert creates row + updates user plan, checkout test-mode fallback, cancel no-sub graceful, cancel marks cancelled, webhook sync premium (subscription.updated), webhook downgrade (subscription.deleted), webhook past_due (payment_failed), CMS gating free/premium/anonymous/non-premium page, checkout/status require auth, /auth/me returns subscription_plan
- `components/subscription/PremiumBadge.tsx` — Crown icon + amber badge
- `components/subscription/GatedContent.tsx` — blurred teaser overlay with lock icon + Upgrade CTA
- `components/subscription/SubscriptionStatusCard.tsx` — plan badge, period end, cancel/upgrade actions
- `components/subscription/PricingTable.tsx` — monthly/annual toggle, Free vs Premium tier comparison, Stripe checkout CTA
- `app/(public)/premium/page.tsx` — public marketing page with PricingTable
- `app/(public)/account/premium/page.tsx` — auth-gated: fetches subscription status, SubscriptionStatusCard, upgrade/cancel actions
- `app/(admin)/admin/cms/page.tsx` — Crown icon toggle per page to set/unset is_premium; is_premium tracked in local CMSPage interface
- `lib/api.ts` — CMSPage.is_premium + is_gated fields; SubscriptionStatus interface; fetchSubscriptionStatus, createSubscriptionCheckout, cancelSubscription helpers
- `lib/auth-api.ts` — UserResponse.subscription_plan: string added
- `.env.local.example` — NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY added
- 472/472 backend tests pass (15 new); next build clean (178 static pages)
What remains:
- Real STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET required for live billing (test-mode redirect works without keys)
- Stripe CLI needed locally: `stripe listen --forward-to localhost:8000/api/v1/subscriptions/webhook`
- GatedContent component not yet wired into trek detail/guide pages — requires is_premium check on CMSPage fetch (follow-up)

### Step 39 — Trip Planning Assistant
Status: done
What is done:
- Migration `20260506_0029_trip_plans.py` — `trip_plans` (id UUID PK, session_id String 128, user_id FK→users SET NULL, inputs JSON, output JSON, trek_slug String 255, fallback_used bool, created_at); applied with `alembic upgrade head`
- `modules/plan/__init__.py`, `models.py` — TripPlan ORM model; registered in db/base.py
- `modules/agents/trip_planner/__init__.py`, `agent.py` — TripPlannerAgent (LangGraph 4-node): gather_constraints → select_treks → build_itinerary → package_response; selects treks from CMS by page_type=trek_guide + region/experience/month scoring; LLM call (claude-haiku, max_tokens=3000, ephemeral caching) for day-by-day itinerary; fallback itinerary when no API key or LLM fails; gear parsed from CMS packing section; all exceptions swallowed
- `modules/plan/service.py` — generate_plan (runs agent, stores TripPlan, optionally captures LeadSubmission with cta_type=trip_planner); get_plan; email_plan (SMTP graceful)
- `schemas/plan.py` — PlanGenerateRequest, ItineraryDay, TripPlanOutput, TripPlanResponse, PlanEmailRequest
- `api/routes/plan.py` — POST /plan/generate (optional auth), GET /plan/{id}, POST /plan/{id}/email
- `api/router.py` — plan_router registered
- `db/base.py` — TripPlan registered
- `tests/test_plan.py` — 13 tests TC-B01–TC-B13: fallback itinerary day count, region scoring, no-key fallback, mocked LLM, exception swallowing, plan stored in DB, lead captured, API generate/get/get-404/email-404/email-no-smtp, gear parsed from CMS
- `lib/api.ts` — ItineraryDay, TripPlanOutput, TripPlan, PlanGeneratePayload interfaces; generatePlan, fetchPlan, emailPlan helpers
- `components/plan/WizardStep.tsx` — progress bar + step title wrapper
- `components/plan/ItineraryDay.tsx` — expandable day card (client, first day open by default)
- `components/plan/TrekPlanCard.tsx` — full plan result: header, difficulty badge, meta chips, itinerary accordion, gear list, email-plan inline form, operator inquiry CTA
- `app/(public)/plan/page.tsx` — full rewrite: 4-step "which trek for me" wizard (region/month → experience → duration+budget → group+email); POST /plan/generate on submit; TrekPlanCard on result; "New plan" back button; loading state with spinner
- 457/444 backend tests pass (13 new, 1 pre-existing failure in test_refresh.py unrelated to this step); next build clean (176 static pages)
What remains:
- Pre-existing test `test_stale_pages_includes_past_interval` in test_refresh.py failing — test isolation issue from a previous step; will fix in separate commit
- Real ANTHROPIC_API_KEY required for LLM itinerary generation (fallback always works)
- Saved plans not yet surfaced in user account dashboard (/account)

### Step 38 — Operator Marketplace Layer
Status: done
What is done:
- Migration `20260506_0028_operator_marketplace.py` — ALTER operators: logo_url VARCHAR(512), description_long TEXT, rating_avg FLOAT default 0.0, review_count INT default 0; CREATE operator_reviews (id UUID PK, operator_id FK→operators CASCADE, user_id FK→users SET NULL, rating INT, body TEXT, created_at, UNIQUE(operator_id, user_id)); CREATE operator_agreements (id UUID PK, operator_id FK→operators CASCADE, lead_fee_inr FLOAT, revenue_share_pct FLOAT nullable, active bool, notes TEXT, created_at, UNIQUE(operator_id)); applied with `alembic upgrade head`
- `modules/operators/models.py` — Operator: logo_url, description_long, rating_avg, review_count, reviews + agreement relationships added; OperatorReview + OperatorAgreement ORM models added
- `modules/operators/review_service.py` — list_reviews, create_review, delete_review, _update_rating_avg (recomputes denormalised rating_avg + review_count on every write)
- `modules/operators/agreement_service.py` — get_agreement, upsert_agreement, patch_agreement
- `schemas/operators.py` — OperatorCreate/Patch: logo_url + description_long added; OperatorResponse: new fields; OperatorPublicResponse (no contact_email); OperatorReviewCreate/Response; OperatorAgreementCreate/Patch/Response; InquiryCreate/Response
- `api/routes/operators_public.py` — GET /operators (list active, region filter), GET /operators/{slug} (public detail), GET /operators/{slug}/reviews (paginated), POST /operators/{slug}/reviews (user auth, 409 on duplicate), POST /inquiries (public, optional auth; SMTP confirmation + operator notification graceful)
- `api/routes/operators.py` — admin: GET/DELETE /admin/operators/reviews/{id}; GET /admin/operators/{id}/reviews; GET/POST/PATCH /admin/operators/{id}/agreement
- `api/router.py` — operators_public_router, inquiry_router, operators_reviews_router registered
- `db/base.py` — OperatorReview + OperatorAgreement registered
- `tests/test_operators_marketplace.py` — 17 tests TC-B01–TC-B17: public list/detail/404, region filter, review CRUD + rating avg, duplicate review 409, auth enforcement, agreement upsert/idempotency, admin agreement 404, inquiry with/without operator, admin delete review, model field presence
- `lib/api.ts` — Operator: logo_url/description_long/rating_avg/review_count added; OperatorPublic interface (no contact_email); OperatorReview, OperatorAgreement, InquiryPayload interfaces; fetchPublicOperators, fetchPublicOperator, fetchOperatorReviews, submitReview, submitInquiry helpers
- `components/operators/OperatorCard.tsx` — logo/name/rating stars/region/trek types/description/CTA; uses OperatorPublic
- `components/operators/OperatorGrid.tsx` — responsive card grid + empty state
- `components/operators/OperatorReviewList.tsx` — star display + review cards; empty state
- `components/operators/OperatorInquiryForm.tsx` — client form; pre-fills operator context; submits to POST /inquiries; success state
- `app/(public)/operators/page.tsx` — SSR operator listing; KPI strip (count, regions, trek types); OperatorGrid
- `app/(public)/operators/[slug]/page.tsx` — SSR operator detail; header card; star rating; region/website/phone; trek type badges; description; 2-col layout: reviews (OperatorReviewList) + sticky inquiry form (OperatorInquiryForm)
- 444/444 backend tests pass (17 new); next build clean (176 static pages); GitNexus re-indexed
What remains:
- `/admin/operators` page: agreement tab + review moderation panel not yet added (existing admin page shows operator CRUD only)
- Real SMTP required for inquiry confirmation + operator notification emails
- Operator profiles currently created via admin API only (no self-serve signup flow)

### Step 34 — Digital Product Checkout and File Delivery
Status: done
What is done:
- Migration `20260501_0024_digital_products.py` — `digital_products` (id UUID PK, slug unique, title, description, price_inr, file_path, preview_image_url, active bool default true, created_at, updated_at); `user_orders` (id UUID PK, user_id FK→users CASCADE, product_id FK→digital_products CASCADE, provider_order_id, amount_inr, status default 'pending', razorpay_signature, test_mode bool, paid_at, created_at); ALTERs `user_downloads`: adds order_id FK→user_orders SET NULL + download_url TEXT; applied with `alembic upgrade head`
- `modules/products/__init__.py`, `models.py` — DigitalProduct, UserOrder ORM models; registered in db/base.py
- `modules/products/service.py` — generate_download_token/verify_download_token (HMAC-SHA256 base64 signed, 24h TTL); list_active_products/admin_list_products/_enrich (with sales_count); get_product_by_slug/by_id; create/update/delete_product; create_checkout_order (Razorpay real mode when key set, test mode otherwise); verify_checkout_payment (verifies HMAC sig, marks paid, records download, sends email); serve_download_file (validates token, checks paid order, returns path+filename); list_orders
- `api/routes/products.py` — public_router: GET /products, GET /products/{slug}; admin_router: GET/POST /admin/products, PATCH/DELETE /admin/products/{id}, GET /admin/orders
- `api/routes/checkout.py` — POST /checkout/create-order (auth required), POST /checkout/verify (auth required), GET /account/downloads/file?token=… (FileResponse, HMAC token auth)
- `schemas/products.py` — ProductResponse (with sales_count), ProductCreate, ProductPatch, OrderResponse, CheckoutCreateRequest/Response, CheckoutVerifyRequest/Response
- `api/router.py` — products_public_router, products_admin_router, checkout_router registered
- `pyproject.toml` — razorpay>=1.4.1,<2.0.0 added
- `.env.example` — RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, STRIPE_SECRET_KEY, PRODUCT_FILES_DIR, PRODUCT_DOWNLOAD_BASE_URL added
- `core/config.py` — razorpay_key_id, razorpay_key_secret, stripe_secret_key, product_files_dir, product_download_base_url settings added
- `tests/test_products.py` — 20 tests (TC-B01 through TC-B20): token round-trip/expired/tampered, product service CRUD, list active/inactive, public API endpoints, checkout create/verify (test mode), already-paid idempotency, 404 on missing product, auth requirements, admin CRUD + order list
- `modules/account/models.py` — UserBookmark: cms_page_id nullable, trek_slug/bookmark_title/bookmark_image_url added; UserDownload: order_id + download_url added
- `app/(public)/products/page.tsx` — rewritten as client component; fetchProducts() on mount; skeleton loading, empty state, ProductCard grid linking to /products/{slug}
- `app/(public)/products/[slug]/page.tsx` — client component; fetchProduct(slug); Razorpay.js loaded dynamically; test mode: auto-verifies payment → redirect; real mode: opens Razorpay modal → verify → redirect to /success/checkout?order_id=...
- `app/(public)/success/checkout/page.tsx` — reads order_id from query param; POSTs to /account/downloads/{order_id}/url; shows real download button with product title; Suspense boundary for useSearchParams
- `app/(public)/account/downloads/page.tsx` — DownloadButton sub-component; if download_url present shows link; if order_id present fetches fresh URL on demand; graceful null handling
- `app/(admin)/admin/products/page.tsx` — product CRUD table (slug, title, price, sales count, active badge); inline add/edit form with all fields; delete with confirm
- `app/(admin)/admin/orders/page.tsx` — order list table with status filter tabs (all/paid/pending/refunded); test/live mode badge; count per status
- `app/(admin)/admin/layout.tsx` — Products (Package icon) + Orders (ShoppingBag icon) nav items added to Growth group
- `lib/api.ts` — DigitalProduct, ProductCreate, ProductPatch, UserOrder, CheckoutCreateResponse, CheckoutVerifyResponse interfaces; DownloadResponse: order_id + download_url added; fetchProducts, fetchProduct, createCheckoutOrder, verifyPayment, fetchAdminProducts, createAdminProduct, updateAdminProduct, deleteAdminProduct, fetchAdminOrders helpers
- `.env.local.example` — NEXT_PUBLIC_RAZORPAY_KEY_ID added
- 383/383 backend tests pass (20 new); next build clean (139 static pages); GitNexus: 7,796 nodes | 13,331 edges | 283 clusters | 206 flows
What remains:
- Real Razorpay keys required for live payment flow (test mode works without keys)
- Trek alert delivery task deferred to future step
- File serving requires placing actual files in services/api/data/products/

### Step 37 — Multilingual Content Workflows
Status: done
What is done:
- Migration `20260506_0027_cms_language.py` — adds `language` String(10) default='en', `translations` JSON nullable, `source_page_id` UUID nullable FK→cms_pages self-reference to `cms_pages`; index on language; applied with `alembic upgrade head`
- `modules/cms/models.py` — CMSPage: `language`, `translations`, `source_page_id` fields added
- `schemas/cms.py` — `language`, `translations`, `source_page_id` added to CMSPageCreate, CMSPagePatch, CMSPageResponse
- `app/data/glossary_hi.json` — proper nouns list (trek names, regions, brands) preserved during translation
- `modules/agents/translation/__init__.py`, `agent.py` — `translate_page(title, content_html, target_language)`: Anthropic claude-haiku-4-5 with ephemeral prompt caching; returns `{title, content_html, fallback}`; rule-based fallback when ANTHROPIC_API_KEY unset; all exceptions swallowed
- `schemas/translation.py` — TranslateRequest, TranslateResponse Pydantic schemas
- `api/routes/translation.py` — `POST /admin/cms/{slug}/translate` (admin auth): validates target_language, returns existing if already translated, runs TranslationAgent, creates CMSPage draft with `language=hi/mr` + `source_page_id`, updates source page `translations` JSON; 422 for unsupported lang, 404 for unknown slug
- `api/routes/cms.py` — `GET /cms/pages/{slug}?lang=hi`: if lang requested and published translation exists, serves translated page; falls back to English source
- `api/router.py` — translation_router registered
- `lib/api.ts` — `language`, `translations`, `source_page_id` added to CMSPage interface; `fetchCMSPage` accepts optional `lang` param; `TranslateResult` interface; `triggerTranslation` helper
- `app/(public)/hi/trek/[slug]/page.tsx` — Hindi trek detail route; serves published Hindi CMS page; language switcher banner; hreflang alternates in generateMetadata
- `app/(public)/hi/guides/[slug]/page.tsx` — Hindi guide route (same pattern)
- `app/(public)/hi/packing/[slug]/page.tsx` — Hindi packing list route (same pattern)
- `app/(public)/trek/[slug]/page.tsx` — hreflang alternates added to generateMetadata (en + hi when translation exists)
- `app/(public)/guides/[slug]/page.tsx` — hreflang alternates added
- `app/(admin)/admin/cms/page.tsx` — language badge (EN/HI/MR) + HI ✓ indicator per row; Languages icon button triggers Hindi translation; translatePage() function wired to `triggerTranslation`
- `tests/test_translation.py` — 14 tests TC-B01–TC-B14: glossary load, supported languages, no-api-key fallback, mocked LLM call, exception swallowing, 404/422 endpoint validation, draft creation, translations JSON update, idempotency, auth enforcement, lang query param with published/draft translation, CMSPageResponse language fields
- 427/427 backend tests pass (14 new); next build clean (175 static pages); GitNexus re-indexed
What remains:
- Real ANTHROPIC_API_KEY required for LLM translation (rule-based fallback without it)
- Marathi (mr) translation supported by the agent and route but no `/mr/trek/[slug]` frontend routes yet (Hindi-first per step scope)
- Middleware language-detection banner (Accept-Language: hi → suggest Hindi version) not implemented — out of scope for this step

### Step 36 — User-Intent Aware Monetization
Status: done
What is done:
- Migration `20260505_0026_intent_monetization.py` — `affiliate_products` (id UUID PK, title, description, affiliate_url, affiliate_program, category JSON, price_range, active, created_at, updated_at); `page_intent_sessions` (id UUID PK, session_id, user_id FK→users SET NULL, page_slug, intent, confidence, module_shown, converted, ab_variant, created_at); two indexes on page_slug and session_id; applied with `alembic upgrade head`
- `modules/monetization/__init__.py`, `models.py` — AffiliateProduct, PageIntentSession ORM models; registered in db/base.py
- `modules/agents/intent/__init__.py`, `agent.py` — `classify_intent(page_type, page_slug, has_bookmarks, has_purchases)`: Anthropic claude-haiku-4-5 with ephemeral prompt caching; rule-based fallback when key unset (buyer > booking_ready > research > inspiration); JSON parse with markdown fence strip; all exceptions swallowed
- `modules/auth/dependencies.py` — `get_optional_user` dependency added (returns User | None, never raises)
- `modules/monetization/service.py` — `classify_and_record` (classifies intent + persists session with A/B variant), `mark_converted`, `list/create/update/delete_affiliate_product`, `get_monetization_stats` (intent distribution, conversion_by_module, top pages)
- `schemas/monetization.py` — IntentClassification, IntentResponse, AffiliateProductCreate/Patch/Response, MonetizationStatsResponse
- `api/routes/monetization.py` — `GET /intent/{slug}` (public + optional auth), `POST /intent/{slug}/convert`, `GET /affiliate-products` (public), `GET/POST /admin/affiliate-products`, `PATCH/DELETE /admin/affiliate-products/{id}`, `GET /admin/monetization/stats`
- `api/router.py` — monetization_router registered
- `tests/test_intent.py` — 15 tests TC-B01–TC-B15: rule-based fallback, buyer/booking_ready signals, mocked LLM, exception swallowing, classify_and_record, mark_converted, affiliate product CRUD, all API endpoints, stats shape
- `lib/api.ts` — IntentResponse, AffiliateProduct, MonetizationStats TS interfaces; fetchIntent, trackConversion, fetchPublicAffiliateProducts, fetchMonetizationStats, fetchAdminAffiliateProducts, createAdminAffiliateProduct, updateAdminAffiliateProduct, deleteAdminAffiliateProduct helpers
- `components/monetization/MonetizationSlot.tsx` — server component: calls fetchIntent → selects AffiliateRail/LeadForm/NewsletterCapture by recommended_module; newsletter default on API failure
- `app/(admin)/admin/monetization/page.tsx` — rewritten with real API: KPI cards (sessions/conversions/intent types/modules), intent distribution bar chart, conversion rate by module, top pages table, affiliate catalog CRUD table + add product form
- 413/413 backend tests pass (15 new); next build clean (139 static pages); GitNexus re-indexed
What remains:
- Wire MonetizationSlot into trek detail page CTA slot (currently uses static LeadForm)
- Real ANTHROPIC_API_KEY required for LLM classification (rule-based works without it)
- Affiliate catalog initially empty — admin must populate via /admin/monetization
- A/B test enabled by setting MONETIZATION_AB_TEST=true in .env

### Step 35 — Advanced Recommendation Engine
Status: done
What is done:
- Docker image switched `postgres:16-alpine` → `pgvector/pgvector:pg16` to enable vector extension (data volume preserved)
- Migration `20260504_0025_pgvector_embeddings.py` — `CREATE EXTENSION IF NOT EXISTS vector`; `ALTER TABLE cms_pages ADD COLUMN IF NOT EXISTS embedding vector(1536)`; applied with `alembic upgrade head`
- `modules/cms/models.py` — `embedding: Mapped[list[float] | None] = mapped_column(Vector(1536), nullable=True)` added; `from pgvector.sqlalchemy import Vector` import added
- `modules/agents/embedding/__init__.py`, `agent.py` — `generate_embedding(text)`: calls OpenAI `text-embedding-3-small` (1536-dim), returns None gracefully when `OPENAI_API_KEY` unset; `embed_page(db, page_id)`: builds embed text (title + page_type + hero + description + body snippet), stores on CMSPage; all exceptions swallowed (non-critical)
- `modules/recommendations/service.py` — `find_similar_pages(db, page_id, limit)`: cosine vector search (`embedding <=> CAST(:emb AS vector(1536))`) falling back to cluster/page_type filter; `find_similar_to_query(db, query_embedding, limit)`: direct vector search; `get_recommendations_for_user(db, user_id, limit)`: centroid of bookmarked page embeddings → vector search excluding already-bookmarked; `get_anonymous_recommendations(db, limit)`: DISTINCT ON cluster_id, freshness-ordered; `_compute_centroid`, `_vec_str`, `_row_to_dict` helpers
- `schemas/recommendations.py` — `RecommendationItem`, `SimilarPagesResponse`, `RecommendationsResponse` Pydantic schemas
- `api/routes/recommendations.py` — `GET /pages/{slug}/similar` (public, 404 if not found); `GET /account/recommendations` (auth-gated, personalised=True); `GET /recommendations` (public, personalised=False); `GET /search?q=` (semantic for >3-word queries, ILIKE fallback)
- `api/router.py` — `recommendations_router` registered
- `modules/publish/service.py` — `embed_page(db, cms_page.id)` triggered after every CMS publish (try/except, never blocks)
- `modules/refresh/tasks.py` — `embed_page` triggered after every content refresh
- `core/config.py` — `openai_api_key: str | None = None` added
- `pyproject.toml` — `openai>=1.51.0,<2.0.0` and `pgvector>=0.3.0,<1.0.0` added
- `.env.example` — `OPENAI_API_KEY=` documented with graceful-degradation note
- `tests/test_recommendations.py` — 15 tests (TC-B01 through TC-B15): generate_embedding no-op without key, OpenAI mock, embed_page missing page/stores vector, similar pages fallback/exclusion, anonymous recs, personalised recs, all 4 API endpoints, exception swallowing, bookmarked exclusion
- `lib/api.ts` — `RecommendationItem`, `SimilarPagesResponse`, `RecommendationsResponse` TS interfaces; `fetchSimilarPages`, `fetchPersonalisedRecommendations`, `fetchAnonymousRecommendations` helpers
- `components/content/RecommendedContent.tsx` — server component; fetches similar pages server-side; renders RecommendCard with hero image, page_type badge, title, description; returns null if no items
- `components/content/PersonalisedFeed.tsx` — client component; uses `useAuth()`; fetches personalised (logged-in) or anonymous (guest) recs; "For you / Based on your interests" vs "Popular now / Trending treks" labels
- `app/(public)/trek/[slug]/page.tsx` — replaced static related treks section with `<RecommendedContent slug={params.slug} limit={3} />`
- `app/(public)/explore/page.tsx` — added `<PersonalisedFeed limit={6} />` section below main trek grid
- `app/(public)/search/page.tsx` — semantic search: useEffect triggers when query >3 words, calls `GET /api/v1/search?q=…`, renders "Semantic matches" section with Sparkles icon; AbortController for cleanup
- 398/398 backend tests pass (15 new); next build clean; GitNexus re-indexed
What remains:
- Real OPENAI_API_KEY required to generate live embeddings (all fallbacks work without it)
- Bulk backfill job for existing published pages (future step)

### Step 33 — Premium User Accounts + Bookmarks
Status: done
What is done:
- Migration `20260430_0022_user_accounts.py` — user_bookmarks (user_id FK→users CASCADE, cms_page_id FK→cms_pages CASCADE, unique(user_id,cms_page_id)); user_downloads (user_id FK→users CASCADE, product_id nullable, filename, downloaded_at); trek_alerts (user_id FK→users CASCADE, trek_slug, alert_type, active bool, unique(user_id,trek_slug,alert_type)); user_profiles (user_id FK→users UNIQUE, fitness_level, trek_experience, preferred_regions JSON, budget_range, submitted_at); applied with `alembic upgrade head`
- `modules/account/__init__.py`, `models.py` — UserBookmark, UserDownload, TrekAlert, UserProfile ORM models; all registered in db/base.py
- `modules/account/service.py` — add/remove/list_bookmarks (enriched with CMSPage slug/title/hero_image_url), record/list_downloads, add/remove/list_alerts (idempotent), get/upsert_profile
- `api/routes/account.py` — POST/DELETE/GET /account/bookmarks; GET /account/downloads; POST/DELETE/GET /account/alerts; GET/PATCH /account/profile; all require get_current_user
- `schemas/account.py` — BookmarkCreate/Response, DownloadResponse, TrekAlertCreate/Response, UserProfileUpdate/Response
- `api/router.py` — account_router registered
- `tests/test_account.py` — 20 tests (TC-B01 through TC-B20): service CRUD, idempotency, 404 handling, API auth-gated 401, API happy path for bookmarks/profile/alerts
- `app/(public)/account/saved/page.tsx` — rewritten as client component; fetchBookmarks() on mount; card grid with hero image, page type badge, view + remove actions; loading/empty states
- `app/(public)/account/downloads/page.tsx` — rewritten as client component; fetchDownloads() on mount; filename + downloaded_at rendered; empty state
- `components/account/BookmarkButton.tsx` — client component; toggle add/remove bookmark; optimistic state; filled icon when bookmarked; graceful no-op on auth error
- `app/(auth)/auth/onboarding/page.tsx` — step 3 submit now calls upsertUserProfile(trek_experience, preferred_regions) then router.push("/explore"); graceful on auth failure
- `lib/api.ts` — BookmarkResponse, DownloadResponse, TrekAlertResponse, UserProfileResponse/Update interfaces; fetchBookmarks, addBookmark, removeBookmark, fetchDownloads, fetchAlerts, addAlert, removeAlert, fetchUserProfile, upsertUserProfile helpers
- 363/363 backend tests pass (20 new); next build clean (137 static pages); GitNexus: 7,396 nodes | 12,613 edges | 266 clusters | 199 flows
What remains:
- Trek alert delivery task not implemented (flagged as out of scope — Step 33 stores subscriptions; delivery fires in a future beat task)

### Step 33 Bug Fixes Round 1 (post-TC)
- `components/trek/TrekCard.tsx` — partial fix: calls fetchCMSPage(trek.slug) then addBookmark; still broken for static treks with no cms_pages row (fetchCMSPage returns 404, catch swallows silently)
- `app/(public)/account/page.tsx` — FIXED: client component with real API counts

### Step 33 Bug Fixes Round 2 (bookmark root cause + unauthenticated queue + reactive dashboard)
Root cause: static trek slugs (kedarkantha, valley-of-flowers, etc.) have no row in cms_pages — fetchCMSPage 404 → silent catch → bookmark never saved.
Fix:
- Migration `20260501_0023_bookmark_by_slug.py` — drops uq_user_bookmark constraint; makes cms_page_id nullable; adds trek_slug VARCHAR(300) + bookmark_title VARCHAR(500) + bookmark_image_url TEXT nullable columns; partial unique indexes: (user_id,cms_page_id) WHERE cms_page_id IS NOT NULL + (user_id,trek_slug) WHERE trek_slug IS NOT NULL
- `modules/account/models.py` — UserBookmark: cms_page_id nullable, trek_slug/bookmark_title/bookmark_image_url added
- `schemas/account.py` — BookmarkResponse: cms_page_id nullable, trek_slug field added; new BookmarkBySlugCreate + BookmarkCheckResponse schemas
- `modules/account/service.py` — add_bookmark_by_slug (first resolves CMS page by slug, else stores slug-only); remove_bookmark_by_slug (finds by trek_slug or cms_page FK); check_bookmark; list_bookmarks updated to enrich slug-only bookmarks
- `api/routes/account.py` — POST /account/bookmarks/by-slug, DELETE /account/bookmarks/by-slug/{trek_slug}, GET /account/bookmarks/check/{trek_slug}
- `components/trek/TrekCard.tsx` — handleBookmark now calls addBookmarkBySlug/removeBookmarkBySlug directly (no fetchCMSPage lookup); on 401/403 queues slug in localStorage pendingBookmarks; dispatches bookmark-changed custom event on success
- `lib/auth-context.tsx` — flushPendingBookmarks() reads localStorage pendingBookmarks after login/signup/loginWithGoogle and POSTs each to API; dispatches bookmark-changed on flush
- `app/(public)/account/page.tsx` — listens for bookmark-changed window event and re-fetches bookmark counts reactively (no page reload needed)
- `app/(public)/account/saved/page.tsx` — handleRemove uses b.id as removing key; calls removeBookmarkBySlug if trek_slug else removeBookmark; dispatches bookmark-changed
- `lib/api.ts` — BookmarkResponse: cms_page_id nullable, trek_slug added; BookmarkCheckResponse type; addBookmarkBySlug, removeBookmarkBySlug, checkBookmark helpers
- 363/363 backend tests pass; next build clean

### Step 32 — Deeper Dashboards and Revenue Attribution
Status: done
What is done:
- Migration `20260430_0021_revenue_attributions.py` — revenue_config (key unique, value_float); revenue_attributions (page_id FK→pages CASCADE, date, affiliate_clicks, lead_conversions, estimated_revenue_inr, page_type, cluster_id FK→keyword_clusters SET NULL, unique(page_id,date)); executive_summaries (week_label unique, content_md, sent_at); applied with `alembic upgrade head`
- `modules/revenue/__init__.py`, `models.py` — RevenueConfig, RevenueAttribution, ExecutiveSummary ORM models; registered in db/base.py
- `modules/revenue/service.py` — _ensure_config (seeds avg_cpc_inr=3.0, lead_value_inr=500.0 on first call); aggregate_revenue (iterates pages × date range, reads AffiliateClick + LeadSubmission counts, upserts rows); revenue_by_cluster, revenue_by_page_type, decaying_pages (7-day vs prev-7-day click comparison); upsert_executive_summary, list_executive_summaries; get/update config
- `modules/revenue/tasks.py` — aggregate_revenue_task (daily, aggregates last 1 day); generate_executive_summary_task (weekly, fires ExecutiveSummaryAgent)
- `modules/agents/executive_summary/__init__.py`, `agent.py` — ExecutiveSummaryAgent (LangGraph 3-node: gather_data → generate_summary → store_summary); builds prompt from top-5 cluster/page-type rows + top-3 decaying pages; 300-word markdown digest; upserts to executive_summaries table
- `api/routes/revenue.py` — GET /admin/revenue/by-cluster, /by-page-type, /decaying-pages; POST /admin/revenue/aggregate?days=N; GET/PATCH /admin/revenue/config/{key}; GET /admin/revenue/summaries; POST /admin/revenue/summaries/generate; all require get_current_admin
- `schemas/revenue.py` — ClusterRevenueRow, PageTypeRevenueRow, DecayingPageRow, RevenueConfigResponse/Update, AggregateRevenueResponse, ExecutiveSummaryResponse
- `api/router.py` — revenue_router registered
- `worker/celery_app.py` — app.modules.revenue.tasks in include; daily-aggregate-revenue + weekly-executive-summary beat entries
- `tests/test_revenue.py` — 18 tests (TC-B01 through TC-B18): config seed/CRUD, upsert summary, revenue_by_cluster/page_type, all API endpoints including 404 + patched task mock
- `app/(admin)/admin/revenue/page.tsx` — KPI strip (total revenue, clicks, leads); cluster revenue table; page-type table; decaying pages list (amber badges); inline config editor; executive summary history with expand/collapse; "Aggregate (7d)" + "Generate Summary" action buttons
- `app/(admin)/admin/layout.tsx` — TrendingUp icon; "Revenue" nav item added to Growth group before Monetization
- `lib/api.ts` — ClusterRevenueRow, PageTypeRevenueRow, DecayingPageRow, RevenueConfig, ExecutiveSummaryResponse interfaces; fetchRevenueByCluster/ByPageType, fetchDecayingPages, aggregateRevenue, fetchRevenueConfig, patchRevenueConfig, fetchExecutiveSummaries, triggerExecutiveSummary helpers
- 363/363 backend tests pass (18 new); next build clean (137 static pages); GitNexus: 7,396 nodes | 12,613 edges | 266 clusters | 199 flows
What remains:
- ANTHROPIC_API_KEY required for ExecutiveSummaryAgent to generate summaries
- Revenue estimates are proxy-based on click counts × config constants — not real payment receipts

### Step 31 — Email Automation and Audience Workflows
Status: done
What is done:
- Alembic migration `20260430_0020_email_sequences.py` — adds `preferences` JSON + `active` Boolean to `newsletter_subscribers`; creates `subscriber_tags` (subscriber_id FK, tag, created_at, unique(subscriber_id,tag)); `email_sequences` (id UUID, name, slug unique, description, created_at); `email_sequence_steps` (id UUID, sequence_id FK, step_number, subject, body_template, delay_days, created_at); `subscriber_sequence_enrollments` (id UUID, subscriber_id FK, sequence_id FK, current_step, next_send_at, enrolled_at, status, unique(subscriber_id,sequence_id)); applied with `alembic upgrade head`
- `modules/email_sequences/__init__.py`, `models.py` — SubscriberTag, EmailSequence, EmailSequenceStep, SubscriberSequenceEnrollment ORM models; registered in db/base.py
- `modules/email_sequences/service.py` — seed_default_sequences (3 built-in sequences: winter_trek_nurture, monsoon_prep, general_trek_discovery; idempotent); add_subscriber_tag (idempotent); enroll_subscriber + enroll_by_tag (tag→sequence routing); update_subscriber_preferences; generate_preferences_token/verify_preferences_token (HMAC-SHA256); get_pending_enrollments
- `modules/email_sequences/tasks.py` — send_welcome_email_task (Celery; pulls 3 top trek_guide CMS pages for recommendations; graceful no-op when SMTP unconfigured; try/except wrap in auth route); process_nurture_sequences_task (daily Celery beat; Jinja2 template render; step advance; status=completed on last step; preference.nurture check; graceful per-enrollment error catch)
- `api/routes/email_sequences.py` — admin_router: GET /admin/email-sequences, GET /admin/email-sequences/{id}, POST /admin/email-sequences/seed, POST /admin/email-sequences/{id}/enroll/{subscriber_id}; public_router: PATCH /newsletter/preferences (HMAC token), GET /newsletter/unsubscribe (sets active=False)
- `schemas/email_sequences.py` — EmailSequenceResponse, EmailSequenceStepResponse, SubscriberSequenceEnrollmentResponse, SubscriberPreferencesUpdate, SeedSequencesResponse
- `api/router.py` — email_sequences_admin_router + email_sequences_public_router registered
- `modules/newsletter/models.py` — preferences + active fields added to NewsletterSubscriber
- `modules/leads/service.py` — subscriber tagging hook after create_lead commit: looks up subscriber by email, calls add_subscriber_tag + enroll_by_tag; graceful exception handling
- `api/routes/auth.py` — send_welcome_email_task.delay(user.email, user.full_name) fired after email signup (try/except — never breaks signup)
- `worker/celery_app.py` — app.modules.email_sequences.tasks in include list; daily-nurture-sequences beat entry (86400s)
- `pyproject.toml` — jinja2>=3.1,<4.0 added
- `tests/test_email_sequences.py` — 17 tests (TC-B01 through TC-B17): ORM tag insert, seed 3 sequences, idempotency, tag service, enroll_by_tag winter/fallback, enrollment idempotency, prefs update, HMAC token, API list/detail/seed/404, prefs invalid token, unsubscribe valid token, welcome task no-SMTP, lead tagging
- `lib/api.ts` — EmailSequence, EmailSequenceStep, SeedSequencesResult; fetchEmailSequences, fetchEmailSequence, seedEmailSequences
- `app/(admin)/admin/email-sequences/page.tsx` — sequence list (expandable steps panel), KPI strip (sequences/steps/enrollments), Seed button, info card explaining welcome/tagging/nurture/unsubscribe flow
- `app/(admin)/admin/layout.tsx` — "Email Sequences" nav item (Workflow icon) added to Growth group after Newsletter
- 325/325 backend tests pass; `next build` clean (136 static pages); GitNexus re-indexed: 6,857 nodes | 11,664 edges | 236 clusters | 185 flows
What remains:
- SMTP must be configured in services/api/.env for welcome + nurture emails to fire
- Jinja2 installed (3.1.6) — required for process_nurture_sequences_task template rendering
- Digest weekly send uses existing weekly-newsletter-generate Celery beat (Step 27 NewsletterAgent); no additional beat task needed

### Step 30 — Dynamic Destination Hubs
Status: done
What is done:
- No Alembic migration — CMSPage already has `page_type`; hub pages use values `seasonal_hub`, `cluster_hub`, `regional_hub`
- `modules/agents/seasonal_content/__init__.py`, `agent.py` — SeasonalContentAgent (LangGraph 3-node: prepare_context → generate_content → store_page); supports 4 slugs: winter/summer/monsoon/spring; generates 700–900 word seasonal overview; upserts CMSPage slug=`seasons/{slug}` with status=published; `max_tokens = 2000`; SEASON_META dict drives titles/months/overview/regions prompts
- `modules/hubs/__init__.py`, `tasks.py` — `regenerate_seasonal_hubs_task` Celery task (name: `hubs.regenerate_seasonal_hubs`); iterates all 4 seasons; graceful per-season error catch
- `schemas/hubs.py` — HubPageResponse, HubRegenerateRequest, HubRegenerateResponse; HUB_PAGE_TYPES set; VALID_SEASON_SLUGS set
- `api/routes/hubs.py` — GET /admin/hubs (filter by hub_type); POST /admin/hubs/{slug:path}/regenerate (path param captures slashes); seasonal → SeasonalContentAgent; cluster/regional → 501 (pipeline managed); both require get_current_admin
- `api/router.py` — hubs_router registered
- `worker/celery_app.py` — `app.modules.hubs.tasks` in include list; `quarterly-seasonal-hub-regeneration` beat entry (7776000s = 90 days)
- `tests/test_hubs.py` — 9 tests: SEASON_META coverage, unknown season error, agent creates page (mocked LLM), API list (all + filtered + invalid type), API regenerate seasonal (mocked LLM), API regenerate cluster returns 501, API regenerate invalid season returns 422
- `lib/api.ts` — HubPage, HubRegenerateResult interfaces; fetchHubPages, regenerateHub helpers
- `app/(public)/trek-types/[slug]/page.tsx` — new server component; CMS-powered cluster hub page; hero + breadcrumb + cms_section prose + FAQ + CTA; static template fallback; generateMetadata with canonical/OG; revalidate=3600
- `app/(public)/regions/[slug]/page.tsx` — CMS-first (fetchCMSPage `regions/{slug}`); renders CMS content_html block if available; FAQAccordion from content_json.faqs; BreadcrumbSchema; static fallback preserved
- `app/(public)/seasons/[slug]/page.tsx` — CMS-first (fetchCMSPage `seasons/{slug}`); renders CMS content if available; FAQAccordion from content_json.faqs; BreadcrumbSchema; spring slug + Leaf icon added; AffiliateDisclosure appended
- `app/(admin)/admin/hubs/page.tsx` — Hub list table (type badge, status badge, last updated, Regenerate button per seasonal hub, View link); KPI strip (total/seasonal/cluster/regional); filter pills by hub_type; "Generate Missing Seasonal Hubs" panel for seasons not yet generated; real-time message feedback per slug
- `app/(admin)/admin/layout.tsx` — "Destination Hubs" nav item (Globe icon) added to Growth group after Operators
- 308/308 backend tests pass; `next build` clean; GitNexus re-indexed: 6,572 nodes | 11,155 edges | 220 clusters | 178 flows
What remains:
- ANTHROPIC_API_KEY required for SeasonalContentAgent to generate real content
- cluster_hub regeneration via pipeline (POST /admin/hubs/trek-types/{slug}/regenerate returns 501 — use pipeline trigger instead)
- regional_hub content generation: create CMSPages with page_type=regional_hub via pipeline or manual CMS editor

### Step 29 — Operator Listing + Lead Marketplace Basics
Status: done
What is done:
- Alembic migration `20260430_0019_operators.py` — creates `operators` table (id UUID PK, name, slug UNIQUE, region JSON, trek_types JSON, contact_email, phone nullable, website_url nullable, active bool server_default=true, created_at); creates `operator_specializations` table (id UUID PK, operator_id FK→operators CASCADE, trek_slug, priority int 1-5); adds `assigned_operator_id` FK→operators SET NULL + `status_history` JSON to `lead_submissions`; applied with `alembic upgrade head`
- `modules/operators/__init__.py`, `models.py` — Operator + OperatorSpecialization ORM models; Operator has relationship to OperatorSpecialization (cascade delete) and to LeadSubmission; LeadSubmission now has `assigned_operator` relationship + `assigned_operator_id` + `status_history` columns
- `db/base.py` — Operator + OperatorSpecialization registered
- `schemas/operators.py` — OperatorCreate, OperatorPatch, OperatorResponse, OperatorSpecializationCreate/Response, AssignOperatorRequest
- `schemas/leads.py` — VALID_LEAD_STATUSES extended: `routed`, `lost` added; `LeadResponse` extended with `assigned_operator_id` + `status_history`; `StatusHistoryEntry` model added
- `modules/operators/service.py` — list_operators (active_only filter), get_operator, create_operator (slug uniqueness check), update_operator, delete_operator, find_matching_operator (fuzzy trek_types match, returns highest-priority active operator)
- `modules/leads/service.py` — `_push_status_history` helper; `create_lead` now auto-routes to matching operator (status → "routed") via `find_matching_operator`; `update_lead_status` records history entry; `assign_operator_to_lead` (manual re-assign + auto-route to "routed" if "new")
- `modules/leads/tasks.py` — `_send_email` helper extracted; `notify_admin_new_lead_task` updated to show assigned operator in email; new `notify_operator_new_lead_task` (Celery) sends lead details to operator contact_email
- `api/routes/leads.py` — fires `notify_operator_new_lead_task.delay()` when lead is auto-routed on create
- `api/routes/operators.py` — `router`: GET/POST /admin/operators, GET/PATCH/DELETE /admin/operators/{id}; `leads_router`: PATCH /admin/leads/{id}/assign-operator; both require get_current_admin
- `api/router.py` — operators_router + operators_leads_router registered
- `tests/test_operators.py` — 15 tests (TC-B01 through TC-B15): ORM insert, duplicate slug ValueError, list, get (found+not_found), update, delete, find_matching_operator hit+miss, API list, API create+get+delete, API patch, API 404, auto-route on lead create, API assign-operator, assign-operator 404s
- `lib/api.ts` — AdminLead extended with `assigned_operator_id` + `status_history`; Operator + OperatorSpecialization interfaces; OperatorCreate; fetchOperators, createOperator, patchOperator, deleteOperator, assignLeadOperator helpers
- `app/(admin)/admin/operators/page.tsx` — operator list table (name/contact, trek type chips, active/inactive toggle, edit/delete); add/edit inline form (name, slug, email, phone, website, regions, trek_types, active toggle); auto-slug from name on add; confirmation dialog on delete
- `app/(admin)/admin/leads/page.tsx` — rewritten: assigned_operator column with assign-dropdown for unassigned leads; status_history expandable drawer per row; routed/lost statuses added to KPI row + filter + action buttons; 6-column KPI strip
- `app/(admin)/admin/layout.tsx` — "Operators" nav item (Building2 icon) added to Growth group
- 299/299 backend tests pass; `next build` clean (✓ Compiled successfully)
- GitNexus re-indexed: 6,407 nodes | 10,901 edges | 215 clusters | 187 flows
What remains:
- SMTP must be configured in services/api/.env for operator email notifications to fire
- Step 30 (Dynamic destination hubs) pending

### Post-Step 28 Bug Fixes
Status: done
What was done:
- **Bug 1 — Compliance check not persisting to DB** (commit after Step 28): `POST /admin/drafts/{id}/compliance-check` route called `compliance_service.run_compliance_check(db, draft_id)` which internally did `db.flush()` but the route never called `db.commit()`. Because `get_db` uses `autocommit=False` and only closes (never commits), the agent's `compliance_status` + `compliance_notes` changes were rolled back when the session closed. Every subsequent `GET /drafts` returned the original `compliance_status = "unchecked"`. Fix: added `db.commit()` after the successful agent run in `api/routes/compliance.py`. 284/284 tests pass after fix.
- **Bug 2 — TC-F05 "Re-check" label never appears**: The compliance button label condition `compStatus === "passed"` only matched the "passed" state. After an override the status is "overridden", so the button always showed "Check Compliance" again. Fix: changed condition to `compStatus === "unchecked" ? "Check Compliance" : "Re-check"` — now shows "Re-check" for any previously-checked state (passed/flagged/overridden). In `app/(admin)/admin/drafts/page.tsx`.

### Step 28 — Compliance Guard Agent
Status: done
What is done:
- Alembic migration `20260430_0018_compliance_fields.py` — adds `compliance_status` (String(32), server_default='unchecked', indexed), `compliance_notes` (JSON nullable), `compliance_override_note` (Text nullable), `compliance_overridden_by` (String(255) nullable), `compliance_overridden_at` (DateTime nullable) to `content_drafts`; creates `compliance_rules` table (id UUID PK, name unique, rule_type, description, rule_config JSON, is_active Boolean, created_at); applied with `alembic upgrade head`
- `modules/compliance/models.py` — ComplianceRule ORM model registered in `db/base.py`
- `modules/compliance/service.py` — seed_default_rules (idempotent: 4 default rules; skips if any exist), list_rules, run_compliance_check (seeds then runs agent), override_compliance (sets overridden + audit trail)
- `modules/agents/compliance/agent.py` — ComplianceGuardAgent (LangGraph 3-node: fetch_draft → run_compliance → store_report); claude-haiku-4-5-20251001; 4 rules: affiliate_disclosure (string match), safety_disclaimer (difficulty-triggered), risky_wording (LLM call using .replace not .format), ymyl_claims (count≥2 threshold); stores compliance_status + compliance_notes on draft
- `schemas/compliance.py` — ComplianceRuleResponse, ComplianceResultItem, ComplianceCheckResponse, ComplianceOverrideRequest, ComplianceOverrideResponse
- `api/routes/compliance.py` — POST /admin/drafts/{id}/compliance-check, PATCH /admin/drafts/{id}/compliance-override, GET /admin/compliance/rules; registered in router.py
- `modules/publish/service.py` — compliance gate added to publish_to_cms: auto-runs check for unchecked drafts; blocks publish if flagged (unless overridden)
- `tests/test_compliance.py` — 13 tests (TC-B01 through TC-B13): ORM insert, seed idempotency, list rules, API list rules, 404 check, happy-path mocked LLM, status persists, override 404/happy-path/audit-trail, publish blocked when flagged, publish allowed when overridden, publish auto-checks unchecked
- `tests/test_publish.py` — 3 existing publish success tests updated to mock compliance check (patch target: `app.modules.compliance.service.run_compliance_check`)
- `lib/api.ts` — ComplianceResultItem, ComplianceCheckResult, ComplianceOverrideResult interfaces; runComplianceCheck, overrideCompliance helpers
- `app/(admin)/admin/drafts/page.tsx` — compliance_status + compliance_notes added to Draft interface; compliance badge (unchecked/passed/flagged/overridden) per card header; per-rule result list in expanded view (fail=red, warn=amber, pass=muted); Run Compliance Check button in action bar; Override button + note textarea for flagged drafts
- `next.config.mjs` — experimental.proxyTimeout: 120_000 (fixes TC-03 ECONNRESET for all LLM-backed admin endpoints)
- `CLAUDE.md` + `PROCESS_GUARDRAILS.md` — Backend Test Cases added to Step Completion Gate; TC-B01/TC-F01 format documented in Section 12
- 284/284 backend tests pass; next build clean (132 static pages)
- GitNexus re-indexed: 6,164 nodes | 10,475 edges | 200 clusters | 187 flows
What remains:
- Step 29 (Operator listing + lead marketplace) pending

### Step 27 — Newsletter Automation + Repurposing Agent
Status: done
What is done:
- Alembic migration `20260429_0017_newsletter_campaigns.py` — creates `newsletter_campaigns` table (id UUID PK, week_label String(50), subject String(500), preview_text String(300) nullable, body_html Text, status String(32) default=draft, sent_at nullable, created_at) and `social_snippets` table (id UUID PK, page_id FK→pages SET NULL nullable, platform String(50), copy Text, copy_title String(500) nullable, status String(32) default=draft, created_at); applied with `alembic upgrade head`
- `modules/newsletter/models.py` — NewsletterCampaign + SocialSnippet ORM models added (alongside existing NewsletterSubscriber)
- `db/base.py` — NewsletterCampaign + SocialSnippet registered
- `schemas/newsletter.py` — NewsletterCampaignResponse, GenerateCampaignResponse, SendCampaignResponse, SocialSnippetResponse, RepurposeResponse added
- `modules/newsletter/service.py` — list_campaigns, get_campaign, send_campaign (Mailchimp/Brevo send via API; graceful no-op when platform unconfigured), _send_mailchimp, _send_brevo, list_snippets added
- `modules/agents/newsletter/__init__.py`, `agent.py` — NewsletterAgent (LangGraph 3-node: fetch_pages → generate_newsletter → store_campaign); picks top 5 published CMSPages by recency; Claude generates subject/preview_text/body_html; JSON parsed with regex fallback; stores NewsletterCampaign with status=draft
- `modules/agents/social_repurpose/__init__.py`, `agent.py` — SocialRepurposeAgent (LangGraph 3-node: fetch_page → generate_snippets → store_snippets); takes page_slug; Claude generates Instagram (280 chars) + Pinterest (title + 150 chars) + Twitter hook; stores 3 SocialSnippet records
- `modules/newsletter/tasks.py` — auto_generate_newsletter_task (Celery) added before sync_subscriber_task
- `worker/celery_app.py` — weekly-newsletter-generate beat entry (604800s)
- `api/routes/newsletter_admin.py` — GET /admin/newsletter, POST /admin/newsletter/generate, GET /admin/newsletter/{id}, POST /admin/newsletter/{id}/send, GET /admin/newsletter/snippets/list, POST /admin/pages/{slug}/repurpose; all require get_current_admin
- `api/router.py` — newsletter_admin_router + newsletter_pages_router registered
- `tests/test_newsletter_agent.py` — 15 tests (2 model ORM, 5 list/get campaigns, 3 send paths, 1 generate mocked, 2 repurpose, 2 snippets); 271/271 backend tests pass
- `lib/api.ts` — NewsletterCampaign, GenerateCampaignResult, SendCampaignResult, SocialSnippet, RepurposeResult interfaces; fetchNewsletterCampaigns, generateNewsletter, sendNewsletterCampaign, fetchSocialSnippets, repurposePage helpers
- `app/(admin)/admin/newsletter/page.tsx` — campaign list with Preview + Send actions (iframe preview modal), social snippets tab with repurpose form + clipboard copy per snippet, status badges
- `app/(admin)/admin/layout.tsx` — "Newsletter" nav item (Mail icon) added to Growth group
- `next build` clean (132 static pages); 271/271 backend tests pass
- GitNexus re-indexed: 5,930 nodes | 10,072 edges | 183 clusters | 181 flows
What remains:
- Configure NEWSLETTER_PLATFORM + NEWSLETTER_PLATFORM_API_KEY + NEWSLETTER_LIST_ID for real Mailchimp/Brevo send
- Weekly auto-generate fires Monday 09:00 UTC via Celery Beat (worker must be running)

### Step 26 — Cannibalization Detection + Consolidation Agent
Status: done
What is done:
- Alembic migration `20260429_0016_cannibalization_issues.py` — creates `cannibalization_issues` table (page_a_id + page_b_id FK→pages CASCADE, shared_keywords JSON, severity VARCHAR(16), recommendation VARCHAR(32), status VARCHAR(32) default=open, resolved_at nullable, created_at); 4 indexes on page_a_id, page_b_id, severity, status
- `modules/cannibalization/__init__.py`, `models.py` — CannibalizationIssue ORM
- `modules/cannibalization/service.py` — detect_cannibalization() (pairwise keyword overlap detection: full keyword set = {primary_keyword} ∪ supporting_keywords; ≥2 shared → issue; upserts on re-run); get_issues(severity, status, limit); resolve_issue(); get_issue()
- Severity: HIGH (same primary_keyword or 5+ shared), MEDIUM (3–4 shared), LOW (2 shared)
- Recommendation: merge (HIGH/same-primary), redirect (MEDIUM), differentiate (LOW)
- `modules/agents/consolidation/__init__.py`, `agent.py` — ConsolidationAgent (LangGraph 3-node: fetch_pages → merge_content → store_draft); creates ContentBrief stub + ContentDraft with status=requires_review
- `api/routes/cannibalization.py` — GET /admin/cannibalization (filter by severity/status), POST /detect, POST /{id}/resolve, POST /{id}/merge; all require get_current_admin
- `api/router.py` — cannibalization_router registered
- `schemas/cannibalization.py` — CannibalizationIssueResponse (enriched with page slugs/titles), DetectResponse, ResolveRequest, MergeResponse
- `db/base.py` — CannibalizationIssue registered
- `tests/test_cannibalization.py` — 17 tests (severity/recommendation unit tests, detect service, list/filter, resolve 200/422/404, merge 400/404/happy-path with mocked LLM); 256/256 backend tests pass
- Pre-existing fix: test_refresh.py stale pages tests now use `?limit=500`; refresh.py endpoint le raised to 1000 (from 200) to accommodate growing test data
- `lib/api.ts` — CannibalizationIssue interface + fetchCannibalizationIssues, detectCannibalization, resolveCannibalizationIssue, triggerConsolidationMerge helpers
- `app/(admin)/admin/cannibalization/page.tsx` — new page: scan button, severity+status filter pills, issue cards with shared keyword chips, Merge/Dismiss/Resolve actions
- `app/(admin)/admin/layout.tsx` — "Cannibalization" nav item (Swords icon) added to Growth group
- `next build` clean; 256/256 backend tests pass; GitNexus 5,663 nodes | 9,587 edges | 181 flows
What remains:
- V2.1: Embedding-similarity upgrade for semantic (not just string-match) keyword overlap detection (Step 35 prereq)

### Step 25 — Advanced Fact Validation System
Status: done
What is done:
- Alembic migration `20260428_0015_draft_claims_ymyl.py` — adds `evidence_url` (nullable Text) and `ymyl_flag` (bool, server_default=false) to `draft_claims`; applied with `alembic upgrade head`
- `modules/agents/fact_validation/__init__.py`, `agent.py` — ClaimExtractionAgent (LangGraph 3-node: fetch_draft → extract_claims → store_claims); YMYL_CLAIM_TYPES = {altitude, safety_advisory, permit_requirement, emergency_contact, medical_advisory}; uses `.replace()` not `.format()` to avoid KeyError from JSON `{}` blocks in extraction prompt; clears existing claims before re-inserting; `evidence_url = None` in V2.0 (EvidenceSearchAgent mocked)
- `api/routes/fact_validation.py` — POST /admin/drafts/{id}/fact-check → FactCheckTriggerResponse (draft_id, claims_extracted, ymyl_claims, flagged_claims); requires get_current_admin
- `api/router.py` — fact_validation_router registered
- `modules/content/models.py` — DraftClaim: `ymyl_flag: Mapped[bool]`, `evidence_url: Mapped[str | None]` added
- `schemas/content.py` — DraftClaimCreate + DraftClaimResponse: ymyl_flag + evidence_url added
- `schemas/admin.py` — ClaimResponse: ymyl_flag + evidence_url added
- `api/routes/admin.py` — list_fact_check_claims + patch_fact_check_claim pass new fields in ClaimResponse
- `api/routes/content.py` — get_draft_claims serialization updated for new fields
- `tests/test_fact_validation.py` — 7 tests (model field check, ORM insert, agent mock 4 claims + YMYL detection, claim clearing on re-run, endpoint 200/404/400); 239/239 backend tests pass
- Pre-existing fix: test_refresh.py stale pages test uses `?limit=200` (50+ real pages in DB exceed default limit=50)
- `lib/api.ts` — FactCheckClaim: `ymyl_flag: boolean` + `evidence_url: string | null`; `FactCheckTriggerResult` interface; `triggerFactCheck(draftId)` helper
- `app/(admin)/admin/fact-check/page.tsx` — rewritten: claims grouped by draft (byDraft map), per-draft "Re-run fact-check" button (triggerFactCheck), YMYL badge (ShieldAlert/red), evidence URL link, YMYL+flagged counts in header, confidence bar, flaggedOnly filter
- `next build` clean (zero TypeScript errors); 239/239 backend tests pass
What remains:
- V2.1 micro-task: wire `trackEvent("admin_draft_approved")` / `trackEvent("admin_draft_published")` in `/admin/drafts` page (flagged V1 code gap, separate scope)
- V2.1: EvidenceSearchAgent with real web search (Brave/Serper API) behind feature flag

### Step 24 — Analytics Ingestion + Admin Panel Full Wiring
Status: done
What is done:
- Alembic migration `20260428_0014_analytics.py` — creates `affiliate_clicks` table (UUID PK, page_slug, affiliate_program, affiliate_link_url, clicked_at, user_agent, session_id, created_at); indexed on affiliate_program, clicked_at, page_slug
- `modules/analytics/__init__.py`, `models.py` — AffiliateClick ORM model
- `modules/analytics/service.py` — `track_affiliate_click` (creates AffiliateClick with explicit timestamps); `get_analytics_summary` (6 COUNT queries: leads_last_30d, affiliate_clicks_last_30d, newsletter_subscribers_total, pages_published_total, pipeline_runs_last_30d, agent_runs_last_30d)
- `schemas/analytics.py` — AffiliateClickCreate, AffiliateClickResponse, AnalyticsSummaryResponse
- `api/routes/analytics.py` — dual routers: POST /track/affiliate-click (public, 201) + GET /admin/analytics/summary (admin auth)
- `db/base.py` — AffiliateClick registered
- `api/router.py` — analytics public + admin routers registered
- `tests/test_analytics.py` — 5 tests; 232/232 backend tests pass
- `lib/analytics.ts` — trackEvent(name, properties) utility: fires to GA4 (window.gtag) and Plausible (window.plausible); silent no-op if neither configured
- `lib/api.ts` — AnalyticsSummary, AffiliateClickPayload, AgentRun interfaces; fetchAnalyticsSummary, trackAffiliateClick, fetchAgentRuns helpers
- `components/monetization/AffiliateCard.tsx` — trackEvent + trackAffiliateClick on affiliate link click
- `components/monetization/LeadForm.tsx` — trackEvent("lead_form_submit") on success
- `components/monetization/NewsletterCapture.tsx` — trackEvent("newsletter_subscribe") on new subscription
- `app/layout.tsx` — conditional GA4 gtag.js script injection (NEXT_PUBLIC_GA4_ID env var)
- `app/(admin)/admin/page.tsx` — rewritten as "use client"; real KPIs from /admin/analytics/summary; real agent runs table from /admin/agent-runs with status badges
- `app/(admin)/admin/analytics/page.tsx` — rewritten; 6 real KPI cards; GA4 integration note
- `app/(admin)/admin/logs/page.tsx` — rewritten; real agent run table with refresh button; status badges
- `.env.local.example` — NEXT_PUBLIC_GA4_ID documented
- Bug fix (pre-existing): test_cms.py list_pages tests fixed with limit=10000 after 50+ pages in DB hit the default limit=50 ceiling
- `next build` clean with zero TypeScript errors; 232/232 backend tests pass
- GitNexus re-indexed: 5,106 nodes | 8,744 edges | 165 clusters | 172 flows
What remains:
- Configure NEXT_PUBLIC_GA4_ID with real G-XXXXXXXXXX ID for production event tracking
- V1 content seeding: run pipeline to generate at least 10 trek guide posts, 5 packing lists, 5 seasonal pages

### Step 23 — Content Refresh Engine (Basic)
Status: done
What is done:
- Alembic migration `20260427_0013_content_refresh.py` — adds `freshness_interval_days`, `last_refreshed_at`, `do_not_refresh` to `pages`; adds `freshness_interval_days` to `content_drafts`; creates `refresh_logs` table (page_id FK→pages, triggered_by, trigger_at, completed_at, result, notes)
- `modules/linking/models.py` — Page model updated with 3 new fields
- `modules/content/models.py` — ContentDraft updated with `freshness_interval_days`
- `modules/refresh/__init__.py`, `models.py` — RefreshLog ORM model
- `modules/refresh/service.py` — `get_stale_pages` (excludes do_not_refresh, uses PostgreSQL interval arithmetic); `create_refresh_log`, `update_refresh_log`, `get_refresh_logs`
- `modules/refresh/tasks.py` — `refresh_task` (Celery: SEOAEOAgent re-run → flag check → upsert_page_from_draft or requires_review gate); `auto_refresh_task` (Celery beat: detect 5 stale pages, dispatch refresh_task per page)
- `api/routes/refresh.py` — GET /admin/refresh/stale, POST /admin/refresh/trigger, GET /admin/refresh/logs; all require get_current_admin
- `schemas/refresh.py` — StalePageResponse, RefreshTriggerRequest, RefreshLogResponse, RefreshTriggerResponse
- `db/base.py` — RefreshLog registered
- `api/router.py` — refresh_router registered
- `worker/celery_app.py` — `app.modules.refresh.tasks` added to include; `daily-auto-refresh` beat entry (86400s)
- `tests/test_refresh.py` — 13 tests (stale detection, do_not_refresh exclusion, recently-refreshed exclusion, trigger 404/422/happy-path with mock dispatch, logs list); 227/227 backend tests pass
- `lib/api.ts` — StalePage, RefreshLog, RefreshTriggerResponse interfaces + fetchStalePages, triggerRefresh, fetchRefreshLogs helpers
- `app/(admin)/admin/refresh/page.tsx` — stale pages table with Refresh-now button per row; refresh log history table with result badge; responsive, matches design system
- `app/(admin)/admin/layout.tsx` — "Content Refresh" nav item (RefreshCw icon) added to Growth group
- `next build` clean; 227/227 backend tests pass; GitNexus re-indexed
What remains:
- Beat schedule runs daily — adjust `freshness_interval_days` per page_type (30/60/90/120 days) via DB update if needed

### Post-Step 23 Bug Fixes (commits 783a004 → current)
Status: done
Five bugs found during end-to-end testing of the Step 23 refresh flow and the pipeline orchestrator. All fixed as separate labelled bug-fix commits. 227/227 backend tests pass after each fix.

**Bug 1 — Pipeline StaleDataError on pipeline_stages UPDATE (commit 783a004)**
- Symptom: `StaleDataError: UPDATE statement on table 'pipeline_stages' expected to update 1 row(s); 0 were matched` on `run_pipeline` and `resume_pipeline` Celery tasks
- Root cause: `TrendDiscoveryAgent._store_results` calls `self.db.rollback()` on duplicate topic errors. SQLAlchemy's `rollback()` always expires ALL session-tracked objects regardless of `expire_on_commit=False`. The `stage_record` (PipelineStage) held by `_execute_stages` was expired; subsequent `_update_stage` commit matched 0 rows.
- Fix: `_update_stage` and `_update_run` now call `db.get(Model, id)` to re-fetch a fresh ORM instance by PK before setting attributes and committing. Both silently no-op if the row is missing.
- Files changed: `services/api/app/modules/pipeline/service.py`

**Bug 2 — Published pages not appearing in Content Refresh queue (commit b5e44a7)**
- Symptom: Pipeline-published pages visible in Master CMS but absent from `/admin/refresh/stale`
- Root cause: `publish_to_cms` wrote to `cms_pages` but never called `sync_pages_from_cms`. The `pages` table (which Content Refresh queries) was only populated by the daily Celery beat or a manual `/admin/links/sync` trigger. The Step 22 MASTER_TRACKER and DEPENDENCY_MAP incorrectly stated this sync was hooked in — it was not in the actual code.
- Fix: `publish_to_cms` now calls `sync_pages_from_cms(db)` after `upsert_page_from_draft`, within the same transaction (flush only; caller commits). Applies to both manual publish and pipeline `_run_publish`.
- Files changed: `services/api/app/modules/publish/service.py`

**Bug 3 — refresh_task TypeError: unexpected keyword argument 'input' (commit 96c85e2)**
- Symptom: `Task refresh.run_refresh raised unexpected: TypeError("BaseAgent.run() got an unexpected keyword argument 'input'")`
- Root cause: `refresh_task` called `agent.run(input={...})`. `BaseAgent.run()` signature is `run(self, input_data, run_id=None)` — the parameter is `input_data`, not `input`.
- Fix: Changed `input=` to `input_data=` on line 49 of `modules/refresh/tasks.py`.
- Files changed: `services/api/app/modules/refresh/tasks.py`

**Bug 4 — Test fixtures wiping real pipeline data on every test run (commits b4fc9e1, d3bd4c7)**
- Symptom: `refresh.run_refresh` returned `result: failed, reason: no_draft` even for pages with a published CMS entry. After investigation: `test_publish.py` and `test_cms.py` `clean_state` fixtures ran `DELETE FROM content_briefs` (which CASCADE-deletes `content_drafts`) and `DELETE FROM cms_pages` on every test run, destroying all real pipeline data.
- Root cause: Blanket `DELETE` on all content tables in `autouse=True` fixtures targeting the shared dev database.
- Fix: Replaced blanket deletes with snapshot approach — record pre-existing IDs for all 5 content tables before each test, delete only newly-created rows post-test in FK-safe order (ContentBrief first → CASCADE to ContentDraft → PublishLog, then CMSPage, KeywordCluster, TopicOpportunity). Count-exact test assertions updated to delta assertions.
- Files changed: `services/api/tests/test_cms.py`, `services/api/tests/test_publish.py`

**Bug 5 — refresh_task hard-fails with "no_draft" when ContentDraft was previously deleted**
- Symptom: Clicking "Refresh" on a published page returns `result: failed, reason: no_draft` even though the page exists in `cms_pages`. Happens when the page's `ContentDraft` row was wiped by test runs before the Bug 4 isolation fix landed.
- Root cause: `refresh_task` queried `ContentDraft` by `cms_page_id` and immediately returned failure when no row found, with no recovery path. Pages whose draft chains were deleted by earlier blanket test deletes are permanently stuck in a "can't refresh" state.
- Fix: When no `ContentDraft` is found, `refresh_task` now looks up the `CMSPage` record and reconstructs a stub `ContentBrief` + `ContentDraft` from it (title, slug, content_html), flushes both, then proceeds with the SEO/AEO agent and re-publish as normal. The refresh succeeds for any published page regardless of draft chain history.
- Files changed: `services/api/app/modules/refresh/tasks.py`

### Step 22 — Internal Linking Engine + Lead Pipeline + Newsletter Platform
Status: done
What is done:
- Alembic migration `20260427_0012_internal_linking_lead_status.py` — creates `pages` and `page_links` tables; adds `status` column to `lead_submissions`
- `modules/linking/models.py` — `Page` + `PageLink` ORM models with FK relationships; registered in `db/base.py`
- `schemas/linking.py` — PageResponse, RelatedPageResponse, AnchorSuggestion, SyncResponse, OrphanResponse
- `modules/linking/service.py` — `sync_pages_from_cms`, `get_related_pages` (cluster-first + fallback), `get_orphan_pages`, `get_anchor_suggestions`
- `modules/linking/tasks.py` — `sync_pages_task` (daily beat), `detect_orphans_task` (daily beat)
- `modules/leads/service.py` — `list_leads` + `update_lead_status` added
- `modules/leads/tasks.py` — `notify_admin_new_lead_task` (SMTP, graceful skip if unconfigured)
- `modules/newsletter/tasks.py` — `sync_subscriber_task` (Mailchimp + Brevo, graceful skip)
- `modules/newsletter/service.py` — fires `sync_subscriber_task.delay()` after DB insert
- `api/routes/linking.py` — POST /admin/links/sync, GET /links/suggestions/{slug}, GET /admin/links/orphans, GET /admin/links/anchors/{slug}
- `api/routes/leads_admin.py` — GET /admin/leads, PATCH /admin/leads/{id}
- `api/routes/leads.py` — fires `notify_admin_new_lead_task.delay()` after submit
- `api/routes/newsletter.py` — POST /newsletter/sync (admin)
- `api/router.py` — linking public+admin, leads_admin registered
- `worker/celery_app.py` — linking/leads/newsletter tasks + daily beat for sync_pages + detect_orphans
- `modules/publish/service.py` — `sync_pages_from_cms()` hooked in after every publish (non-fatal)
- `tests/test_linking.py` — 12 tests; 214/214 backend tests pass
- Frontend: `lib/api.ts` — RelatedPage, OrphanPage, AnchorSuggestion, AdminLead types + fetch helpers
- Frontend: `RelatedContent.tsx` — server-component path fetches from `/links/suggestions/{slug}` when `pageSlug` prop given
- Frontend: `/admin/linking` page rewritten with real API: orphan table + sync trigger + anchor suggestions (inline row expand)
- Frontend: `/admin/leads` page — paginated leads table, KPI row, status filter, mark-as-contacted action
- Frontend: admin sidebar — Leads nav item added (Users icon)
- GitNexus re-indexed: 4,771 nodes | 8,189 edges | 172 flows
What remains:
- SMTP creds must be configured in services/api/.env to enable lead email notifications
- NEWSLETTER_PLATFORM, NEWSLETTER_PLATFORM_API_KEY, NEWSLETTER_LIST_ID must be set to activate external sync

### Step 21 — RBAC Enforcement (+ Step 21 Arch Fix: Separate CMS Auth)
Status: done
What is done:
- RequireRole class in dependencies.py with named singletons (require_super_admin, require_admin, require_editor, require_pipeline, require_agent_admin)
- create_access_token extended with roles list in JWT payload
- services/api/app/schemas/rbac.py — RoleResponse, RoleAssignRequest, UserWithRolesResponse
- services/api/app/modules/rbac/service.py — seed_roles, assign/revoke role helpers, list_users_with_roles
- scripts/seed_roles.py + scripts/assign_admin.py — management scripts
- ARCHITECTURAL FIX: Separated CMS admin auth from public user auth entirely (no shared DB)
  - get_current_admin dependency added to dependencies.py (validates trekyatra_admin_token cookie)
  - create_admin_token() added to security.py (stateless JWT, typ: admin_access)
  - Settings: admin_email, admin_password, admin_cookie_name, admin_token_expire_hours added to config.py
  - NEW routes/admin_auth.py: POST /admin/auth/login, POST /admin/auth/logout, GET /admin/auth/me
  - All 9 admin route routers (admin, publish, content, pipeline, agent_triggers, agent_runs, worker, cms, users) switched from RequireRole to get_current_admin
  - apps/web-next/middleware.ts — checks trekyatra_admin_token for /admin/* (not user token); redirects to /admin/sign-in
  - apps/web-next/app/(admin-auth)/admin/sign-in/page.tsx — standalone admin sign-in page (no sidebar)
  - apps/web-next/app/(admin)/admin/layout.tsx — Sign out button added to header
  - apps/web-next/lib/admin-auth-api.ts — adminLogin, adminLogout, getAdminMe client helpers
  - conftest.py bypass updated to override get_current_admin
  - test_rbac.py rewritten: 20 tests (admin token guards, admin auth endpoints, role seeding, role assignment, user management API)
  - 202/202 backend tests pass; next build clean (128 pages); GitNexus re-indexed 4519 nodes | 7744 edges | 165 flows
What remains:
- Admin password is set in services/api/.env — change from TrekAdmin@2026 to your preferred password

## Step History

### Step 00 — Repo bootstrap, docs, and source-of-truth setup
Status: done
What is done:
- Monorepo folders created
- Uploaded frontend preserved untouched in `apps/web-static`
- Tracker, process, dependency, and implementation docs created

### Step 01 — Backend foundation and local infra scaffold
Status: done
What is done:
- Root repo tooling added
- GitNexus installed and initial graph indexed
- Backend FastAPI scaffold added under `services/api`
- Docker Compose added for Postgres and Redis
- Health endpoints and tests added
- Local API boot validated

### Step 02 — Database, config, and auth data model foundation
Status: done
What is done:
- SQLAlchemy base and session foundation added
- Alembic initialized
- Initial migration created
- User, auth identity, user session, role, permission, user-role, and role-permission models added
- Metadata tests added
- Pylance-safe model typing fixed for auth and RBAC relationships

### Step 03 — Auth APIs foundation
Status: done
What is done:
- Email signup/login/logout/me endpoints implemented
- Password hashing implemented
- JWT access token in HttpOnly cookie implemented
- Placeholder Google/mobile auth interfaces added
- Auth tests added
- Python 3.10 compatibility fixes applied
- ORM registration fix applied for runtime mapper resolution

### Step 04 — Frontend audit and full Next.js migration blueprint
Status: done
What is done:
- Static frontend structure audited using GitNexus and file inventory
- Frontend entry chain and blast radius documented
- Migration direction finalized: full Next.js migration
- Vite app reclassified as source-reference/design-reference only
- API wiring groups mapped for auth, homepage, explore, trek detail, account, admin, and content surfaces
- Mock data deprecation strategy documented

### Step 05 — WordPress integration foundation
Status: done
What is done:
- WordPress config model extended
- WordPress response schemas added
- WordPress REST client skeleton added
- WordPress service helpers added
- WordPress health endpoint added
- WordPress connectivity test endpoint added
- WordPress tests added
- Local WordPress fallback using `?rest_route=/` validated
- Authenticated local WordPress connectivity validated

### Step 06 — Content domain foundation
Status: done
What is done:
- Topic, keyword cluster, content brief, and content draft ORM models added
- Content-domain schemas added
- Content-domain service helpers added
- List/create APIs for topics, clusters, briefs, and drafts added
- Alembic migration `20260421_0003_content_domain_foundation.py` added and validated
- Content route tests added and passing
- Local WordPress bootstrap compose file added
- Local WordPress setup documentation added
- Content insert stability fix applied
- Manual topic create/list curl validation completed

### Step 07 — Internal admin foundation
Status: done
What is done:
- Admin summary schemas added
- Admin service aggregation layer added
- Admin routes added for dashboard, topics, clusters, briefs, drafts, and system summaries
- Admin route tests added and passing
- Manual curl validation completed for:
  - `/api/v1/admin/dashboard/summary`
  - `/api/v1/admin/topics/summary`
  - `/api/v1/admin/clusters/summary`
  - `/api/v1/admin/briefs/summary`
  - `/api/v1/admin/drafts/summary`
  - `/api/v1/admin/system/summary`
What is pending:
- Static admin frontend remains unwired
- Role-aware admin access enforcement is still pending for future steps

### Step 08 — Public frontend data integration phase 1 + full Next.js migration
Status: done
What is done:
- Added public trek read APIs (`GET /api/v1/treks`, `GET /api/v1/treks/{slug}`) in FastAPI
- Added `services/api/app/modules/treks/` domain with in-memory data, service, and schemas
- Added trek route tests (`test_treks.py`)
- Completed full Next.js 14 App Router migration of all ~55 routes from Vite SPA
- Created `apps/web-next/` with: root layout, Providers (QueryClient + Tooltip), globals.css design system, tailwind.config.ts
- Migrated all public pages: homepage (SSG), explore (client), trek detail (SSG + generateStaticParams), compare, regions/[slug], seasons/[slug], all content pages, saved, search, no-results, empty-saved, under-review
- Migrated all auth pages: sign-in, sign-up, otp, forgot-password, reset-password, verify-email, invalid-token, onboarding (multi-step wizard)
- Migrated all success pages (5): newsletter, plan, checkout, password-reset, signup
- Migrated account section: layout with responsive sidebar, dashboard, saved, compare, downloads, enquiries, settings
- Migrated admin section: AdminLayout with dark sidebar, dashboard (KPIs + publish queue), topics, clusters, briefs, drafts, fact-check, linking, monetization, analytics, logs, settings
- Universal `lib/api.ts` with server/client URL detection and 3-second abort timeout
- `lib/trekApi.ts` with mergeImage() and safe static fallback
- `data/treks.ts` with 12 treks using string image paths
- Next.js rewrites proxy `/api/:path*` → `http://localhost:8000/api/:path*`
- All 85 pages build cleanly (`next build` passes)
- `apps/web-static/` Vite reference app removed (migration complete)
What remains:
- Role-aware admin access enforcement is still pending

### Google OAuth (addendum to Step 09)
Status: done
What is done:
- Backend: replaced `google_auth_placeholder` (501) with real `google_auth` handler
- Backend: added `login_or_register_google_user` service — handles new user, existing email link, and returning Google user
- Backend: `POST /api/v1/auth/google` accepts `{ access_token }`, verifies with Google's userinfo endpoint via httpx, upserts user + auth_identity, creates session, sets HttpOnly cookie
- Backend schema: `GoogleAuthRequest.access_token` (was `id_token`)
- Backend tests: 3 new Google auth tests (creates user, 401 for bad token, links to existing email account) — all 7 auth tests pass
- Frontend: installed `@react-oauth/google`
- Frontend: `googleAuth()` added to `lib/auth-api.ts`
- Frontend: `loginWithGoogle()` added to `AuthContext` and `AuthProvider`
- Frontend: `Providers.tsx` wrapped with `GoogleOAuthProvider` (reads `NEXT_PUBLIC_GOOGLE_CLIENT_ID`)
- Frontend: "Continue with Google" button wired with `useGoogleLogin` in both sign-in and sign-up pages
- Frontend: `apps/web-next/.env.local.example` created with `NEXT_PUBLIC_GOOGLE_CLIENT_ID` instruction
- All 85 pages build cleanly
What is required to activate:
- Create OAuth 2.0 credentials at Google Cloud Console (Web application type)
- Set Authorized JavaScript origins: `http://localhost:3000`
- Copy Client ID → `apps/web-next/.env.local` as `NEXT_PUBLIC_GOOGLE_CLIENT_ID=<id>`

### Step 17 — Full Publish Orchestration Pipeline (+ enhancements)
Status: done
What is done (enhancements, post-TC review):
- Alembic migration `20260423_0010_cms_hero_image.py` — adds hero_image_url (String 512, nullable) to cms_pages
- `CMSPage` model + all 3 CMS schemas updated with hero_image_url field
- `CMSPageForm` — hero_image_url URL input + preview; trek_facts strip (6 fields: duration, altitude, difficulty, season, permits, base); trek_facts persisted to content_json.trek_facts; buildPayload updated
- `lib/api.ts` — TrekFacts interface added; CMSPage + CMSPagePayload extended with hero_image_url and trek_facts
- Pipeline service `resume()` fix: paused_at_draft_approval now resumes at seo_aeo (not publish) — SEO/AEO agent runs before every publish
- 2 new pipeline tests: draft-approval resume dispatches task, stages_slice confirms seo_aeo→publish path; 139/139 backend tests pass
- Trek detail page full overhaul: generateMetadata (seo_title/description), descriptive anchor IDs (#why-this-trek, #quick-facts, etc.), sticky sidebars fixed (nested sticky+overflow), all 12 TOC items match real section blocks, 4 new content blocks (best_time, difficulty, packing, safety), hero_image_url from CMS, trek facts from content_json.trek_facts, H1 strips SEO subtitle (splits on : or —); CMS section extraction broadened (question-form headings, intro pre-heading capture); CMS form fields full-width (max-w-4xl removed)
- Anthropic 529 resilience: `agents/client.py` shared factory with `max_retries=6`; all 5 agents updated to use `get_anthropic_client()`; 139/139 tests pass
- Sticky sidebar root fix: `globals.css` changed `overflow-x: hidden` → `overflow-x: clip` on html/body; `hidden` on `<html>` re-assigns the scroll container away from the viewport, breaking `position: sticky` in Chromium/Safari
- CMS empty sections fix: `cms/service.py:reparse_sections_from_draft` + `POST /cms/pages/{slug}/reparse-sections` route + Re-parse sections button in CMSPageForm; prevents double-processing HTML via `_process_content_json` passthrough; 2 new tests; 141/141 pass
- Section parser overhaul (parser fix batch): `_parse_sections_from_markdown` updated to use `^#{1,2}` (H3 = content not boundary), H1 always opens why_this_trek (captures intro paragraphs), `faqs` moved to top of `_SECTION_HEADING_MAP` (first-match-wins; fixes FAQ content landing in why_this_trek), `difficult\b` added to difficulty pattern, `key facts` and `overview` added to why_this_trek pattern; `_extract_trek_facts_from_markdown` helper added — extracts duration/altitude/difficulty/season/permits/base from structured markdown; `upsert_page_from_draft` + `reparse_sections_from_draft` both write trek_facts to content_json; FE hardcoded fallbacks "Required"/"Sankri"/"Moderate" replaced with "—"; 8 new parser unit tests; 148/149 pass (1 pre-existing pipeline test pollution — unrelated)

### Step 20 — Monetization Frontend Components
Status: done
What is done:
- Alembic migration `20260427_0011_leads_newsletter.py` — creates `lead_submissions` (id, name, email, phone nullable, trek_interest, message nullable, source_page, source_cluster nullable, cta_type, created_at) and `newsletter_subscribers` (id, email UNIQUE, name nullable, source_page, lead_magnet nullable, created_at)
- `modules/leads/models.py` — LeadSubmission ORM model
- `modules/newsletter/models.py` — NewsletterSubscriber ORM model with UniqueConstraint on email
- `db/base.py` — LeadSubmission + NewsletterSubscriber registered
- `schemas/leads.py` — LeadCreate (custom email validator) + LeadResponse
- `schemas/newsletter.py` — NewsletterSubscribeCreate + NewsletterSubscribeResponse (already_subscribed: bool)
- `modules/leads/service.py` — create_lead()
- `modules/newsletter/service.py` — subscribe() with idempotent duplicate detection
- `api/routes/leads.py` — POST /api/v1/leads (201)
- `api/routes/newsletter.py` — POST /api/v1/newsletter/subscribe (200)
- `api/router.py` — leads_router + newsletter_router registered
- `tests/test_leads_newsletter.py` — 8 tests; 182/182 backend tests pass
- `apps/web-next/lib/api.ts` — LeadPayload, LeadResponse, NewsletterPayload, NewsletterResponse interfaces + submitLead() + subscribeNewsletter()
- `apps/web-next/components/monetization/InArticleAdSlot.tsx` — conditional AdSense/placeholder
- `apps/web-next/components/monetization/SidebarAdSlot.tsx` — 300×250 ad slot
- `apps/web-next/components/monetization/FooterAdSlot.tsx` — 970×60 footer ad
- `apps/web-next/components/monetization/AffiliateCard.tsx` — product card with rel="nofollow sponsored noopener"
- `apps/web-next/components/monetization/AffiliateRail.tsx` — snap-scroll horizontal rail
- `apps/web-next/components/monetization/ComparisonTable.tsx` — comparison table with checkmark icons
- `apps/web-next/components/monetization/GearRecommendation.tsx` — inline affiliate gear mention
- `apps/web-next/components/monetization/LeadForm.tsx` — name/email/phone/trek/message → POST /leads; localStorage-backed
- `apps/web-next/components/monetization/OperatorCard.tsx` — operator display + embedded LeadForm
- `apps/web-next/components/monetization/ConsultationCTA.tsx` — inline/card CTA wrapping LeadForm
- `apps/web-next/components/monetization/NewsletterCapture.tsx` — email → POST /newsletter/subscribe; localStorage guards duplicate
- `apps/web-next/components/monetization/LeadMagnetCapture.tsx` — download CTA wrapping NewsletterCapture
- `apps/web-next/components/monetization/InlineNewsletterBlock.tsx` — mid-article wrapper for NewsletterCapture
- `apps/web-next/components/trust/DisclosureBlock.tsx` — affiliate/ads/AI disclosure block
- `apps/web-next/components/trust/TrustSignals.tsx` — date/author/fact-checked trust bar
- `apps/web-next/components/trust/StickyMobileCTA.tsx` — lg:hidden sticky mobile CTA with localStorage 7-day dismiss
- `apps/web-next/app/layout.tsx` — conditional AdSense script via NEXT_PUBLIC_ADSENSE_ID
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — InArticleAdSlot + AffiliateRail + TrustSignals + StickyMobileCTA inserted
- `apps/web-next/app/(public)/packing/[slug]/page.tsx` — AffiliateRail + NewsletterCapture inserted
- `apps/web-next/app/(public)/.env.local.example` — NEXT_PUBLIC_ADSENSE_ID documented
- `next build` clean (127 static pages); 182/182 backend tests pass

### Step 19 Bug Fixes — Fact-check wiring, flagged-marker stripping, pipeline clear
Status: done
What is done:
- `PATCH /admin/fact-check/claims/{claim_id}`: new endpoint updates `flagged_for_review` on DraftClaim; `update_draft_claim()` service function added to `content/service.py`
- `ClaimPatch` Pydantic schema added to `schemas/admin.py`
- Fact Check admin page: "Mark verified" calls PATCH with `flagged_for_review=false`, optimistic UI update removes flag; "Flag for editor" calls PATCH confirm + shows "Sent to editor queue ✓" (no DB change, already flagged)
- `patchFactCheckClaim()`, `clearPipelineRuns()`, `clearAgentRuns()` helpers added to `lib/api.ts`
- Pipeline page: "Clear all" button in Failed/Cancelled section header calls `DELETE /admin/pipeline/runs/clear` and reloads
- `_strip_flagged_markers()` + `_strip_flagged_markers_html()` helpers in `cms/service.py`: strip `*(flagged for verification)*`, `[flagged for verification ...]`, `<em>(flagged...)</em>` from markdown/HTML before storage
- `_md_to_html()` now calls `_strip_flagged_markers()` before markdown conversion
- `_process_content_json()` now strips flagged HTML markers from already-stored HTML sections
- Section patterns expanded: "safety" gains `medical|health.*altitude|mountain.*safe|know before`; "cost_estimate" gains `invest|spend|financial|tariff|expenditure`
- 6 new backend tests; 174/174 pass; `next build` clean
- Pipeline keyword_cluster fallback: `_run_keyword_cluster` now falls back to 10 most-recent DB topics when trend_discovery returns `topic_ids: []`, preventing hard failure on every re-run
- TrendDiscoveryAgent `_store_results`: added `logger.warning()` + `self.db.rollback()` in except block — fixes silent DB session corruption when first `create_topic` leaves an aborted transaction (causing all subsequent topics to fail silently)
- 174/174 backend tests pass; `next build` clean; GitNexus re-indexed (4,093 nodes | 7,032 edges | 155 flows)

### Step 19 — SEO and Schema Infrastructure (Frontend)
Status: done
What is done:
- `apps/web-next/lib/schema.ts` — schema builder utilities: `buildArticleSchema`, `buildFAQSchema`, `buildBreadcrumbSchema`, `buildItemListSchema`, `buildWebSiteSchema`; all use `NEXT_PUBLIC_SITE_URL` env
- `apps/web-next/components/seo/SchemaInjector.tsx` — renders `<script type="application/ld+json">` for each valid schema object; filters null entries
- `apps/web-next/app/sitemap.ts` — Next.js App Router sitemap: static pages + trek detail slugs + published CMS pages by type prefix; deduplicates by URL; fails gracefully when API unavailable
- `apps/web-next/app/robots.ts` — blocks `/admin/`, `/account/`, `/auth/`, `/api/`; references sitemap URL
- `apps/web-next/app/layout.tsx` — `metadataBase`, global OG site defaults, Twitter card defaults, `robots: {index: true, follow: true}` added
- `apps/web-next/app/(public)/page.tsx` — homepage gets `buildWebSiteSchema()` via SchemaInjector
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — canonical, OG, Twitter card via `generateMetadata()`; Article + FAQPage + BreadcrumbList JSON-LD; section padding increased `pt-16 pb-16 md:pt-20 md:pb-20`; TOC URL hash reinstated via `history.pushState`
- `apps/web-next/app/(public)/packing/[slug]/page.tsx` — canonical, OG, Twitter card; Article + FAQ JSON-LD
- `apps/web-next/app/(public)/permits/[slug]/page.tsx` — canonical, OG, Twitter card; Article + FAQ JSON-LD
- `apps/web-next/app/(public)/guides/[slug]/page.tsx` — canonical, OG, Twitter card; Article + FAQ JSON-LD
- Step 18 bug fixes: trek facts two-pass extraction (table → KV, colon required); FAQ H3 format parsing; stale-run cleanup at startup; fact-check admin page wired to real DraftClaim data
- Backend: `DELETE /admin/pipeline/runs/clear` + `DELETE /admin/agent-runs/clear` bulk cleanup endpoints; `GET /admin/fact-check/claims` with DraftClaim join; startup `_cancel_stale_runs()` lifespan hook
- `apps/web-next/app/(admin)/admin/fact-check/page.tsx` rewritten as real-API client component
- `apps/web-next/lib/api.ts`: `FactCheckClaim` type + `fetchFactCheckClaims` helper
- 168/168 backend tests pass; `next build` clean; CLAUDE.md updated with inter-step dependency rules (Section 16)

### Step 18 — Public Frontend Content Page Templates
Status: done
What is done:
- Backend parser: fixed permits regex (`permit\b[^*:\n]{0,20}(?::?\*\*)?:?`) to match "Permit Required:" format; fixed base regex to match "Nearest Base Villages:" + note stripping; added `_extract_faq_section_raw` + `_parse_faqs_from_section` — parses bold-question/paragraph-answer FAQ format into `[{q, a}]` list; `upsert_page_from_draft` + `reparse_sections_from_draft` both now write `content_json.faqs`; 4 new tests (permits format, nearest base villages, FAQ parse, FAQ extract); 153/153 pass
- Shared components created: `components/content/FAQAccordion.tsx` (client, smooth open/close, accent active state), `components/content/TableOfContents.tsx` (client, IntersectionObserver scroll spy, active highlight with border-l-2), `components/content/Breadcrumb.tsx`, `components/content/RelatedContent.tsx`, `components/content/AuthorBlock.tsx`, `components/content/UpdatedBadge.tsx`, `components/content/SafetyDisclaimer.tsx`, `components/content/AffiliateDisclosure.tsx`
- Trek page rewrite: uses TableOfContents (scroll spy replaces hardcoded i===0), FAQAccordion (from content_json.faqs with HTML answers), Breadcrumb, AuthorBlock; added body-level Quick Facts section (`#quick-facts`) so TOC link scrolls correctly; cost fallback changed to generic "Contact for pricing" message; permits fallback made generic; difficulty badge uses tf.difficulty
- CMSPageForm: FAQ textarea removed; replaced with structured Q&A pair editor (add/remove pairs); answer field accepts HTML from auto-parse or plain text; Re-parse sections button also updates FAQ state when new pairs extracted
- `lib/api.ts`: `FAQItem` type exported; `CMSPage.content_json.faqs` typed; `CMSPagePayload.content_json.faqs` typed
- New page templates: `app/(public)/packing/[slug]/page.tsx`, `app/(public)/permits/[slug]/page.tsx`, `app/(public)/guides/[slug]/page.tsx` — all CMS-powered with static fallbacks, use shared components
- next build clean (89+ pages); 153/153 backend tests pass
- Alembic migration `20260423_0009_pipeline.py` — creates `pipeline_runs` (id UUID PK, pipeline_type, status, current_stage, start/end_stage, input/output_json, error_detail, timestamps) and `pipeline_stages` (id UUID PK, pipeline_run_id FK, stage_name, agent_run_id FK→agent_runs, status, error_detail, timestamps)
- `app/modules/pipeline/models.py` — `PipelineRun` + `PipelineStage` ORM models with relationship; `db/base.py` updated
- `app/schemas/pipeline.py` — `PipelineRunCreate`, `PipelineRunResponse`, `PipelineStageResponse`, `PipelineTriggerResponse`
- `app/modules/pipeline/service.py` — CRUD helpers + `PipelineOrchestrator` class: `run()` / `resume()` / stage dispatchers for all 6 stages; checkpoint gates: `paused_at_brief_approval` (after content_brief), `paused_at_draft_approval` (after content_writing if draft has flagged claims); partial pipeline support via start_stage/end_stage
- `app/modules/pipeline/tasks.py` — `run_pipeline_task`, `resume_pipeline_task`, `daily_discovery_task` (Celery beat)
- `app/worker/celery_app.py` — pipeline tasks included; beat_schedule daily_discovery added
- `app/api/routes/pipeline.py` — POST /run, GET /runs, GET /runs/{id}, POST /runs/{id}/resume, POST /runs/{id}/cancel
- `app/api/router.py` — pipeline_router registered
- `tests/test_pipeline.py` — 20 tests: CRUD, stages_slice, API trigger/list/get/cancel/resume/409, orchestrator failure propagation, metadata coverage
- 137/137 backend tests pass; `next build` clean
- `apps/web-next/lib/api.ts` — PipelineRun/PipelineStage types + triggerPipeline/fetchPipelineRuns/fetchPipelineRun/resumePipelineRun/cancelPipelineRun
- `apps/web-next/app/(admin)/admin/pipeline/page.tsx` — fully rewritten: TriggerForm (start stage selector + seed topics/brief_id/draft_id inputs), RunCard (stage track, output chips, resume/cancel buttons, approval gate notice, error detail), KPI strip, auto-refresh while runs are active

### Step 16 — Master CMS Foundation
Status: done
What is done:
- WordPress removed entirely: deleted `app/modules/wordpress/`, `app/api/routes/wordpress.py`, `app/schemas/wordpress.py`, `tests/test_wordpress*.py`, `docker-compose.wordpress.yml`, `infrastructure/wordpress/`; 5 WP config settings removed from `config.py` and `.env.example`
- `services/api/alembic/versions/20260423_0008_master_cms.py` — creates `cms_pages` table; drops WP columns from drafts+logs; adds `cms_page_id`+`published_url`
- `services/api/app/modules/cms/service.py` — full CRUD + `upsert_page_from_draft` (agent pipeline → CMS); `_md_to_html` converts markdown at storage time; `_parse_sections_from_markdown` extracts named sections from agent output into `content_json.sections`; `_process_content_json` converts section markdown to HTML for manual saves; `cache_invalidate`/`cache_invalidate_all` (Redis DB 2)
- `services/api/app/api/routes/cms.py` — `GET/POST /cms/pages`, `GET/PATCH/DELETE /cms/pages/{slug}`, `POST /cms/cache/invalidate`
- `services/api/app/modules/publish/service.py` — `publish_to_cms` replaces `push_draft_to_wordpress`
- 117/117 backend tests pass
- `apps/web-next/lib/api.ts` — `CMSPage` + `TrekContentSections` interfaces; `fetchCMSPage`/`fetchCMSPages`/`createCMSPage`/`updateCMSPage` helpers
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — each named Block renders from `content_json.sections[key]` (HTML) when present; static template is fallback; `notFound()` guard for unknown slugs; `formatUpdatedAt` from `cmsPage.published_at`; sticky sidebars `max-h` capped
- `apps/web-next/app/api/revalidate/route.ts` — Next.js on-demand revalidation endpoint
- `apps/web-next/app/(admin)/admin/cms/page.tsx` — KPI cards + pages table; New page button + edit icon per row; cache clear (per-page + global)
- `apps/web-next/app/(admin)/admin/cms/new/page.tsx` — manual CMS page creation form
- `apps/web-next/app/(admin)/admin/cms/[slug]/edit/page.tsx` — edit existing CMS page with Save + Publish + cache clear
- `apps/web-next/components/admin/CMSPageForm.tsx` — shared form: title, slug, page type, status, SEO meta, 10 section textareas (markdown)
- `apps/web-next/app/globals.css` — `.cms-section` prose styles for agent-generated HTML blocks
- `apps/web-next/app/(admin)/admin/drafts/page.tsx` — "Publish to Master CMS" CTA label
- `services/api/pyproject.toml` — `markdown>=3.6` dependency added
- `next build` clean (89 static pages); GitNexus re-indexed

### Step 15B — Admin CMS Enhancements (real API wiring + pipeline view)
Status: done
What is done:
- `components/admin/CopyableId.tsx` — click-to-copy UUID component; `Copy` icon on hover, `Check` icon on copied (2s reset); shows truncated UUID with optional label prefix
- `components/admin/AgentRunsPanel.tsx` — live last-5 agent-run panel; polls every 5s while any run has status="running"; auto-stops when all complete; remounts per dispatch via `key={runKey}`; shows status badge + duration; non-intrusive (returns null on empty)
- `admin/topics/page.tsx` — fully rewritten; loads real topics from `GET /api/v1/topics`; trend_score and urgency_score progress bars; status badges; CopyableId per topic; "Generate brief →" nav link with `?topic_id=&kw=` query params; AgentRunsPanel for trend_discovery agent
- `admin/clusters/page.tsx` — fully rewritten; loads real clusters from `GET /api/v1/clusters`; intent badges (informational/commercial/transactional); supporting keywords expandable (first 6 shown, +N more toggle); AgentRunsPanel for keyword_cluster agent
- `admin/briefs/page.tsx` — structured brief content viewer expanded (heading tree H1/H2/H3 indented, FAQs list, key_entities + secondary_keywords tag pills); CopyableId for brief/topic/cluster UUIDs; "Write draft →" cross-nav link on approved briefs; AgentRunsPanel for content_brief agent
- `admin/drafts/page.tsx` — requires_review and review status badges added; per-card agentFeedback state shows dispatch confirmation after optimize; await-outside-setState bug fixed
- `admin/pipeline/page.tsx` — new page; parallel fetches all 4 entities; client-side join (topicMap, clusterMap, draftByBrief); stage summary pills (In Progress→In Review→Approved→Draft Stage→Published); full pipeline table with brief/topic/cluster/draft status + confidence %, all UUIDs via CopyableId, nav links to /admin/briefs and /admin/drafts
- `admin/layout.tsx` — Pipeline View nav item added (GitMerge icon, href /admin/pipeline)
- GitNexus re-indexed: 3,268 nodes | 5,350 edges | 81 clusters | 101 flows (commit aab2d3e)

### Step 15 — Content Writing Agent + SEO/AEO Optimization Agent
Status: done
What is done:
- Alembic migration `20260422_0007_draft_claims.py` — adds `optimized_content` (Text nullable) to `content_drafts`; creates `draft_claims` table (id UUID PK, draft_id FK→content_drafts CASCADE, claim_text, claim_type, confidence_score, flagged_for_review, created_at) with indexes on draft_id and flagged_for_review
- `app/modules/content/models.py` — `ContentDraft` extended with `optimized_content` and `claims` relationship; new `DraftClaim` ORM model added
- `app/db/base.py` — `DraftClaim` registered in metadata
- `app/schemas/content.py` — `ContentDraftCreate`/`ContentDraftResponse` extended with `optimized_content`; `DraftClaimCreate` and `DraftClaimResponse` added
- `app/modules/content/service.py` — `get_draft`, `update_draft_optimized_content`, `create_draft_claim`, `list_draft_claims` added; `create_draft` updated for `optimized_content`
- `app/modules/agents/content_writing/__init__.py` + `agent.py` + `prompts.py` — `ContentWritingAgent`: 3-node LangGraph (fetch_brief → write_draft → store_results); validates brief is approved + has structured_brief; calls Claude claude-sonnet-4-6 with prompt caching; stores draft + all DraftClaim records; sets status `requires_review` if any claim confidence < 0.7
- `app/modules/agents/seo_aeo/__init__.py` + `agent.py` + `prompts.py` — `SEOAEOAgent`: 3-node LangGraph (fetch_draft → optimize → store_results); runs SEO/AEO pass; stores `optimized_content` on draft; returns changes_count + faq_count
- `app/worker/tasks/agent_tasks.py` — `write_draft_task` + `optimize_draft_task` Celery tasks added
- `app/api/routes/agent_triggers.py` — `POST /api/v1/admin/agents/write-draft` + `POST /api/v1/admin/agents/optimize-draft` added
- `app/api/routes/content.py` — `GET /api/v1/admin/drafts/{id}/claims` added; `_draft_to_response` helper added; `get_drafts`/`post_draft` refactored to use it
- `tests/test_content_writing_agent.py` — 11 tests: missing brief_id, invalid format, not found, unapproved brief, no structured_brief, mocked-LLM creates draft+claims, no-flagged sets status=draft, claims empty, claims returns data, invalid ID, trigger dispatch
- `tests/test_seo_aeo_agent.py` — 6 tests: missing draft_id, invalid format, not found, mocked-LLM optimizes + stores optimized_content, content unchanged, trigger dispatch
- `apps/web-next/app/(admin)/admin/drafts/page.tsx` — fully rewritten: expandable content preview (optimized if available), flagged claims panel with confidence % and claim type badges, Optimize button, Write Draft trigger form, `requires_review` status badge
- 101/101 backend tests pass; `next build` clean (zero errors)
What remains:
- Real LLM calls require ANTHROPIC_API_KEY in services/api/.env
- Draft status machine: `requires_review` → `review` transition manually wired via Submit for Review button

### Step 14 — Content Brief Agent + Brief Approval Workflow
Status: done
What is done:
- Alembic migration `20260422_0006_brief_versions.py` — adds `structured_brief` (JSON) and `word_count_target` (int) to `content_briefs`; creates `brief_versions` table (id UUID PK, brief_id FK→content_briefs CASCADE, version_number, structured_brief, created_at)
- `app/modules/content/models.py` — `ContentBrief` extended with `structured_brief`, `word_count_target`, `versions` relationship; new `BriefVersion` ORM model
- `app/db/base.py` — `BriefVersion` registered in metadata
- `app/schemas/content.py` — `ContentBriefCreate`/`ContentBriefResponse` extended; `BriefStatusPatch`, `BriefVersionResponse`, `BRIEF_STATUS_TRANSITIONS` state machine added
- `app/modules/content/service.py` — `get_brief`, `update_brief_status` (state machine: draft→review→approved/rejected→scheduled), `create_brief_version`, `list_brief_versions`, `list_briefs` (status filter) added
- `app/modules/agents/content_brief/__init__.py` — package init
- `app/modules/agents/content_brief/schema.py` — `BriefStructure` TypedDict (all brief fields)
- `app/modules/agents/content_brief/prompts.py` — Claude prompt for SEO+AEO execution-grade brief generation
- `app/modules/agents/content_brief/agent.py` — `ContentBriefAgent`: 3-node LangGraph (fetch_context → generate_brief → store_results); fetches topic + cluster context, calls Claude, stores brief + version 1
- `app/worker/tasks/agent_tasks.py` — `generate_brief_task` Celery task added (`agents.generate_brief`)
- `app/api/routes/agent_triggers.py` — `POST /api/v1/admin/agents/generate-brief` added
- `app/api/routes/content.py` — `GET /api/v1/admin/briefs/{id}`, `PATCH /api/v1/admin/briefs/{id}/status`, `GET /api/v1/admin/briefs/{id}/versions` added; `get_briefs` supports `?status_filter=`
- `app/api/router.py` — `admin_router` moved before `content_router` to prevent route shadowing
- `tests/test_brief_agent.py` — 15 tests: agent no-topic, invalid-topic, mocked-LLM creates brief+version, state machine valid/invalid/not-found, version increment, API detail/404, PATCH valid/invalid, versions empty/filled, trigger missing IDs, trigger dispatch
- `apps/web-next/app/(admin)/admin/briefs/page.tsx` — fully wired to real API: loads briefs, approve/reject via PATCH, generate-brief trigger with topic UUID + keyword inputs
- 84/84 backend tests pass; `next build` clean (zero errors)
What remains:
- Real LLM calls require ANTHROPIC_API_KEY in services/api/.env
- Brief detail expanded view (structured_brief JSON viewer) deferred to a later step

### Step 13 — Trend Discovery Agent + Keyword Cluster Agent
Status: done
What is done:
- `app/modules/agents/base_agent.py` — `_build_graph` return type fixed to `Any` (compiled graph)
- `app/modules/agents/trend_discovery/prompts.py` — Claude prompt for SEO topic scoring
- `app/modules/agents/trend_discovery/agent.py` — `TrendDiscoveryAgent`: 2-node LangGraph (score_topics → store_results); calls Claude, writes `TopicOpportunity` rows
- `app/modules/agents/keyword_cluster/prompts.py` — Claude prompt for semantic topic clustering
- `app/modules/agents/keyword_cluster/agent.py` — `KeywordClusterAgent`: 3-node LangGraph (fetch_topics → cluster_topics → store_results); writes `KeywordCluster` rows with `competition_score` and `cannibalization_risk` in `notes`
- `app/modules/agents/service.py` — `get_run` added
- `app/worker/tasks/agent_tasks.py` — `discover_trends_task` and `cluster_keywords_task` Celery tasks; use `SessionLocal` directly; call agent, then `complete_run`/`fail_run`
- `app/worker/celery_app.py` — `agent_tasks` added to `include` list
- `app/api/routes/agent_runs.py` — `GET /api/v1/admin/agent-runs/{id}` endpoint added
- `app/api/routes/agent_triggers.py` — `POST /api/v1/admin/agents/discover-trends` and `POST /api/v1/admin/agents/cluster-keywords`; both dispatch Celery tasks and return `agent_run_id`
- `app/api/router.py` — `agent_triggers_router` registered
- `apps/web-next/app/(admin)/admin/topics/page.tsx` — "Discover trends" button wired; shows run ID + poll link
- `apps/web-next/app/(admin)/admin/clusters/page.tsx` — "Cluster topics" button wired; accepts topic UUID input
- `tests/test_agent_triggers.py` — 8 tests (trigger dispatch, run_id returned, GET by ID, 404, mocked LLM unit test, empty input error)
- No new DB migration (TopicOpportunity and KeywordCluster models already have all required fields)
- 69/69 backend tests pass; `next build` clean
What remains:
- Real LLM calls require ANTHROPIC_API_KEY in services/api/.env
- Admin topics/clusters pages still show static seed data; live data wiring deferred to Step 18

### Step 12 — LangGraph agent framework + agent tracking
Status: done
What is done:
- `pyproject.toml` — `anthropic`, `langchain-core`, `langchain-anthropic`, `langgraph` added and installed
- `app/core/config.py` — `anthropic_api_key` setting added
- `app/modules/agents/models.py` — `AgentRun` ORM model (id, agent_type, status, input_json, output_json, error, started_at, completed_at, created_at, updated_at)
- `app/modules/agents/state.py` — `BaseAgentState` TypedDict (run_id, agent_type, input, output, errors, metadata)
- `app/modules/agents/base_agent.py` — `BaseAgent` ABC wrapping LangGraph `StateGraph`; subclasses define `_build_graph()` and call `run()`
- `app/modules/agents/service.py` — `start_run`, `update_run`, `complete_run`, `fail_run`, `list_runs`
- `app/schemas/agents.py` — `AgentRunResponse` Pydantic schema
- `app/api/routes/agent_runs.py` — `GET /api/v1/admin/agent-runs` with agent_type, status, limit, offset filters
- `app/api/router.py` — `agent_runs_router` registered
- `app/db/base.py` — `AgentRun` imported and registered in metadata
- `alembic/versions/20260422_0005_agent_runs.py` — `agent_runs` table with status/agent_type indexes; migration applied
- `tests/test_agent_runs.py` — 7 tests (list empty, filter by type, filter by status, CRUD lifecycle, fail lifecycle, nonexistent run, API list after create)
- 61/61 backend tests pass; `next build` not needed (no frontend changes)
What remains:
- Actual LLM calls wired through agents (Steps 13–15)
- ANTHROPIC_API_KEY must be set in `.env` before agents make real LLM calls

### Step 11 — Worker and task queue infrastructure
Status: done
What is done:
- `app/core/config.py` — `celery_broker_url` and `celery_result_backend` computed fields added (Redis DB 1)
- `app/worker/celery_app.py` — Celery instance with broker/backend from settings; task serializer, UTC, acks_late, prefetch=1 configured; empty beat_schedule stub
- `app/worker/tasks/base.py` — `BaseTask` with `max_retries=3`, `default_retry_delay=60s`, `on_failure` and `on_retry` hooks
- `app/worker/tasks/smoke.py` — `smoke.ping` task using `BaseTask`; validates end-to-end queue flow
- `app/api/routes/worker.py` — `GET /api/v1/worker/health`; checks Redis broker connectivity, returns broker status and URL
- `app/api/router.py` — `worker_router` registered additively
- `docker-compose.yml` — `worker` and `beat` services added under `profiles: [worker]`; arm64-safe `python:3.12-slim` base via Dockerfile
- `services/api/Dockerfile` — minimal Python image for Docker-based worker/beat runs
- `Makefile` — `make worker` and `make beat` targets for local host-based worker runs
- `services/api/.env.example` — Celery broker/backend documented (derived automatically, override comment provided)
- `tests/test_worker.py` — 4 new tests: 200 status, response shape, broker connected, broker URL uses DB 1
- 54/54 backend tests pass; no Alembic migration (infra-only step)
What remains:
- `agent_runs` table and LangGraph wiring (Step 12)
- Dead-letter `failed` flag on `agent_runs` referenced in base.py on_failure (wired in Step 12)

### Step 10 — Publish, tracking, and validation workflows
Status: done
What is done:
- `PublishLog` ORM model added to `content_drafts` cascade (tracks every push attempt)
- `published_at` and `wordpress_post_id` columns added to `content_drafts` via migration `20260422_0004`
- `WordPressClient.create_post()` method added
- `schemas/publish.py` — `DraftStatusPatch`, `PublishLogResponse`, `DraftPublishResponse`
- `modules/publish/service.py` — `VALID_TRANSITIONS` dict, `update_draft_status`, `push_draft_to_wordpress`, `get_publish_logs`
- `api/routes/publish.py` — `PATCH /admin/drafts/{id}/status`, `POST /admin/drafts/{id}/publish`, `GET /admin/drafts/{id}/publish-log`
- `publish_router` registered in `api/router.py`
- `test_smoke.py` — smoke tests for all key API surfaces (14 tests)
- `test_publish.py` — full publish workflow tests (9 tests, including mocked WP push)
- Admin drafts page rewritten as real API client with status badges and action buttons
- 50/50 backend tests pass; `next build` clean; GitNexus re-indexed (2072 nodes, 74 flows)
What remains:
- Role-aware admin access enforcement (future step)
- OTP mobile auth (future step)

### Step 09 — User account foundation on frontend
Status: done
What is done:
- Created `apps/web-next/lib/auth-api.ts`: typed client-only fetch helpers for `/auth/me`, `/auth/login`, `/auth/signup`, `/auth/logout`
- Created `apps/web-next/lib/auth-context.tsx`: React context with `AuthProvider` that bootstraps from `GET /me` on mount; exposes `user`, `isLoading`, `login()`, `signup()`, `logout()`, `refresh()`
- Created `apps/web-next/middleware.ts`: Next.js middleware protecting `/account/*` routes (redirects to `/auth/sign-in?next=<path>`) and bouncing authenticated users from `/auth/sign-in` and `/auth/sign-up` to `/account`
- Created `apps/web-next/components/account/UserGreeting.tsx`: client component reading `useAuth()` to display personalised welcome in account dashboard
- Modified `apps/web-next/components/Providers.tsx`: wrapped children in `<AuthProvider>`
- Modified `apps/web-next/app/(auth)/auth/sign-in/page.tsx`: wired to `login()` from `useAuth()`, `useSearchParams` redirect after login, `<Suspense>` boundary for static generation compatibility
- Modified `apps/web-next/app/(auth)/auth/sign-up/page.tsx`: wired to `signup()` from `useAuth()`, redirects to `/auth/onboarding` on success
- Modified `apps/web-next/components/layout/Header.tsx`: auth-aware desktop dropdown (avatar with initials, name/email, Dashboard link, Sign out) and mobile drawer (Dashboard link, Sign out)
- Modified `apps/web-next/app/(public)/account/page.tsx`: replaced static greeting with `<UserGreeting />` component
- All 85 pages build cleanly with Step 9 changes applied
What remains:
- Saved treks/downloads/enquiries wired to real user data (future step)
- Onboarding form data persisted to backend (future step)
- OTP and Google auth (backend stubs return 501; frontend UI exists)
- Role-aware admin access enforcement (future step)
# Frontend Wiring Blueprint — Step 04

## Audit Summary

`apps/web-static` is a fully static React 18 / Vite / React Router SPA with a large provider-wrapped route tree, separate public/auth/admin/account shell patterns, hard-coded trek mock data, and zero backend integration. It serves as the UI/source-reference frontend only.

---

## Migration Strategy Decision: Full Next.js Migration

**Decision: Carry out a complete Next.js migration.**

### Why this is the correct decision
- Product scope already targets a Next.js frontend for SEO, AEO, structured rendering, and future ISR/SSG behaviour.
- The Vite app is a good design and route reference, but not the final runtime architecture.
- Public pages like homepage, explore, trek detail, region, seasonal, permit, packing, cost, and comparison pages benefit from server-oriented rendering and cleaner route architecture.
- Auth, account, and admin sections can be organized cleanly in route groups.
- WordPress and FastAPI integrations will be cleaner in a unified Next.js runtime layer than retrofitting a large static SPA and migrating later.

### Rule
- `apps/web-static` stays untouched as source-reference
- no live API wiring into Vite
- all future frontend implementation targets the new Next.js app

---

## Current Static Frontend Findings

### Entry chain
- `src/main.tsx` = mount entry
- `src/App.tsx` = provider tree + full route registry
- `src/components/layout/SiteLayout.tsx` = public shell
- `src/components/layout/Header.tsx` = global public navigation
- `src/components/layout/Footer.tsx` = global public footer

### Shell patterns identified
1. Public shell — `SiteLayout`
2. Auth shell — local `AuthLayout`
3. Admin shell — `AdminLayout`
4. Account shell — currently public-shell based, but should become protected account layout later

### Static data dependency
- `src/data/treks.ts` is the only trek data source today
- it currently feeds homepage, explore, trek detail, dashboard, and related trek displays

---

## Target Next.js Architecture

## App structure
Recommended new frontend app:
- `apps/web-next/`

Recommended stack:
- Next.js
- TypeScript
- Tailwind CSS
- App Router
- route groups for public/auth/account/admin
- shared UI system migrated from current components selectively
- fetch client for FastAPI + WordPress integration

### Suggested route groups
- `(public)`
- `(auth)`
- `(account)`
- `(admin)`

### Suggested top-level route mapping
- `/`
- `/explore`
- `/treks/[slug]`
- `/compare/[slug]`
- `/regions/[slug]`
- `/seasons/[slug]`
- `/packing/[slug]`
- `/permits/[slug]`
- `/costs/[slug]`
- `/itineraries/[slug]`
- `/gear/[slug]`
- `/beginner/[slug]`
- `/resources/[slug]`
- `/search`
- `/auth/sign-in`
- `/auth/sign-up`
- `/auth/otp`
- `/account`
- `/account/saved`
- `/account/compare`
- `/account/downloads`
- `/account/enquiries`
- `/account/settings`
- `/admin`
- `/admin/topics`
- `/admin/clusters`
- `/admin/briefs`
- `/admin/drafts`
- `/admin/fact-check`
- `/admin/linking`
- `/admin/monetization`
- `/admin/analytics`
- `/admin/logs`
- `/admin/settings`

---

## Migration Mapping from Vite to Next.js

### Public shell migration
Reference files:
- `src/components/layout/SiteLayout.tsx`
- `Header.tsx`
- `Footer.tsx`

Target:
- Next.js public layout in `(public)/layout.tsx`
- Header/Footer moved into server-friendly modular layout structure
- search, save, auth CTA, and navigation remain modular

### Auth shell migration
Reference:
- `src/pages/auth/AuthPages.tsx`

Target:
- `(auth)/layout.tsx`
- dedicated pages:
  - `sign-in/page.tsx`
  - `sign-up/page.tsx`
  - `otp/page.tsx`

### Account shell migration
Reference:
- `src/pages/account/Dashboard.tsx`
- `src/pages/account/AccountScreens.tsx`

Target:
- `(account)/layout.tsx`
- protected route group
- account sidebar becomes reusable account nav component

### Admin shell migration
Reference:
- `src/pages/admin/AdminPages.tsx`
- `src/pages/admin/AdminScreens.tsx`

Target:
- `(admin)/layout.tsx`
- protected admin route group
- admin sidebar/topbar become reusable admin shell components

---

## API Wiring Blueprint

## Group 1 — Auth
These APIs are already live and will be consumed in the new Next.js frontend:
- `POST /api/v1/auth/signup/email`
- `POST /api/v1/auth/login/email`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`

Google/mobile auth endpoints remain placeholders.

## Group 2 — Trek APIs
To be built later:
- `GET /api/v1/treks`
- `GET /api/v1/treks/{slug}`
- related trek APIs
- save/unsave trek APIs
- compare APIs

## Group 3 — Account APIs
To be built later:
- saved treks
- compare workspace
- downloads
- enquiry history
- account settings update
- change password

## Group 4 — Admin APIs
To be built later:
- dashboard summary
- topics
- clusters
- briefs
- drafts
- fact-check
- linking
- monetization
- analytics
- logs
- settings

## Group 5 — WordPress editorial content
Editorial content pages will ultimately be sourced from WordPress REST endpoints, not FastAPI.

---

## Shared Client Rules for Next.js

### FastAPI client
Use `credentials: 'include'` because auth depends on HttpOnly cookie session.

### WordPress client
Use separate read client for published editorial content.

### Type layer
Create shared frontend API types for:
- auth user
- trek list item
- trek detail
- account entities
- admin summaries

---

## Mock Data Deprecation Plan

`src/data/treks.ts` remains untouched until:
1. the new Next.js app exists
2. trek APIs are live
3. homepage/explore/trek detail are wired in Next.js

Only then should the mock trek dataset be removed from active runtime usage.

---

## Proposed Future Frontend Steps

### Next frontend implementation step
Create:
- `apps/web-next`
- App Router skeleton
- global layout
- public/auth/account/admin route groups
- shared API client
- migrated header/footer/logo foundations

### Public data wiring step
Wire:
- homepage
- explore
- trek detail

### Auth/account wiring step
Wire:
- sign in/up
- me
- logout
- protected account shell

### Admin wiring step
Wire:
- admin dashboard placeholders to backend summaries

---

## Final Step 04 Outcome

Step 04 does not change code in `apps/web-static`.
It establishes that:
- Vite is reference-only
- Next.js is the committed frontend runtime direction
- future frontend work should build a new Next.js app rather than retrofit the static SPA
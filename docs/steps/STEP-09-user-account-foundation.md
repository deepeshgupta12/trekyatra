# STEP 09 — user-account-foundation-frontend

## Status: done

## Goal
Wire the Next.js frontend auth flows (sign-in, sign-up) and account dashboard to the real FastAPI JWT auth backend. Add route guards, React auth context, and auth-aware header/account components.

## Scope
- Create typed client auth API helpers
- Create React AuthContext bootstrapped from `GET /me` on mount
- Add Next.js middleware route guards for `/account/*` and guest-only routes
- Wire sign-in and sign-up pages to real `login()` / `signup()` calls
- Add auth-aware header: avatar dropdown (desktop) + auth links (mobile drawer)
- Add `UserGreeting` client component for the account dashboard

## Preconditions
- Read docs/MASTER_TRACKER.md
- Read docs/PROCESS_GUARDRAILS.md
- Read docs/DEPENDENCY_MAP.md
- Confirm GitNexus graph is up to date
- Confirm Step 08 is complete (Next.js migration + all 85 pages build)

## Dependency Check
- `services/api/app/api/routes/auth.py` — no changes needed; all 4 endpoints already exist
- `apps/web-next/next.config.mjs` — rewrites proxy already configured; no changes needed
- `apps/web-next/components/Providers.tsx` — additive: wrap children in `<AuthProvider>`
- `apps/web-next/components/layout/Header.tsx` — additive: inject `useAuth` + user menu state
- No database schema changes

## Files Created
- `apps/web-next/lib/auth-api.ts` — typed client-only fetch helpers: `getCurrentUser`, `loginEmail`, `signupEmail`, `logoutApi`
- `apps/web-next/lib/auth-context.tsx` — `AuthProvider`, `useAuth` hook, `UserResponse` and `AuthContextValue` types
- `apps/web-next/middleware.ts` — Next.js route guard; reads `trekyatra_access_token` cookie
- `apps/web-next/components/account/UserGreeting.tsx` — client component for personalised greeting

## Files Modified
- `apps/web-next/components/Providers.tsx` — added `AuthProvider` wrap
- `apps/web-next/app/(auth)/auth/sign-in/page.tsx` — wired to `login()`; split `SignInForm` + `<Suspense>` for `useSearchParams`
- `apps/web-next/app/(auth)/auth/sign-up/page.tsx` — wired to `signup()`; redirects to `/auth/onboarding`
- `apps/web-next/components/layout/Header.tsx` — auth-aware desktop dropdown + mobile drawer
- `apps/web-next/app/(public)/account/page.tsx` — replaced static greeting with `<UserGreeting />`

## Auth Architecture
```
Browser → Next.js (port 3000)
  → POST /api/v1/auth/login (rewrite → FastAPI :8000)
  ← Set-Cookie: trekyatra_access_token (HttpOnly, SameSite=lax)
Browser → GET /api/v1/auth/me (cookie forwarded via Next.js rewrite)
  ← { id, email, full_name, display_name, ... }
```
- No CORS configuration needed (server-to-server proxy)
- Cookie is set for `localhost` domain; Next.js rewrite forwards it transparently
- `middleware.ts` checks cookie existence (not JWT validity) to decide redirects

## What Remains
- Saved treks / downloads / enquiries wired to real user data (future step)
- Onboarding form data persisted to backend (future step)
- OTP auth: frontend UI exists; backend stub returns 501
- Google OAuth: frontend button exists; backend stub returns 501
- Role-aware admin access enforcement (future step)

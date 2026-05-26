# Step 55 — Site-Wide Fixes Batch

## Status: In Progress

## Issues Fixed

### 1. Meta title double "TrekYatra"
Root cause: Root layout has `template: "%s | TrekYatra"` which auto-appends the suffix.
Pages that also manually append `| TrekYatra` get `"X | TrekYatra | TrekYatra"`.
Fix: Remove manual `| TrekYatra` suffixes from all generateMetadata returns; let layout template handle it.

### 2. Sitemap: trek_guide pages only in state sitemaps, not root
Root cause: `sitemap.ts` includes all published CMS pages including trek_guides.
Fix: Skip `trek_guide` page_type in root sitemap — they are covered by state-specific sitemaps.

### 3. Difficulty tabs: remove emoji icons
Root cause: DifficultyTabsSection.tsx renders 🟢🟡🔴 emoji in tab buttons.
Fix: Remove emoji spans.

### 4. Home editorial section: make static, remove Kedarkantha link
Root cause: "Read the guide" button links to `/trek/kedarkantha`.
Fix: Remove the link; make the section a non-clickable editorial block.

### 5. Auth session 24h + password eye icon
Root cause: `auth_access_token_expire_minutes: int = 60` (1 hour only).
Fix: Change to 1440 (24 hours). Add password show/hide eye icon to sign-in and sign-up pages.

### 6. Google/email login conflict
Root cause: Google OAuth creates user with no password. Email/password login hashes an empty string,
which never matches. Fix: Check in email login that user has a password set; return clear error.

### 7. SERP Organization logo
Root cause: `buildWebSiteSchema` may not be rendering the logo correctly for Google.
Fix: Verify Organization schema has `logo` with proper URL.

### 8. Regions nav hover UX
Root cause: `onMouseLeave` on individual nav item fires immediately when cursor moves to mega menu.
Fix: Use `setTimeout` delay (200ms) on the close handler, cleared by mega menu's `onMouseEnter`.

### 9. Search trending: real API
Root cause: `STATIC_TRENDING` hardcoded array; never fetches `/api/v1/search/trending`.
Fix: `useEffect` fetches real trending from API; falls back to static.

### 10. Search trek cards: real CMS data
Root cause: Search page uses static `treks.ts` for TrekCard data; no CMS override applied.
Fix: Merge `fetchTrekCMSOverrides()` into matchingTreks before rendering cards.

## Step docs (new features)
- STEP-56-news-agent.md — weekly news agent + /news/[slug] pages
- STEP-57-plan-my-trek-revamp.md — revamp of Plan My Trek feature

---

## Search Page Bug Fixes — 2026-05-26

Fixed 3 bugs that caused trending searches to show destination page titles and recent searches to not update.

### Issues Fixed

**11. Trending searches show destination page titles instead of user queries**
Root cause: `handleSuggestionClick` called `logSearchEvent({ query: label, ... })` where `label` is the CMS page title clicked (e.g., "Kedarkantha Trek Guide"). These destination titles accumulated in `search_events` and surfaced as trending instead of what users actually typed (e.g., "kedar"). Also: `q` was not in the `useCallback` dep array, causing a stale closure.
Fix: Changed to use `searchQuery = q.trim() || label` — saves and logs the actual typed query. Added `q` to deps array.

**12. Recent searches not updating when clicking TrekCard results**
Root cause: `handleResultClick` called `logSearchEvent` (backend log) but never called `handleQueryCommit`, so `localStorage` was never written and the `recent` state never updated.
Fix: Added `handleQueryCommit(q)` call in `handleResultClick` before the backend log.

**13. Recent searches not saved for passive browsing**
Root cause: No auto-save path for users who type a query, read results, and navigate away without pressing Enter or clicking any result.
Fix: Added a debounced `useEffect` that saves to `localStorage` after 1.5s of inactivity on a 3+ char query.

### Files Modified
- `apps/web-next/app/(public)/search/page.tsx`
  - `handleSuggestionClick`: use `q.trim() || label` as search query; add `q` to deps array
  - `handleResultClick`: call `handleQueryCommit(q)` to save recent; add `handleQueryCommit` to deps
  - Added auto-save `useEffect` (1.5s debounce, 3+ char threshold)

### Test results
`next build` passes with zero TypeScript errors.

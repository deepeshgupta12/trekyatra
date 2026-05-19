# Step 44 — Discovery Engine Improvements (Search, Interlinking, Recommendations, Compare)

## Status: Done — commits 6e3dd9d + (Step 44 remaining, 2026-05-19)

## What was implemented (original commit 6e3dd9d)
- **Search analytics**: `search_events` table (migration 0031), POST /search/log, GET /search/suggestions (CMS full-text), GET /search/trending
- **Compare 3-trek support**: up to 3 treks, dynamic columns, share URL (?slugs=), navigator.share
- **Frontend**: `logSearchEvent()` + `fetchSearchSuggestions()` in lib/api.ts
- **Tests**: 8 new search tests pass

## What was implemented (Step 44 remaining, 2026-05-19)

### A. Search frontend wiring
- `apps/web-next/app/(public)/search/page.tsx`: debounced `fetchSearchSuggestions()` (API-powered CMS autocomplete), click tracking via `logSearchEvent()`, page type badges on all result items, recent searches (localStorage `ty_recent_searches`, max 5), "Did you mean?" for near-miss queries (Fuse.js score threshold)

### B. Recommendations — behavioral signals
- `services/api/alembic/versions/20260519_0032_page_views.py`: `page_views` table migration
- `services/api/app/modules/search/models.py`: `PageView` ORM model
- `services/api/app/modules/search/service.py`: `record_page_view()` function
- `services/api/app/api/routes/analytics.py`: `POST /track/page-view` endpoint
- `services/api/app/modules/recommendations/service.py`: `get_anonymous_recommendations()` now blends popularity (30-day view count × 0.6) + recency (epoch × 0.4) with cluster diversity
- `apps/web-next/components/trek/TrekViewTracker.tsx`: writes to `ty_recently_viewed` localStorage
- `apps/web-next/app/(public)/account/page.tsx`: "Recently viewed" section reads from localStorage

### C. Internal linking improvements
- `services/api/app/modules/linking/service.py`: `get_anchor_suggestions()` now returns `quality` score (0.5–0.9) for each suggestion; sorted descending by quality
- `services/api/app/schemas/linking.py`: `AnchorSuggestion` schema now includes `quality: float = 0.5`
- `apps/web-next/lib/api.ts`: `AnchorSuggestion` interface updated with optional `quality`
- `apps/web-next/app/(admin)/admin/linking/page.tsx`: quality score displayed as percentage badge per anchor suggestion

### D. Compare — saved comparisons
- `services/api/alembic/versions/20260519_0033_account_comparisons.py`: `account_comparisons` table migration (FK → users.id CASCADE)
- `services/api/app/modules/account/models.py`: `AccountComparison` ORM model (JSONB slugs, user FK)
- `services/api/app/modules/account/service.py`: `list_comparisons()`, `save_comparison()`, `delete_comparison()`
- `services/api/app/schemas/account.py`: `ComparisonCreate` + `ComparisonResponse` schemas
- `services/api/app/api/routes/account.py`: `GET /account/comparisons`, `POST /account/comparisons`, `DELETE /account/comparisons/{id}`
- `apps/web-next/lib/api.ts`: `fetchComparisons()`, `saveComparison()`, `deleteComparison()`, `trackPageView()`
- `apps/web-next/app/(public)/account/compare/page.tsx`: fully wired to real API (list, delete, link to /compare?slugs=)

### E. Trek guide — "In this cluster" sidebar
- `apps/web-next/app/(public)/trek/[slug]/page.tsx`: fetches `fetchRelatedPages(slug, 5)` server-side, renders "In this cluster" sidebar block in right column (degrades gracefully if empty)

### Tests (new)
- `services/api/tests/test_discovery_improvements.py`: 11 new tests — TC-B01 through TC-B11

## What is deferred (post-launch)
- Collaborative filtering ("readers also read…") based on session co-occurrence
- Editorial link pin/unpin in admin (requires separate `link_pins` table)
- Search click tracking wired into /search page sidebar filter tabs

## Notes
- Requires: `alembic upgrade head` (migrations 0032 + 0033 applied 2026-05-19)
- GitNexus re-index required after this step

## Summary
A comprehensive improvement pass across four interconnected discovery features: site search, internal linking, content recommendations, and trek comparison. Each subsystem is functional but has significant quality gaps that reduce user engagement and SEO value.

## Motivation
- Search (Fuse.js) is client-side fuzzy matching: no ranking by relevance/popularity, no search analytics, no autocomplete for guides/packing lists (only treks)
- Internal linking is frequency-based but has no anchor text quality scoring or editorial override
- Recommendations are pgvector cosine-similarity but use no behavioral signals (clickthrough, time-on-page)
- Compare is functional but limited to 2 treks with a fixed attribute set; no saved comparisons

## Scope

### A. Search Improvements
**Backend:**
- POST `/search/log` — record query + result clicks (new `search_events` table)
- GET `/search/suggestions?q=X` — unified suggestions across all CMS page types (not just treks)
- Add search ranking: boost pages by recency, view count, cluster importance score

**Frontend:**
- `SearchBar` / `/search` page: expand autocomplete to include guides, packing lists, regions (all CMS page types)
- Show recent searches (localStorage)
- "Did you mean?" for near-misses (Fuse.js `getScore()` threshold 0.4–0.6)
- Search results: show page type badge (Trek Guide, Permit Guide, Packing List etc.)
- Track clicks on search results → POST `/search/log`

### B. Internal Linking Improvements
**Backend:**
- Improve anchor text suggestion quality: weight by target page's SEO title, primary keyword, cluster
- Add editorial override: allow admin to pin/unpin specific links per page
- Orphan page auto-suggestion: suggest the top 3 internal links for each orphan based on keyword overlap

**Frontend:**
- `/admin/linking`: show quality score per suggested link, allow pin/unpin
- On public trek pages: show related links more prominently (currently just `RelatedContent` at the bottom)
- Add "In this cluster" sidebar block for trek guide pages

### C. Recommendation Engine Improvements
**Backend:**
- Add `page_views` table: record anonymous + authenticated page views with session_id
- Weight recommendations by view count (popularity signal) + recency
- Collaborative filtering lite: "readers of this page also read…" based on session co-occurrence
- A/B test: pgvector similarity vs. collaborative recommendations

**Frontend:**
- `RecommendedContent`: show 3 recommendations (currently shows varying amounts)
- Add "Recently viewed" section on `/account` page (localStorage + API hybrid)
- Track page views: fire POST `/track/page-view` on every public page load

### D. Compare Feature Improvements
**Backend:**
- GET `/compare?slugs=a,b,c` — multi-trek comparison (up to 3 treks)
- Allow comparison of CMS pages (not just static trek data)

**Frontend:**
- `/compare`: allow comparing 3 treks simultaneously (not just 2)
- Add more comparison attributes: max altitude, fitness level required, permits needed, operator availability
- `/account/compare` (currently a stub): save comparisons server-side via POST `/account/comparisons`
- Share link: `/compare?slugs=kedarkantha,hampta-pass`

## Files to Create (Backend)
- `services/api/app/modules/search/models.py` — `search_events`, `page_views` tables
- `services/api/app/modules/search/service.py` — search logging + suggestions
- `services/api/app/api/routes/search.py` — new search endpoints
- `services/api/tests/test_search.py`

## Files to Modify
- Multiple frontend components (per section above)
- `services/api/app/modules/links/service.py` — anchor text quality scoring
- `services/api/app/modules/cms/service.py` — recommendations with popularity

## Dependencies
- Step 22 (internal linking) — done ✅
- Step 24 (analytics) — done ✅
- Step 35 (recommendation engine) — done ✅

## Acceptance Criteria
- [ ] Search covers all CMS page types with type badge in results
- [ ] Search clicks are tracked in `search_events`
- [ ] Recommendations blend similarity + popularity signals
- [ ] Compare supports 3 treks with extended attribute set
- [ ] `/account/compare` persists saved comparisons
- [ ] All backend tests pass; `next build` clean

# Step 42 — CMS-Driven Static Pages

## Status: Done — commit b4924d6 (2026-05-15)

## Summary
All pages that currently serve static hardcoded content must become CMS-driven. The CMS (cms_pages table) is the single source of truth for all public content. When a CMS page with the matching slug exists, it is served; when it doesn't, the static fallback is used. Owner creates pages in the admin CMS — no code deployment required to update any content page.

## Motivation
- Currently many pages (`/about`, `/contact`, `/privacy`, `/terms`, `/affiliate-disclosure`, `/safety-disclaimer`, `/methodology`, `/explore` hub text, etc.) contain hardcoded content in `.tsx` files
- Any content change requires a code deployment
- Content should be owned by the operator, not the developer
- CMS is live and operational — extend its reach to all public pages

## Scope

### Pages to CMS-ify (owner creates CMS page with matching slug)
| URL | CMS Slug | Notes |
|-----|----------|-------|
| `/about` | `about` | Editorial mission, team |
| `/about/authors` | `about-authors` | Editor bios |
| `/contact` | `contact` | Contact info, response times |
| `/privacy` | `privacy-policy` | Legal |
| `/terms` | `terms-of-service` | Legal |
| `/affiliate-disclosure` | `affiliate-disclosure` | Legal |
| `/safety-disclaimer` | `safety-disclaimer` | Legal |
| `/methodology` | `editorial-methodology` | Trust content |
| `/explore` (hub intro) | `explore-hub` | Intro text only; trek grid remains static |
| `/newsletter` | `newsletter-page` | Subscribe page copy |

### How it works
- Each page component checks CMS first: `fetchCMSPage(slug)` 
- If CMS page exists and is `published` → render CMS content
- If not → fall back to existing static JSX (no regression)
- No new page types needed — all are `page_type: "editorial"` or existing types

## Files to Create
- None (pure content, owner creates in admin CMS)

## Files to Modify
- `app/(public)/about/page.tsx` — add CMS check with static fallback
- `app/(public)/about/authors/page.tsx` — add CMS check
- `app/(public)/contact/page.tsx` — add CMS check
- `app/(public)/privacy/page.tsx` — add CMS check
- `app/(public)/terms/page.tsx` — add CMS check
- `app/(public)/affiliate-disclosure/page.tsx` — add CMS check
- `app/(public)/safety-disclaimer/page.tsx` — add CMS check
- `app/(public)/methodology/page.tsx` — add CMS check
- `app/(public)/explore/page.tsx` — add CMS intro block with static fallback
- `app/(public)/newsletter/page.tsx` — add CMS check

## Implementation Pattern (for each page)
```tsx
// At top of server component:
const cmsPage = await fetchCMSPage("about").catch(() => null);

// In JSX: render CMS content if available, else static
{cmsPage?.status === "published" ? (
  <ContentPage page={cmsPage} />
) : (
  /* existing static JSX */
)}
```

## Dependencies
- Step 16 (CMS) — done ✅
- Step 18 (ContentPage component) — done ✅
- `fetchCMSPage` in `lib/api.ts` — done ✅

## Acceptance Criteria
- [ ] Each listed page checks CMS first before rendering static content
- [ ] Static fallback always renders if no CMS page exists (no regressions)
- [ ] Owner can update any page content via `/admin/cms` without a deploy
- [ ] `next build` passes with zero errors after changes

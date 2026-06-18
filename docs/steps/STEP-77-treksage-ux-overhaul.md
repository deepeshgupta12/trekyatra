# Step 77 — TrekSage UX Overhaul: Myra-Inspired UI + Search Fix + Inline Detail + Compare

**Status:** Done
**Date:** 2026-06-18
**Scope:** Search keyword fix, Myra-like split-screen chat UI, inline trek detail panel, compare selection, trek card analytics link

---

## Problem Statement

User testing (post-Step-76 hotfixes) surfaced 5 issues:

1. **Search returns empty for natural-language queries** — `search_treks` uses exact substring match (`query.lower() not in haystack`). "best snowfall treks in December" finds nothing because no trek title/name/SEO-desc contains that exact phrase.
2. **`recommend_treks` ignores full month names** — `_MONTH_ORD` in `matching.py` only has abbreviated forms ("Dec"). When agent calls `recommend_treks(months=["December"])`, "December" is not in `_MONTH_ORD` → `user_m` set is empty → season score = 0 for all treks.
3. **Chat UI not Myra-like** — no split-screen, no thinking cascade, no visual hierarchy between user/AI bubbles.
4. **Trek cards lack detail access** — name should be a clickable link with `?ref=treksage` (analytics); "View Details" should render an inline trek detail panel in the right canvas, not just a text response.
5. **No compare flow in TrekSage** — user can't select multiple treks and compare side-by-side from the chat.

---

## Root Causes

### Bug 1 — `search_treks` exact substring
```python
# BEFORE (broken):
if query.lower() not in haystack:  # exact phrase match — almost always misses
    continue
# haystack only includes trek_name + title + seo_description
```

### Bug 2 — `_MONTH_ORD` abbreviations only
```python
_MONTH_ORD = {"Jan": 1, ..., "Dec": 12}  # "December" NOT present
user_m = {_MONTH_ORD[m] for m in user_months if m in _MONTH_ORD}  # empty for ["December"]
```

---

## Implementation Plan

### Commit 1 — Backend search fix
- `service.py:search_treks`: Tokenize query into meaningful keywords (remove stop words, len≥3). OR-match any keyword against extended haystack (name + title + seo_desc + season + state + region + themes + structured month names).
- `matching.py:_MONTH_ORD`: Add full month names ("January"→1 … "December"→12).
- `tests/test_treksage.py`: Add TC-B tests for keyword search and full month name scoring.

### Commit 2 — Frontend Myra-inspired UI + inline detail + compare
- `TreksageChat.tsx`: Full rewrite with:
  - Split-screen layout (chat left 40% / canvas right 60%) animated on trek-card arrival
  - White/cream background (#FAF5EE), dark forest-green user pill (#1D3A2E), white AI card with shadow
  - Multi-stage thinking animation: pulsing dots → step cascade (Searching → Analyzing → Preparing)
  - Input bar: glowing orange ring on focus, send/stop morph
  - Trek cards moved to right canvas with hero image, badges, "View Details" + "Add to Compare"
  - Trek name → `/trek/[slug]?ref=treksage` (new tab)
  - Compare selection state (up to 4 treks); "Compare (N)" button triggers compare_treks tool call via new message
  - Stagger-fade animation on card arrival
- `TrekDetailPanel.tsx` (new): Inline detail panel rendered in right canvas from trek_cards data — hero image, key facts grid, season, permit, themes, "View Full Page" link, "Plan This Trek" → pre-fills Plan wizard.

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/web-next/app/(public)/treksage/TrekDetailPanel.tsx` | Inline trek detail for right canvas |
| `docs/steps/STEP-77-treksage-ux-overhaul.md` | This file |

## Files to Modify

| File | Change |
|------|--------|
| `services/api/app/modules/trek_intelligence/service.py` | `search_treks`: keyword tokenization |
| `services/api/app/modules/trek_intelligence/matching.py` | `_MONTH_ORD`: add full month names |
| `services/api/tests/test_treksage.py` | New search + month-name tests |
| `apps/web-next/app/(public)/treksage/TreksageChat.tsx` | Full Myra-inspired rewrite |

---

## Verification

- `POST /api/v1/treksage/chat {"message":"best snowfall treks in December"}` → returns real trek cards, not fallback
- `POST /api/v1/treksage/chat {"message":"recommend treks for December"}` → season scores correctly
- `/treksage` page: split-screen appears on first bot response with cards
- Trek name click → navigates to `/trek/[slug]?ref=treksage`
- "View Details" click → inline detail panel appears in right canvas
- "Add to Compare" on 2+ cards → "Compare (N)" button → sends compare message → comparison table in canvas
- Mobile (375px): single-column, canvas hidden, cards appear inline in chat
- `next build` passes zero errors
- Full pytest suite: zero new failures

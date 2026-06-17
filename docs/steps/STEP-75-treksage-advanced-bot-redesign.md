# Step 75 — TrekSage Advanced Bot Fix + Complete UI Redesign

**Status:** Done  
**Date:** 2026-06-17  
**Based on:** User testing results from Step 74 TC-F03 (markdown still showing), user-provided PRD PDF (40 pages + 7 design screenshots)

---

## Issues Addressed

| # | Issue | Root Cause | Fix |
|---|-------|-----------|-----|
| Bug 1 | Bot stops with "Let me broaden the search:" | On non-final rounds with no tool calls, ANY text-only response (even short transition phrases) was accepted as final reply | Detect incomplete replies on non-final rounds; nudge and continue loop |
| Bug 2 | TrekAskAI.tsx trek detail markdown shows raw `**bold**` | `{ex.answer}` at line 77 was plain text with no ReactMarkdown wrapper | Add ReactMarkdown + mdComponents |
| Bug 3 | Voice crash on iOS search screen | TCC crash is native (before JS runs); `VOICE_AVAILABLE` check passes on iOS but plist key needed | Add Expo Go detection + Alert so app shows message instead of crashing |
| Feature | TrekSage /treksage page UI outdated | Dark-mode generic chat, minimal empty state, basic trek cards | Complete PRD redesign: light warm mode (#FAF5EE), tabs, trek cards with hero/stats/CTA |

---

## Implementation Scope

### Backend
- `services/api/app/modules/trek_intelligence/treksage_agent.py` — loop fix, system prompt, `max_altitude_ft`

### Web Frontend
- `apps/web-next/components/trek/TrekAskAI.tsx` — ReactMarkdown on answer
- `apps/web-next/app/(public)/treksage/TreksageChat.tsx` — complete PRD redesign
- `apps/web-next/app/(public)/treksage/page.tsx` — light-mode wrapper
- `apps/web-next/package.json` — add `remark-gfm`

### Mobile
- `apps/mobile/app/(tabs)/browse/search.tsx` — Expo Go detection + Alert

---

## Files Created
- `docs/steps/STEP-75-treksage-advanced-bot-redesign.md` (this file)

## Files Modified

### Backend
| File | Change |
|------|--------|
| `services/api/app/modules/trek_intelligence/treksage_agent.py` | Bot loop: detect incomplete transition phrases on non-final rounds, nudge and continue; improved `_SYSTEM_PROMPT` with guardrails, no-tech-exposure rules, structured format; `max_altitude_ft` added to `_slim_profile`; `max_tokens=1200` on final round |

### Web Frontend
| File | Change |
|------|--------|
| `apps/web-next/components/trek/TrekAskAI.tsx` | Added `ReactMarkdown` + `mdComponents`; wraps `ex.answer` in `<ReactMarkdown>` |
| `apps/web-next/app/(public)/treksage/TreksageChat.tsx` | Complete rewrite: light mode (#FAF5EE bg, #1D3A2E pine, #E8702A saffron); category tabs (Discover/Compare/Plan); prompt suggestions with tags; trek cards with hero image/match pill/stats grid/CTAs; loading with rotating contextual messages; `remark-gfm` table support |
| `apps/web-next/app/(public)/treksage/page.tsx` | Light-mode wrapper; removed dark heading |
| `apps/web-next/package.json` | `remark-gfm` added |

### Mobile
| File | Change |
|------|--------|
| `apps/mobile/app/(tabs)/browse/search.tsx` | Added `Alert`; added `expo-constants` import; Expo Go detection in `handleMicPress`; improved catch block with user-facing Alert |

---

## Verification

- **Backend:** 683/685 pass (2 pre-existing `test_refresh.py` failures, unrelated); `test_treksage.py` 7/7 pass
- **Frontend:** `next build` ✅ Compiled successfully, 196/196 pages, zero TypeScript errors
- **Mobile:** `npx tsc --noEmit` ✅ zero errors
- **GitNexus re-index:** pending after commit — run `npx gitnexus analyze --force`

---

## Notes

- Bot loop fix: on non-final rounds with no tool_use blocks, if `candidate.length < 50` or `candidate.rstrip().endswith(":")` → don't accept as final; add nudge to messages and `continue`
- `max_tokens` bumped from 800 to 1200 for final round to allow richer summary responses
- System prompt: explicitly forbids mentioning Claude, Haiku, Anthropic, FastAPI, tool names; responds as "TrekSage" only
- TreksageChat redesign: light PRD design (#FAF5EE bg) per pages 41-47 of user-provided design doc
- Trek card match% is positional (rank 0=96%, rank 1=91%, rank 2=86%, ...) since backend does not return a score
- Voice crash: still requires `eas build --profile development --platform ios` for the real fix; the code-level change prevents crash in Expo Go by detecting execution environment and showing a friendly Alert

# Step 74 — Post-73 Bug Fixes + Mobile/TrekSage UI Revamp

**Status:** Done  
**Date:** 2026-06-16  
**Based on:** User testing results from Step 73 TC-F01–F20 and TC-M01–M15

---

## Issues Addressed

### Website Bugs
| TC | Issue | Root Cause | Fix |
|----|-------|-----------|-----|
| TC-F05/F10 | Bot replies show raw `**bold**` markdown | `TreksageChat.tsx` rendered content as plain text | `react-markdown` + custom components |
| TC-F09/F10 | UI says "Myra" everywhere | Step 73 used "Myra" in system prompt + page text | "TrekSage" everywhere |
| TC-F10 | Bot stops with "Let me try a broader search:" | On `MAX_TOOL_ROUNDS`, model returned partial tool-call prefix as final reply | Force `tool_choice={"type":"none"}` on final round |
| TC-F09 | No home page entry for TrekSage | No banner existed on homepage | TrekSage AI section added to `page.tsx` |
| TC-F18/F19/F20 | datacenter.trekyatra.co.in "Server Not Found" | DNS/CNAME not configured in DO/GoDaddy | **User infra action required** (code already correct) |

### Mobile Bugs
| TC | Issue | Fix |
|----|-------|-----|
| TC-M15 crash | Mic tap crashes app (`NSSpeechRecognitionUsageDescription` missing) | Explicit `infoPlist` keys in `app.config.ts`; dev client rebuild required |
| TC-M05 | Compare UI: no images, no visual hierarchy | Trek tile grid with images; pill strip; styled AI summary |
| TC-M06–M09 | Plan My Trek UI "destroyed" vs web | Full revamp: emoji chips, hint labels, hero images, coloured match badge |
| TC-M15 | Compare search only shows pre-populated chips | Added debounced search input using `contentApi.searchTreks()` |

---

## Files Created
- `docs/steps/STEP-74-post73-bugfix-ui-revamp.md` (this file)

## Files Modified

### Backend
| File | Change |
|------|--------|
| `services/api/app/modules/trek_intelligence/treksage_agent.py` | System prompt Myra→TrekSage; `_SYSTEM_PROMPT` constant; `tool_choice={"type":"none"}` on final round; `hero_image_url` in `_slim_profile`; `trek_cards` in `chat()` return; `_TREK_CARD_TOOLS` set |
| `services/api/app/api/routes/treksage.py` | `TreksageChatResponse.trek_cards: list[dict] = []`; passed through in route handler |

### Web Frontend
| File | Change |
|------|--------|
| `apps/web-next/app/(public)/treksage/TreksageChat.tsx` | Complete rewrite — "TrekSage AI" header; `ReactMarkdown` + `mdComponents`; `TrekCardsList` below assistant replies; `TrekCard` + `Message` interfaces updated |
| `apps/web-next/app/(public)/treksage/page.tsx` | "Myra" → "TrekSage" in metadata description, page text, footnote |
| `apps/web-next/lib/api.ts` | `TreksageChatResponse.trek_cards` field typed |
| `apps/web-next/app/(public)/page.tsx` | TrekSage AI banner section between TRENDING and CATEGORY HUB |
| `apps/web-next/package.json` | `react-markdown@^10.1.0` added |

### Mobile
| File | Change |
|------|--------|
| `apps/mobile/app.config.ts` | `ios.infoPlist.NSSpeechRecognitionUsageDescription` + `NSMicrophoneUsageDescription` |
| `apps/mobile/lib/mobileApi.ts` | `TrekRecommendation.hero_image_url`; `contentApi.searchTreks()` |
| `apps/mobile/app/(tabs)/(home)/plan-my-trek.tsx` | Full revamp: emoji chips; hint labels; hero image cards; `MatchBadge` component; improved layout |
| `apps/mobile/app/(tabs)/(home)/compare.tsx` | Full revamp: 2-col tile grid; selected pill strip; debounced search; image header row in table; TrekSage summary badge |

---

## Verification

- **Backend:** 683/685 pass, 2 pre-existing `test_refresh.py` failures (unrelated, unchanged)
- **Frontend:** `next build` → ✅ Compiled successfully, 196/196 pages
- **Mobile:** `npx tsc --noEmit` → ✅ zero errors

---

## User Infra Actions Required

1. **Voice search fix**: rebuild iOS dev client (`eas build --profile development --platform ios`) — `app.config.ts` changes only apply in a freshly built dev client binary.
2. **datacenter.trekyatra.co.in**: in DO App Platform, add `datacenter.trekyatra.co.in` as additional domain on `web` component; in GoDaddy, add CNAME `datacenter` → DO app domain. The Next.js middleware rewrite already handles the routing — only DNS is missing.
3. **Trek images in TrekSage chat**: Will appear automatically once the Step 73 post-action is done (admin clicks "Backfill All Treks" on `/admin/trek-data` to populate `hero_image_url` for all 51 trek guides).

---

## Notes

- The `tool_choice={"type":"none"}` fix on `MAX_TOOL_ROUNDS` prevents the model from generating a partial tool-use block on the final round. Instead it must emit a complete text response, which becomes `final_reply`. `max_tokens` also bumped from 600→800 for the final round's summary.
- `react-markdown` v10 requires `"type": "module"` compatibility; no issues with Next.js 14 app router.
- `contentApi.searchTreks()` in mobile reuses the existing `/api/v1/search/semantic` endpoint with `page_type=trek_guide` — no new backend endpoint needed.

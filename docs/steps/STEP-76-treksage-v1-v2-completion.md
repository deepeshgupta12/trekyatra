# Step 76 — TrekSage V1 Completion + V2 Features

**Status:** Done  
**Date:** 2026-06-17  
**Scope:** All pending V1 and V2 TrekSage MCP features (global widget, guided wizard, lead capture, admin logs, mobile chat tab)

---

## What Was Delivered

### V1 Remaining → Now Complete

| Feature | Files | Status |
|---------|-------|--------|
| Global floating TrekSage widget (all public pages) | `components/treksage/TrekSageWidget.tsx`, `components/layout/SiteLayout.tsx` | ✅ Done |
| 7-step guided Plan Wizard | `components/treksage/PlanWizard.tsx`, `TreksageChat.tsx` | ✅ Done |
| Lead capture modal (expert help CTA) | `components/treksage/LeadCaptureModal.tsx`, `TreksageChat.tsx` | ✅ Done |

### V2 → Done

| Feature | Files | Status |
|---------|-------|--------|
| Mobile TrekSage chat tab (center FAB) | `apps/mobile/app/(tabs)/treksage.tsx`, `_layout.tsx`, `CustomTabBar.tsx` | ✅ Done |
| Admin TrekSage Logs dashboard | `apps/web-next/app/(admin)/admin/treksage-logs/page.tsx`, `layout.tsx` | ✅ Done |

---

## Files Created

| File | Purpose |
|------|---------|
| `apps/web-next/components/treksage/TrekSageWidget.tsx` | Global floating FAB + compact chat drawer on all public pages |
| `apps/web-next/components/treksage/PlanWizard.tsx` | 7-step chip-selection guided planner (Region → Duration → Difficulty → Budget → Month → Group → Preferences) |
| `apps/web-next/components/treksage/LeadCaptureModal.tsx` | Lead capture form (name, email, phone, trek interest, month) → `POST /api/v1/leads/operator-help` |
| `apps/web-next/app/(admin)/admin/treksage-logs/page.tsx` | Admin AI interaction logs dashboard with source/tool_name filters |
| `apps/mobile/app/(tabs)/treksage.tsx` | Mobile TrekSage chat screen (DISCOVER/COMPARE/PLAN tabs, message bubbles, session persistence via AsyncStorage) |
| `docs/steps/STEP-76-treksage-v1-v2-completion.md` | This file |

---

## Files Modified

### Backend
| File | Change |
|------|--------|
| `services/api/app/modules/trek_intelligence/service.py` | `list_ai_interaction_logs`: added `source` and `tool_name` optional filter params |
| `services/api/app/api/routes/admin_treks.py` | `get_ai_interaction_logs`: added `source` and `tool_name` Query params; default limit bumped to 100 |

### Web Frontend
| File | Change |
|------|--------|
| `apps/web-next/components/layout/SiteLayout.tsx` | Added `<TrekSageWidget />` — renders on all public pages, hides itself on `/treksage` via `usePathname` |
| `apps/web-next/app/(public)/treksage/TreksageChat.tsx` | Added `showWizard` and `showLeadModal` state; PlanWizard trigger button in Plan tab; "Get Expert Help" CTA bar after conversations |
| `apps/web-next/lib/api.ts` | `fetchAiInteractionLogs`: added `source` and `toolName` optional params; default limit 100 |
| `apps/web-next/app/(admin)/admin/layout.tsx` | Added `MessageSquare` import + "TrekSage Logs" nav entry in System group |

### Mobile
| File | Change |
|------|--------|
| `apps/mobile/app/(tabs)/_layout.tsx` | Added `<Tabs.Screen name="treksage">` between browse and plan |
| `apps/mobile/components/tabs/CustomTabBar.tsx` | `isCenter` now checks `route.name === "treksage"` (was "plan"); center FAB icon `chatbubbles`; added Plan icon `sparkles-outline`/`sparkles`; added treksage label |
| `apps/mobile/lib/mobileApi.ts` | Added `TreksageMobileTrekCard`, `TreksageMobileChatResponse`, `TreksageMobileMessage` interfaces; `treksageChatMobile()`, `fetchTreksageHistoryMobile()` functions |

---

## Design Details

### TrekSageWidget (global floating)
- Pine circle FAB (56×56) fixed bottom-6 right-4/6 on all public pages
- Live pulse indicator on FAB (emerald dot over saffron notification dot)
- Compact chat panel: 380px wide × 480px tall, bottom-anchored slide-in
- Separate localStorage session key `treksage_widget_session` (independent from full-page session)
- "Open full TrekSage experience →" link to `/treksage`
- Self-hides when `pathname === "/treksage"`

### PlanWizard (7 steps)
1. Region: Himachal Pradesh | Uttarakhand | Ladakh/J&K | Sikkim/NE | Maharashtra | Anywhere
2. Duration: Weekend (2–3d) | Short (4–5d) | Week (6–7d) | Extended (8+d)
3. Difficulty: Easy | Moderate | Difficult | Expert
4. Budget: Under ₹5k | ₹5–10k | ₹10–20k | ₹20k+
5. Month: Jan–Dec (4-column grid)
6. Group: Solo | Couple | Small group (3–8) | Large group (9+)
7. Preferences (multi-select): Beginner-friendly | Family-friendly | No permit required | High altitude | Photography focus | No preference

Completion → constructs natural language prompt → calls `send()` in parent TreksageChat → closes wizard

### Mobile TrekSage Tab
- Replaces Plan as center FAB (chatbubbles icon, saffron background)
- Plan becomes a regular icon tab (sparkles icon)
- Layout: [Home] [Explore] [TrekSage-FAB] [Plan] [Saved] [You]
- Full chat: Discover/Compare/Plan prompt chips in empty state, message bubbles, trek card chips inline, session persistence via AsyncStorage

---

## Verification

- **Backend:** `test_admin_ai_logs` passes; `list_ai_interaction_logs` filter params work (source, tool_name); 40/40 trek intelligence + treksage tests pass
- **Frontend:** `next build` ✅ Compiled successfully; 197 pages; zero TypeScript errors
- **Mobile:** `npx tsc --noEmit` ✅ zero errors
- **GitNexus re-index:** pending (to run after commit)

---

## Notes
- `TrekSageWidget` uses the same `POST /api/v1/treksage/chat` endpoint as the full `/treksage` page but maintains a separate `localStorage` session key (`treksage_widget_session`) so widget conversations don't pollute the full-page chat history
- The "lockfile patch" warning in `next build` is a pre-existing Next.js workspace issue unrelated to Step 76 changes — compiled successfully
- Mobile `treksage.tsx` does not render trek cards as rich UI cards (matching web TrekResultCard) to keep the implementation lean; trek cards appear as text chips with name + difficulty. A richer card layout can be added in a future step if needed.
- The 6-tab mobile layout (Home | Explore | TrekSage-FAB | Plan | Saved | You) is the recommended final tab architecture per PRD V2 intent. Plan tab remains accessible as a regular sparkles icon tab.

---

## Post-Step-76 Hotfixes (2026-06-17–18, commits 3a33716 / 88ddd49 / 387de83)

### Hotfix 1 — commit 3a33716
- `SiteLayout.tsx`: Hooks violation fix — widget conditional return moved inside component (uses `usePathname()` guard, not early return between hooks); fixes React errors #418/#423/#300
- `TreksageChat.tsx`: `messagesContainerRef.scrollTo({top:scrollHeight})` replaces `scrollIntoView` (page was scrolling instead of container)
- `treksage_agent.py`: `MAX_HISTORY_MESSAGES` cut 20→6; logging guard added

### Hotfix 2 — commit 88ddd49
- `TreksageChat.tsx`: `session_key` always persisted to `localStorage` even on error reply (session key was lost on agent failure)

### Hotfix 3 — commit 387de83 (full TreksageChat rewrite)
- `treksage_agent.py`: `tool_choice={"type":"any"}` on round 0 forces tool call before any text output; post-process fallback for transition phrases ending with `:`
- `TreksageChat.tsx`: Full rewrite — sessions sidebar (Today/Yesterday/Earlier), `userSentRef` scroll guard, voice input (Web Speech API + pulsing popup), emoji fix (🏕→⛺, 🗓→📅), trek cards `sm:grid-cols-2`, `treksageSlideUp` animation
- `page.tsx`: `h-[calc(100vh-4rem)] overflow-hidden` full-screen layout; `max-w-2xl` removed

# STEP-M29 — v1.1 Redesign: Post-Build Fixes (1.1.0 device test)

**Status:** Issues recorded + confirmed by owner 2026-07-30. This is the MASTER tracker for the
redesign fixes — every defect (D01–D27) is checked off here as it lands.
**Blocking:** App Store review submission is BLOCKED until every item below is resolved.
**Source:** Owner device-test of `1.1.0 (1)` — 11 screenshots, 15 reported issues + navigation,
broken into distinct defects (IDs Dnn). Fixes follow the process (gitnexus impact per symbol,
tsc, both-platform, MD updates).

## ⚠️ Regression-safety principle (applies to EVERY fix)
Each incremental fix/enhancement MUST NOT break current UI, existing implementations, features,
functionality, or **between-screen navigation**. Before each commit: gitnexus impact on touched
symbols; confirm the change is additive/scoped; re-check that navigations into and out of the
touched screen still work. Prefer the smallest change that resolves the defect. If a fix risks a
shared component (TrekCard/tab bar/router), isolate it and note the blast radius.

## Navigation is currently broken (owner)
- **D27** — **Screen-to-screen navigation is not working correctly** (cross-cutting). Diagnose the
  router/route wiring across the app (may overlap D04 chip→Explore, D05 view-all, and pushed-screen
  back behaviour). Verify every tab, drawer item, card tap, "View all", back, and deep link routes
  to the correct screen. This is a **first-class, high-priority** item — fix + verify holistically.

---

## HOME  (owner issues 1, 3, 4)

### Owner #1 — Home top (screenshot 1)
- **D01** — Excess **padding above the greeting/username** block at the top of Home.
- **D02** — Quick-filter chips (Difficulty / Length / Elevation gain) are **not centre-aligned**.
- **D03** — **"Length" filter is wrong** — there is no length data. Rename to **"Duration"** and wire
  the real **duration** filter behaviour.
- **D04** — Tapping a quick-filter chip must **navigate to Explore with the filter bottom-sheet
  OPENED** (currently it just routes to browse; sheet not opened, filter not applied).

### Owner #3 — "View all"/"See all" (screenshot 2)
- **D05** — **"View all" / "See all"** on every Home section (Explore by Region, Treks by difficulty,
  Popular, etc.) **does nothing** — no navigation and no filter applied on the destination.

### Owner #4 — Personalized feed (screenshot 3)
- **D06** — **News articles must NOT appear** in the personalized "For {name} / Based on your
  browsing history" feed.
- **D07** — The personalized **"For {name}" section must move to the TOP** of Home (above "Popular
  with trekkers") — it is the core personalized section.
- **D08** — **Re-verify the entire Home personalization + recommendation logic** against ALL defined
  use cases: logged-in / logged-out, new / repeat, onboarding done / skipped, cross-web sync
  (STEP-M28 matrix).

---

## BOTTOM NAVIGATION  (owner issue 2)
- **D09** — Bottom-nav **pill UI quality is poor** (needs a proper modern-app treatment).
- **D10** — **Extra padding inside the bottom** of the bottom nav.

---

## EXPLORE  (owner issues 5, 6)
- **D11** — **Explore filters need a full revisit.** Filter source must be the **CMS fields used by
  the WEB Explore screen** PLUS the **trek data used by Compare** — the union of both (unique
  fields + combinations). Rebuild the filter set from these real fields.
- **D12** — When **some filters are applied, scrolling stops working** on Explore.

---

## TREK DETAIL  (owner issues 7, 8, 9, 12)

### Owner #7 — hero + summary (screenshot 4)
- **D13** — Hero image **bottom corners are not rounded** (must match the approved reference UI).
- **D14** — **State is repeated** in the hero (region pill "UTTARAKHAND" + subtitle "Uttarakhand").
- **D15** — **Trek metadata** (trek-data backfill + Master CMS trek fields) renders **below the Trail
  Route** — wrong position; it should sit above / be repositioned per the reference.
- **D16** — The **Trail Route image (summary card) is not clickable**.

### Owner #8 — photo tour + log + nav (screenshot 5)
- **D17** — The **Photo-tour image is not clickable**.
- **D18** — The **"I did this trek — log it"** banner **collides with the navigation**.
- **D19** — The **navigation UI is broken / not aligned** with modern mobile-app conventions.

### Owner #9 — section collision (screenshot 6)
- **D20** — The **"Ask TrekSage" section collides with the Trail Route Map** section (overlap).

### Owner #12 — scroll safe-area (screenshot 8)
- **D21** — On scroll, the **pinned section-tab navigation collides with the device top** (notch /
  Dynamic Island) — safe-area not respected on the pinned bar.

---

## COMPARE  (owner issue 10, screenshot 7)
- **D22** — Selected **trek chips (pills) show NO trek name** (the compare selection chips at top are
  blank). [Recurrence of the earlier compare-name contrast bug — re-check.]

---

## PROFILE  (owner issue 11)
- **D23** — **Saved treks + saved comparisons are not reflected** in the user's profile
  (Saved / Comparisons screens empty despite saving).

---

## SETTINGS  (owner issue 13, screenshot 9)
- **D24** — **App version is hardcoded to 1.0.0** — must be **dynamic** (read the real app version,
  i.e. show 1.1.0 now, auto-updating per release).

---

## AUTH  (owner issue 14, screenshot 10)
- **D25** — In **dark mode the TrekYatra logo is invisible** on welcome/sign-in. Use the adaptive
  icon / a dark-mode-visible logo variant.

---

## NOTIFICATIONS  (owner issue 15, screenshot 11)
- **D26** — **Notification-centre UI is broken** (header padding/layout off at the top).

---

## Summary count
15 owner issues + navigation → **27 tracked defects (D01–D27)** across Navigation (1), Home (8),
Bottom nav (2), Explore (2), Trek detail (9), Compare (1), Profile (1), Settings (1), Auth (1),
Notifications (1).

## Fix priority (functional & cross-cutting first, visual last)
1. **Navigation (D27)** — cross-cutting; diagnose + fix routing so nothing else is built on broken nav.
2. **Home functional** — D04 (chip→Explore+sheet), D05 (view-all), D06/D07/D08 (personalization order+logic).
3. **Explore functional** — D11 (filters from Web CMS fields + Compare trek data), D12 (scroll).
4. **Data reflection** — D23 (saved/comparisons in profile), D22 (compare chip names), D24 (dynamic version).
5. **Trek detail** — D13–D21 (rounding, state dup, metadata order, clickable map/photo, collisions, safe-area).
6. **Visual/UI** — D01/D02/D03 (home top), D09/D10 (bottom nav), D25 (dark logo), D26 (notifications).

Each group = its own commit (gitnexus impact + tsc + regression re-check + MD update). Then rebuild `1.1.0 (2)`.

## Progress (checked off as landed)
_(none yet)_

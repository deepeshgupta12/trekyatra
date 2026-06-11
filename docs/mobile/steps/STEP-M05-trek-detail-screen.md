# STEP-M05 — Trek Detail Screen

**Status:** Done ✓ (2026-06-10)
**Phase:** Foundation
**Dependencies:** STEP-M04 (offline engine + CMSContentRenderer)

---

## Scope

Build the core trek detail screen — the most important content surface in the app. Every trek guide page from the web (`/trek/[slug]`) must render natively with full CMS content. Sub-guides (packing, permits, costs) are tab-accessible without leaving the screen. The screen works offline using the SQLite cache built in M04.

Delivers:
- Trek detail screen with hero image, metadata strip, and CMS body rendering
- Bottom tab switcher: Guide | Packing | Permits | Costs
- Table of contents (anchor scroll via `SectionList` or `ScrollView` refs)
- Sticky bottom CTA bar: "Plan with this trek" + "Save" bookmark
- Native share sheet (sharing the web URL)
- Offline download toggle (calls M04 OfflineStore)
- Recently viewed tracking (writes to behavior profile in AsyncStorage)
- Operator inquiry deeplink
- Related trek cards section
- Trek news cards section

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/mobile/app/(tabs)/(home)/trek/[slug].tsx` | Trek detail screen (Expo Router dynamic route) |
| `apps/mobile/app/(tabs)/(home)/trek/[slug]/packing.tsx` | Packing tab (delegates to CMSContentRenderer) |
| `apps/mobile/app/(tabs)/(home)/trek/[slug]/permits.tsx` | Permits tab |
| `apps/mobile/app/(tabs)/(home)/trek/[slug]/costs.tsx` | Costs tab |
| `apps/mobile/components/trek/TrekHero.tsx` | Hero image + gradient overlay + title |
| `apps/mobile/components/trek/TrekMetaStrip.tsx` | Duration / Altitude / Difficulty / Season chips |
| `apps/mobile/components/trek/TrekTabBar.tsx` | Guide / Packing / Permits / Costs switcher |
| `apps/mobile/components/trek/TrekTableOfContents.tsx` | H2 headings extracted from body_json; tap scrolls to section |
| `apps/mobile/components/trek/TrekStickyBar.tsx` | Fixed bottom bar: Plan CTA + Save button |
| `apps/mobile/components/trek/TrekOperatorCard.tsx` | "Plan with an operator" card linking to operators screen |
| `apps/mobile/components/trek/TrekRelatedRow.tsx` | Horizontal scroll row of related trek cards |
| `apps/mobile/components/trek/TrekNewsRow.tsx` | Latest news cards for this trek |
| `apps/mobile/components/trek/TrekCard.tsx` | Trek card (same data shape as web TrekCard) |
| `apps/mobile/hooks/useTrekDetail.ts` | TanStack Query hook: fetch trek, packing, permits, costs |

---

## Screen Layout

```
┌─────────────────────────────────────┐
│  [Back arrow]     Trek Name    [⬆️ Share] [↓ Save offline]  │ ← Header
├─────────────────────────────────────┤
│  Hero image (full-width, 260px)     │
│  Gradient overlay: trek name + state│
├─────────────────────────────────────┤
│  [Duration] [Altitude] [Difficulty] [Season]  │ ← Meta strip
├─────────────────────────────────────┤
│  [Guide] [Packing] [Permits] [Costs]│ ← Tab bar
├─────────────────────────────────────┤
│                                     │
│  CMS body content                   │
│  (CMSContentRenderer)               │
│                                     │
│  [Table of contents]                │
│  [Related treks row →]              │
│  [Latest news cards]                │
│  [Operator inquiry card]            │
│                                     │
├─────────────────────────────────────┤
│  [Plan with this trek]  [♥ Save]    │ ← Sticky bottom CTA
└─────────────────────────────────────┘
```

---

## Data Fetching

```typescript
// hooks/useTrekDetail.ts
export function useTrekDetail(slug: string) {
  // Try network first, fall back to SQLite
  return useQuery({
    queryKey: ['trek', slug],
    queryFn: async () => {
      try {
        const page = await api.get<CMSPage>(`/cms/pages/${slug}`);
        // Background: upsert into SQLite
        await db.insert(cmsPages).values(mapPageToDb(page))
          .onConflictDoUpdate({ target: cmsPages.slug, set: mapPageToDb(page) });
        return page;
      } catch (networkError) {
        // Offline fallback
        const cached = await db.select().from(cmsPages)
          .where(eq(cmsPages.slug, slug)).limit(1);
        if (cached[0]) return mapDbToPage(cached[0]);
        throw networkError;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
```

---

## Behavior Tracking

On screen mount, record the trek view in behavior profile (mirrors web `recordTrekView`):

```typescript
// In trek detail screen useEffect
useEffect(() => {
  if (!trek) return;
  recordTrekView({
    slug: trek.slug,
    region: trek.trek_state || trek.region,
    difficulty: trek.trek_difficulty || '',
    season: trek.trek_season || '',
  });
}, [trek?.slug]);
```

`recordTrekView` writes to `AsyncStorage` key `ty_behavior_v1` using the same schema as web `localStorage`.

---

## Tab Switching

```typescript
// components/trek/TrekTabBar.tsx
type Tab = 'guide' | 'packing' | 'permits' | 'costs';

const TABS: { key: Tab; label: string }[] = [
  { key: 'guide',   label: 'Guide' },
  { key: 'packing', label: 'Packing' },
  { key: 'permits', label: 'Permits' },
  { key: 'costs',   label: 'Costs' },
];
```

Each tab has its own `useTrekDetail(slug-variant)` query (e.g. slug `kedarkantha` for guide, `kedarkantha-packing` for packing page — same slug convention as web).

If the sub-page (packing/permits/costs) doesn't exist in CMS, the tab shows:
```
[Icon]
"No packing guide available yet for this trek."
[Browse general packing guides →]
```

---

## Native Share Sheet

```typescript
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';

async function shareTrek(slug: string, name: string) {
  await Share.share({
    message: `Check out the ${name} trek guide on TrekYatra`,
    url: `https://trekyatra.co.in/trek/${slug}`,
    title: `${name} Trek Guide`,
  });
}
```

---

## Hero Image

```tsx
// components/trek/TrekHero.tsx
import { Image } from 'expo-image';

<Image
  source={{ uri: heroImageUrl }}
  style={{ width: '100%', height: 260 }}
  contentFit="cover"
  placeholder={blurhash}
  transition={300}
/>
<LinearGradient
  colors={['transparent', 'rgba(12,14,20,0.95)']}
  style={StyleSheet.absoluteFill}
/>
```

Blurhash placeholder prevents layout shift while image loads. Expo Image provides automatic disk caching — hero images stay cached across sessions.

---

## Meta Strip

```
[🕐 6 days] [⛰ 12,500 ft] [●●○ Moderate] [❄️ Dec–Apr]
```

Each chip: small rounded pill with icon + text. Colour coding:
- Difficulty Easy → pine green
- Difficulty Moderate → amber
- Difficulty Challenging/Difficult → red

---

## Sticky Bottom CTA

```tsx
// components/trek/TrekStickyBar.tsx
<View style={styles.stickyBar}>
  <TouchableOpacity onPress={() => router.push('/plan')} style={styles.planButton}>
    <Text style={styles.planButtonText}>✦ Plan with this trek</Text>
  </TouchableOpacity>
  <SaveButton slug={slug} />
</View>
```

Save button: calls `POST /api/v1/account/saved` (auth required). If not signed in, shows sign-in prompt sheet.

---

## Affiliate Gear Cards

Trek detail pages may include affiliate product cards (gear recommendations) as part of the CMS body. The `CMSContentRenderer` must handle the `monetization_slot` block type from body_json:

```typescript
// In CMSContentRenderer — handle monetization_slot block
case 'monetization_slot':
  if (block.slot_type === 'affiliate_card' && block.product_url) {
    return (
      <AffiliateCard
        key={block.id}
        title={block.title}
        description={block.notes}
        productUrl={block.product_url}
        imageUrl={block.image_url}
      />
    );
  }
  return null;
```

`AffiliateCard` opens the affiliate URL via `Linking.openURL()` — native browser handles the external link. The affiliate disclosure blurb ("We may earn a commission") renders as a small note below each card. All affiliate URLs on the web use `/trek/[slug]` paths — confirm M22 note that share URLs use `/trek/` not `/treks/` (fixed in web bugfix commit `63d0460`).

---

## Safety Disclaimer Banner

Trek detail screen shows a safety disclaimer nudge in the meta strip area for treks with `trek_difficulty = "Challenging"` or `trek_difficulty = "Difficult"`:

```tsx
{trek.trek_difficulty !== 'Easy' && trek.trek_difficulty !== 'Moderate' && (
  <TouchableOpacity onPress={() => router.push('/safety-disclaimer')}>
    <Text>⚠️ Always trek with a certified guide. See safety guidelines →</Text>
  </TouchableOpacity>
)}
```

---

## Offline Indicator

When content served from SQLite (no network), show:

```
[⬇ Offline content · Last synced: May 28]
```

Banner displayed below meta strip. Tapping it triggers a manual sync.

---

## Verification

## Files Created
| File | Purpose |
|------|---------|
| `apps/mobile/app/(tabs)/(home)/_layout.tsx` | Stack layout for home group — enables back-nav from trek detail |
| `apps/mobile/app/(tabs)/(home)/trek/[slug].tsx` | Trek detail screen (hero, meta strip, tabs, sticky CTA) |
| `apps/mobile/components/trek/TrekHero.tsx` | expo-image hero + LinearGradient overlay + title |
| `apps/mobile/components/trek/TrekMetaStrip.tsx` | Duration/altitude/difficulty/season chips |
| `apps/mobile/components/trek/TrekTabBar.tsx` | Guide/Packing/Permits/Costs tab switcher |
| `apps/mobile/components/trek/TrekStickyBar.tsx` | "Plan with this trek" + Save button (auth-gated) |
| `apps/mobile/components/trek/TrekCard.tsx` | Reusable trek card (shared with M06) |
| `apps/mobile/components/trek/TrekRelatedRow.tsx` | Horizontal related treks scroll row |
| `apps/mobile/hooks/useTrekDetail.ts` | TanStack Query: network-first + SQLite fallback |
| `apps/mobile/lib/mobileApi.ts` | Bearer-token API client with auto-refresh |
| `apps/mobile/lib/behaviorProfile.ts` | AsyncStorage ty_behavior_v1 read/write + recordTrekView() |

## Files Modified
| File | Change |
|------|--------|
| `apps/mobile/app/(tabs)/_layout.tsx` | Changed Home tab name from `"index"` to `"(home)"` |
| `apps/mobile/app.config.ts` | Added `"expo-image"` to plugins |

## Notes
- `expo-image` and `expo-linear-gradient` installed (SDK 56-compatible versions)
- Old placeholder `app/(tabs)/index.tsx` removed; home screen moved to `(home)/index.tsx` for stack nav
- OfflineBadge uses `visible={fromCache}` prop (existing component API)
- Sub-page tabs use `slug-packing`, `slug-permits`, `slug-costs` convention matching web CMS
- `tsc --noEmit`: 0 errors

### Bugfix Pass (2026-06-11) — Mobile Crosscheck (M-DS1–M06)
The `"index"` → `"(home)"` route rename above had two downstream consequences not caught at the time, both fixed in this pass (see `docs/MASTER_TRACKER.md` "Mobile Crosscheck Bugfix Pass" for full details):
- `apps/mobile/app/_layout.tsx` `AuthGate` still redirected to the now-invalid `"/(tabs)"` route after login — fixed to `"/(tabs)/(home)"` (caught via `tsc --noEmit` TS2345; this was the root cause of "login does nothing").
- `apps/mobile/components/tabs/CustomTabBar.tsx` `getIconName`/`getLabelText` still switched on the old `"index"` route name — Home tab showed default icon + raw "(home)" label. Fixed to `"(home)"`.

---

## Frontend Test Cases (Pending Manual Verification)

Run: `cd apps/mobile && npx expo start` (open in iOS Simulator or Expo Go)

### TC-M05-F01: Trek detail — hero image + meta strip
**Setup:** Be signed in. Tap any TrekCard on the home or browse screen.
**Steps:**
1. Tap a trek card (e.g. Kedarkantha)
2. Wait for screen to load
**Expected:** Full-bleed hero image loads (blur placeholder → full image within 300ms); LinearGradient title overlay shows trek name + state at bottom of hero; meta chip row below hero shows duration, altitude, difficulty, season chips with colour coding (green for Easy, amber for Moderate, red for Difficult).
**Pass =** All 4 data chips visible; hero fills full width; no layout shift after image loads

---

### TC-M05-F02: Trek detail — Guide tab CMS content
**Steps:**
1. Open any trek detail
2. Verify default tab is "Guide"
**Expected:** CMS body renders below tab bar — paragraphs, headings, callout blocks, lists, images visible depending on content. Active tab has saffron underline indicator.
**Pass =** Body renders; "Guide" tab is active (saffron underline); no blank screen

---

### TC-M05-F03: Trek detail — tab switching (Packing / Permits / Costs)
**Steps:**
1. Open Kedarkantha trek detail
2. Tap "Packing" tab → wait 1s
3. Tap "Permits" tab → wait 1s
4. Tap "Costs" tab → wait 1s
**Expected:** Each tab loads its sub-page content (`kedarkantha-packing`, `kedarkantha-permits`, `kedarkantha-costs` slugs). If CMS page doesn't exist, shows "📋 No packing guide available yet" empty state with grey subtitle.
**Pass =** No crash on any tab; either content or graceful empty state on each

---

### TC-M05-F04: Trek detail — sticky CTA bar (Plan + Save)
**Steps:**
1. Open any trek detail
2. Scroll down
3. Tap "✦ Plan with this trek"
4. Go back → tap heart icon (while signed in)
**Expected:** CTA bar stays pinned at bottom; "Plan" navigates to Plan tab; heart fills to orange (♥) after tap; no sign-in redirect when already authenticated.
**Pass =** CTA visible at all scroll positions; navigation works; heart state changes

---

### TC-M05-F05: Trek detail — save while unauthenticated
**Steps:**
1. Sign out
2. Open any trek detail
3. Tap heart icon
**Expected:** App redirects to sign-in screen (no crash, no silent failure).
**Pass =** Sign-in screen appears after tapping save while logged out

---

### TC-M05-F06: Trek detail — share sheet
**Steps:**
1. Open any trek detail
2. Tap the ⬆ button (top-right, overlaid on header)
**Expected:** Native iOS/Android share sheet appears with message "Check out the {trek name} trek guide on TrekYatra" and URL `https://trekyatra.co.in/trek/{slug}`.
**Pass =** Share sheet opens; URL contains `/trek/` (not `/treks/`)

---

### TC-M05-F07: Trek detail — offline fallback
**Steps:**
1. Open a trek detail while online (data loads and caches to SQLite)
2. Enable airplane mode (iOS Settings → Airplane Mode)
3. Kill the app and reopen it
4. Navigate to the same trek
**Expected:** Trek content renders from SQLite cache; orange offline badge appears below meta strip ("📵 Offline").
**Pass =** Content visible without network; offline badge shown

---

### TC-M05-F08: Trek detail — safety disclaimer for difficult treks
**Steps:**
1. Open a trek with difficulty "Challenging" or "Difficult" (e.g. Rupin Pass)
**Expected:** Red warning banner "⚠️ Always trek with a certified guide. See safety guidelines →" appears below meta strip.
**Pass =** Banner visible; not shown on Easy/Moderate treks

---

### TC-M05-F09: Trek detail — related treks row
**Steps:**
1. Open any trek detail
2. Scroll to bottom of Guide tab
**Expected:** "You might also like" section appears with a horizontal row of trek cards. Tapping a card navigates to that trek's detail.
**Pass =** At least 2–4 related trek cards visible; navigation works; back arrow returns to previous trek

---

### TC-M05-F10: Behavior profile tracking
**Steps:**
1. Open any trek detail
2. Go back to home screen
3. Check AsyncStorage key `ty_behavior_v1` (via Expo Dev Tools or React Native Debugger)
**Expected:** Entry exists with `slug`, `region`, `difficulty`, `season`, and `ts` (timestamp) fields.
**Pass =** ty_behavior_v1 JSON has at least 1 view entry matching the trek you opened

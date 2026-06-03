# STEP-M05 — Trek Detail Screen

**Status:** Pending
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

### Manual smoke tests
1. **TC-M05-01**: Open Kedarkantha trek detail → hero image, meta strip, CMS body all render
2. **TC-M05-02**: Tap "Packing" tab → packing guide content loads
3. **TC-M05-03**: Tap "Permits" tab → permit guide content loads
4. **TC-M05-04**: Tap "Costs" tab → cost guide content loads
5. **TC-M05-05**: Tap share button → native share sheet appears with web URL
6. **TC-M05-06**: Tap "Save" → bookmark created → button fills (auth required)
7. **TC-M05-07**: Enable airplane mode, open previously-synced trek → content renders from SQLite + offline badge shows
8. **TC-M05-08**: Trek with no packing guide → Packing tab shows "No guide available" empty state
9. **TC-M05-09**: Table of contents entries → tapping scrolls to correct section
10. **TC-M05-10**: Behavior profile in AsyncStorage updated after viewing trek

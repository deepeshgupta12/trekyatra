# STEP-M04 — CMS Offline Content Engine

**Status:** Pending
**Phase:** Foundation
**Dependencies:** STEP-M01 (scaffold), STEP-M03 (/mobile/sync endpoint)
**Backend dependency:** None (reads from M03 endpoint)

---

## Scope

Build the offline-first content layer. Trek guides, packing lists, permit guides, and cost guides are downloaded to the device's SQLite database so they are fully readable without network access — critical for trekkers on trail with no signal.

This step delivers:
- `expo-sqlite` + Drizzle ORM schema for the device-side content database
- Sync service that fetches from `/mobile/sync` and upserts into SQLite
- Background sync on app foreground (every 15 minutes when online)
- `CMSContentRenderer` component that renders the CMS `body_json` block format as native components
- Manual "Download for offline" toggle per trek (prominently placed on trek detail screens)
- Offline indicator badge showing when content is read from cache, not from network
- Download manager screen showing all offline-saved content

---

## Files to Create

### SQLite Schema (Drizzle ORM)
| File | Purpose |
|------|---------|
| `apps/mobile/db/schema.ts` | Drizzle schema: `cmsPages`, `syncMeta`, `offlineQueue` tables |
| `apps/mobile/db/client.ts` | `expo-sqlite` connection + Drizzle client init |
| `apps/mobile/db/migrations/` | Drizzle migration files (run on first app launch) |

### Sync Service
| File | Purpose |
|------|---------|
| `apps/mobile/services/syncService.ts` | `syncContent()` — fetches /mobile/sync, upserts to SQLite |
| `apps/mobile/services/backgroundSync.ts` | AppState listener — triggers sync on app foreground |
| `apps/mobile/hooks/useSync.ts` | Hook: `isSyncing`, `lastSyncAt`, `triggerSync()`, `syncProgress` |

### Content Renderer
| File | Purpose |
|------|---------|
| `apps/mobile/components/cms/CMSContentRenderer.tsx` | Root renderer: dispatches body_json blocks to type-specific renderers |
| `apps/mobile/components/cms/blocks/ParagraphBlock.tsx` | `<p>` blocks |
| `apps/mobile/components/cms/blocks/HeadingBlock.tsx` | H2/H3 with anchor IDs |
| `apps/mobile/components/cms/blocks/ImageBlock.tsx` | Images with caption (expo-image) |
| `apps/mobile/components/cms/blocks/ListBlock.tsx` | Ordered + unordered lists |
| `apps/mobile/components/cms/blocks/TableBlock.tsx` | Data tables (ScrollView + responsive) |
| `apps/mobile/components/cms/blocks/CalloutBlock.tsx` | Warning / tip / info callout boxes |
| `apps/mobile/components/cms/blocks/FAQBlock.tsx` | Accordion FAQ sections |
| `apps/mobile/components/cms/blocks/AffiliateCardBlock.tsx` | Affiliate product cards |

### Download Manager
| File | Purpose |
|------|---------|
| `apps/mobile/components/trek/OfflineToggle.tsx` | Download/delete toggle button for a single trek |
| `apps/mobile/screens/OfflineContentScreen.tsx` | List of all downloaded trek guides |
| `apps/mobile/stores/offlineStore.ts` | Zustand: `downloadedSlugs: string[]`, `download()`, `remove()` |
| `apps/mobile/components/trek/OfflineBadge.tsx` | Badge shown when content served from SQLite |

---

## SQLite Schema (Drizzle)

```typescript
// db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const cmsPages = sqliteTable('cms_pages', {
  slug:           text('slug').primaryKey(),
  title:          text('title').notNull(),
  pageType:       text('page_type').notNull(),
  heroImageUrl:   text('hero_image_url'),
  trekState:      text('trek_state'),
  trekDifficulty: text('trek_difficulty'),
  trekDuration:   text('trek_duration'),
  trekAltitude:   text('trek_altitude'),
  trekSeason:     text('trek_season'),
  bodyJson:       text('body_json'),       // JSON string; parse on read
  seoDescription: text('seo_description'),
  syncedAt:       text('synced_at').notNull(), // ISO datetime
  isDownloaded:   integer('is_downloaded', { mode: 'boolean' }).default(false),
});

export const syncMeta = sqliteTable('sync_meta', {
  id:          integer('id').primaryKey(),
  lastSyncAt:  text('last_sync_at'),  // ISO datetime of last successful sync
  totalPages:  integer('total_pages').default(0),
});
```

---

## Sync Service Logic

```typescript
// services/syncService.ts
async function syncContent(apiClient: ApiClient) {
  const meta = await db.select().from(syncMeta).limit(1);
  const lastSync = meta[0]?.lastSyncAt ?? null;

  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const resp = await apiClient.get<SyncOut>('/mobile/sync', {
      params: { last_sync: lastSync, limit: 100, offset }
    });

    // Upsert updated pages
    for (const page of resp.updated) {
      await db.insert(cmsPages).values({
        slug: page.slug,
        bodyJson: JSON.stringify(page.body_json),
        syncedAt: new Date().toISOString(),
        // ... all fields
      }).onConflictDoUpdate({ target: cmsPages.slug, set: { ... } });
    }

    // Mark deleted pages (soft: set syncedAt to null so they show as stale)
    for (const slug of resp.deleted_slugs) {
      await db.delete(cmsPages).where(eq(cmsPages.slug, slug));
    }

    hasMore = resp.has_more;
    offset += 100;
  }

  // Update sync meta
  await db.update(syncMeta).set({ lastSyncAt: new Date().toISOString() });
}
```

### Background Sync Trigger
```typescript
// services/backgroundSync.ts
import { AppState } from 'react-native';

let lastForegroundSync: number = 0;
const SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

AppState.addEventListener('change', (nextState) => {
  if (nextState === 'active') {
    const now = Date.now();
    if (now - lastForegroundSync > SYNC_INTERVAL_MS) {
      lastForegroundSync = now;
      syncContent(apiClient).catch(console.error);
    }
  }
});
```

---

## CMS Body JSON Block Format

The web CMS stores content as a `body_json` array of blocks. The mobile renderer must handle all block types:

```typescript
type Block =
  | { type: 'paragraph'; content: string }
  | { type: 'heading'; level: 2 | 3; content: string; id?: string }
  | { type: 'image'; url: string; alt: string; caption?: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'callout'; variant: 'warning' | 'tip' | 'info'; content: string }
  | { type: 'faq'; items: Array<{ question: string; answer: string }> }
  | { type: 'affiliate_card'; product_name: string; price: string; url: string; image: string }
  | { type: 'html'; content: string }; // render as WebView for complex HTML
```

`CMSContentRenderer` maps each block type to its native component:

```tsx
// components/cms/CMSContentRenderer.tsx
export function CMSContentRenderer({ bodyJson }: { bodyJson: Block[] }) {
  return (
    <View>
      {bodyJson.map((block, i) => {
        switch (block.type) {
          case 'paragraph':     return <ParagraphBlock key={i} {...block} />;
          case 'heading':       return <HeadingBlock key={i} {...block} />;
          case 'image':         return <ImageBlock key={i} {...block} />;
          case 'list':          return <ListBlock key={i} {...block} />;
          case 'table':         return <TableBlock key={i} {...block} />;
          case 'callout':       return <CalloutBlock key={i} {...block} />;
          case 'faq':           return <FAQBlock key={i} {...block} />;
          case 'affiliate_card':return <AffiliateCardBlock key={i} {...block} />;
          case 'html':          return <WebView key={i} html={block.content} style={{height: 300}} />;
          default:              return null;
        }
      })}
    </View>
  );
}
```

---

## Data Fetch Strategy (Network vs SQLite)

Every content screen uses this priority order:

```
1. TanStack Query: attempt API fetch (network request)
2. On success: update SQLite cache (upsert)
3. On network error / offline: read from SQLite
4. If SQLite also empty: show "Content not available offline" empty state + "Sync when online" CTA
5. Show OfflineBadge when serving from SQLite
```

---

## Manual Download Flow

```
User taps "Download for offline" toggle on trek detail screen
  → OfflineStore: download(slug)
  → Fetch all 4 page types for this trek slug:
      GET /mobile/sync?last_sync=&slugs=slug,slug/packing,slug/permits,slug/costs
  → Upsert all 4 pages into SQLite with is_downloaded = true
  → OfflineToggle shows filled icon (green)
  → Trek appears in Downloads screen

User taps "Remove download"
  → OfflineStore: remove(slug)
  → UPDATE cms_pages SET is_downloaded = false WHERE slug LIKE '{slug}%'
  → Trek removed from Downloads screen (but still in SQLite cache for background sync)
```

---

## Downloads Screen

```
[Page header: "Offline Content"]
[Total size badge: "~12 MB downloaded"]

[Trek list — only is_downloaded = true]
  Each row:
    [Hero thumbnail (cached)] Trek Name    [Region badge]
    [4 pages: Guide ✓  Packing ✓  Permits ✓  Costs ✓]
    [Last synced: 2026-05-28]   [Delete button]

[Empty state: "No offline content yet. Download trek guides before heading into the mountains."]
```

---

## New Packages

```json
"expo-sqlite": "~14.0.0",
"drizzle-orm": "^0.30.0",
"drizzle-kit": "^0.20.0"
```

---

## Verification

### Manual smoke tests
1. **TC-M04-01**: First app launch → sync runs → SQLite populated with trek guides
2. **TC-M04-02**: Enable airplane mode → open a trek guide → content renders from SQLite + OfflineBadge shows
3. **TC-M04-03**: Tap "Download for offline" on Kedarkantha → all 4 page types downloaded → appear in Downloads screen
4. **TC-M04-04**: Remove a download → trek removed from Downloads screen
5. **TC-M04-05**: Background app for 20 minutes → foreground → sync runs automatically
6. **TC-M04-06**: body_json with all block types renders correctly (paragraph, heading, image, list, table, callout, FAQ, affiliate card)
7. **TC-M04-07**: Network error during sync → error caught silently → SQLite content still accessible

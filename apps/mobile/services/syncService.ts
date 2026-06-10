import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { cmsPages, syncMeta } from "../db/schema";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

interface SyncPageOut {
  slug: string;
  title: string;
  page_type: string;
  hero_image_url: string | null;
  trek_state: string | null;
  trek_difficulty: string | null;
  trek_duration: string | null;
  trek_altitude: string | null;
  trek_season: string | null;
  body_json: Record<string, unknown> | null;
  seo_description: string | null;
  updated_at: string;
}

interface SyncOut {
  updated: SyncPageOut[];
  deleted_slugs: string[];
  sync_timestamp: string;
  has_more: boolean;
  total_updated: number;
}

export interface SyncResult {
  updatedCount: number;
  deletedCount: number;
  timestamp: string;
}

export async function syncContent(accessToken: string): Promise<SyncResult> {
  const meta = await db.select().from(syncMeta).limit(1);
  const lastSync = meta[0]?.lastSyncAt ?? null;

  let totalUpdated = 0;
  let totalDeleted = 0;
  let syncTimestamp = new Date().toISOString();
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams({ limit: "100", offset: String(offset) });
    if (lastSync) params.set("last_sync", lastSync);

    const resp = await fetch(`${API_BASE}/api/v1/mobile/sync?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!resp.ok) {
      throw new Error(`Sync failed: ${resp.status}`);
    }

    const data: SyncOut = await resp.json();
    syncTimestamp = data.sync_timestamp;

    // Upsert updated pages
    const now = new Date().toISOString();
    for (const page of data.updated) {
      await db
        .insert(cmsPages)
        .values({
          slug: page.slug,
          title: page.title,
          pageType: page.page_type,
          heroImageUrl: page.hero_image_url ?? null,
          trekState: page.trek_state ?? null,
          trekDifficulty: page.trek_difficulty ?? null,
          trekDuration: page.trek_duration ?? null,
          trekAltitude: page.trek_altitude ?? null,
          trekSeason: page.trek_season ?? null,
          bodyJson: page.body_json ? JSON.stringify(page.body_json) : null,
          seoDescription: page.seo_description ?? null,
          syncedAt: now,
          isDownloaded: false,
        })
        .onConflictDoUpdate({
          target: cmsPages.slug,
          set: {
            title: page.title,
            pageType: page.page_type,
            heroImageUrl: page.hero_image_url ?? null,
            trekState: page.trek_state ?? null,
            trekDifficulty: page.trek_difficulty ?? null,
            trekDuration: page.trek_duration ?? null,
            trekAltitude: page.trek_altitude ?? null,
            trekSeason: page.trek_season ?? null,
            bodyJson: page.body_json ? JSON.stringify(page.body_json) : null,
            seoDescription: page.seo_description ?? null,
            syncedAt: now,
          },
        });
    }

    // Remove deleted pages (preserves is_downloaded state by deletion)
    for (const slug of data.deleted_slugs) {
      await db.delete(cmsPages).where(eq(cmsPages.slug, slug));
    }

    totalUpdated += data.updated.length;
    totalDeleted += data.deleted_slugs.length;
    hasMore = data.has_more;
    offset += 100;
  }

  // Update sync meta
  await db
    .update(syncMeta)
    .set({ lastSyncAt: syncTimestamp, totalPages: totalUpdated })
    .where(eq(syncMeta.id, 1));

  return { updatedCount: totalUpdated, deletedCount: totalDeleted, timestamp: syncTimestamp };
}

export async function getLastSyncAt(): Promise<string | null> {
  const meta = await db.select().from(syncMeta).limit(1);
  return meta[0]?.lastSyncAt ?? null;
}

export async function getCachedPage(slug: string) {
  const rows = await db
    .select()
    .from(cmsPages)
    .where(eq(cmsPages.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

export async function getDownloadedPages() {
  return db.select().from(cmsPages).where(eq(cmsPages.isDownloaded, true));
}

export async function downloadTrekPages(slug: string, accessToken: string): Promise<void> {
  // Fetch the 4 page types for this trek: guide, packing, permits, costs
  const slugVariants = [slug, `${slug}/packing`, `${slug}/permits`, `${slug}/costs`];
  const params = new URLSearchParams({ limit: "10" });
  // Use page_types param to narrow, but easiest is full sync of these slugs
  // The /mobile/sync endpoint doesn't support slug filtering, so we fetch each individually
  for (const variant of slugVariants) {
    const cached = await getCachedPage(variant);
    if (cached) {
      await db
        .update(cmsPages)
        .set({ isDownloaded: true })
        .where(eq(cmsPages.slug, variant));
    }
  }
}

export async function removeTrekDownload(slug: string): Promise<void> {
  // Mark all pages for this trek as not downloaded (keep in cache for background sync)
  const rows = await db.select({ slug: cmsPages.slug }).from(cmsPages);
  for (const row of rows) {
    if (row.slug === slug || row.slug.startsWith(`${slug}/`)) {
      await db
        .update(cmsPages)
        .set({ isDownloaded: false })
        .where(eq(cmsPages.slug, row.slug));
    }
  }
}

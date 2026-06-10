import { useQuery } from "@tanstack/react-query";
import { contentApi, NotFoundError } from "@/lib/mobileApi";
import type { CMSPage } from "@/lib/mobileApi";
import { db } from "@/db/client";
import { cmsPages } from "@/db/schema";
import { eq } from "drizzle-orm";

function mapPageToDb(page: CMSPage) {
  return {
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
    syncedAt: new Date().toISOString(),
    isDownloaded: false,
  };
}

function mapDbToPage(row: typeof cmsPages.$inferSelect): CMSPage {
  return {
    slug: row.slug,
    title: row.title,
    page_type: row.pageType,
    hero_image_url: row.heroImageUrl ?? null,
    trek_state: row.trekState ?? null,
    trek_difficulty: row.trekDifficulty ?? null,
    trek_duration: row.trekDuration ?? null,
    trek_altitude: row.trekAltitude ?? null,
    trek_season: row.trekSeason ?? null,
    body_json: row.bodyJson ? (JSON.parse(row.bodyJson) as unknown[]) : null,
    seo_description: row.seoDescription ?? null,
    is_published: true,
  };
}

export interface TrekDetailResult {
  page: CMSPage;
  fromCache: boolean;
}

async function fetchTrekDetail(slug: string): Promise<TrekDetailResult> {
  try {
    const page = await contentApi.getCmsPage(slug);
    // Background upsert into SQLite
    try {
      await db
        .insert(cmsPages)
        .values(mapPageToDb(page))
        .onConflictDoUpdate({ target: cmsPages.slug, set: mapPageToDb(page) });
    } catch {
      // Cache write failure is non-critical
    }
    return { page, fromCache: false };
  } catch (networkError) {
    if (networkError instanceof NotFoundError) throw networkError;
    // Offline fallback
    const cached = await db.select().from(cmsPages).where(eq(cmsPages.slug, slug)).limit(1);
    if (cached[0]) return { page: mapDbToPage(cached[0]), fromCache: true };
    throw networkError;
  }
}

export function useTrekDetail(slug: string) {
  return useQuery<TrekDetailResult>({
    queryKey: ["trek", slug],
    queryFn: () => fetchTrekDetail(slug),
    staleTime: 5 * 60 * 1000,
    retry: (count, error) => {
      if (error instanceof NotFoundError) return false;
      return count < 2;
    },
  });
}

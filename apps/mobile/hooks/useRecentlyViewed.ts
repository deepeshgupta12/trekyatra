import { useQueries } from "@tanstack/react-query";
import { contentApi, type CMSPage, type TrekListItem } from "@/lib/mobileApi";
import type { TrekViewEntry } from "@/lib/behaviorProfile";

export interface RecentlyViewedItem {
  trek: TrekListItem;
  viewedAt: number;
  updatedAt: string | null;
}

/**
 * STEP-M30 N02 — hydrate recently-viewed slugs into full trek cards (title/image/state) plus the
 * trek's last-updated date. Fetches each viewed trek's CMS page (cached per slug); keeps the
 * original view order and the local viewed-at timestamp.
 */
export function useRecentlyViewed(views: TrekViewEntry[]): RecentlyViewedItem[] {
  const entries = views.slice(0, 6);
  const results = useQueries({
    queries: entries.map((v) => ({
      queryKey: ["cms-page", v.slug],
      queryFn: () => contentApi.getCmsPage(v.slug),
      staleTime: 10 * 60 * 1000,
    })),
  });

  const items: RecentlyViewedItem[] = [];
  results.forEach((r, i) => {
    const page = r.data as CMSPage | undefined;
    if (!page) return;
    items.push({
      trek: {
        slug: page.slug,
        title: page.title,
        trek_state: page.trek_state,
        trek_difficulty: page.trek_difficulty,
        trek_duration: page.trek_duration,
        hero_image_url: page.hero_image_url,
        route_image_url: page.route_image_url ?? null,
        trek_season: page.trek_season,
      },
      viewedAt: entries[i].ts,
      updatedAt: page.updated_at,
    });
  });
  return items;
}

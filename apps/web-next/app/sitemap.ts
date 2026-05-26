import type { MetadataRoute } from "next";
// fetchTreks removed — static trek pages are covered by state-specific sitemaps

// Always fetch fresh CMS pages so newly published pages appear immediately
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Lightweight CMS sitemap entry — matches the /public/sitemap-pages backend response. */
interface CmsSitemapEntry {
  slug: string;
  page_type: string;
  updated_at: string;
  published_at: string | null;
}

/**
 * Fetch published CMS pages for the sitemap using the dedicated lightweight public
 * endpoint (/api/v1/public/sitemap-pages) with a 20-second timeout.
 *
 * The standard apiFetch helper uses a 3-second timeout and routes through
 * www.trekyatra.co.in which is subject to Cloudflare enhanced_threat_control
 * challenges for server-to-server requests. This function:
 *  1. Tries the primary API base (www domain via DO ingress rule)
 *  2. Falls back to api.trekyatra.co.in (direct, no www routing)
 *  Both attempts use a 20-second timeout to survive Cloudflare latency.
 */
async function fetchCmsSitemapPages(): Promise<CmsSitemapEntry[]> {
  const primaryBase = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";
  const fallbackBase = "https://api.trekyatra.co.in";
  const path = "/api/v1/public/sitemap-pages?limit=500";

  for (const base of [primaryBase, fallbackBase]) {
    try {
      const res = await fetch(`${base}${path}`, {
        signal: AbortSignal.timeout(20_000),   // 20 seconds — survive Cloudflare latency
        cache: "no-store",
      });
      if (res.ok) {
        return (await res.json()) as CmsSitemapEntry[];
      }
    } catch {
      // try next base
    }
  }
  return [];
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trekyatra.com";

function url(path: string, priority = 0.7, changefreq: MetadataRoute.Sitemap[0]["changeFrequency"] = "weekly") {
  return {
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: changefreq,
    priority,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    // Core public pages
    url("/", 1.0, "daily"),
    url("/explore", 0.9, "daily"),
    url("/packing", 0.7, "weekly"),
    url("/permits", 0.7, "weekly"),
    url("/guides", 0.7, "weekly"),
    url("/compare", 0.7, "weekly"),
    url("/seasons", 0.7, "monthly"),
    url("/regions", 0.7, "weekly"),
    url("/plan", 0.8, "monthly"),
    url("/gear", 0.6, "monthly"),
    url("/operators", 0.8, "weekly"),
    url("/products", 0.6, "weekly"),
    url("/premium", 0.6, "monthly"),
    url("/newsletter", 0.4, "monthly"),
    // State-specific trek sitemaps (child sitemaps referenced from master)
    url("/uttarakhand-treks-sitemap.xml", 0.9, "daily"),
    url("/himachal-treks-sitemap.xml",    0.9, "daily"),
    url("/kashmir-treks-sitemap.xml",     0.9, "daily"),
    url("/ladakh-treks-sitemap.xml",      0.9, "weekly"),
    url("/maharashtra-treks-sitemap.xml", 0.8, "weekly"),
    url("/sikkim-treks-sitemap.xml",      0.8, "weekly"),
    url("/karnataka-treks-sitemap.xml",   0.8, "weekly"),
    // Hindi trek pages — separate sitemap with hreflang alternates
    url("/hi-trek-sitemap.xml",           0.6, "weekly"),
    // News articles — separate Google News sitemap
    url("/news-sitemap.xml",              0.8, "daily"),
    // News hub page
    url("/news",                          0.8, "daily"),
    // Difficulty category pages
    url("/beginner", 0.8, "weekly"),
    url("/moderate", 0.8, "weekly"),
    url("/challenging", 0.8, "weekly"),
    // Trust + editorial pages
    url("/about", 0.6, "monthly"),
    url("/about/authors", 0.5, "monthly"),
    url("/contact", 0.4, "yearly"),
    url("/methodology", 0.5, "monthly"),
    url("/privacy", 0.3, "yearly"),
    url("/terms", 0.3, "yearly"),
    url("/affiliate-disclosure", 0.3, "yearly"),
    url("/safety-disclaimer", 0.4, "monthly"),
  ];

  // NOTE: Static trek detail pages (/trek/{slug}) are intentionally excluded from the
  // root sitemap. They are covered by state-specific sitemaps:
  //   /uttarakhand-treks-sitemap.xml, /himachal-treks-sitemap.xml, etc.
  // This prevents duplicate indexing and keeps the root sitemap focused on hub pages.

  // Published CMS pages — trek_guide pages are excluded from the root sitemap;
  // they are already listed in state-specific sitemaps (/uttarakhand-treks-sitemap.xml etc.)
  const PAGE_PREFIX: Record<string, string | undefined> = {
    trek_guide: undefined, // excluded — covered by state-specific sitemaps
    news_article: "/news",
    packing_list: "/packing", packing_guide: "/packing",
    permit_guide: "/permits", beginner_guide: "/guides", beginner_roundup: "/guides",
    cost_guide: "/guides", gear_guide: "/guides", safety_guide: "/guides",
    itinerary: "/guides", expert_guide: "/guides", premium_compendium: "/guides",
    comparison: "/compare", seasonal: "/seasons", seasonal_hub: "/seasons",
    cluster_hub: "/trek-types", regional_hub: "/regions", editorial: "/",
  };
  const cmsPages = await fetchCmsSitemapPages();
  for (const p of cmsPages) {
    const base = PAGE_PREFIX[p.page_type];
    if (base !== undefined) {
      const pageUrl = p.page_type === "editorial"
        ? `${SITE_URL}/${p.slug}`
        : `${SITE_URL}${base}/${p.slug}`;
      entries.push({
        url: pageUrl,
        lastModified: new Date(p.updated_at),
        changeFrequency: p.page_type === "editorial" ? "monthly" : "weekly",
        priority: p.page_type === "editorial" ? 0.5 : 0.8,
      });
    }
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  return entries.filter((e) => {
    if (seen.has(e.url)) return false;
    seen.add(e.url);
    return true;
  });
}

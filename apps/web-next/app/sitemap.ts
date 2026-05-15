import type { MetadataRoute } from "next";
import { fetchTreks } from "@/lib/trekApi";
import { fetchCMSPages } from "@/lib/api";

// Always fetch fresh CMS pages so newly published pages appear immediately
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  // Trek detail pages from static data — /trek/{slug} (singular, matches the actual route)
  try {
    const treks = await fetchTreks();
    for (const t of treks) {
      entries.push(url(`/trek/${t.slug}`, 0.85, "weekly"));
    }
  } catch { /* static data unavailable */ }

  // Published CMS pages
  try {
    const pages = await fetchCMSPages({ status: "published", limit: 500 });
    for (const p of pages) {
      const prefix: Record<string, string> = {
        trek_guide: "/trek",
        packing_list: "/packing",
        packing_guide: "/packing",
        permit_guide: "/permits",
        beginner_guide: "/guides",
        beginner_roundup: "/guides",
        cost_guide: "/guides",
        gear_guide: "/guides",
        safety_guide: "/guides",
        itinerary: "/guides",
        expert_guide: "/guides",
        premium_compendium: "/guides",
        comparison: "/compare",
        seasonal: "/seasons",
        seasonal_hub: "/seasons",
        cluster_hub: "/trek-types",
        regional_hub: "/regions",
        // editorial pages use their own slug as the full path (e.g. /about, /contact)
        editorial: "/",
      };
      const base = prefix[p.page_type];
      if (base !== undefined) {
        // editorial pages: URL is /{slug} not //{slug}
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
  } catch { /* CMS unavailable at build time */ }

  // Deduplicate by URL
  const seen = new Set<string>();
  return entries.filter((e) => {
    if (seen.has(e.url)) return false;
    seen.add(e.url);
    return true;
  });
}

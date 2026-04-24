import type { MetadataRoute } from "next";
import { fetchTreks } from "@/lib/trekApi";
import { fetchCMSPages } from "@/lib/api";

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
    url("/", 1.0, "daily"),
    url("/explore", 0.9, "daily"),
    url("/treks", 0.9, "daily"),
    url("/packing", 0.7, "weekly"),
    url("/permits", 0.7, "weekly"),
    url("/guides", 0.7, "weekly"),
    url("/compare", 0.7, "weekly"),
    url("/seasons", 0.7, "monthly"),
    url("/regions", 0.7, "weekly"),
    url("/plan", 0.6, "monthly"),
    url("/gear", 0.6, "monthly"),
  ];

  // Trek detail pages from static data
  try {
    const treks = await fetchTreks();
    for (const t of treks) {
      entries.push(url(`/treks/${t.slug}`, 0.85, "weekly"));
    }
  } catch { /* static data unavailable */ }

  // Published CMS pages
  try {
    const pages = await fetchCMSPages({ status: "published", limit: 500 });
    for (const p of pages) {
      const prefix: Record<string, string> = {
        trek_guide: "/treks",
        packing_list: "/packing",
        permit_guide: "/permits",
        beginner_roundup: "/guides",
        comparison: "/compare",
        seasonal: "/seasons",
      };
      const base = prefix[p.page_type];
      if (base) {
        entries.push({
          url: `${SITE_URL}${base}/${p.slug}`,
          lastModified: new Date(p.updated_at),
          changeFrequency: "weekly",
          priority: 0.8,
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

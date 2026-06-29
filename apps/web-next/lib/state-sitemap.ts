/**
 * Shared helper for generating state-specific trek sitemaps.
 * Used by /uttarakhand-treks-sitemap.xml, /himachal-treks-sitemap.xml etc.
 *
 * lastmod = max(cms_pages.updated_at, trek_conditions.last_updated_at) so Google
 * re-crawls trek detail pages when live conditions or trail reports are refreshed.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trekyatra.com";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

interface TrekSitemapEntry {
  slug: string;
  trek_state: string | null;
  last_modified: string;
}

async function fetchTrekSitemapByState(stateName: string): Promise<TrekSitemapEntry[]> {
  const fallbackBase = "https://api.trekyatra.co.in";
  const path = `/api/v1/public/sitemap-treks?state=${encodeURIComponent(stateName)}&limit=200`;

  for (const base of [API_BASE, fallbackBase]) {
    try {
      const res = await fetch(`${base}${path}`, {
        signal: AbortSignal.timeout(20_000),
        cache: "no-store",
      });
      if (res.ok) return (await res.json()) as TrekSitemapEntry[];
    } catch {
      // try fallback
    }
  }
  return [];
}

function xmlEscape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function generateStateTrekSitemap(stateName: string): Promise<Response> {
  const pages = await fetchTrekSitemapByState(stateName);

  const urls = pages.map((p) => `
  <url>
    <loc>${xmlEscape(`${SITE_URL}/trek/${p.slug}`)}</loc>
    <lastmod>${new Date(p.last_modified).toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>`).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml", "Cache-Control": "s-maxage=3600" },
  });
}

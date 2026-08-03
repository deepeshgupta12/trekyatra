/**
 * Trek XML sitemap generator. Used by the single catch-all /treks-sitemap.xml (all published treks,
 * every region auto-included). Optionally filters by state (substring) if per-region sitemaps return.
 *
 * lastmod = max(cms_pages.updated_at, trek_conditions.last_updated_at) so Google
 * re-crawls trek detail pages when live conditions or trail reports are refreshed.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

interface TrekSitemapEntry {
  slug: string;
  trek_state: string | null;
  last_modified: string;
}

async function fetchTrekSitemap(stateName?: string): Promise<TrekSitemapEntry[]> {
  const fallbackBase = "https://api.trekyatra.co.in";
  // No state → ALL published treks (the single catch-all sitemap). limit=50000 = sitemap spec max.
  const qs = stateName ? `state=${encodeURIComponent(stateName)}&limit=50000` : `limit=50000`;
  const path = `/api/v1/public/sitemap-treks?${qs}`;

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

/** Generate a trek XML sitemap. No `stateName` → ALL published treks (the single catch-all sitemap
 *  at /treks-sitemap.xml, so any region — Indian or international — is auto-included with zero
 *  per-region code). A `stateName` still works (substring-matched) if per-region sitemaps are ever
 *  reintroduced. */
export async function generateTrekSitemap(stateName?: string): Promise<Response> {
  const pages = await fetchTrekSitemap(stateName);

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

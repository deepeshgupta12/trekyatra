/**
 * Shared helper for generating state-specific trek sitemaps.
 * Used by /uttarakhand-treks-sitemap.xml, /himachal-treks-sitemap.xml etc.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trekyatra.com";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

interface CMSTrekPage {
  slug: string;
  page_type: string;
  trek_state: string | null;
  updated_at: string;
}

async function fetchTrekPagesByState(stateName: string): Promise<CMSTrekPage[]> {
  try {
    const url = `${API_BASE}/api/v1/cms/pages?page_type=trek_guide&status=published&limit=200`;
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000), cache: "no-store" });
    if (!res.ok) return [];
    const pages: CMSTrekPage[] = await res.json();
    return pages.filter(
      (p) => p.trek_state?.toLowerCase() === stateName.toLowerCase()
    );
  } catch {
    return [];
  }
}

function xmlEscape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function generateStateTrekSitemap(stateName: string): Promise<Response> {
  const pages = await fetchTrekPagesByState(stateName);

  const urls = pages.map((p) => `
  <url>
    <loc>${xmlEscape(`${SITE_URL}/trek/${p.slug}`)}</loc>
    <lastmod>${new Date(p.updated_at).toISOString().split("T")[0]}</lastmod>
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

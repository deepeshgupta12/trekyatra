/**
 * Hindi Trek Sitemap — /hi-trek-sitemap.xml
 *
 * Lists all published Hindi trek guide pages at /hi/trek/{source_slug}.
 * Includes hreflang alternates (<xhtml:link>) so Google understands the
 * EN ↔ HI relationship. English canonical pages are indexed; Hindi pages
 * are crawlable via this separate sitemap.
 *
 * Regenerated on every request (force-dynamic) so newly translated pages
 * appear without waiting for a revalidation cycle.
 */

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";
const FALLBACK_API = "https://api.trekyatra.co.in";

interface HindiSitemapEntry {
  source_slug: string;
  page_type: string;
  updated_at: string;
  published_at: string | null;
}

async function fetchHindiTrekPages(): Promise<HindiSitemapEntry[]> {
  for (const base of [API_BASE, FALLBACK_API]) {
    try {
      const res = await fetch(`${base}/api/v1/public/sitemap-pages/hindi?limit=500`, {
        signal: AbortSignal.timeout(20_000),
        cache: "no-store",
      });
      if (res.ok) return (await res.json()) as HindiSitemapEntry[];
    } catch {
      // try fallback
    }
  }
  return [];
}

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function GET(): Promise<Response> {
  const pages = await fetchHindiTrekPages();

  const urls = pages
    .map((p) => {
      const hiUrl   = xmlEscape(`${SITE_URL}/hi/trek/${p.source_slug}`);
      const enUrl   = xmlEscape(`${SITE_URL}/trek/${p.source_slug}`);
      const lastmod = new Date(p.updated_at).toISOString().split("T")[0];
      return `
  <url>
    <loc>${hiUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
    <xhtml:link rel="alternate" hreflang="hi" href="${hiUrl}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}"/>
  </url>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

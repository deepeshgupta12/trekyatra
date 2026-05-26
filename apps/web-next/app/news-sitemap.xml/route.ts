/**
 * /news-sitemap.xml — Google News sitemap for news_article CMS pages.
 *
 * Follows Google News Sitemap protocol:
 * https://developers.google.com/news/sitemaps/build-sitemap
 *
 * Updated dynamically on every request (force-dynamic).
 * Submitted separately from the main sitemap.xml.
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface NewsEntry {
  slug: string;
  title: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  content_json: { trek_slug?: string; week_label?: string } | null;
}

async function fetchNewsPages(): Promise<NewsEntry[]> {
  const primaryBase = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";
  const fallbackBase = "https://api.trekyatra.co.in";
  const path = "/api/v1/public/news?limit=200";

  for (const base of [primaryBase, fallbackBase]) {
    try {
      const res = await fetch(`${base}${path}`, {
        signal: AbortSignal.timeout(20_000),
        cache: "no-store",
      });
      if (res.ok) return (await res.json()) as NewsEntry[];
    } catch { /* try next */ }
  }
  return [];
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trekyatra.com";
  const articles = await fetchNewsPages();

  // Google News sitemap only indexes articles published within the last 2 days
  // for the <news:news> element, but we include all for standard <url> entries.
  const newsItems = articles.map((a) => {
    const pubDate = a.published_at ?? a.created_at;
    const isoDate = new Date(pubDate).toISOString();
    const url = `${SITE_URL}/news/${a.slug}`;
    const title = escapeXml(a.title);

    return `  <url>
    <loc>${url}</loc>
    <lastmod>${new Date(a.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    <news:news>
      <news:publication>
        <news:name>TrekYatra</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${isoDate}</news:publication_date>
      <news:title>${title}</news:title>
    </news:news>
  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${newsItems.join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}

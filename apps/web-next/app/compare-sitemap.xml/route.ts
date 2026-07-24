/**
 * /compare-sitemap.xml — sitemap for the clean comparison pages (/compare/{a-vs-b}).
 *
 * Pairs come from the trek_comparisons table via GET /api/v1/public/comparisons.
 * Kept SEPARATE from the core sitemap.xml (which only references this child sitemap),
 * so comparison URLs don't bloat the root sitemap. force-dynamic.
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchComparisonPairs(): Promise<string[]> {
  const primaryBase = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";
  const fallbackBase = "https://api.trekyatra.co.in";
  const path = "/api/v1/public/comparisons?limit=1000";
  for (const base of [primaryBase, fallbackBase]) {
    try {
      const res = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(20_000), cache: "no-store" });
      if (res.ok) {
        const pairs = (await res.json()) as { pair_slug: string }[];
        return pairs.map((p) => p.pair_slug);
      }
    } catch {
      // try next base
    }
  }
  return [];
}

export async function GET() {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trekyatra.com";
  const now = new Date().toISOString();
  const pairs = await fetchComparisonPairs();

  const items = pairs.map(
    (pair) => `  <url>
    <loc>${SITE_URL}/compare/${pair}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items.join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}

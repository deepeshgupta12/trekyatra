import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/account/", "/auth/", "/api/"],
      },
    ],
    // All sitemaps listed explicitly so search engines discover every one directly
    // (the core sitemap.xml is a urlset, not a sitemap index, so children aren't auto-followed).
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      // Single catch-all trek sitemap — every published trek, any region, auto-included.
      // (Replaced the old per-state/region sitemaps, which now 301 → here via next.config.mjs.)
      `${SITE_URL}/treks-sitemap.xml`,
      // Hindi trek pages (hreflang alternates)
      `${SITE_URL}/hi-trek-sitemap.xml`,
      // Google News + comparison sitemaps
      `${SITE_URL}/news-sitemap.xml`,
      `${SITE_URL}/compare-sitemap.xml`,
    ],
  };
}

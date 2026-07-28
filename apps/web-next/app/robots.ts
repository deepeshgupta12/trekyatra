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
      // State-specific trek sitemaps
      `${SITE_URL}/uttarakhand-treks-sitemap.xml`,
      `${SITE_URL}/himachal-treks-sitemap.xml`,
      `${SITE_URL}/kashmir-treks-sitemap.xml`,
      `${SITE_URL}/ladakh-treks-sitemap.xml`,
      `${SITE_URL}/maharashtra-treks-sitemap.xml`,
      `${SITE_URL}/sikkim-treks-sitemap.xml`,
      `${SITE_URL}/karnataka-treks-sitemap.xml`,
      // Hindi trek pages (hreflang alternates)
      `${SITE_URL}/hi-trek-sitemap.xml`,
      // Google News + comparison sitemaps
      `${SITE_URL}/news-sitemap.xml`,
      `${SITE_URL}/compare-sitemap.xml`,
    ],
  };
}

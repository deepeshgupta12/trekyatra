/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOTE: productionBrowserSourceMaps was enabled temporarily (commit 69f602f) to demap the
  // live #418/#423/#425 hydration errors. Reverted — the stack frames are pure React reconciler
  // internals (no app frame), so source maps could not name the component, and prod React emits
  // no component stack. The errors reproduce ONLY in the live production build (never in dev or
  // local prod, with or without the real-data path), produce NO DOM change, and match the known
  // benign App-Router `next/dynamic({ ssr:false })` Suspense-boundary hydration warning. See
  // docs/MASTER_TRACKER.md PSI #4. Keeping source maps off (avoids exposing source + build bloat).
  transpilePackages: ["@react-oauth/google"],
  experimental: {
    proxyTimeout: 120_000, // 2 minutes — LLM-backed endpoints can take 30-60s
  },
  async redirects() {
    // The per-state/region trek sitemaps were consolidated into a single /treks-sitemap.xml.
    // 301 the old URLs so search engines (which discovered them via robots.txt) don't hit 404s.
    const oldRegions = ["uttarakhand", "himachal", "kashmir", "ladakh", "maharashtra", "sikkim", "karnataka", "nepal", "pakistan", "tibet"];
    const sitemapRedirects = oldRegions.map((r) => ({
      source: `/${r}-treks-sitemap.xml`,
      destination: "/treks-sitemap.xml",
      permanent: true,
    }));
    // Region hubs used to be linked by their full slugified composite trek_state (the home
    // chips generated e.g. /regions/gilgit-baltistan-pakistan). Those are now consolidated to
    // canonical short hub slugs — 301 the crawled aliases so there's no duplicate content.
    const regionAliasRedirects = [
      { source: "/regions/gilgit-baltistan-pakistan", destination: "/regions/pakistan", permanent: true },
      { source: "/regions/gilgit-baltistan-pakistan-xinjiang-china", destination: "/regions/pakistan", permanent: true },
      { source: "/regions/koshi-province-nepal-tibet-china", destination: "/regions/nepal", permanent: true },
      { source: "/regions/gandaki-province-nepal", destination: "/regions/nepal", permanent: true },
      { source: "/regions/tibet-china", destination: "/regions/tibet", permanent: true },
    ];
    return [...sitemapRedirects, ...regionAliasRedirects];
  },
  async rewrites() {
    // Read the public API base. DO App Platform encrypted vars (EV[...]) are not
    // decrypted at build time — guard against them with a startsWith check.
    const raw = process.env.NEXT_PUBLIC_API_BASE ?? "";
    const validBase =
      raw.startsWith("http://") || raw.startsWith("https://")
        ? raw
        : "http://localhost:8000";
    // Replace //www. with //api. so the proxy never points back to itself
    // (www.trekyatra.co.in proxying to www.trekyatra.co.in would loop infinitely).
    const proxyTarget = validBase.replace("//www.", "//api.");
    return [
      {
        source: "/api/:path*",
        destination: `${proxyTarget}/api/:path*`,
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Cache optimized images at the CDN for a year. Next's optimizer inherits the upstream
    // Cache-Control; local /public images (hero, logo, region art) have none, so without this
    // they fell back to the 60s default → Cloudflare expired them every 60s → REVALIDATE/MISS
    // → origin re-optimize on nearly every load (slow LCP + needless dyno load). Spaces images
    // already inherit `immutable` from the backfill. Public assets here are stable brand/hero
    // art; if one is ever replaced, purge the Cloudflare cache or rename the file.
    minimumCacheTTL: 31536000,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "pixabay.com" },
      { protocol: "https", hostname: "cdn.pixabay.com" },
      { protocol: "https", hostname: "trekyatra-media.sgp1.digitaloceanspaces.com" },
      { protocol: "https", hostname: "*.digitaloceanspaces.com" },
      { protocol: "https", hostname: "source.unsplash.com" },
      // trekyatra.co.in root + any subdomain (CMS / WordPress uploads)
      { protocol: "https", hostname: "trekyatra.co.in" },
      { protocol: "https", hostname: "**.trekyatra.co.in" },
    ],
    deviceSizes: [375, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 64, 128, 256],
  },
};

export default nextConfig;

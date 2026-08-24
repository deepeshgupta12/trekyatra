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
    // Month-specific season hubs were removed (they duplicated winter/summer) — 301 to the parent season.
    const seasonMonthRedirects = [
      { source: "/seasons/december", destination: "/seasons/winter", permanent: true },
      { source: "/seasons/may", destination: "/seasons/summer", permanent: true },
    ];
    // ── GSC 404 cleanup (2026-08-12) ──
    // Legacy/dead URL prefixes that never existed as routes (old sitemaps/backlinks) → 301 to a live
    // hub so Google stops reporting 404s and any link equity is preserved. `:path*` catches all depths.
    // (These are wildcards; the bare-index redirects below use EXACT sources so they don't shadow the
    // real /guides/{slug}, /seasons/{slug}, /regions/{slug} children.)
    const legacyPrefixRedirects = [
      { source: "/treks/:path*", destination: "/explore", permanent: true },       // no /treks/{slug} route (it's /trek/{slug})
      { source: "/destinations/:path*", destination: "/explore", permanent: true },
      { source: "/blog/:path*", destination: "/explore", permanent: true },
      { source: "/health/:path*", destination: "/safety", permanent: true },
    ];
    // Bare hub-index: /guides, /seasons, /regions now EXIST as real index hub pages (2026-08-12) — do
    // NOT redirect them. Only /treks has no page (it's /trek/{slug}).
    const bareIndexRedirects = [
      { source: "/treks", destination: "/explore", permanent: true },
    ];
    // Malformed region URLs `/regions/{slug}{Name}` — these leaked from a bad React key in
    // HubInterlinks (`key={l.href + l.label}`, now fixed) into the serialized RSC payload, and Google
    // harvested + crawled them as 404s (e.g. /regions/kashmirKashmir, /regions/uttarakhandUttarakhand).
    // 301 each to its canonical region hub so the already-crawled 404s resolve. Generated for every region.
    const malformedRegionRedirects = [
      ["uttarakhand", "Uttarakhand"], ["himachal", "Himachal"], ["kashmir", "Kashmir"],
      ["ladakh", "Ladakh"], ["maharashtra", "Maharashtra"], ["sikkim", "Sikkim"],
      ["karnataka", "Karnataka"], ["nepal", "Nepal"], ["pakistan", "Pakistan"], ["tibet", "Tibet"],
    ].map(([slug, name]) => ({ source: `/regions/${slug}${name}`, destination: `/regions/${slug}`, permanent: true }));
    // Specific dead root-level article slugs → closest live hub.
    const legacyArticleRedirects = [
      { source: "/roopkund-trek-complete-guide", destination: "/trek/roopkund", permanent: true },
      { source: "/best-treks-uttarakhand", destination: "/regions/uttarakhand", permanent: true },
      { source: "/best-trekking-gear-india", destination: "/gear", permanent: true },
      { source: "/high-altitude-trekking-gear-india", destination: "/gear", permanent: true },
      { source: "/what-to-pack-for-a-himalayan-trek", destination: "/packing", permanent: true },
      { source: "/trekking-packing-list-india", destination: "/packing", permanent: true },
      { source: "/himachal-pradesh-trekking-permits-guide", destination: "/permits", permanent: true },
      { source: "/how-to-get-inner-line-permit-ladakh", destination: "/permits", permanent: true },
      { source: "/altitude-sickness-prevention-guide", destination: "/safety", permanent: true },
      { source: "/high-altitude-trekking-tips", destination: "/safety", permanent: true },
      { source: "/high-altitude-trekking-fitness-guide", destination: "/safety", permanent: true },
      { source: "/leh-acclimatisation-guide", destination: "/regions/ladakh", permanent: true },
      { source: "/ladakh-winter-travel-tips", destination: "/regions/ladakh", permanent: true },
      { source: "/alchi-monastery-guide", destination: "/regions/ladakh", permanent: true },
      { source: "/stok-kangri-trek-guide", destination: "/regions/ladakh", permanent: true },
      { source: "/best-trekking-operators-india", destination: "/operators", permanent: true },
      { source: "/how-to-reach-chopta-from-delhi", destination: "/explore", permanent: true },
    ];
    // ── GSC 404 cleanup (2026-08-24) ──
    // News articles were historically crawled under the WRONG prefix /trek/{slug}; the real article is
    // /news/{slug} (live, 200). 301 the wrong-prefix URLs to the real article (better than 410 — the
    // content exists). Handled here (not the middleware 410 catch-all, which only fires on ROOT slugs).
    const trekNewsRedirects = [
      "cloudy-conditions-across-most-trekking-slopes-afternoon-2026-07",
      "uttarakhand-s-valley-of-flowers-national-park-reopens-how-2026-07",
      "trekkers-urge-reopening-of-great-lakes-routes-say-2026-07",
      "indian-travellers-adopting-the-trek-first-travel-planning-2026-06",
    ].map((s) => ({ source: `/trek/${s}`, destination: `/news/${s}`, permanent: true }));
    // Invented /trek/ slug (hallucinated "-trek-complete-guide" suffix) → canonical trek page.
    const trekAliasRedirects = [
      { source: "/trek/kedarkantha-trek-complete-guide", destination: "/trek/kedarkantha", permanent: true },
    ];
    return [
      ...sitemapRedirects,
      ...regionAliasRedirects,
      ...seasonMonthRedirects,
      ...legacyPrefixRedirects,
      ...bareIndexRedirects,
      ...malformedRegionRedirects,
      ...legacyArticleRedirects,
      ...trekNewsRedirects,
      ...trekAliasRedirects,
    ];
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

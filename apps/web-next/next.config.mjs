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
    // ── GSC 404 cleanup (2026-08-24, superseded 2026-09-22) ──
    // News articles are crawled under the WRONG prefix /trek/{slug}; the real article is /news/{slug}.
    // This used to be a hand-curated 4-slug list here, which promptly fell behind — the 2026-09-22 GSC
    // wave surfaced 5 MORE such URLs (there are 280 published news articles, so the list could never
    // keep up). It is now a DURABLE pattern in middleware.ts (`NEWS_SLUG_UNDER_TREK`): any /trek/{slug}
    // whose slug ends in -YYYY-MM → 301 /news/{slug}. Middleware runs before these redirects, so adding
    // per-slug entries here would be dead code. Do NOT reintroduce a curated list.
    // ── Duplicate news articles (2026-09-22) ──
    // The news agent deduplicated only WITHIN a calendar month (slug carries -YYYY-MM), so the same
    // headline was re-published under a NEW url each month: 57 headlines were live under 2-3 URLs
    // = 64 duplicate URLs out of 200 in news-sitemap.xml. Verified duplicates, not merely similar --
    // identical <title>, same source story, LLM-rewritten body. 301 each duplicate onto the EARLIEST
    // URL for that headline (longest-indexed, most equity). All 57 targets verified live 200, and the
    // mapping contains no chains (no target is also a source).
    //
    // A hand-listed set is acceptable HERE, unlike the news/root-slug patterns elsewhere in this file,
    // because this set is CLOSED: agents/news/agent.py now dedupes on the headline stem across all
    // months, so no new cross-month duplicate can ever be created. Do NOT extend this list -- if it
    // ever needs extending, the stem dedupe has regressed and THAT is the bug to fix.
    const duplicateNewsRedirects = [
      ["10-best-places-to-visit-in-september-in-india-for-a-perfect-2026-09", "10-best-places-to-visit-in-september-in-india-for-a-perfect-2026-08"],
      ["10-stunning-flowers-you-ll-spot-on-the-valley-of-flowers-2026-09", "10-stunning-flowers-you-ll-spot-on-the-valley-of-flowers-2026-08"],
      ["4-easy-trekking-routes-for-beginners-in-india-that-offer-2026-09", "4-easy-trekking-routes-for-beginners-in-india-that-offer-2026-08"],
      ["43-year-old-indian-woman-climbs-europe-s-highest-peak-and-2026-09", "43-year-old-indian-woman-climbs-europe-s-highest-peak-and-2026-08"],
      ["7-best-trekking-trails-in-northern-india-2026-09", "7-best-trekking-trails-in-northern-india-2026-08"],
      ["7-scenic-monsoon-treks-in-india-for-nature-lovers-2026-08", "7-scenic-monsoon-treks-in-india-for-nature-lovers-2026-07"],
      ["7-scenic-monsoon-treks-in-india-for-nature-lovers-2026-09", "7-scenic-monsoon-treks-in-india-for-nature-lovers-2026-07"],
      ["8-best-trekking-routes-in-india-for-beginners-2026-09", "8-best-trekking-routes-in-india-for-beginners-2026-08"],
      ["8-places-under-25-c-in-india-to-escape-the-heat-this-june-2026-09", "8-places-under-25-c-in-india-to-escape-the-heat-this-june-2026-08"],
      ["9-indian-treks-with-the-best-sunrise-views-2026-09", "9-indian-treks-with-the-best-sunrise-views-2026-08"],
      ["9-year-old-girl-from-hyderabad-completes-daunting-sar-pass-2026-08", "9-year-old-girl-from-hyderabad-completes-daunting-sar-pass-2026-07"],
      ["9-year-old-girl-from-hyderabad-completes-daunting-sar-pass-2026-09", "9-year-old-girl-from-hyderabad-completes-daunting-sar-pass-2026-07"],
      ["age-is-just-a-number-how-a-43-year-old-indian-mother-scaled-2026-09", "age-is-just-a-number-how-a-43-year-old-indian-mother-scaled-2026-08"],
      ["amal-sehrawat-on-trek-filled-with-adventure-fitness-inner-2026-08", "amal-sehrawat-on-trek-filled-with-adventure-fitness-inner-2026-07"],
      ["bali-pass-at-16-200-feet-what-the-mountains-taught-me-about-2026-09", "bali-pass-at-16-200-feet-what-the-mountains-taught-me-about-2026-08"],
      ["best-places-to-visit-in-india-in-july-hills-beaches-culture-2026-08", "best-places-to-visit-in-india-in-july-hills-beaches-culture-2026-07"],
      ["best-places-to-visit-in-india-in-july-hills-beaches-culture-2026-09", "best-places-to-visit-in-india-in-july-hills-beaches-culture-2026-07"],
      ["british-trekker-injured-on-deo-tibba-trail-in-manali-urges-2026-08", "british-trekker-injured-on-deo-tibba-trail-in-manali-urges-2026-07"],
      ["chamba-tightens-manimahesh-yatra-with-daily-cap-trek-via-2026-09", "chamba-tightens-manimahesh-yatra-with-daily-cap-trek-via-2026-08"],
      ["clear-mountain-mornings-across-the-himalayas-afternoon-rain-2026-09", "clear-mountain-mornings-across-the-himalayas-afternoon-rain-2026-08"],
      ["cloudy-conditions-across-several-trekking-slopes-afternoon-2026-09", "cloudy-conditions-across-several-trekking-slopes-afternoon-2026-08"],
      ["cloudy-conditions-and-intermittent-rain-expected-across-2026-09", "cloudy-conditions-and-intermittent-rain-expected-across-2026-08"],
      ["courage-takes-flight-in-kangra-district-13-member-team-2026-09", "courage-takes-flight-in-kangra-district-13-member-team-2026-08"],
      ["critically-ill-shepherd-rescued-by-13-member-team-from-bara-2026-09", "critically-ill-shepherd-rescued-by-13-member-team-from-bara-2026-08"],
      ["dad-announces-rs-10l-reward-for-info-on-noida-techie-who-2026-09", "dad-announces-rs-10l-reward-for-info-on-noida-techie-who-2026-08"],
      ["did-you-know-india-has-a-natural-ice-cave-you-can-actually-2026-09", "did-you-know-india-has-a-natural-ice-cave-you-can-actually-2026-08"],
      ["gb-sees-rise-in-foreign-climbers-trekkers-despite-mideast-2026-09", "gb-sees-rise-in-foreign-climbers-trekkers-despite-mideast-2026-08"],
      ["governor-felicitates-nine-year-old-trekker-for-scaling-sar-2026-08", "governor-felicitates-nine-year-old-trekker-for-scaling-sar-2026-07"],
      ["governor-felicitates-nine-year-old-trekker-for-scaling-sar-2026-09", "governor-felicitates-nine-year-old-trekker-for-scaling-sar-2026-07"],
      ["hemis-national-park-how-to-reach-when-to-go-and-everything-2026-09", "hemis-national-park-how-to-reach-when-to-go-and-everything-2026-08"],
      ["how-were-the-himalayas-formed-finding-answers-on-the-2026-09", "how-were-the-himalayas-formed-finding-answers-on-the-2026-08"],
      ["hyderabad-girl-9-completes-13-800-ft-sar-pass-trek-eyes-2026-08", "hyderabad-girl-9-completes-13-800-ft-sar-pass-trek-eyes-2026-07"],
      ["hyderabad-girl-9-completes-13-800-ft-sar-pass-trek-eyes-2026-09", "hyderabad-girl-9-completes-13-800-ft-sar-pass-trek-eyes-2026-07"],
      ["is-the-triund-trek-getting-too-crowded-try-these-3-quieter-2026-09", "is-the-triund-trek-getting-too-crowded-try-these-3-quieter-2026-08"],
      ["j-k-maintains-trekking-ban-across-valley-despite-reopening-2026-09", "j-k-maintains-trekking-ban-across-valley-despite-reopening-2026-08"],
      ["kailash-trip-off-mount-everest-base-camp-treks-on-after-2026-09", "kailash-trip-off-mount-everest-base-camp-treks-on-after-2026-08"],
      ["kashmir-s-children-are-turning-wetland-loss-into-community-2026-09", "kashmir-s-children-are-turning-wetland-loss-into-community-2026-08"],
      ["kashmir-s-trekking-ban-deals-blow-to-seasonal-tourism-2026-09", "kashmir-s-trekking-ban-deals-blow-to-seasonal-tourism-2026-08"],
      ["kili-pemba-sherpa-completes-all-14-eight-thousanders-with-2026-09", "kili-pemba-sherpa-completes-all-14-eight-thousanders-with-2026-08"],
      ["kullu-shrikhand-mahadev-yatra-to-begin-on-july-10-extensive-2026-09", "kullu-shrikhand-mahadev-yatra-to-begin-on-july-10-extensive-2026-08"],
      ["lg-sinha-orders-reopening-of-naranag-2026-08", "lg-sinha-orders-reopening-of-naranag-2026-07"],
      ["lg-sinha-orders-reopening-of-naranag-2026-09", "lg-sinha-orders-reopening-of-naranag-2026-07"],
      ["monsoon-can-make-these-6-iconic-indian-treks-extremely-risky-2026-09", "monsoon-can-make-these-6-iconic-indian-treks-extremely-risky-2026-08"],
      ["monsoon-conditions-continue-across-high-altitude-treks-2026-09", "monsoon-conditions-continue-across-high-altitude-treks-2026-08"],
      ["monsoon-conditions-persist-across-the-himalayas-rain-and-2026-09", "monsoon-conditions-persist-across-the-himalayas-rain-and-2026-08"],
      ["monsoon-travel-ideal-destinations-for-trekkers-during-rainy-2026-08", "monsoon-travel-ideal-destinations-for-trekkers-during-rainy-2026-07"],
      ["monsoon-travel-ideal-destinations-for-trekkers-during-rainy-2026-09", "monsoon-travel-ideal-destinations-for-trekkers-during-rainy-2026-07"],
      ["monsoon-trek-alert-5-popular-indian-trails-to-approach-with-2026-09", "monsoon-trek-alert-5-popular-indian-trails-to-approach-with-2026-08"],
      ["nanga-parbat-records-season-s-first-summit-2026-09", "nanga-parbat-records-season-s-first-summit-2026-08"],
      ["planning-shrikhand-mahadev-trek-2026-check-dates-route-and-2026-09", "planning-shrikhand-mahadev-trek-2026-check-dates-route-and-2026-08"],
      ["pleasant-conditions-across-most-trekking-slopes-afternoon-2026-09", "pleasant-conditions-across-most-trekking-slopes-afternoon-2026-08"],
      ["sab-aa-gaye-triund-koi-reh-toh-nahi-gaya-a-video-from-the-2026-08", "sab-aa-gaye-triund-koi-reh-toh-nahi-gaya-a-video-from-the-2026-07"],
      ["shrikhand-mahadev-yatra-2026-pilgrimage-suspended-till-2026-09", "shrikhand-mahadev-yatra-2026-pilgrimage-suspended-till-2026-08"],
      ["shrikhand-mahadev-yatra-abvimas-recce-team-finds-phancha-2026-09", "shrikhand-mahadev-yatra-abvimas-recce-team-finds-phancha-2026-08"],
      ["test-of-endurance-for-trekkers-at-hampta-pass-in-himalayas-2026-09", "test-of-endurance-for-trekkers-at-hampta-pass-in-himalayas-2026-08"],
      ["the-rise-of-organised-trekking-in-india-and-the-role-of-2026-09", "the-rise-of-organised-trekking-in-india-and-the-role-of-2026-08"],
      ["trekkers-keep-vanishing-in-parvati-valley-these-men-risk-2026-09", "trekkers-keep-vanishing-in-parvati-valley-these-men-risk-2026-08"],
      ["uttarakhand-s-valley-of-flowers-national-park-reopens-how-2026-08", "uttarakhand-s-valley-of-flowers-national-park-reopens-how-2026-07"],
      ["uttarakhand-trekker-missing-for-10-days-drones-120-rescuers-2026-09", "uttarakhand-trekker-missing-for-10-days-drones-120-rescuers-2026-08"],
      ["valley-of-flowers-in-uttarakhand-is-open-for-trekking-how-2026-09", "valley-of-flowers-in-uttarakhand-is-open-for-trekking-how-2026-08"],
      ["valley-of-flowers-national-park-reopens-for-visitors-best-2026-08", "valley-of-flowers-national-park-reopens-for-visitors-best-2026-07"],
      ["what-s-happening-at-indiahikes-as-the-high-adventure-2026-09", "what-s-happening-at-indiahikes-as-the-high-adventure-2026-08"],
      ["young-trekkers-successfully-complete-bhrigu-lake-trek-in-2026-09", "young-trekkers-successfully-complete-bhrigu-lake-trek-in-2026-07"],
      ["youngest-to-undertake-the-snow-covered-sar-pass-trek-2026-09", "youngest-to-undertake-the-snow-covered-sar-pass-trek-2026-08"],
    ].map(([from, to]) => ({ source: `/news/${from}`, destination: `/news/${to}`, permanent: true }));
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
      ...trekAliasRedirects,
      ...duplicateNewsRedirects,
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

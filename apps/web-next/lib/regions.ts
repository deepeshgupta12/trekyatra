/**
 * Region taxonomy — the single source of truth for the /regions/[slug] hubs.
 *
 * WHY THIS EXISTS: region hub URLs are generated in three places (home "Trekking
 * regions" chips, the header mega-nav, and the region page itself) and must all agree
 * on ONE canonical slug per region, or the same content ends up under two URLs
 * (duplicate content) — or worse, an unknown slug falls through to a hardcoded default
 * and renders the WRONG region (the live "gilgit-baltistan-pakistan shows Himachal" bug).
 *
 * The design is fully data-driven off `trek_state` (the value stored on each published
 * trek_guide CMS page). A region is matched to a state by an exact composite match or a
 * substring `matchWord`, so international 8000m peaks whose `trek_state` is a composite
 * value like "Koshi Province, Nepal / Tibet, China" resolve to the right hub with ZERO
 * per-trek code. Any brand-new state with no curated entry still works: it is synthesised
 * (slugified name, default image) so the hub renders and self-updates.
 */

export interface RegionMeta {
  /** Canonical URL slug — /regions/{slug}. Kept short + stable (SEO). */
  slug: string;
  /** Display name (H1 + chips). */
  name: string;
  tagline: string;
  image: string;
  blurb: string;
  /** Country the region sits in — drives permit copy + logistics + schema. */
  country: "India" | "Nepal" | "Pakistan" | "Tibet";
  /**
   * Lowercased word substring-matched inside a trek's `trek_state`. e.g. "himachal"
   * matches "Himachal Pradesh"; "nepal" matches "Koshi Province, Nepal / Tibet, China".
   */
  matchWord: string;
  /** Exact `trek_state` values that must map here regardless of matchWord order. */
  matchStates?: string[];
  /** "Getting there" rows — [hub, note]. Region-aware (India cities ≠ Nepal/Pakistan). */
  logistics: [string, string][];
  /** Unique "Why trek here" narrative — rendered as an H2 section (SEO/AEO substance). */
  whyTrek?: string;
}

// Per-region "Why trek here" narrative, keyed by slug (kept separate from REGIONS to stay readable).
const REGION_WHY: Record<string, string> = {
  uttarakhand:
    "Uttarakhand is where most Indians take their first Himalayan trek. Garhwal and Kumaon pack an extraordinary range into short approaches, from beginner snow summits like Kedarkantha and Brahmatal to the flower meadows of the Valley of Flowers and serious high routes like Roopkund, and almost all of them sit within a day of the roadhead. Well marked trails, a mature guiding network and reliable winter snow make this the friendliest big mountain region in the country for a first timer.",
  himachal:
    "No Indian state offers more variety than Himachal. In one state you can walk the green Kullu valleys, cross a glaciated pass on Hampta, camp beside Bhrigu Lake, or step into the cold desert of Spiti and Pin Parvati. That range, from lush to lunar and gentle to technical, together with easy access from Delhi and Chandigarh, makes Himachal the trekker's playground across almost every season.",
  kashmir:
    "The high meadows of Kashmir are simply unrivalled in India. The Great Lakes trek strings together a chain of turquoise alpine lakes below jagged peaks, and Tarsar Marsar delivers the same beauty with far fewer people. Lush pasture, wildflowers and a short but spectacular summer window make Kashmir the country's premier destination for meadow and lake trekking.",
  ladakh:
    "Ladakh is high altitude trekking at its most raw. Every route stays above 3,500 metres, crossing ochre moonscapes, Buddhist villages and glacier fed rivers on trails like Markha Valley, Stok Kangri and the frozen Chadar. This is a region for acclimatised, experienced trekkers who are chasing big altitude and stark, otherworldly landscapes rather than green meadows.",
  maharashtra:
    "The Sahyadris of Maharashtra are the monsoon trekking capital of India. When the Himalaya shuts down for the rains, these basalt ranges erupt with waterfalls, fort ramparts and misty ridgelines. With more than seventy documented routes within a few hours of Mumbai and Pune, the Sahyadris deliver dramatic, accessible weekend trekking from June right through February.",
  sikkim:
    "Sikkim and the North East pair jaw dropping Kanchenjunga views with some of the richest biodiversity in India. Goecha La, Dzongri and the ridge walk to Sandakphu pass through rhododendron forest, high yak pasture and orchid strewn valleys. Quieter and greener than the western Himalaya, this region rewards trekkers who want scenery and solitude in equal measure.",
  karnataka:
    "Karnataka brings the Western Ghats within a weekend of Bengaluru. The rolling grasslands of Kudremukh, the granite dome of Kumara Parvatha and the coffee country ridgelines of Tadiyandamol range from gentle to genuinely tough. Lush, green and easy to reach, it is the most rewarding trekking region in the south.",
  nepal:
    "The Nepal Himalaya holds the greatest concentration of eight thousand metre giants on Earth and the most storied treks in the world. From the Everest Base Camp trail to the Annapurna Circuit and the wild approaches to Kanchenjunga and Makalu, Nepal blends soaring high altitude scenery with a deep teahouse trekking culture that makes long routes surprisingly accessible.",
  pakistan:
    "The Karakoram of Pakistan packs the most extreme high peaks on the planet into one range, from K2 and the Gasherbrums to Broad Peak and, close by, Nanga Parbat. Treks like the Baltoro Glacier to Concordia walk beneath a wall of eight thousand metre peaks unlike anywhere else. Remote, permit heavy and serious, Gilgit Baltistan is high altitude trekking at the sharpest end.",
  tibet:
    "Tibet is the high, remote north side of the Himalaya, a vast high altitude desert of turquoise lakes, monasteries and the north approaches to Everest, Cho Oyu and Shishapangma. Big logistics and strict, guide only permits are the price of admission to some of the most austere and spiritual trekking terrain on Earth.",
};

const INDIA_LOGISTICS: [string, string][] = [
  ["Delhi", "Overnight train or bus to the base towns, around 8 to 12 hours."],
  ["Mumbai", "Flight to the nearest hub, then a 6 to 10 hour drive."],
  ["Bengaluru", "Flight to Delhi or Chandigarh, then onward by road."],
  ["Chandigarh", "The closest hub for most Himachal and Uttarakhand treks."],
];

/**
 * Curated regions, in resolution priority order. India states are listed first so a
 * composite border state (e.g. "Sikkim, India / Koshi Province, Nepal") resolves to the
 * Indian hub (India-first product), then the international ranges.
 */
export const REGIONS: RegionMeta[] = [
  {
    slug: "uttarakhand", name: "Uttarakhand", matchWord: "uttarakhand", country: "India",
    matchStates: ["Uttarakhand", "Uttrakhand"], // guards a known LLM misspelling
    tagline: "Land of the great Himalayan snow treks",
    image: "/images/region-uttarakhand.webp",
    blurb: "Garhwal and Kumaon hold India's most loved beginner snow treks, from Kedarkantha and Brahmatal to the Valley of Flowers and Roopkund.",
    logistics: INDIA_LOGISTICS,
  },
  {
    slug: "himachal", name: "Himachal Pradesh", matchWord: "himachal", country: "India",
    tagline: "The trekker's playground",
    image: "/images/region-himachal.webp",
    blurb: "From the apple valleys of Kullu to the moonscapes of Spiti, Himachal offers the widest variety of treks of any Indian state.",
    logistics: INDIA_LOGISTICS,
  },
  {
    slug: "kashmir", name: "Kashmir", matchWord: "kashmir", country: "India",
    matchStates: ["Jammu & Kashmir", "Kashmir"],
    tagline: "Alpine lakes & turquoise meadows",
    image: "/images/region-jammu-kashmir.webp",
    blurb: "Kashmir's high-altitude meadow treks are unrivalled in India. The Great Lakes trek alone draws trekkers from around the world.",
    logistics: INDIA_LOGISTICS,
  },
  {
    slug: "ladakh", name: "Ladakh", matchWord: "ladakh", country: "India",
    tagline: "High desert, high stakes, high reward",
    image: "/images/region-ladakh-hd.webp",
    blurb: "Above 3,500 metres on every trek, from Markha Valley and Stok Kangri to the legendary Chadar. Ladakh trekking is not for first timers.",
    logistics: INDIA_LOGISTICS,
  },
  {
    slug: "maharashtra", name: "Maharashtra (Sahyadris)", matchWord: "maharashtra", country: "India",
    tagline: "Monsoon trekking capital of India",
    image: "/images/region-sahyadri.webp",
    blurb: "70+ documented treks from Mumbai and Pune. Best between June and February.",
    logistics: [
      ["Mumbai", "A 2 to 4 hour drive or train to most Sahyadri base villages."],
      ["Pune", "A 1.5 to 3 hour drive to the Western Ghats trailheads."],
      ["Nashik", "Gateway to the northern Sahyadri forts and peaks."],
    ],
  },
  {
    slug: "sikkim", name: "Sikkim & North East", matchWord: "sikkim", country: "India",
    tagline: "Quiet, lush, photogenic",
    image: "/images/region-ladakh.webp",
    blurb: "Goecha La, Sandakphu and Dzongri pair stunning Kanchenjunga views with rich biodiversity across the North East.",
    logistics: [
      ["Kolkata", "Flight or train to Bagdogra, then a 4 to 5 hour drive to Yuksom or Darjeeling."],
      ["Bagdogra", "The nearest airport, with road access to the Gangtok and Yuksom trailheads."],
      ["Delhi", "Direct flight to Bagdogra, then onward by road."],
    ],
  },
  {
    slug: "karnataka", name: "Karnataka", matchWord: "karnataka", country: "India",
    tagline: "Western Ghats from Bangalore",
    image: "/images/region-sahyadri.webp",
    blurb: "Kudremukh, Kumara Parvatha, Tadiyandamol — beginner to challenging treks reachable in a weekend from Bangalore.",
    logistics: [
      ["Bangalore", "4–6 hr drive to most Western Ghats trailheads."],
      ["Mangalore", "Coastal gateway to Kudremukh and the Sahyadri escarpment."],
    ],
  },
  // ── International Himalaya (8000m ranges) ────────────────────────────────
  {
    slug: "nepal", name: "Nepal Himalaya", matchWord: "nepal", country: "Nepal",
    tagline: "The roof of the world",
    image: "/images/region-nepal.webp",
    blurb: "Everest, Annapurna, Kanchenjunga, Makalu, Lhotse — the Nepal Himalaya holds the greatest concentration of 8000m giants and the world's most storied high-altitude treks and base-camp routes.",
    logistics: [
      ["Kathmandu", "International hub. All permits (TIMS/national park) issued here."],
      ["Pokhara", "Gateway to the Annapurna region — 25 min flight or 6–7 hr drive from KTM."],
      ["Lukla", "Everest gateway — scenic mountain flight from Kathmandu."],
      ["Overland (India)", "Sunauli / Kakarbhitta border crossings from Uttar Pradesh / West Bengal."],
    ],
  },
  {
    slug: "pakistan", name: "Pakistan Karakoram", matchWord: "pakistan", country: "Pakistan",
    tagline: "Where the great peaks tower",
    image: "/images/region-pakistan.webp",
    blurb: "K2, Nanga Parbat, the Gasherbrums, Broad Peak — Pakistan's Gilgit-Baltistan holds the most concentrated cluster of extreme high peaks on Earth. Serious, remote, and permit-heavy.",
    logistics: [
      ["Islamabad", "International hub — visa + trekking permits arranged here."],
      ["Skardu", "Baltoro / K2 gateway — flight from Islamabad or 2-day Karakoram Highway drive."],
      ["Gilgit", "Hunza & Nanga Parbat access along the Karakoram Highway."],
    ],
  },
  {
    slug: "tibet", name: "Tibet", matchWord: "tibet", country: "Tibet",
    tagline: "The high, remote north side",
    image: "/images/region-tibet.webp",
    blurb: "The Tibetan side of the Himalaya — Everest's north approach, Cho Oyu, Shishapangma. High-altitude desert, big logistics, and strict permits.",
    logistics: [
      ["Lhasa", "Entry hub — flights/train via mainland China; Tibet Travel Permit mandatory."],
      ["Kathmandu (overland)", "Gyirong border crossing into Tibet — group visa required."],
      ["Tingri", "Staging town for the Everest north base camp approach."],
    ],
  },
];

// Attach the per-region "Why trek here" narrative (kept in REGION_WHY above for readability).
for (const r of REGIONS) {
  r.whyTrek = REGION_WHY[r.slug];
}

/** Slugify an arbitrary state name into a stable URL slug (fallback for un-curated states). */
export function slugifyState(s: string): string {
  return s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Find the curated region for a `trek_state` value (exact composite match first, then matchWord). */
export function regionForState(state: string): RegionMeta | undefined {
  const lower = state.toLowerCase();
  return (
    REGIONS.find((r) => r.matchStates?.some((s) => s.toLowerCase() === lower)) ??
    REGIONS.find((r) => lower.includes(r.matchWord))
  );
}

/** Canonical /regions/{slug} slug for a `trek_state` — curated where known, else slugified. */
export function regionSlugForState(state: string): string {
  return regionForState(state)?.slug ?? slugifyState(state);
}

/** Look up a curated region by its canonical slug. */
export function regionBySlug(slug: string): RegionMeta | undefined {
  return REGIONS.find((r) => r.slug === slug);
}

/**
 * Resolve a URL slug to a RegionMeta, ALWAYS returning something usable. Un-curated slugs
 * (a state introduced after this file was written) are synthesised so the hub still renders
 * and stays correct — the matchWord is the slug's first token, which is exactly how the
 * slug was derived, so trek filtering by that word round-trips.
 */
export function resolveRegion(slug: string): RegionMeta {
  const curated = regionBySlug(slug);
  if (curated) return curated;
  const name = slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return {
    slug,
    name,
    tagline: "Himalayan treks",
    image: "/images/region-himachal-camp.webp",
    blurb: `Documented trekking routes across ${name}. Live route conditions, permits, and season windows.`,
    country: "India",
    matchWord: slug.split("-")[0],
    logistics: INDIA_LOGISTICS,
  };
}

export interface RegionCard {
  slug: string;
  name: string;
  image: string;
  count: number;
}

/**
 * Group live per-state trek counts into region cards (one card per canonical region),
 * summing counts across composite states and sorting by total desc. Curated regions use
 * their curated name/image; un-curated states fall back to the raw state name.
 */
export function groupStateCounts(
  counts: { state: string; count: number }[],
): RegionCard[] {
  const bySlug = new Map<string, RegionCard>();
  for (const { state, count } of counts) {
    if (!count) continue;
    // Curated regions ONLY. A state that doesn't map to a curated region is skipped rather than
    // slugified into a junk /regions/{slug} URL (which now 404s). Add it to REGIONS to surface it.
    const region = regionForState(state);
    if (!region) continue;
    const existing = bySlug.get(region.slug);
    if (existing) {
      existing.count += count;
    } else {
      bySlug.set(region.slug, { slug: region.slug, name: region.name, image: region.image, count });
    }
  }
  return Array.from(bySlug.values()).sort((a, b) => b.count - a.count);
}

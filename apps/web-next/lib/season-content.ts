/**
 * Rich, UNIQUE editorial content per seasonal hub (/seasons/{slug}) — the SEO/AEO substance that
 * makes each season page stand out (distinct hero, why-trek, best regions, month-by-month table,
 * packing list, weather). Rendered code-first so the pages are strong without depending on the
 * LLM/CMS generation. Keyed by the canonical season slugs + the two month hubs (december, may).
 */

export interface SeasonContent {
  title: string;        // H1 / SEO title stem — "Best {X} Treks in India"
  heroImage: string;    // distinct per season
  monthsLabel: string;  // "Mar – Apr"
  tagline: string;
  intro: string;        // lead paragraph (unique)
  whyTrek: string;      // "Why trek in {season}" paragraph
  bestRegions: { name: string; slug: string; note: string }[];
  monthTable: { month: string; conditions: string }[];
  packing: string[];
  weather: string;
  prep: string;         // safety / permits note
  beginnerNote: string; // for the generated "good for beginners?" FAQ
}

export const SEASON_CONTENT: Record<string, SeasonContent> = {
  spring: {
    title: "Best Spring Treks in India",
    heroImage: "/images/region-nepal.webp",
    monthsLabel: "Mar – Apr",
    tagline: "Rhododendron season in the lower Himalaya",
    intro:
      "Spring is India's rhododendron season. As the snow retreats from the lower ridgelines, the forests of Uttarakhand, Himachal and the North-East erupt in red and pink bloom, and the trails dry out into some of the most colourful — and least crowded — walking of the year.",
    whyTrek:
      "Spring hits the sweet spot between the deep snow of winter and the crowds of summer. Lower and mid-altitude trails are snow-free and stable, the rhododendron and magnolia forests are in full flower, and daytime weather is mild. High passes above ~4,000 m can still hold snow, so spring rewards forest and ridge treks over big glacier crossings.",
    bestRegions: [
      { name: "Uttarakhand", slug: "uttarakhand", note: "Brahmatal and Ali–Bedni Bugyal for rhododendron ridgelines." },
      { name: "Sikkim & North East", slug: "sikkim", note: "Sandakphu and the Goecha La approach for Himalayan bloom." },
      { name: "Himachal Pradesh", slug: "himachal", note: "Lower Kullu and Dhauladhar forest trails clearing of snow." },
    ],
    monthTable: [
      { month: "March", conditions: "Rhododendron begins in the lower forests; high passes still snow-bound." },
      { month: "April", conditions: "Peak bloom, drying trails, warm days — the best spring window." },
    ],
    packing: [
      "Light insulating layers for cold mornings and nights",
      "A packable rain shell for occasional spring showers",
      "Strong sun protection — UV is high at altitude",
      "Trekking poles for lingering snow on higher sections",
    ],
    weather: "Mild days of 10–18 °C in the forests, cold nights at altitude, and residual snow on passes above 4,000 m.",
    prep: "Some high passes remain snow-bound into April — check current conditions and carry microspikes for higher routes.",
    beginnerNote: "Excellent — spring's snow-free forest trails are among the gentlest for first-time Himalayan trekkers.",
  },
  summer: {
    title: "Best Summer Treks in India",
    heroImage: "/images/region-himachal.webp",
    monthsLabel: "May – Jun",
    tagline: "Alpine meadows and the high Himalaya opening up",
    intro:
      "Summer is the pre-monsoon window when the high Himalaya finally opens. Snowmelt turns the high meadows emerald, the big alpine-lake and pass routes of Kashmir, Himachal and Ladakh become accessible, and long daylight makes for relaxed, unhurried days on the trail.",
    whyTrek:
      "With schools and offices on break and the snowline retreating fast, summer is peak Himalayan trekking season. It is the time for the flagship high routes — Kashmir's Great Lakes, Hampta Pass, Beas Kund and the early Valley of Flowers — when meadows bloom and high camps are snow-free.",
    bestRegions: [
      { name: "Kashmir", slug: "kashmir", note: "The Great Lakes trek at its turquoise-meadow best." },
      { name: "Himachal Pradesh", slug: "himachal", note: "Hampta Pass, Bhrigu Lake and Beas Kund open up." },
      { name: "Ladakh", slug: "ladakh", note: "Markha Valley and high-desert routes become accessible." },
    ],
    monthTable: [
      { month: "May", conditions: "Snowmelt, meadows greening, shoulder-season quiet on many routes." },
      { month: "June", conditions: "Peak meadow season and warmest weather before the monsoon arrives." },
    ],
    packing: [
      "High-SPF sunscreen, lip balm and UV sunglasses — glare is intense",
      "Layers for warm days (15–25 °C) and cold high-altitude nights",
      "A light rain shell for pre-monsoon afternoon showers",
      "1.5–2 L hydration capacity for dry, sunny days",
    ],
    weather: "Warm days of 15–25 °C at base, cold nights at altitude, very strong UV, and the first pre-monsoon showers by late June.",
    prep: "This is the busiest season — book permits, homestays and guides well ahead, and prioritise hydration and sun protection.",
    beginnerNote: "Great for beginners with reasonable fitness — meadow treks like Bhrigu Lake are approachable, though altitude acclimatisation still matters.",
  },
  monsoon: {
    title: "Best Monsoon Treks in India",
    heroImage: "/images/region-sahyadri.webp",
    monthsLabel: "Jul – Sep",
    tagline: "Waterfalls, emerald forts and rain-shadow deserts",
    intro:
      "When the monsoon closes most of the Himalaya, the Western Ghats come alive. Maharashtra's Sahyadri forts stream with waterfalls, the forests of Karnataka and Coorg turn emerald, and — in the rain-shadow of the main range — Ladakh and Spiti stay dry and trekkable.",
    whyTrek:
      "The monsoon is a completely different trekking country. The high Himalaya is prone to landslides and leeches, but the Sahyadris deliver dramatic fort walks, misty ridges and roaring waterfalls, while the rain-shadow deserts of Ladakh offer the only reliable high-altitude trekking of the season.",
    bestRegions: [
      { name: "Maharashtra (Sahyadris)", slug: "maharashtra", note: "Fort treks and waterfalls at their monsoon peak." },
      { name: "Karnataka", slug: "karnataka", note: "Kudremukh and the Western Ghats in full green." },
      { name: "Ladakh", slug: "ladakh", note: "Rain-shadow high-desert routes stay dry and open." },
    ],
    monthTable: [
      { month: "July", conditions: "Peak monsoon in the Ghats — full waterfalls, heavy rain, leeches out." },
      { month: "August", conditions: "Deep green everywhere; slippery basalt and active leeches in the Sahyadris." },
      { month: "September", conditions: "Rain tapers — arguably the best, greenest Sahyadri trekking." },
    ],
    packing: [
      "A genuinely waterproof jacket and pack cover (not just water-resistant)",
      "Quick-dry clothing and a spare set sealed in a dry bag",
      "Anti-leech measures — salt, tobacco or leech socks",
      "Shoes with aggressive grip for slick, wet basalt",
    ],
    weather: "Heavy, persistent rain and leeches in the Western Ghats; dry, sunny and cool in rain-shadow Ladakh and Spiti.",
    prep: "Avoid the main Himalaya (landslide and leech risk). In the Ghats, prioritise waterproofing, grip and leech protection; never cross swollen streams.",
    beginnerNote: "Yes for the Sahyadris — short, low-altitude fort treks suit beginners, but respect slippery rock and fast-rising water.",
  },
  autumn: {
    title: "Best Autumn Treks in India",
    heroImage: "/images/hero-himalaya-dawn.webp",
    monthsLabel: "Oct – Nov",
    tagline: "The clearest Himalayan skies of the year",
    intro:
      "Autumn is the connoisseur's season. The monsoon has scrubbed the atmosphere clean, leaving crystal-clear air, razor-sharp mountain views and stable, dry weather — the classic window for the big high-Himalaya and base-camp treks.",
    whyTrek:
      "Post-monsoon, visibility is unmatched: this is when the giants stand out cleanest against a deep blue sky. Trails are dry, rivers have dropped, and the weather is stable — ideal for high passes, ridge walks and the great base-camp approaches before winter closes in.",
    bestRegions: [
      { name: "Uttarakhand", slug: "uttarakhand", note: "Kuari Pass and Kedarkantha for panoramic post-monsoon views." },
      { name: "Sikkim & North East", slug: "sikkim", note: "Goecha La for the cleanest Kanchenjunga views of the year." },
      { name: "Nepal Himalaya", slug: "nepal", note: "Everest and Annapurna base-camp routes at their prime." },
    ],
    monthTable: [
      { month: "October", conditions: "Peak clarity and stable weather — the finest high-Himalaya trekking." },
      { month: "November", conditions: "Colder and quieter, with the first winter snow arriving on high passes." },
    ],
    packing: [
      "A warm down or synthetic jacket for sub-zero nights at altitude",
      "Layered insulation — days are mild but nights are cold",
      "A headlamp — daylight shortens noticeably through November",
      "Sun protection for bright, high-UV afternoons",
    ],
    weather: "Crisp, dry and exceptionally clear; pleasant days with nights dropping below freezing at altitude, and early snow on high passes by late November.",
    prep: "Days shorten fast — start early and carry a headlamp. Nights are cold, so a proper sleeping system matters above 3,500 m.",
    beginnerNote: "Ideal for beginners — dry, stable trails and famous first-timer routes like Kedarkantha and Kuari Pass are at their best.",
  },
  winter: {
    title: "Best Winter Treks in India",
    heroImage: "/images/region-uttarakhand-snow.webp",
    monthsLabel: "Dec – Feb",
    tagline: "Snow treks and frozen trails",
    intro:
      "Winter turns the lower ridgelines of Uttarakhand and Himachal white, and with them come India's most loved snow treks. Powder-covered pine forests, frozen meadows and glowing sunrise summits make this the season that turns first-timers into lifelong trekkers.",
    whyTrek:
      "Winter is snow-trek season. Accessible summits like Kedarkantha, Brahmatal and Nag Tibba offer the full alpine experience — pristine white campsites and 360° snow panoramas — without technical mountaineering. It is the most photogenic and beginner-friendly way to walk on snow.",
    bestRegions: [
      { name: "Uttarakhand", slug: "uttarakhand", note: "Kedarkantha, Brahmatal and Dayara Bugyal — the classic snow treks." },
      { name: "Himachal Pradesh", slug: "himachal", note: "Kheerganga and Prashar Lake under fresh snow." },
      { name: "Kashmir", slug: "kashmir", note: "Winter meadows and the Gulmarg-area snowscape." },
    ],
    monthTable: [
      { month: "December", conditions: "Early, powdery snow — the gentlest month for first-time snow trekkers." },
      { month: "January", conditions: "Deep winter, heaviest snow and the coldest nights." },
      { month: "February", conditions: "Deep snow with clearer, brighter spells and stunning summits." },
    ],
    packing: [
      "Heavy insulation — down jacket, thermals and an insulated sleeping bag",
      "Microspikes and gaiters for snow and ice underfoot",
      "A waterproof outer shell and insulated, waterproof gloves",
      "UV sunglasses — snow glare is severe",
    ],
    weather: "Snow on the trails, short days, and nights of −5 to −15 °C at altitude, with bright, clear days between snowfalls.",
    prep: "Microspikes and gaiters are essential; watch for frostbite and AMS, and never trek solo above the snowline.",
    beginnerNote: "The best beginner snow season — Kedarkantha and Brahmatal are purpose-built first snow treks with the right guide and gear.",
  },
  december: {
    title: "Best Treks to do in December",
    heroImage: "/images/region-uttarakhand-snow.webp",
    monthsLabel: "December",
    tagline: "The gentle start of the snow season",
    intro:
      "December is the softest entry into winter trekking — early, powdery snow on the classic Uttarakhand ridgelines, festive New-Year summit camps, and cold-but-manageable conditions perfect for a first snow trek.",
    whyTrek:
      "Before the deep snow and hard cold of January, December offers just enough snow for the full winter experience with a gentler edge — ideal for first-timers and for New-Year celebration treks on peaks like Kedarkantha.",
    bestRegions: [
      { name: "Uttarakhand", slug: "uttarakhand", note: "Kedarkantha and Brahmatal for early-season snow and New-Year camps." },
      { name: "Himachal Pradesh", slug: "himachal", note: "Kheerganga and lower Kullu ridgelines under first snow." },
    ],
    monthTable: [
      { month: "Early December", conditions: "Light, early snow — the easiest winter conditions of the season." },
      { month: "Late December", conditions: "More snow and festive New-Year summit treks." },
    ],
    packing: [
      "Warm insulation and thermals for −2 to −10 °C nights",
      "Microspikes and gaiters for early snow",
      "A waterproof shell and insulated gloves",
      "UV sunglasses for snow glare",
    ],
    weather: "Early-season snow with nights of −2 to −10 °C at altitude and bright, crisp days.",
    prep: "Lighter snow than January, but still carry microspikes and a proper sleeping system; book early for New-Year dates.",
    beginnerNote: "One of the best months for a first snow trek — snow underfoot without the extreme cold of deep winter.",
  },
  may: {
    title: "Best Treks to do in May",
    heroImage: "/images/region-himachal.webp",
    monthsLabel: "May",
    tagline: "The shoulder month before the monsoon",
    intro:
      "May is the sweet spot of the trekking year — snow is melting off the high routes, meadows are greening, and the high Himalaya opens up before both the summer crowds and the June rains arrive.",
    whyTrek:
      "As the snowline retreats, May unlocks the high meadow and lake treks while daytime temperatures stay comfortable. It is a quieter, greener window than peak June, with the season's flagship routes just coming into condition.",
    bestRegions: [
      { name: "Kashmir", slug: "kashmir", note: "Great Lakes approach greening up as snow melts." },
      { name: "Himachal Pradesh", slug: "himachal", note: "Hampta Pass and Bhrigu Lake opening for the season." },
      { name: "Uttarakhand", slug: "uttarakhand", note: "Valley of Flowers approach and high bugyals clearing." },
    ],
    monthTable: [
      { month: "Early May", conditions: "Snowmelt underway; shoulder-season quiet on many high routes." },
      { month: "Late May", conditions: "Meadows greening and high camps opening before the June peak." },
    ],
    packing: [
      "Sun protection — high UV as snow reflects light",
      "Layers for warm days and still-cold high-altitude nights",
      "A light rain shell for early pre-monsoon showers",
      "Microspikes for any lingering snow on high passes",
    ],
    weather: "Warm days, cold nights, active snowmelt on high routes and the first hints of pre-monsoon weather late in the month.",
    prep: "Some high passes still hold snow early in May — check conditions and carry traction for the highest sections.",
    beginnerNote: "A friendly month for beginners — mild weather and opening meadow treks, with altitude the main thing to respect.",
  },
};

export function getSeasonContent(slug: string): SeasonContent {
  return SEASON_CONTENT[slug] ?? SEASON_CONTENT.winter;
}

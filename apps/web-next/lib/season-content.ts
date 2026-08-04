/**
 * Rich, UNIQUE editorial content per seasonal hub (/seasons/{slug}). Written to read as human prose
 * (no dashes, no hyphens), with tables and bullets rendered by the page. Keyed by the canonical 5
 * season slugs ONLY (month hubs december/may were removed 2026-08-04).
 */

export interface SeasonContent {
  title: string;        // H1 / SEO title stem
  heroImage: string;    // distinct per season
  monthsLabel: string;  // "March to April"
  tagline: string;
  intro: string;        // lead paragraph (unique)
  overview: string;     // second overview paragraph (adds depth)
  whyTrek: string;
  bestRegions: { name: string; slug: string; note: string }[];
  monthTable: { month: string; conditions: string }[];
  prepare: string[];    // how to prepare bullets
  packing: string[];
  weather: string;
  prep: string;         // one line safety / permits note
  beginnerNote: string;
}

export const SEASON_CONTENT: Record<string, SeasonContent> = {
  spring: {
    title: "Best Spring Treks in India",
    heroImage: "/images/region-nepal.webp",
    monthsLabel: "March to April",
    tagline: "Rhododendron season in the lower Himalaya",
    intro:
      "Spring is the season the Himalaya wakes up. Through March and April the snow pulls back from the lower ridgelines, the oak and rhododendron forests of Uttarakhand, Himachal and the North East burst into red and pink flower, and the trails firm up into some of the most colourful walking of the whole year.",
    overview:
      "It is also one of the quietest windows on the calendar. The winter snow crowds have gone home and the big summer rush has not yet arrived, so popular ridgelines feel almost private. Days are mild in the forest, nights are cold higher up, and the light through the flowering canopy is something photographers plan a whole year around.",
    whyTrek:
      "Spring sits in the sweet spot between the deep snow of winter and the crowds of summer. Lower and mid altitude trails are clear of snow and stable underfoot, the forests are in full bloom, and the weather is gentle enough for relaxed days. Passes above roughly 4,000 metres can still hold snow, so spring rewards forest and ridge treks rather than big glacier crossings.",
    bestRegions: [
      { name: "Uttarakhand", slug: "uttarakhand", note: "Brahmatal and Ali Bedni Bugyal for ridgelines lined with rhododendron." },
      { name: "Sikkim and North East", slug: "sikkim", note: "Sandakphu and the Goecha La approach for Himalayan bloom." },
      { name: "Himachal Pradesh", slug: "himachal", note: "Lower Kullu and Dhauladhar forest trails clearing of snow." },
    ],
    monthTable: [
      { month: "March", conditions: "Rhododendron begins in the lower forests while high passes stay under snow." },
      { month: "April", conditions: "Peak bloom, drying trails and warm days make this the best spring window." },
    ],
    prepare: [
      "Build a base of cardio fitness with regular walking or jogging four to six weeks ahead",
      "Book early for popular rhododendron ridgelines, which fill fast on weekends",
      "Carry traction for any high sections that still hold snow",
      "Plan for warm days and cold nights by packing a proper layering system",
    ],
    packing: [
      "Light insulating layers for cold mornings and nights",
      "A packable rain shell for the odd spring shower",
      "Strong sun protection because the light is intense at altitude",
      "Trekking poles for lingering snow on the higher sections",
    ],
    weather: "Mild days of 10 to 18 degrees in the forests, cold nights higher up, and residual snow on passes above 4,000 metres.",
    prep: "Some high passes stay under snow into April, so check current conditions and carry traction for the higher routes.",
    beginnerNote: "Spring is an excellent first season because the forest trails are clear of snow and the grade stays gentle.",
  },
  summer: {
    title: "Best Summer Treks in India",
    heroImage: "/images/region-himachal.webp",
    monthsLabel: "May to June",
    tagline: "Alpine meadows and the high Himalaya opening up",
    intro:
      "Summer is when the high Himalaya finally opens. As the snowline retreats through May and June, the high meadows turn a deep emerald, and the great alpine lake and pass routes of Kashmir, Himachal and Ladakh become walkable again. Long daylight makes for slow, unhurried days on the trail.",
    overview:
      "This is the flagship trekking window of the year and it draws trekkers from across the country and the world. Schools and offices are on break, the meadows are at their greenest, and the classic routes are all in condition at once. It rewards a little planning, because the best homestays, guides and permits get booked out well in advance.",
    whyTrek:
      "With the snowline retreating fast and the whole country on holiday, summer is peak Himalayan trekking season. It is the time for the marquee high routes, from the Kashmir Great Lakes to Hampta Pass, Beas Kund and the early Valley of Flowers, when the meadows bloom and the high camps are clear of snow.",
    bestRegions: [
      { name: "Kashmir", slug: "kashmir", note: "The Great Lakes trek at its turquoise and meadow best." },
      { name: "Himachal Pradesh", slug: "himachal", note: "Hampta Pass, Bhrigu Lake and Beas Kund all open up." },
      { name: "Ladakh", slug: "ladakh", note: "Markha Valley and the high desert routes become accessible." },
    ],
    monthTable: [
      { month: "May", conditions: "Snow melts fast, meadows begin to green and many routes stay quiet." },
      { month: "June", conditions: "Peak meadow season and the warmest weather before the monsoon arrives." },
    ],
    prepare: [
      "Book permits, homestays and guides early because this is the busiest season",
      "Arrive with solid cardio fitness for long days and real altitude",
      "Give yourself acclimatisation days on the higher lake and pass routes",
      "Carry two litres of water capacity for dry, sunny days",
    ],
    packing: [
      "High factor sunscreen, lip balm and UV sunglasses for intense glare",
      "Layers for warm days and cold high altitude nights",
      "A light rain shell for the first showers by late June",
      "A wide brimmed hat and a buff for sun on open meadows",
    ],
    weather: "Warm days of 15 to 25 degrees at base, cold nights at altitude, very strong sun, and the first showers by late June.",
    prep: "This is the busiest window, so book ahead, hydrate well and prioritise sun protection on the open meadows.",
    beginnerNote: "Summer suits beginners with reasonable fitness, though meadow treks still climb high enough that acclimatisation matters.",
  },
  monsoon: {
    title: "Best Monsoon Treks in India",
    heroImage: "/images/region-sahyadri.webp",
    monthsLabel: "July to September",
    tagline: "Waterfalls, emerald forts and rain shadow deserts",
    intro:
      "When the monsoon closes most of the Himalaya, the Western Ghats come alive. Through July, August and September the Sahyadri forts of Maharashtra run with waterfalls, the forests of Karnataka and Coorg turn a brilliant green, and, tucked away in the rain shadow of the main range, Ladakh and Spiti stay dry and walkable.",
    overview:
      "Monsoon trekking is a completely different country. Instead of snow peaks you get misty ramparts, roaring waterfalls and cloud pouring over basalt cliffs. It calls for good rain gear and respect for fast rising water, but it delivers some of the most atmospheric and affordable trekking of the year, all within a few hours of Mumbai, Pune and Bengaluru.",
    whyTrek:
      "The high Himalaya is prone to landslides and leeches in the rains, but the Sahyadris are at their dramatic best, and the rain shadow deserts of Ladakh offer the only reliable high altitude trekking of the season. It is the time to trade snow for green and to walk historic fort trails in the cloud.",
    bestRegions: [
      { name: "Maharashtra Sahyadris", slug: "maharashtra", note: "Fort treks and waterfalls at their full monsoon peak." },
      { name: "Karnataka", slug: "karnataka", note: "Kudremukh and the Western Ghats in deep green." },
      { name: "Ladakh", slug: "ladakh", note: "Rain shadow high desert routes stay dry and open." },
    ],
    monthTable: [
      { month: "July", conditions: "Peak monsoon in the Ghats with full waterfalls, heavy rain and leeches out." },
      { month: "August", conditions: "Deep green everywhere, with slick basalt and active leeches in the Sahyadris." },
      { month: "September", conditions: "The rain tapers off and the Sahyadris are at their greenest and finest." },
    ],
    prepare: [
      "Skip the main Himalaya during the rains and choose the Ghats or the rain shadow",
      "Waterproof everything inside your pack with a liner and dry bags",
      "Carry leech protection such as salt, tobacco or leech socks",
      "Never attempt to cross a swollen stream in spate",
    ],
    packing: [
      "A genuinely waterproof jacket and pack cover, not just water resistant",
      "Quick drying clothing and a spare set sealed in a dry bag",
      "Leech protection for the Western Ghats",
      "Shoes with aggressive grip for wet, slippery basalt",
    ],
    weather: "Heavy, persistent rain and leeches in the Western Ghats, and dry, cool, sunny weather in rain shadow Ladakh and Spiti.",
    prep: "Avoid the main Himalaya for landslide and leech reasons, and in the Ghats focus on waterproofing, grip and stream safety.",
    beginnerNote: "The Sahyadris are beginner friendly in the monsoon because the fort treks are short and low, though wet rock and rising water need respect.",
  },
  autumn: {
    title: "Best Autumn Treks in India",
    heroImage: "/images/hero-himalaya-dawn.webp",
    monthsLabel: "October to November",
    tagline: "The clearest Himalayan skies of the year",
    intro:
      "Autumn is the season the mountains show off. The monsoon has scrubbed the sky clean, so the air is crystal clear and the peaks stand out razor sharp against a deep blue. Through October and November the weather turns stable and dry, and the trails harden into perfect walking.",
    overview:
      "This is the classic window for the big high routes and the great base camp approaches. Rivers have dropped, the light is gorgeous, and the giants are at their cleanest before winter closes in. Early October is warm and settled, while November turns colder and quieter as the first snow dusts the high passes.",
    whyTrek:
      "After the monsoon the visibility is simply unmatched, and this is when the biggest peaks stand cleanest against the sky. Trails are dry, the weather is stable, and it is the finest time for high passes, ridge walks and the famous base camp treks before the cold sets in.",
    bestRegions: [
      { name: "Uttarakhand", slug: "uttarakhand", note: "Kuari Pass and Kedarkantha for wide, clear panoramas." },
      { name: "Sikkim and North East", slug: "sikkim", note: "Goecha La for the cleanest Kanchenjunga views of the year." },
      { name: "Nepal Himalaya", slug: "nepal", note: "Everest and Annapurna base camp routes at their prime." },
    ],
    monthTable: [
      { month: "October", conditions: "Peak clarity and stable weather deliver the finest high Himalaya trekking." },
      { month: "November", conditions: "Colder and quieter, with the first winter snow arriving on high passes." },
    ],
    prepare: [
      "Start walking early each day because the daylight shortens through November",
      "Carry a warm sleeping system for nights that drop below freezing at altitude",
      "Book base camp routes ahead, as October is a popular window",
      "Pack a headlamp for early starts and short evenings",
    ],
    packing: [
      "A warm down or synthetic jacket for freezing nights at altitude",
      "Layered insulation because days are mild but nights are cold",
      "A headlamp for shorter days through November",
      "Sun protection for bright, high altitude afternoons",
    ],
    weather: "Crisp, dry and exceptionally clear, with pleasant days, nights below freezing at altitude, and early snow on high passes by late November.",
    prep: "Daylight shortens quickly, so start early and carry a proper sleeping system for the cold nights above 3,500 metres.",
    beginnerNote: "Autumn is ideal for beginners because the trails are dry and stable and the famous first timer routes are at their best.",
  },
  winter: {
    title: "Best Winter Treks in India",
    heroImage: "/images/region-uttarakhand-snow.webp",
    monthsLabel: "December to February",
    tagline: "Snow treks and frozen trails",
    intro:
      "Winter turns the lower ridgelines of Uttarakhand and Himachal white, and with them come India's most loved snow treks. Powder covered pine forests, frozen meadows and glowing sunrise summits make this the season that turns curious first timers into lifelong trekkers.",
    overview:
      "The beauty of the Indian winter is that you can walk on snow without technical mountaineering. Summits like Kedarkantha, Brahmatal and Nag Tibba give you the full alpine experience, a pristine white campsite and a wide snow panorama, with nothing more than good gear and a guide. December is the gentle start, January is the deep cold, and February pairs deep snow with brighter, clearer spells.",
    whyTrek:
      "Winter is snow trek season. Accessible summits offer the full alpine experience of pristine white campsites and wide snow panoramas without any technical climbing. It is the most photogenic and the most beginner friendly way to walk on snow in the country.",
    bestRegions: [
      { name: "Uttarakhand", slug: "uttarakhand", note: "Kedarkantha, Brahmatal and Dayara Bugyal are the classic snow treks." },
      { name: "Himachal Pradesh", slug: "himachal", note: "Kheerganga and Prashar Lake under fresh snow." },
      { name: "Kashmir", slug: "kashmir", note: "Winter meadows and the Gulmarg area snowscape." },
    ],
    monthTable: [
      { month: "December", conditions: "Early powdery snow makes this the gentlest month for first time snow trekkers." },
      { month: "January", conditions: "Deep winter brings the heaviest snow and the coldest nights." },
      { month: "February", conditions: "Deep snow pairs with clearer, brighter spells and stunning summits." },
    ],
    prepare: [
      "Rent or buy microspikes and gaiters before the trek for snow and ice",
      "Carry winter grade insulation and an insulated sleeping bag",
      "Trek December to February and pick December if you are new to snow",
      "Go with a registered guide and never head above the snowline alone",
    ],
    packing: [
      "Heavy insulation including a down jacket, thermals and an insulated sleeping bag",
      "Microspikes and gaiters for snow and ice underfoot",
      "A waterproof outer shell and insulated waterproof gloves",
      "UV sunglasses because snow glare is severe",
    ],
    weather: "Snow on the trails, short days, and nights of minus 5 to minus 15 degrees at altitude, with bright clear days between snowfalls.",
    prep: "Microspikes and gaiters are essential, watch for frostbite and altitude sickness, and never trek solo above the snowline.",
    beginnerNote: "This is the best beginner snow season, and Kedarkantha and Brahmatal are made for a first snow trek with the right guide and gear.",
  },
};

export function getSeasonContent(slug: string): SeasonContent {
  return SEASON_CONTENT[slug] ?? SEASON_CONTENT.winter;
}

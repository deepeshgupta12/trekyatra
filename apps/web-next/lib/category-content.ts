/**
 * Rich, UNIQUE editorial content per Trek Category hub (/trek-types/{slug}). Mirrors the season-hub
 * approach so each category page has real SEO/AEO substance (distinct hero, why-choose, tips,
 * best-regions) rather than a thin template. Keyed by the curated category slugs in
 * `lib/categories.TREK_CATEGORY_SLUGS` (and backend `category_meta.CATEGORIES`).
 */

export interface CategoryContent {
  title: string;      // H1 stem — "{Category} in India"
  heroImage: string;  // distinct per category
  tagline: string;
  intro: string;
  whyChoose: string;
  tips: string[];
  bestRegions: { name: string; slug: string; note: string }[];
  beginnerNote: string;
}

export const CATEGORY_CONTENT: Record<string, CategoryContent> = {
  "beginner-friendly-treks": {
    title: "Beginner-Friendly Treks in India",
    heroImage: "/images/region-uttarakhand.webp",
    tagline: "Your first Himalayan trek",
    intro:
      "Beginner-friendly treks are the gateway to the mountains — gentle gradients, short days, moderate altitude and well-marked trails that let first-timers experience high camps and summit mornings without technical risk.",
    whyChoose:
      "A good first trek builds confidence and fitness while keeping the risks low. These routes stay at manageable altitude, cover reasonable daily distances, and run on established trails with a mature guiding ecosystem — so you can focus on the experience rather than the exposure.",
    tips: [
      "Pick a trek of 4–5 days or fewer with a maximum altitude under ~4,000 m",
      "Build a base of cardio fitness (walking, stairs, jogging) 4–6 weeks ahead",
      "Go with a registered guide or organised group for your first few treks",
      "Break in your trekking shoes before the trek to avoid blisters",
    ],
    bestRegions: [
      { name: "Uttarakhand", slug: "uttarakhand", note: "Kedarkantha and Brahmatal — purpose-built first snow treks." },
      { name: "Himachal Pradesh", slug: "himachal", note: "Triund and Prashar Lake for easy, scenic first outings." },
      { name: "Maharashtra (Sahyadris)", slug: "maharashtra", note: "Short fort treks perfect for a low-altitude start." },
    ],
    beginnerNote: "By definition — these are the treks we recommend for a first-timer, chosen for gentle grade and low altitude.",
  },
  "weekend-treks": {
    title: "Weekend Treks in India",
    heroImage: "/images/region-sahyadri.webp",
    tagline: "Two days, big mountains",
    intro:
      "Weekend treks pack a real mountain experience into two or three days — short approaches you can reach from a city on Friday night and be back from by Monday, without burning precious leave.",
    whyChoose:
      "Not every trek needs a week. Weekend routes are built around quick access and compact itineraries, making them ideal for regular escapes, fitness-building between bigger expeditions, and introducing friends to trekking.",
    tips: [
      "Check overnight transport timings so you maximise trail time",
      "Start early to beat the heat and afternoon weather",
      "Carry rain gear in the Western Ghats even outside the monsoon",
      "Confirm any fort/forest permits before you set out",
    ],
    bestRegions: [
      { name: "Maharashtra (Sahyadris)", slug: "maharashtra", note: "The weekend-trek capital — dozens of fort routes near Mumbai and Pune." },
      { name: "Karnataka", slug: "karnataka", note: "Western Ghats trails within a weekend of Bengaluru." },
      { name: "Himachal Pradesh", slug: "himachal", note: "Triund and lower Kullu ridgelines for a quick Himalayan hit." },
    ],
    beginnerNote: "Yes — most weekend treks are short and low-altitude, which makes them excellent for beginners too.",
  },
  "high-altitude-treks": {
    title: "High-Altitude Treks in India",
    heroImage: "/images/region-ladakh-hd.webp",
    tagline: "Above 4,000 metres",
    intro:
      "High-altitude treks climb past 4,000 m into the realm of big passes, thin air and the grandest Himalayan panoramas — serious routes that demand fitness, acclimatisation and respect for the mountains.",
    whyChoose:
      "This is where the Himalaya shows its full scale — glaciated passes, high-desert plateaus and summit views that make the effort worthwhile. High-altitude routes reward experienced trekkers who have built the fitness and the acclimatisation discipline to handle altitude safely.",
    tips: [
      "Build in acclimatisation and rest days — climb high, sleep low",
      "Learn the symptoms of AMS, HACE and HAPE and never ignore them",
      "Consult a doctor about Diamox before the trek if you're prone to AMS",
      "Arrive with strong cardio fitness — these routes are unforgiving",
    ],
    bestRegions: [
      { name: "Ladakh", slug: "ladakh", note: "Markha Valley and Stok Kangri — every step above 3,500 m." },
      { name: "Uttarakhand", slug: "uttarakhand", note: "Roopkund and Kuari Pass for high, classic Garhwal routes." },
      { name: "Nepal Himalaya", slug: "nepal", note: "Everest and Annapurna base-camp trails at serious altitude." },
    ],
    beginnerNote: "Not recommended for a first trek — build up through lower routes first, then attempt high altitude once acclimatisation-savvy.",
  },
  "lake-treks": {
    title: "Lake Treks in India",
    heroImage: "/images/region-jammu-kashmir.webp",
    tagline: "Turquoise alpine water",
    intro:
      "Lake treks are built around the Himalaya's high-altitude alpine lakes — glacial blues and greens set against snow peaks, with some of the most photogenic campsites in the country.",
    whyChoose:
      "Few sights match a string of alpine lakes reflecting the peaks above them. These treks — from Kashmir's Great Lakes to Roopkund and Bhrigu — combine dramatic scenery with the meditative rhythm of moving from one lake basin to the next.",
    tips: [
      "The best window is summer to autumn, once the lakes have thawed",
      "Camp well back from the shoreline to protect fragile lake ecology",
      "Carry a water filter or purification for glacial-melt water",
      "Expect cold nights — most alpine lakes sit above 3,500 m",
    ],
    bestRegions: [
      { name: "Kashmir", slug: "kashmir", note: "The Great Lakes and Tarsar Marsar — the finest lake treks in India." },
      { name: "Uttarakhand", slug: "uttarakhand", note: "Roopkund's mystery lake and the frozen Brahmatal." },
      { name: "Himachal Pradesh", slug: "himachal", note: "Bhrigu Lake and Chandratal in the high Lahaul-Spiti country." },
    ],
    beginnerNote: "Some are beginner-friendly (Brahmatal, Bhrigu Lake); others (Great Lakes) need moderate fitness and acclimatisation.",
  },
  "snow-treks": {
    title: "Snow Treks in India",
    heroImage: "/images/region-uttarakhand-snow.webp",
    tagline: "Walk the white season",
    intro:
      "Snow treks put you on white trails through frosted pine forest and frozen meadows to glowing sunrise summits — the winter Himalaya at its most photogenic and, with the right route, its most beginner-friendly.",
    whyChoose:
      "There's nothing like your first walk on snow. Winter routes in Uttarakhand and Himachal deliver the full alpine experience — powder underfoot, snow-laden forests and 360° summit panoramas — without technical mountaineering, given the right guide and gear.",
    tips: [
      "Carry microspikes and gaiters — snow and ice underfoot are a given",
      "Pack winter-grade insulation and an insulated sleeping system",
      "The season runs December to February; December is gentlest",
      "Never trek solo above the snowline — go guided in winter",
    ],
    bestRegions: [
      { name: "Uttarakhand", slug: "uttarakhand", note: "Kedarkantha, Brahmatal and Dayara Bugyal — India's classic snow treks." },
      { name: "Himachal Pradesh", slug: "himachal", note: "Kheerganga and Prashar Lake under fresh winter snow." },
      { name: "Kashmir", slug: "kashmir", note: "Winter meadows and the Gulmarg-area snowscape." },
    ],
    beginnerNote: "The best beginner snow treks — Kedarkantha and Brahmatal — are made for first-timers with the right gear and a guide.",
  },
  "family-treks": {
    title: "Family Treks in India",
    heroImage: "/images/region-himachal.webp",
    tagline: "Trails the whole family can enjoy",
    intro:
      "Family treks are the easier, safer routes that work for children and mixed-age groups — short days, gentle grades and big scenery, often with the comfort of homestays or fixed camps along the way.",
    whyChoose:
      "Trekking as a family means choosing routes where the reward is high and the risk is low. These treks keep altitude and daily distance modest, favour well-supported trails, and pick destinations — meadows, lakes, viewpoints — that keep younger walkers engaged.",
    tips: [
      "Choose easy-graded routes with short daily distances",
      "Avoid high altitude (above ~3,500 m) with young children",
      "Prefer treks with homestay or fixed-camp options for comfort",
      "Pack extra warm layers and snacks to keep kids happy on the trail",
    ],
    bestRegions: [
      { name: "Himachal Pradesh", slug: "himachal", note: "Triund and Prashar Lake — short, scenic and well-supported." },
      { name: "Uttarakhand", slug: "uttarakhand", note: "Chopta–Deoriatal and Tungnath for gentle family days." },
      { name: "Maharashtra (Sahyadris)", slug: "maharashtra", note: "Easy fort walks that suit mixed-age groups." },
    ],
    beginnerNote: "Ideal for beginners and children alike — these are the gentlest, best-supported routes we document.",
  },
};

export function getCategoryContent(slug: string): CategoryContent | undefined {
  return CATEGORY_CONTENT[slug];
}

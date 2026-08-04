/**
 * Rich, UNIQUE editorial content per Trek Category hub (/trek-types/{slug}). Written to read as human
 * prose (no dashes, no hyphens), with bullets and a comparison table rendered by the page. Keyed by
 * the curated category slugs in `lib/categories.TREK_CATEGORY_SLUGS` and backend `category_meta`.
 */

export interface CategoryContent {
  title: string;
  heroImage: string;
  tagline: string;
  intro: string;
  overview: string;
  whyChoose: string;
  prepare: string[];
  bestRegions: { name: string; slug: string; note: string }[];
  beginnerNote: string;
}

export const CATEGORY_CONTENT: Record<string, CategoryContent> = {
  "beginner-friendly-treks": {
    title: "Beginner Friendly Treks in India",
    heroImage: "/images/region-uttarakhand.webp",
    tagline: "Your first Himalayan trek",
    intro:
      "Beginner friendly treks are the gateway to the mountains. They keep the gradients gentle, the days short and the altitude moderate, and they run on well marked trails, so a first timer can experience a high camp and a summit morning without any technical risk.",
    overview:
      "A good first trek is less about grit and more about the right choice. Pick a route that stays within your fitness, walk with people who know the trail, and you come home hungry for the next one. These are the treks we hand to friends who have never slept in a tent, and almost none of them stop at one.",
    whyChoose:
      "A good first trek builds confidence and fitness while keeping the risk low. These routes hold to manageable altitude, cover sensible daily distances and follow established trails with a mature guiding network, so you can focus on the experience rather than the exposure.",
    prepare: [
      "Choose a trek of four to five days with a highest point under roughly 4,000 metres",
      "Build a base of cardio fitness with walking, stairs and jogging for a month beforehand",
      "Walk your first few treks with a registered guide or an organised group",
      "Break in your trekking shoes before the trek so you avoid blisters",
    ],
    bestRegions: [
      { name: "Uttarakhand", slug: "uttarakhand", note: "Kedarkantha and Brahmatal are purpose built first snow treks." },
      { name: "Himachal Pradesh", slug: "himachal", note: "Triund and Prashar Lake make easy, scenic first outings." },
      { name: "Maharashtra Sahyadris", slug: "maharashtra", note: "Short fort treks are perfect for a low altitude start." },
    ],
    beginnerNote: "These are the treks we recommend for a first timer, chosen for a gentle grade and low altitude.",
  },
  "weekend-treks": {
    title: "Weekend Treks in India",
    heroImage: "/images/region-sahyadri.webp",
    tagline: "Two days, big mountains",
    intro:
      "Weekend treks pack a real mountain experience into two or three days. They are the short routes you can reach from a city on Friday night and be back from by Monday morning, without spending any of your precious leave.",
    overview:
      "You do not need a week off to get into the hills. Weekend routes are built around quick access and compact itineraries, which makes them ideal for regular escapes, for building fitness between bigger expeditions, and for talking a friend into their very first trek.",
    whyChoose:
      "Not every trek needs a week. Weekend routes are built around quick access and compact itineraries, which makes them ideal for regular escapes, fitness between bigger treks, and easy introductions for new trekkers.",
    prepare: [
      "Check overnight bus and train timings so you get the most trail time",
      "Start early to beat the heat and the afternoon weather",
      "Carry rain gear in the Western Ghats even outside the monsoon",
      "Confirm any fort or forest permits before you set out",
    ],
    bestRegions: [
      { name: "Maharashtra Sahyadris", slug: "maharashtra", note: "The weekend capital, with dozens of fort routes near Mumbai and Pune." },
      { name: "Karnataka", slug: "karnataka", note: "Western Ghats trails within a weekend of Bengaluru." },
      { name: "Himachal Pradesh", slug: "himachal", note: "Triund and the lower Kullu ridgelines for a quick Himalayan hit." },
    ],
    beginnerNote: "Most weekend treks are short and low, which makes them excellent for beginners too.",
  },
  "high-altitude-treks": {
    title: "High Altitude Treks in India",
    heroImage: "/images/region-ladakh-hd.webp",
    tagline: "Above 4,000 metres",
    intro:
      "High altitude treks climb past 4,000 metres into a world of big passes, thin air and the grandest Himalayan panoramas. They are serious routes that ask for fitness, careful acclimatisation and real respect for the mountains.",
    overview:
      "This is where the Himalaya shows its full scale, on glaciated passes, high desert plateaus and summit views that make every hard step worthwhile. These routes reward experienced trekkers who have built both the fitness and the acclimatisation discipline to handle altitude safely, and they punish anyone who rushes.",
    whyChoose:
      "This is where the Himalaya shows its full scale, on glaciated passes, high desert plateaus and summit views that repay the effort. High routes reward experienced trekkers who have built the fitness and the acclimatisation habits to handle altitude safely.",
    prepare: [
      "Build acclimatisation and rest days into the plan and climb high but sleep low",
      "Learn the symptoms of altitude sickness and never ignore them",
      "Talk to a doctor about medication before the trek if you are prone to altitude sickness",
      "Arrive with strong cardio fitness because these routes are unforgiving",
    ],
    bestRegions: [
      { name: "Ladakh", slug: "ladakh", note: "Markha Valley and Stok Kangri sit above 3,500 metres at every step." },
      { name: "Uttarakhand", slug: "uttarakhand", note: "Roopkund and Kuari Pass are high, classic Garhwal routes." },
      { name: "Nepal Himalaya", slug: "nepal", note: "Everest and Annapurna base camp trails at serious altitude." },
    ],
    beginnerNote: "These are not for a first trek. Build up through lower routes first, then attempt altitude once you are confident with acclimatisation.",
  },
  "lake-treks": {
    title: "Lake Treks in India",
    heroImage: "/images/region-jammu-kashmir.webp",
    tagline: "Turquoise alpine water",
    intro:
      "Lake treks are built around the high alpine lakes of the Himalaya, pools of glacial blue and green set against snow peaks, with some of the most photogenic campsites in the country.",
    overview:
      "Few sights match a string of alpine lakes catching the peaks above them. From the Kashmir Great Lakes to Roopkund and Bhrigu Lake, these treks pair dramatic scenery with the calm rhythm of moving from one lake basin to the next. Most sit high, so they read best from summer through autumn once the ice has gone.",
    whyChoose:
      "Few sights match a chain of alpine lakes reflecting the peaks above them. These treks combine dramatic scenery with the meditative rhythm of walking from one lake basin to the next.",
    prepare: [
      "Trek from summer through autumn once the lakes have thawed",
      "Camp well back from the shoreline to protect the fragile lake ecology",
      "Carry a filter or purification for glacial melt water",
      "Expect cold nights because most alpine lakes sit above 3,500 metres",
    ],
    bestRegions: [
      { name: "Kashmir", slug: "kashmir", note: "The Great Lakes and Tarsar Marsar are the finest lake treks in India." },
      { name: "Uttarakhand", slug: "uttarakhand", note: "The mystery lake of Roopkund and the frozen Brahmatal." },
      { name: "Himachal Pradesh", slug: "himachal", note: "Bhrigu Lake and Chandratal in the high Lahaul and Spiti country." },
    ],
    beginnerNote: "Some are beginner friendly, such as Brahmatal and Bhrigu Lake, while others like the Great Lakes need moderate fitness and acclimatisation.",
  },
  "snow-treks": {
    title: "Snow Treks in India",
    heroImage: "/images/region-uttarakhand-snow.webp",
    tagline: "Walk the white season",
    intro:
      "Snow treks put you on white trails through frosted pine forest and frozen meadows to glowing sunrise summits. With the right route they are the winter Himalaya at its most photogenic and, surprisingly, its most beginner friendly.",
    overview:
      "There is nothing quite like your first walk on snow. Winter routes in Uttarakhand and Himachal give you powder underfoot, snow laden forests and a wide summit panorama, and the classics ask for nothing more than good gear and a guide. The season runs from December to February, and December is the gentlest way in.",
    whyChoose:
      "There is nothing like your first walk on snow. Winter routes in Uttarakhand and Himachal deliver the full alpine experience of powder, snow laden forests and wide summit panoramas without any technical climbing, given the right guide and gear.",
    prepare: [
      "Carry microspikes and gaiters because snow and ice underfoot are a given",
      "Pack winter grade insulation and an insulated sleeping system",
      "Trek from December to February and choose December if you are new to snow",
      "Never head above the snowline alone and go with a guide in winter",
    ],
    bestRegions: [
      { name: "Uttarakhand", slug: "uttarakhand", note: "Kedarkantha, Brahmatal and Dayara Bugyal are India's classic snow treks." },
      { name: "Himachal Pradesh", slug: "himachal", note: "Kheerganga and Prashar Lake under fresh winter snow." },
      { name: "Kashmir", slug: "kashmir", note: "Winter meadows and the Gulmarg area snowscape." },
    ],
    beginnerNote: "The best beginner snow treks, Kedarkantha and Brahmatal, are made for a first timer with the right gear and a guide.",
  },
  "family-treks": {
    title: "Family Treks in India",
    heroImage: "/images/region-himachal.webp",
    tagline: "Trails the whole family can enjoy",
    intro:
      "Family treks are the easier, safer routes that work for children and mixed age groups. They keep the days short and the grades gentle, they serve up big scenery, and they often come with the comfort of homestays or fixed camps along the way.",
    overview:
      "Trekking as a family is about choosing routes where the reward is high and the risk stays low. These treks hold altitude and daily distance modest, favour well supported trails, and pick destinations like meadows, lakes and viewpoints that keep younger walkers curious and moving.",
    whyChoose:
      "Trekking as a family means choosing routes where the reward is high and the risk stays low. These treks keep altitude and daily distance modest, favour well supported trails, and pick destinations that keep younger walkers engaged.",
    prepare: [
      "Choose easy graded routes with short daily distances",
      "Avoid altitude above roughly 3,500 metres with young children",
      "Prefer treks with homestay or fixed camp options for comfort",
      "Pack extra warm layers and snacks to keep children happy on the trail",
    ],
    bestRegions: [
      { name: "Himachal Pradesh", slug: "himachal", note: "Triund and Prashar Lake are short, scenic and well supported." },
      { name: "Uttarakhand", slug: "uttarakhand", note: "Chopta, Deoriatal and Tungnath make gentle family days." },
      { name: "Maharashtra Sahyadris", slug: "maharashtra", note: "Easy fort walks that suit mixed age groups." },
    ],
    beginnerNote: "These are ideal for beginners and children alike, the gentlest and best supported routes we document.",
  },
};

export function getCategoryContent(slug: string): CategoryContent | undefined {
  return CATEGORY_CONTENT[slug];
}

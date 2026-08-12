import type { Metadata } from "next";
import CMSPageHub, { fetchCMSHubPages } from "@/components/content/CMSPageHub";
import { TrekCard, type Trek } from "@/components/trek/TrekCard";
import { fetchTreks } from "@/lib/trekApi";
import { fetchCMSPages, type CMSPage, type TrekFacts } from "@/lib/api";
import Breadcrumb from "@/components/content/Breadcrumb";
import { DifficultyLadder } from "@/components/content/DifficultyLadder";
import { buildBreadcrumbSchema } from "@/lib/schema";
import Link from "next/link";
import { ArrowRight, Mountain, AlertTriangle, HeartPulse, FileWarning } from "lucide-react";

function cmsToTrek(page: CMSPage): Trek {
  const tf = (page.content_json?.trek_facts ?? {}) as TrekFacts;
  return {
    slug: page.slug, name: page.title, region: tf.base ?? "", state: "",
    image: page.hero_image_url ?? "/images/trek-forest.jpg",
    duration: tf.duration ?? "—", altitude: tf.altitude ?? "—",
    difficulty: "Challenging", season: tf.season ?? "—",
    description: page.seo_description ?? "", beginner: false,
  };
}

export const revalidate = 3600;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";
const CRUMBS = [{ label: "Home", href: "/" }, { label: "Challenging Treks" }];

export const metadata: Metadata = {
  title: "Challenging Treks in India — Difficult High-Altitude Routes | TrekYatra",
  description: "India's hardest treks — high passes above 14,000 ft, long days and technical ground. Prerequisites, AMS management, mandatory permits and guides, fitness benchmarks and the gear that keeps you safe.",
  alternates: { canonical: `${SITE_URL}/challenging` },
  authors: [{ name: "TrekYatra Editorial Team" }],
  openGraph: { title: "Challenging Treks in India | TrekYatra", type: "website" },
};

const FAQ = [
  { q: "What makes a trek challenging or difficult?", a: "Altitudes above 14,000 ft, 8 or more hours of walking a day, exposed or technical sections that need careful route finding, and multi-day remoteness with no easy exit. These treks assume prior high-altitude experience." },
  { q: "Do I need a guide for a challenging trek?", a: "Yes. Most hard Himalayan treks require a certified guide, both for safety and because many national parks and restricted areas mandate one. Always hire an IMF or NIM certified local guide, and never attempt these routes solo." },
  { q: "How do I train for a challenging high-altitude trek?", a: "Build to running 5 km comfortably, walking 8 to 10 hours with a 10 kg pack, and completing two or three moderate multi-day treks first. Acclimatisation matters as much as fitness, so budget extra buffer days on the itinerary." },
  { q: "What is the biggest risk on a challenging trek?", a: "Acute Mountain Sickness. Above 3,500 metres, ascend slowly, hydrate, and know the signs of HAPE and HACE. Descend at once if symptoms worsen. Carry evacuation cover and never push a summit day through altitude illness." },
];

const BENCHMARKS = [
  { metric: "Cardio", target: "Run 5 km under 32 minutes, or 45 minutes of brisk incline walking without stopping" },
  { metric: "Load carry", target: "Walk 8–10 hours with a 10 kg pack across consecutive days" },
  { metric: "Strength", target: "3 sets of 15 step-ups with pack, plus core work, 3 times a week" },
  { metric: "Experience", target: "At least 2–3 completed moderate multi-day treks above 12,000 ft" },
  { metric: "Acclimatisation", target: "One or two buffer days built into the itinerary for altitude" },
];

export default async function ChallengingPage() {
  const [cmsPages, allCmsTrekGuides, treks] = await Promise.all([
    fetchCMSHubPages("trek_guide"),
    fetchCMSPages({ page_type: "trek_guide", status: "published", limit: 100 }).catch(() => []),
    fetchTreks(),
  ]);

  const cmsChallengingTreks = allCmsTrekGuides
    .filter((p) => {
      const d = ((p.content_json?.trek_facts as TrekFacts | undefined)?.difficulty ?? "").toLowerCase();
      return d.includes("challeng") || d.includes("difficult") || d.includes("hard") || d.includes("expert");
    })
    .map(cmsToTrek);
  const staticChallengingTreks = treks.filter((t) =>
    t.difficulty === "Challenging" || /challeng|difficult|hard/i.test(t.difficulty)
  );
  const challengingTreks = cmsChallengingTreks.length > 0 ? cmsChallengingTreks : staticChallengingTreks;

  const bcSchema = buildBreadcrumbSchema(CRUMBS);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bcSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="container-wide pt-4 pb-0"><Breadcrumb items={CRUMBS} /></div>

      <section className="py-12 container-wide">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3">Challenging treks</div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-foreground mb-4 leading-tight">
            Challenging treks in India — earn the summit
          </h1>
          <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
            High passes, long exposed days and real altitude. These are the routes you build up to, not the ones you
            start with. Below is what it actually takes: the prerequisites, the altitude plan, the permits, and the
            fitness you need before you commit.
          </p>
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground mb-8">
            <span className="flex items-center gap-2"><Mountain className="h-4 w-4 text-accent" /> 14,000 ft and above</span>
            <span className="flex items-center gap-2"><HeartPulse className="h-4 w-4 text-accent" /> 8+ hrs walking per day</span>
            <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-accent" /> Prior high-altitude experience required</span>
          </div>
        </div>
        <div className="max-w-3xl"><DifficultyLadder current="challenging" /></div>
      </section>

      {challengingTreks.length > 0 && (
        <section className="py-4 container-wide">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-6">Hard treks worth the effort</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {challengingTreks.map((t) => <TrekCard key={t.slug} trek={t} />)}
          </div>
          <Link href="/explore" className="inline-flex items-center gap-1 text-sm text-accent hover:underline font-medium">
            Explore all treks <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      )}

      <section className="py-12 container-wide border-t border-border mt-8">
        <div className="max-w-3xl space-y-10">
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">Prerequisites — do not skip these</h2>
            <p className="text-foreground/80 leading-relaxed mb-3">
              A challenging trek is not a harder version of a weekend hike. It assumes a base you have to build first.
              Before you book, you should have completed at least two or three moderate multi-day treks, slept above
              12,000 ft without altitude trouble, and be comfortable on loose or steep ground.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-foreground/80 text-sm">
              <li>Proven altitude tolerance from earlier <Link href="/moderate" className="text-accent hover:underline">moderate treks</Link></li>
              <li>A certified guide booked, and ideally a small group rather than solo</li>
              <li>Travel and evacuation insurance that covers high-altitude trekking</li>
              <li>A realistic itinerary with buffer days, not a compressed weekend push</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4 flex items-center gap-2"><HeartPulse className="h-5 w-5 text-accent" /> Altitude and AMS</h2>
            <p className="text-foreground/80 leading-relaxed mb-3">
              Above 3,500 metres, altitude is the single biggest risk, ahead of terrain or weather. Ascend slowly, keep
              hydrated, and learn the early signs of Acute Mountain Sickness. If a headache, nausea or breathlessness
              worsens, descend immediately. HAPE and HACE are emergencies. No summit is worth pushing through them.
            </p>
            <p className="text-foreground/80 leading-relaxed">
              Read the full <Link href="/safety" className="text-accent hover:underline">altitude and safety guide</Link> before
              any trek above 4,000 metres, and pick post monsoon <Link href="/seasons/autumn" className="text-accent hover:underline">autumn</Link> dates
              for the clearest, most stable window.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4 flex items-center gap-2"><FileWarning className="h-5 w-5 text-accent" /> Permits, guides and insurance</h2>
            <p className="text-foreground/80 leading-relaxed">
              Most challenging routes sit inside national parks or restricted border zones, which means inner line or
              protected area permits and a mandatory certified guide. Ladakh, Sikkim and the high Garhwal all have their
              own paperwork. Check the <Link href="/permits" className="text-accent hover:underline">permit guides</Link> and,
              for the biggest peaks, browse <Link href="/regions/ladakh" className="text-accent hover:underline">Ladakh</Link> where
              nearly every trek runs above 3,500 metres.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">Fitness benchmarks</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
                <tbody>
                  {BENCHMARKS.map(({ metric, target }, i) => (
                    <tr key={metric} className={i % 2 ? "bg-card" : ""}>
                      <td className="px-4 py-3 font-medium text-foreground align-top w-40">{metric}</td>
                      <td className="px-4 py-3 text-foreground/80">{target}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {cmsPages.length > 0 && (
            <div>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">Guides for hard treks</h2>
              <CMSPageHub pages={cmsPages} pathPrefix="/trek" />
            </div>
          )}

          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">Frequently asked questions</h2>
            <div className="space-y-5">
              {FAQ.map(({ q, a }) => (
                <div key={q}>
                  <h3 className="font-semibold text-foreground mb-2">{q}</h3>
                  <p className="text-foreground/80 leading-relaxed text-sm">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

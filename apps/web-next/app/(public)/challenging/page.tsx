import type { Metadata } from "next";
import CMSPageHub, { fetchCMSHubPages } from "@/components/content/CMSPageHub";
import { TrekCard, type Trek } from "@/components/trek/TrekCard";
import { fetchTreks } from "@/lib/trekApi";
import { fetchCMSPages, type CMSPage, type TrekFacts } from "@/lib/api";
import Breadcrumb from "@/components/content/Breadcrumb";
import FAQAccordion, { type FAQItem } from "@/components/content/FAQAccordion";
import SchemaInjector from "@/components/seo/SchemaInjector";
import { DifficultyLadder } from "@/components/content/DifficultyLadder";
import { HubHero, HubSection, HubFAQSection } from "@/components/hub/HubLayout";
import { createHubLinker } from "@/components/hub/internalLink";
import { buildBreadcrumbSchema, buildCollectionPageSchema, buildFAQSchema } from "@/lib/schema";
import { Mountain, AlertTriangle, HeartPulse, FileWarning } from "lucide-react";

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

const FAQ: FAQItem[] = [
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
  const ilink = createHubLinker();
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
  const staticChallengingTreks = treks.filter((t) => t.difficulty === "Challenging" || /challeng|difficult|hard/i.test(t.difficulty));
  const challengingTreks = cmsChallengingTreks.length > 0 ? cmsChallengingTreks : staticChallengingTreks;

  return (
    <>
      <SchemaInjector
        schemas={[
          buildBreadcrumbSchema(CRUMBS),
          buildCollectionPageSchema({
            name: "Challenging Treks in India",
            description: metadata.description as string,
            url: "/challenging",
            about: { type: "Thing", name: "Challenging high-altitude trekking in India", description: "Difficult, high-altitude Himalayan treks above 14,000 ft with long days and technical ground." },
            treks: challengingTreks.slice(0, 12).map((t) => ({ name: t.name, slug: t.slug, image: t.image, description: t.description, difficulty: t.difficulty, duration: t.duration, altitude: t.altitude, season: t.season })),
            significantLinks: ["/moderate", "/beginner", "/safety", "/permits", "/regions/ladakh", "/seasons/autumn"],
            keywords: ["challenging treks india", "difficult treks india", "hardest himalayan treks", "high altitude treks india"],
          }),
          buildFAQSchema(FAQ)!,
        ]}
      />

      <div className="container-wide pt-4 pb-0"><Breadcrumb items={CRUMBS} /></div>

      <HubHero
        eyebrow="Challenging treks"
        title="Challenging treks in India — earn the summit"
        intro="High passes, long exposed days and real altitude. These are the routes you build up to, not the ones you start with. Below is what it actually takes: the prerequisites, the altitude plan, the permits, and the fitness you need before you commit."
        stats={[
          { icon: Mountain, label: "14,000 ft and above" },
          { icon: HeartPulse, label: "8+ hrs walking per day" },
          { icon: AlertTriangle, label: "Prior high-altitude experience required" },
        ]}
      >
        <DifficultyLadder current="challenging" />
      </HubHero>

      {challengingTreks.length > 0 && (
        <section className="py-4 container-wide">
          <HubSection title="Hard treks worth the effort">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8 mt-2">
              {challengingTreks.map((t) => <TrekCard key={t.slug} trek={t} />)}
            </div>
            {ilink("/explore", <span className="inline-flex items-center gap-1">Explore all treks →</span>, "text-sm text-accent hover:underline font-medium")}
          </HubSection>
        </section>
      )}

      <section className="py-12 container-wide border-t border-border mt-8">
        <div className="max-w-3xl space-y-10">
          <HubSection title="Prerequisites — do not skip these">
            <p className="text-foreground/80 leading-relaxed mb-3">
              A challenging trek is not a harder version of a weekend hike. It assumes a base you have to build first.
              Before you book, you should have completed at least two or three moderate multi-day treks, slept above
              12,000 ft without altitude trouble, and be comfortable on loose or steep ground.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-foreground/80 text-sm">
              <li>Proven altitude tolerance from earlier {ilink("/moderate", "moderate treks")}</li>
              <li>A certified guide booked, and ideally a small group rather than solo</li>
              <li>Travel and evacuation insurance that covers high-altitude trekking</li>
              <li>A realistic itinerary with buffer days, not a compressed weekend push</li>
            </ul>
          </HubSection>

          <HubSection title="Altitude and AMS" icon={HeartPulse}>
            <p className="text-foreground/80 leading-relaxed mb-3">
              Above 3,500 metres, altitude is the single biggest risk, ahead of terrain or weather. Ascend slowly, keep
              hydrated, and learn the early signs of Acute Mountain Sickness. If a headache, nausea or breathlessness
              worsens, descend immediately. HAPE and HACE are emergencies. No summit is worth pushing through them.
            </p>
            <p className="text-foreground/80 leading-relaxed">
              Read the full {ilink("/safety", "altitude and safety guide")} before any trek above 4,000 metres, and pick
              post monsoon {ilink("/seasons/autumn", "autumn")} dates for the clearest, most stable window.
            </p>
          </HubSection>

          <HubSection title="Permits, guides and insurance" icon={FileWarning}>
            <p className="text-foreground/80 leading-relaxed">
              Most challenging routes sit inside national parks or restricted border zones, which means inner line or
              protected area permits and a mandatory certified guide. Ladakh, Sikkim and the high Garhwal all have their
              own paperwork. Check the {ilink("/permits", "permit guides")} and, for the biggest peaks, browse{" "}
              {ilink("/regions/ladakh", "Ladakh")} where nearly every trek runs above 3,500 metres.
            </p>
          </HubSection>

          <HubSection title="Fitness benchmarks">
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
          </HubSection>

          {cmsPages.length > 0 && (
            <HubSection title="Guides for hard treks">
              <div className="mt-2"><CMSPageHub pages={cmsPages} pathPrefix="/trek" /></div>
            </HubSection>
          )}
        </div>
      </section>

      <HubFAQSection heading="Challenging treks, frequently asked questions">
        <FAQAccordion items={FAQ} />
      </HubFAQSection>
    </>
  );
}

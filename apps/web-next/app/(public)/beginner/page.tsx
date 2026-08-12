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
import { Mountain, Clock, Footprints, CheckCircle2 } from "lucide-react";

function cmsToTrek(page: CMSPage): Trek {
  const tf = (page.content_json?.trek_facts ?? {}) as TrekFacts;
  return {
    slug: page.slug, name: page.title, region: tf.base ?? "", state: "",
    image: page.hero_image_url ?? "/images/trek-forest.jpg",
    duration: tf.duration ?? "—", altitude: tf.altitude ?? "—",
    difficulty: "Easy", season: tf.season ?? "—",
    description: page.seo_description ?? "", beginner: true,
  };
}

export const revalidate = 3600;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";
const CRUMBS = [{ label: "Home", href: "/" }, { label: "Beginner Treks" }];

export const metadata: Metadata = {
  title: "Beginner Treks in India — Easy First-Time Treks | TrekYatra",
  description: "The best beginner-friendly treks in India for first-timers. What to expect, the mistakes to avoid, the best first treks by city, verified permits and realistic costs.",
  alternates: { canonical: `${SITE_URL}/beginner` },
  authors: [{ name: "TrekYatra Editorial Team" }],
  openGraph: { title: "Beginner Treks in India | TrekYatra", type: "website" },
};

const FAQ: FAQItem[] = [
  { q: "Which is the easiest trek in India for a first-timer?", a: "For a first Himalayan trek, Kedarkantha and Nag Tibba in Uttarakhand are ideal: graded trails, short approaches and reliable operators. Near Mumbai, the Sahyadri forts like Rajmachi make a gentle low-altitude start." },
  { q: "How fit do I need to be for my first trek?", a: "Enough to walk 4 to 5 hours with a daypack and climb stairs without gasping. Four weeks of daily 30-minute walks or jogs before the trek is plenty for an easy route." },
  { q: "What should I not do on my first trek?", a: "Do not buy brand new boots for the trek, skip the medical certificate, wear cotton, or book the cheapest operator blindly. Train for four weeks and buffer one extra day for weather." },
];

const MISTAKES = [
  "Booking the cheapest operator", "Not training for 4 weeks", "Wearing brand new boots", "Skipping the medical certificate",
  "Underestimating altitude", "Cotton clothing", "A cheap rented sleeping bag", "Booking peak weekend dates",
  "Trekking solo unprepared", "Skipping travel insurance", "Not buffering one extra day",
];

const CITY_PICKS = [
  { city: "From Mumbai", picks: "Rajmachi, Kalsubai, Harishchandragad" },
  { city: "From Bangalore", picks: "Kumara Parvatha, Tadiyandamol, Skandagiri" },
  { city: "From Delhi", picks: "Kedarkantha, Brahmatal, Nag Tibba" },
];

export default async function BeginnerPage() {
  const ilink = createHubLinker();
  const [cmsPages, allCmsTrekGuides, treks] = await Promise.all([
    fetchCMSHubPages("beginner_guide"),
    fetchCMSPages({ page_type: "trek_guide", status: "published", limit: 100 }).catch(() => []),
    fetchTreks(),
  ]);

  const cmsBeginnerTreks = allCmsTrekGuides
    .filter((p) => {
      const d = ((p.content_json?.trek_facts as TrekFacts | undefined)?.difficulty ?? "").toLowerCase();
      return d.includes("easy") || d.includes("beginner");
    })
    .map(cmsToTrek)
    .slice(0, 6);
  const beginnerTreks = cmsBeginnerTreks.length > 0 ? cmsBeginnerTreks : treks.filter((t) => t.beginner).slice(0, 6);

  return (
    <>
      <SchemaInjector
        schemas={[
          buildBreadcrumbSchema(CRUMBS),
          buildCollectionPageSchema({
            name: "Beginner Treks in India",
            description: metadata.description as string,
            url: "/beginner",
            about: { type: "Thing", name: "Beginner trekking in India", description: "Easy, first-timer friendly treks across India: low altitude, graded trails and short approaches." },
            treks: beginnerTreks.map((t) => ({ name: t.name, slug: t.slug, image: t.image, description: t.description, difficulty: t.difficulty, duration: t.duration, altitude: t.altitude, season: t.season })),
            significantLinks: ["/moderate", "/regions", "/seasons", "/packing"],
            keywords: ["beginner treks india", "easy treks india", "first trek india", "treks for first timers india"],
          }),
          buildFAQSchema(FAQ)!,
        ]}
      />

      <div className="container-wide pt-4 pb-0"><Breadcrumb items={CRUMBS} /></div>

      <HubHero
        eyebrow="Beginner treks"
        title="Your first trek — start here"
        intro="If you have never trekked above 10,000 ft, read this before you book anything. India-specific, no-nonsense guidance for first-time trekkers: what to expect, what to avoid, and the best first treks near your city."
        stats={[
          { icon: Mountain, label: "Low altitude, graded trails" },
          { icon: Clock, label: "4–5 hrs walking per day" },
          { icon: Footprints, label: "No prior experience needed" },
        ]}
      >
        <DifficultyLadder current="beginner" />
      </HubHero>

      {beginnerTreks.length > 0 && (
        <section className="py-4 container-wide">
          <HubSection title="Best beginner treks right now">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8 mt-2">
              {beginnerTreks.map((t) => <TrekCard key={t.slug} trek={t} />)}
            </div>
            {ilink("/explore", <span className="inline-flex items-center gap-1">Explore all treks →</span>, "text-sm text-accent hover:underline font-medium")}
          </HubSection>
        </section>
      )}

      <section className="py-12 container-wide border-t border-border mt-8">
        <div className="max-w-3xl space-y-10">
          <HubSection title="11 mistakes first-time Indian trekkers make">
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mt-2">
              {MISTAKES.map((m) => (
                <li key={m} className="flex items-start gap-2 text-foreground/80 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" /> {m}
                </li>
              ))}
            </ul>
          </HubSection>

          <HubSection title="Best first treks by city">
            <div className="grid sm:grid-cols-3 gap-4 mt-2">
              {CITY_PICKS.map(({ city, picks }) => (
                <div key={city} className="p-4 bg-card border border-border rounded-xl">
                  <h3 className="font-semibold text-sm text-foreground mb-1">{city}</h3>
                  <p className="text-muted-foreground text-sm">{picks}</p>
                </div>
              ))}
            </div>
          </HubSection>

          <HubSection title="Where to next">
            <p className="text-foreground/80 leading-relaxed">
              Once your first trek is behind you and altitude feels manageable, step up to a {ilink("/moderate", "moderate trek")}.
              Choose a friendly starting region with the {ilink("/regions", "regions guide")}, and check the calendar with
              the {ilink("/seasons", "seasons guide")} so the weather is on your side.
            </p>
          </HubSection>

          {cmsPages.length > 0 && (
            <HubSection title="First-timer guides">
              <div className="mt-2"><CMSPageHub pages={cmsPages} pathPrefix="/guides" /></div>
            </HubSection>
          )}
        </div>
      </section>

      <HubFAQSection heading="Beginner treks, frequently asked questions">
        <FAQAccordion items={FAQ} />
      </HubFAQSection>
    </>
  );
}

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
import { Mountain, Clock, TrendingUp, CheckCircle2 } from "lucide-react";

function cmsToTrek(page: CMSPage): Trek {
  const tf = (page.content_json?.trek_facts ?? {}) as TrekFacts;
  return {
    slug: page.slug, name: page.title, region: tf.base ?? "", state: "",
    image: page.hero_image_url ?? "/images/trek-forest.jpg",
    duration: tf.duration ?? "—", altitude: tf.altitude ?? "—",
    difficulty: "Moderate", season: tf.season ?? "—",
    description: page.seo_description ?? "", beginner: false,
  };
}

export const revalidate = 3600;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";
const CRUMBS = [{ label: "Home", href: "/" }, { label: "Moderate Treks" }];

export const metadata: Metadata = {
  title: "Moderate Treks in India — Best Routes for Intermediate Trekkers | TrekYatra",
  description: "The best moderate treks in India for trekkers stepping up from beginner routes. A readiness checklist, a six-week training plan, the terrain to expect, and honest difficulty ratings from real trail data.",
  alternates: { canonical: `${SITE_URL}/moderate` },
  authors: [{ name: "TrekYatra Editorial Team" }],
  openGraph: { title: "Moderate Treks in India | TrekYatra", type: "website" },
};

const FAQ: FAQItem[] = [
  { q: "What counts as a moderate trek in India?", a: "A moderate trek involves 5 to 8 hours of walking a day, altitudes between 8,000 and 14,000 ft, some rocky or steep sections, and consistent daily elevation gain. No technical climbing is needed, but prior trekking helps a lot." },
  { q: "Am I ready to move up from beginner treks?", a: "If you have finished one or two easy treks, can walk 6 hours with a daypack without heavy fatigue, and have slept a night above 9,000 ft comfortably, you are ready to step up. If not, start on the beginner routes first." },
  { q: "What is the best moderate trek to step up to?", a: "Kedarkantha and Brahmatal are ideal step-up treks: moderate grade, good infrastructure and stunning snow views. Hampta Pass adds a real valley crossing with more varied terrain." },
];

const TRAINING = [
  { week: "Weeks 1–2", plan: "30–40 min brisk walk or jog, 4 days a week. Add two flights of stairs daily." },
  { week: "Weeks 3–4", plan: "Extend to 45–60 min cardio, add step-ups and squats twice a week." },
  { week: "Weeks 5–6", plan: "One long day hike (10–12 km) with a loaded daypack. Taper 3 days before the trek." },
];

const READY = [
  "Finished at least one easy multi-day or long day trek",
  "Can walk 6 hours with a daypack without heavy fatigue",
  "Slept a night above 9,000 ft without altitude trouble",
  "Own broken-in waterproof boots and basic layers",
];

export default async function ModeratePage() {
  const ilink = createHubLinker();
  const [cmsPages, allCmsTrekGuides, treks] = await Promise.all([
    fetchCMSHubPages("trek_guide"),
    fetchCMSPages({ page_type: "trek_guide", status: "published", limit: 100 }).catch(() => []),
    fetchTreks(),
  ]);

  const cmsModerateTreks = allCmsTrekGuides
    .filter((p) => {
      const d = ((p.content_json?.trek_facts as TrekFacts | undefined)?.difficulty ?? "").toLowerCase();
      return d.includes("moderate") || d.includes("intermediate");
    })
    .map(cmsToTrek);
  const staticModerateTreks = treks.filter((t) => t.difficulty === "Moderate" || t.difficulty.toLowerCase().includes("moderate"));
  const moderateTreks = cmsModerateTreks.length > 0 ? cmsModerateTreks : staticModerateTreks;

  return (
    <>
      <SchemaInjector
        schemas={[
          buildBreadcrumbSchema(CRUMBS),
          buildCollectionPageSchema({
            name: "Moderate Treks in India",
            description: metadata.description as string,
            url: "/moderate",
            about: { type: "Thing", name: "Moderate difficulty trekking in India", description: "Intermediate-grade Himalayan and Indian treks: 8,000–14,000 ft, 5–8 hours a day." },
            treks: moderateTreks.slice(0, 12).map((t) => ({ name: t.name, slug: t.slug, image: t.image, description: t.description, difficulty: t.difficulty, duration: t.duration, altitude: t.altitude, season: t.season })),
            significantLinks: ["/beginner", "/challenging", "/regions", "/seasons"],
            keywords: ["moderate treks india", "intermediate treks india", "best moderate himalayan treks"],
          }),
          buildFAQSchema(FAQ)!,
        ]}
      />

      <div className="container-wide pt-4 pb-0"><Breadcrumb items={CRUMBS} /></div>

      <HubHero
        eyebrow="Moderate treks"
        title="Moderate treks in India — step it up"
        intro="The sweet spot: bigger mountains and longer days, but no ropes or technical ground. This is where most trekkers spend their best years. Below is how to know you are ready, a six-week plan to get there, and the terrain to expect."
        stats={[
          { icon: Mountain, label: "8,000 – 14,000 ft typical altitude" },
          { icon: Clock, label: "5–8 hrs walking per day" },
          { icon: TrendingUp, label: "Some prior trek experience helpful" },
        ]}
      >
        <DifficultyLadder current="moderate" />
      </HubHero>

      {moderateTreks.length > 0 && (
        <section className="py-4 container-wide">
          <HubSection title="Popular moderate treks">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8 mt-2">
              {moderateTreks.map((t) => <TrekCard key={t.slug} trek={t} />)}
            </div>
            {ilink("/explore", <span className="inline-flex items-center gap-1">Explore all treks →</span>, "text-sm text-accent hover:underline font-medium")}
          </HubSection>
        </section>
      )}

      <section className="py-12 container-wide border-t border-border mt-8">
        <div className="max-w-3xl space-y-10">
          <HubSection title="Are you ready for a moderate trek?">
            <p className="text-foreground/80 leading-relaxed mb-4">
              The most common mistake is booking a moderate trek straight after a single easy one. Run through this
              checklist honestly. If you cannot tick most of it, spend a season on the {ilink("/beginner", "beginner routes")} first.
            </p>
            <ul className="space-y-2">
              {READY.map((item) => (
                <li key={item} className="flex items-start gap-2 text-foreground/80 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </HubSection>

          <HubSection title="A six-week training plan">
            <p className="text-foreground/80 leading-relaxed mb-4">
              You do not need a gym. Six weeks of consistent cardio and leg work is enough for most moderate Himalayan treks.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
                <tbody>
                  {TRAINING.map(({ week, plan }, i) => (
                    <tr key={week} className={i % 2 ? "bg-card" : ""}>
                      <td className="px-4 py-3 font-medium text-foreground align-top w-32">{week}</td>
                      <td className="px-4 py-3 text-foreground/80">{plan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </HubSection>

          <HubSection title="Terrain you will meet">
            <p className="text-foreground/80 leading-relaxed">
              Moderate treks add variety: forest climbs, open meadows, boulder fields and the odd snow patch near a pass.
              None of it is technical, but footing matters and days are longer. Pick your window with the{" "}
              {ilink("/seasons", "seasons guide")} and your mountains with the {ilink("/regions", "regions guide")}. When
              altitude climbs past 14,000 ft, you are stepping into {ilink("/challenging", "challenging")} territory.
            </p>
          </HubSection>

          {cmsPages.length > 0 && (
            <HubSection title="Guides for moderate trekkers">
              <div className="mt-2"><CMSPageHub pages={cmsPages} pathPrefix="/trek" /></div>
            </HubSection>
          )}
        </div>
      </section>

      <HubFAQSection heading="Moderate treks, frequently asked questions">
        <FAQAccordion items={FAQ} />
      </HubFAQSection>
    </>
  );
}

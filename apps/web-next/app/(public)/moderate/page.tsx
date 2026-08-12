import type { Metadata } from "next";
import CMSPageHub, { fetchCMSHubPages } from "@/components/content/CMSPageHub";
import { TrekCard, type Trek } from "@/components/trek/TrekCard";
import { fetchTreks } from "@/lib/trekApi";
import { fetchCMSPages, type CMSPage, type TrekFacts } from "@/lib/api";
import Breadcrumb from "@/components/content/Breadcrumb";
import { DifficultyLadder } from "@/components/content/DifficultyLadder";
import { buildBreadcrumbSchema } from "@/lib/schema";
import Link from "next/link";
import { ArrowRight, Mountain, Clock, TrendingUp, CheckCircle2 } from "lucide-react";

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

const FAQ = [
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
  const staticModerateTreks = treks.filter((t) =>
    t.difficulty === "Moderate" || t.difficulty.toLowerCase().includes("moderate")
  );
  const moderateTreks = cmsModerateTreks.length > 0 ? cmsModerateTreks : staticModerateTreks;

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
          <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3">Moderate treks</div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-foreground mb-4 leading-tight">
            Moderate treks in India — step it up
          </h1>
          <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
            The sweet spot: bigger mountains and longer days, but no ropes or technical ground. This is where most
            trekkers spend their best years. Below is how to know you are ready, a six-week plan to get there, and the
            terrain to expect.
          </p>
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground mb-8">
            <span className="flex items-center gap-2"><Mountain className="h-4 w-4 text-accent" /> 8,000 – 14,000 ft typical altitude</span>
            <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-accent" /> 5–8 hrs walking per day</span>
            <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-accent" /> Some prior trek experience helpful</span>
          </div>
        </div>
        <div className="max-w-3xl"><DifficultyLadder current="moderate" /></div>
      </section>

      {moderateTreks.length > 0 && (
        <section className="py-4 container-wide">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-6">Popular moderate treks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {moderateTreks.map((t) => <TrekCard key={t.slug} trek={t} />)}
          </div>
          <Link href="/explore" className="inline-flex items-center gap-1 text-sm text-accent hover:underline font-medium">
            Explore all treks <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      )}

      <section className="py-12 container-wide border-t border-border mt-8">
        <div className="max-w-3xl space-y-10">
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">Are you ready for a moderate trek?</h2>
            <p className="text-foreground/80 leading-relaxed mb-4">
              The most common mistake is booking a moderate trek straight after a single easy one. Run through this
              checklist honestly. If you cannot tick most of it, spend a season on the{" "}
              <Link href="/beginner" className="text-accent hover:underline">beginner routes</Link> first.
            </p>
            <ul className="space-y-2">
              {READY.map((item) => (
                <li key={item} className="flex items-start gap-2 text-foreground/80 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">A six-week training plan</h2>
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
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">Terrain you will meet</h2>
            <p className="text-foreground/80 leading-relaxed">
              Moderate treks add variety: forest climbs, open meadows, boulder fields and the odd snow patch near a pass.
              None of it is technical, but footing matters and days are longer. Pick your window with the{" "}
              <Link href="/seasons" className="text-accent hover:underline">seasons guide</Link> and your mountains with the{" "}
              <Link href="/regions" className="text-accent hover:underline">regions guide</Link>. When altitude climbs past
              14,000 ft, you are stepping into <Link href="/challenging" className="text-accent hover:underline">challenging</Link> territory.
            </p>
          </div>

          {cmsPages.length > 0 && (
            <div>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">Guides for moderate trekkers</h2>
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

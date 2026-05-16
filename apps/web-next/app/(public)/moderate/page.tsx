import type { Metadata } from "next";
import CMSPageHub, { fetchCMSHubPages } from "@/components/content/CMSPageHub";
import { TrekCard, type Trek } from "@/components/trek/TrekCard";
import { fetchTreks } from "@/lib/trekApi";
import { fetchCMSPages, type CMSPage, type TrekFacts } from "@/lib/api";

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
import Breadcrumb from "@/components/content/Breadcrumb";
import { buildBreadcrumbSchema } from "@/lib/schema";
import Link from "next/link";
import { ArrowRight, Mountain, Clock, TrendingUp } from "lucide-react";

export const revalidate = 3600;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";
const CRUMBS = [{ label: "Home", href: "/" }, { label: "Moderate Treks" }];

export const metadata: Metadata = {
  title: "Moderate Treks in India — Best Routes for Intermediate Trekkers | TrekYatra",
  description: "Discover the best moderate treks in India — verified routes, realistic difficulty ratings, honest cost breakdowns, and permit guides for intermediate trekkers.",
  alternates: { canonical: `${SITE_URL}/moderate` },
  authors: [{ name: "TrekYatra Editorial Team" }],
  openGraph: { title: "Moderate Treks in India | TrekYatra", type: "website" },
};

const FAQ = [
  { q: "What counts as a moderate trek in India?", a: "A moderate trek typically involves 5–8 hours of walking per day, altitudes between 8,000 and 14,000 ft, some rocky or steep sections, and requires basic fitness. No technical climbing skills are needed but prior trekking experience helps." },
  { q: "How do I prepare for a moderate trek?", a: "Train for 4–6 weeks with daily cardio (30-45 min runs or brisk walks), add stair climbing for leg strength, and do one or two short day treks to test your gear and body before the main trek." },
  { q: "What is the best moderate trek for beginners stepping up?", a: "Kedarkantha (Uttarakhand) and Brahmatal are excellent step-up treks — moderate difficulty, good infrastructure, and stunning snow views. Hampta Pass is another popular choice with diverse terrain." },
];

export default async function ModeratePage() {
  const [cmsPages, allCmsTrekGuides, treks] = await Promise.all([
    fetchCMSHubPages("trek_guide"),
    fetchCMSPages({ page_type: "trek_guide", status: "published", limit: 100 }).catch(() => []),
    fetchTreks(),
  ]);

  // CMS trek_guide pages with moderate difficulty — preferred source
  const cmsModerateTreks = allCmsTrekGuides
    .filter((p) => {
      const d = ((p.content_json?.trek_facts as TrekFacts | undefined)?.difficulty ?? "").toLowerCase();
      return d.includes("moderate") || d.includes("intermediate");
    })
    .map(cmsToTrek);

  // Static fallback when no CMS trek guides published yet
  const staticModerateTreks = treks.filter((t) =>
    t.difficulty === "Moderate" || t.difficulty.toLowerCase().includes("moderate")
  );
  const moderateTreks = cmsModerateTreks.length > 0 ? cmsModerateTreks : staticModerateTreks;
  const bcSchema = buildBreadcrumbSchema(CRUMBS);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bcSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Breadcrumb */}
      <div className="container-wide pt-4 pb-0"><Breadcrumb items={CRUMBS} /></div>

      {/* Hero */}
      <section className="py-12 container-wide">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3">Moderate treks</div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-foreground mb-4 leading-tight">
            Moderate treks in India — step it up
          </h1>
          <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
            Verified routes for intermediate trekkers. More elevation, more challenge, more reward.
            Difficulty ratings based on real trail data — not operator marketing.
          </p>
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground mb-8">
            <span className="flex items-center gap-2"><Mountain className="h-4 w-4 text-accent" /> 8,000 – 14,000 ft typical altitude</span>
            <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-accent" /> 5–8 hrs walking per day</span>
            <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-accent" /> Some prior trek experience helpful</span>
          </div>
        </div>
      </section>

      {/* Trek cards */}
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

      {/* CMS guides */}
      {cmsPages.length > 0 && (
        <section className="py-8 container-wide">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-6">Guides for moderate trekkers</h2>
          <CMSPageHub pages={cmsPages} pathPrefix="/trek" />
        </section>
      )}

      {/* SEO content */}
      <section className="py-12 container-wide border-t border-border mt-8">
        <div className="max-w-3xl space-y-10">
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">What makes a trek &ldquo;Moderate&rdquo;?</h2>
            <p className="text-foreground/80 leading-relaxed mb-3">
              TrekYatra rates a trek as Moderate when it involves consistent daily elevation gain (500–1,000 m), trail sections that are rocky or require careful footing, and days that run 5–8 hours of actual walking. You do not need mountaineering skills, but you should not be attempting your very first trek.
            </p>
            <p className="text-foreground/80 leading-relaxed">
              The most common mistake: booking a moderate trek after zero preparation. Kedarkantha in December looks like a beginner trek on paper but the cold, snow, and cumulative fatigue make fitness essential. Train for at least 4 weeks before any moderate Himalayan trek.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">Best moderate treks by season</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { season: "Winter (Dec – Mar)", picks: "Kedarkantha, Brahmatal, Chopta Tungnath" },
                { season: "Summer (Apr – Jun)", picks: "Hampta Pass, Rupin Pass approach, Beas Kund" },
                { season: "Monsoon (Jul – Sep)", picks: "Valley of Flowers, Sandakphu, Kalsubai" },
                { season: "Autumn (Oct – Nov)", picks: "Kashmir Great Lakes, Sandakphu Phalut, Kedarkantha pre-season" },
              ].map(({ season, picks }) => (
                <div key={season} className="p-4 bg-card border border-border rounded-xl">
                  <h3 className="font-semibold text-sm text-foreground mb-1">{season}</h3>
                  <p className="text-muted-foreground text-sm">{picks}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
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

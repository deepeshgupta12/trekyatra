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
    difficulty: "Challenging", season: tf.season ?? "—",
    description: page.seo_description ?? "", beginner: false,
  };
}
import Breadcrumb from "@/components/content/Breadcrumb";
import { buildBreadcrumbSchema } from "@/lib/schema";
import Link from "next/link";
import { ArrowRight, Mountain, Clock, TrendingUp, Shield } from "lucide-react";

export const revalidate = 3600;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";
const CRUMBS = [{ label: "Home", href: "/" }, { label: "Challenging Treks" }];

export const metadata: Metadata = {
  title: "Challenging Treks in India — Difficult High-Altitude Routes | TrekYatra",
  description: "India's best challenging and difficult treks — high-altitude passes, technical routes, and multi-week expeditions. Verified safety data, permit guides, and acclimatisation schedules.",
  alternates: { canonical: `${SITE_URL}/challenging` },
  authors: [{ name: "TrekYatra Editorial Team" }],
  openGraph: { title: "Challenging Treks in India | TrekYatra", type: "website" },
};

const FAQ = [
  { q: "What makes a trek 'Challenging' or 'Difficult'?", a: "A challenging trek involves altitudes above 14,000 ft, 8+ hours of walking per day, exposed or technical sections requiring careful route-finding, and significant physical demands. These treks require prior multi-day trekking experience at moderate difficulty." },
  { q: "Do I need a guide for a challenging trek?", a: "Yes. Most challenging Himalayan treks require a certified guide — both for safety and because many national parks and restricted areas mandate it. We always recommend hiring a NIMS/IMF-certified local guide." },
  { q: "What fitness level do I need for challenging treks?", a: "You should be able to run 5km comfortably, walk 8–10 hours with a 10kg pack, and have completed at least 2–3 moderate multi-day treks. Acclimatisation is as important as fitness — budget extra days." },
];

export default async function ChallengingPage() {
  const [cmsPages, allCmsTrekGuides, treks] = await Promise.all([
    fetchCMSHubPages("trek_guide"),
    fetchCMSPages({ page_type: "trek_guide", status: "published", limit: 100 }).catch(() => []),
    fetchTreks(),
  ]);

  // CMS trek_guide pages with difficult/challenging difficulty — preferred source
  const cmsChallengingTreks = allCmsTrekGuides
    .filter((p) => {
      const d = ((p.content_json?.trek_facts as TrekFacts | undefined)?.difficulty ?? "").toLowerCase();
      return d.includes("difficult") || d.includes("challenging") || d.includes("strenuous") || d.includes("hard");
    })
    .map(cmsToTrek);

  // Static fallback when no CMS trek guides published yet
  const staticChallengingTreks = treks.filter((t) =>
    t.difficulty === "Difficult" || t.difficulty === "Challenging" ||
    t.difficulty.toLowerCase().includes("difficult") || t.difficulty.toLowerCase().includes("challenging")
  );
  const challengingTreks = cmsChallengingTreks.length > 0 ? cmsChallengingTreks : staticChallengingTreks;
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

      <div className="container-wide pt-4 pb-0"><Breadcrumb items={CRUMBS} /></div>

      {/* Hero */}
      <section className="py-12 container-wide">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3">Challenging treks</div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-foreground mb-4 leading-tight">
            Challenging treks in India — for experienced trekkers
          </h1>
          <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
            High-altitude passes, multi-day wilderness routes, and technically demanding terrain.
            Every route verified for safety. Every permit requirement documented.
          </p>
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground mb-8">
            <span className="flex items-center gap-2"><Mountain className="h-4 w-4 text-accent" /> 14,000 ft+ altitude</span>
            <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-accent" /> 8–12 hrs per day</span>
            <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-accent" /> Prior moderate trek experience required</span>
            <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-accent" /> Guide recommended</span>
          </div>
        </div>
      </section>

      {/* Trek cards */}
      {challengingTreks.length > 0 && (
        <section className="py-4 container-wide">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-6">Popular challenging treks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {challengingTreks.map((t) => <TrekCard key={t.slug} trek={t} />)}
          </div>
          <Link href="/explore" className="inline-flex items-center gap-1 text-sm text-accent hover:underline font-medium">
            Explore all treks <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      )}

      {/* CMS guides */}
      {cmsPages.length > 0 && (
        <section className="py-8 container-wide">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-6">Expert guides for advanced trekkers</h2>
          <CMSPageHub pages={cmsPages} pathPrefix="/trek" />
        </section>
      )}

      {/* SEO content */}
      <section className="py-12 container-wide border-t border-border mt-8">
        <div className="max-w-3xl space-y-10">
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">Acclimatisation on challenging treks</h2>
            <p className="text-foreground/80 leading-relaxed mb-3">
              Acute Mountain Sickness (AMS) is the most underestimated risk on challenging Indian treks. Above 14,000 ft, your body needs time to adjust. The rule: never ascend more than 300–500 m per day above 3,000 m, and always include at least one rest day every 3 days of ascent.
            </p>
            <p className="text-foreground/80 leading-relaxed">
              Signs of AMS — headache, nausea, dizziness, fatigue — are never to be ignored. The only proven treatment is descent. All our challenging trek guides include the specific acclimatisation schedule we recommend.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">Essential safety gear for challenging treks</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                "High-ankle waterproof boots (broken in — minimum 50km prior)",
                "Microspikes or crampons (for snow sections above 13,000 ft)",
                "Trekking poles (mandatory on any pass crossing)",
                "Sleeping bag rated to -15°C for winter expeditions",
                "Diamox (Acetazolamide) — consult a doctor before use",
                "Satellite communicator for remote routes",
                "Rescue insurance covering altitude and helicopter evacuation",
                "Waterproof layering system — base, mid, shell",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-foreground/80 p-3 bg-card border border-border rounded-xl">
                  <span className="text-accent mt-0.5 flex-shrink-0">✓</span>
                  {item}
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
